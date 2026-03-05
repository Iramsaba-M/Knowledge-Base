import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import { apiEndpoints } from '../integration/apiConfig';

// ─── Context ──────────────────────────────────────────────────────────────────
// We expose the manager instance only — never a piece of state.
// Components that need live status updates subscribe selectively via the hook,
// so a WebSocket message for doc-A never re-renders a component watching doc-B.
const WebSocketContext = createContext(null);

// ─── Singleton manager ────────────────────────────────────────────────────────
let wsManagerInstance = null;

class WebSocketManager {
  constructor() {
    this.ws = null;
    // statusUpdates is mutated in-place; listeners receive targeted callbacks.
    this.statusUpdates = {};
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.connectionPromise = null;

    // Two separate listener maps so subscribers only pay for what they watch.
    // connectionListeners → called when isConnected changes
    // documentListeners   → Map<documentId, Set<callback>>
    // globalListeners     → called on every status update (use sparingly)
    this.connectionListeners = new Set();
    this.documentListeners = new Map();
    this.globalListeners = new Set();
  }

  // ── Notify helpers ──────────────────────────────────────────────────────────

  _notifyConnection() {
    this.connectionListeners.forEach(cb => {
      try { cb(this.isConnected); } catch (e) { console.error('[WS] connection listener error', e); }
    });
  }

  _notifyDocument(documentId, update) {
    // Notify document-specific listeners
    const docListeners = this.documentListeners.get(documentId);
    if (docListeners) {
      docListeners.forEach(cb => {
        try { cb(update); } catch (e) { console.error('[WS] doc listener error', e); }
      });
    }
    // Notify global listeners (e.g. a status-update overlay)
    this.globalListeners.forEach(cb => {
      try { cb(documentId, update); } catch (e) { console.error('[WS] global listener error', e); }
    });
  }

  // ── Subscribe APIs ──────────────────────────────────────────────────────────

  /** Subscribe to connection state changes only. Returns unsubscribe fn. */
  onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  /**
   * Subscribe to status updates for a specific document.
   * Fires immediately with current status if available.
   * Returns unsubscribe fn.
   */
  onDocumentStatus(documentId, callback) {
    if (!documentId || !callback) return () => {};

    if (!this.documentListeners.has(documentId)) {
      this.documentListeners.set(documentId, new Set());
    }
    this.documentListeners.get(documentId).add(callback);

    // Replay current status so the subscriber doesn't miss it
    const current = this.statusUpdates[documentId];
    if (current) setTimeout(() => callback(current), 0);

    return () => {
      const listeners = this.documentListeners.get(documentId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) this.documentListeners.delete(documentId);
      }
    };
  }

  /**
   * Subscribe to ALL document status updates.
   * Callback: (documentId, update) => void
   * Use sparingly — fires on every WS message.
   */
  onAnyStatus(callback) {
    this.globalListeners.add(callback);
    return () => this.globalListeners.delete(callback);
  }

  // ── Connection ──────────────────────────────────────────────────────────────

  connect() {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING ||
      this.connectionPromise
    ) {
      return this.connectionPromise || Promise.resolve(this.ws);
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        let finalUrl = apiEndpoints.WS_STATUS;
        const token = localStorage.getItem('access_token');
        if (token) {
          const sep = finalUrl.includes('?') ? '&' : '?';
          finalUrl = `${finalUrl}${sep}token=${encodeURIComponent(token)}`;
        } else {
          console.warn('[WS] No token found in localStorage');
        }

        const ws = new WebSocket(finalUrl);
        this.ws = ws;

        ws.onopen = () => {
          console.log('[WS] Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this._notifyConnection();
          resolve(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            const isProgress =
              data.message_type === 'processing_progress' ||
              data.message_type === 'upload_progress' ||
              data.message_type === 'progress';

            if (!isProgress) return;

            const { document_id, status, state, progress_percentage } = data;
            const existing = this.statusUpdates[document_id];

            // Skip if nothing actually changed — avoids pointless re-renders
            if (
              existing &&
              existing.status === status &&
              existing.progress_percentage === progress_percentage
            ) {
              return;
            }

            const update = {
              status,
              progress_percentage,
              message: data.message,
              timestamp: Date.now(),
              ...data,
            };
            this.statusUpdates[document_id] = update;
            
            // Also store by filename for optimistic document matching
            if (data.file_name) {
              this.statusUpdates[`filename_${data.file_name}`] = update;
            }
            if (data.filename) {
              this.statusUpdates[`filename_${data.filename}`] = update;
            }
            if (data.name) {
              this.statusUpdates[`filename_${data.name}`] = update;
            }

            // Only notify listeners for THIS document + global listeners.
            // Components watching other documents are NOT touched.
            this._notifyDocument(document_id, update);

            console.log(`[WS] ${document_id}: ${status} (${progress_percentage}%)`);
          } catch (err) {
            console.error('[WS] Parse error:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          this.isConnected = false;
          this.connectionPromise = null;
          this._notifyConnection();
          reject(error);
        };

        ws.onclose = (event) => {
          console.log(`[WS] Closed (code ${event.code})`);
          this.isConnected = false;
          this.ws = null;
          this.connectionPromise = null;
          this._notifyConnection();

          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
            this.reconnectTimeout = setTimeout(() => {
              this.reconnectAttempts += 1;
              this.connect().catch(err => console.error('[WS] Reconnect failed:', err));
            }, delay);
          }
        };
      } catch (err) {
        console.error('[WS] Failed to create connection:', err);
        this.isConnected = false;
        this.connectionPromise = null;
        reject(err);
      }
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try { this.ws.close(1000, 'Normal closure'); } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this._notifyConnection();
  }

  getStatus(documentId) {
    return this.statusUpdates[documentId] || null;
  }

  getAllStatuses() {
    return this.statusUpdates;
  }
}

function getWSManager() {
  if (!wsManagerInstance) wsManagerInstance = new WebSocketManager();
  return wsManagerInstance;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
// Provides the manager instance via context. Does NOT hold any state — the
// manager is a singleton, so the context value never changes reference.
// This means <WebSocketProvider> itself NEVER re-renders due to WS activity.
export const WebSocketProvider = ({ children }) => {
  const managerRef = useRef(getWSManager());

  useEffect(() => {
    const manager = managerRef.current;
    manager.connect().catch(err => console.error('[WebSocketProvider] Init failed:', err));
    // Keep connection alive across provider remounts — do not disconnect on cleanup.
  }, []);

  return (
    <WebSocketContext.Provider value={managerRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};

// ─── Hook: connection status only ─────────────────────────────────────────────
// Re-renders ONLY when the connection opens/closes — not on every WS message.
export const useWSConnection = () => {
  const manager = useContext(WebSocketContext);
  if (!manager) throw new Error('useWSConnection must be used within WebSocketProvider');

  const [isConnected, setIsConnected] = useState(() => manager.isConnected);
  useEffect(() => manager.onConnectionChange(setIsConnected), [manager]);
  return isConnected;
};

// ─── Hook: single-document status ─────────────────────────────────────────────
// Re-renders ONLY when the specified document's status changes.
// Use this in DocumentCard, ProgressPill, table rows, etc.
export const useDocumentStatus = (documentId) => {
  const manager = useContext(WebSocketContext);
  if (!manager) throw new Error('useDocumentStatus must be used within WebSocketProvider');

  const [status, setStatus] = useState(() => manager.getStatus(documentId));
  useEffect(() => {
    if (!documentId) return;
    return manager.onDocumentStatus(documentId, setStatus);
  }, [manager, documentId]);

  return status;
};

// ─── Hook: full status map (use sparingly) ────────────────────────────────────
// Re-renders on every WS status update. Only use in one place (e.g. a single
// status panel), never in list items or table rows.
export const useAllDocumentStatuses = () => {
  const manager = useContext(WebSocketContext);
  if (!manager) throw new Error('useAllDocumentStatuses must be used within WebSocketProvider');

  const [statuses, setStatuses] = useState(() => ({ ...manager.getAllStatuses() }));
  useEffect(() => {
    return manager.onAnyStatus(() => {
      setStatuses({ ...manager.getAllStatuses() });
    });
  }, [manager]);

  return statuses;
};

// ─── Main hook (backward-compatible) ─────────────────────────────────────────
// Keeps the original { isConnected, statusUpdates, subscribeToDocument, ... }
// shape so existing consumers work without changes.
//
// ⚠️  This hook re-renders on every WS message because it returns all
// statusUpdates. That's intentional for backward-compat.
// Migrate callers to useDocumentStatus(id) to eliminate unnecessary re-renders.
export const useWebSocketStatus = () => {
  const manager = useContext(WebSocketContext);
  if (!manager) throw new Error('useWebSocketStatus must be used within WebSocketProvider');

  const [isConnected, setIsConnected] = useState(() => manager.isConnected);
  const [statusUpdates, setStatusUpdates] = useState(() => ({ ...manager.getAllStatuses() }));

  useEffect(() => {
    const unsubConn   = manager.onConnectionChange(setIsConnected);
    const unsubStatus = manager.onAnyStatus(() => {
      setStatusUpdates({ ...manager.getAllStatuses() });
    });
    return () => { unsubConn(); unsubStatus(); };
  }, [manager]);

  return {
    isConnected,
    statusUpdates,
    subscribeToDocument: useCallback(
      (documentId, callback) => manager.onDocumentStatus(documentId, callback),
      [manager]
    ),
    getDocumentStatus: useCallback((documentId) => manager.getStatus(documentId), [manager]),
    connect:           useCallback(() => manager.connect(),    [manager]),
    disconnect:        useCallback(() => manager.disconnect(), [manager]),
  };
};

export default useWebSocketStatus;