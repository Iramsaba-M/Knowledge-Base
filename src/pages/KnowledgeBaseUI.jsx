import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/layout/Sidebar';
import DashboardScreen from './DashboardScreen';
import OnboardingScreen from './Onboardingscreen';
import ContentLibraryScreen from './ContentLibraryScreen';
import TestChatScreen from './TestChatScreen';
import { uploadDocuments, processDocument, fetchAllDocuments } from '../integration/api';

const DOCUMENT_SCREENS = ['content', 'onboarding', 'test'];
// How long to suppress polling after an upload starts (ms).
// Give the backend time to at least register the file before we fetch again.
const UPLOAD_COOLDOWN_MS = 15000;

const KnowledgeBaseUI = ({ currentUser, onLogout }) => {
  const [activeScreen, setActiveScreen] = useState(() => {
    try {
      return localStorage.getItem('activeScreen') || 'dashboard';
    } catch (err) {
      return 'dashboard';
    }
  });
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiError, setHasApiError] = useState(false);

  // ─── Refs (never cause re-renders, safe to read inside effects) ──────────────
  // Tracks IDs currently being approved so the poller can skip during that window.
  // Using a ref instead of useState(Set) because a new Set reference on every
  // setProcessingDocuments call was re-triggering the polling useEffect constantly.
  const processingDocsRef = useRef(new Set());
  // Timestamp set when an upload starts — suppresses polling for UPLOAD_COOLDOWN_MS.
  const lastUploadAt = useRef(null);
  // Stable ref to loadDocuments so the interval closure never goes stale.
  const loadDocumentsRef = useRef(null);
  // Track if we have in-flight documents to avoid polling during uploads
  const hasInFlightDocsRef = useRef(false);

  // ─── Core fetch helper ───────────────────────────────────────────────────────
  // Merges fresh backend list with any docs still in-flight locally so they
  // are never overwritten by a poll that arrives before the backend confirms them.
  const loadDocuments = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setHasApiError(false);
    }
    try {
      const result = await fetchAllDocuments(1, 50);
      setDocuments(prev => {
        const backendIds = new Set(result.documents.map(d => d.id));
        const backendNames = new Set(result.documents.map(d => d.name));
        // Preserve local docs that are still uploading/processing and haven't
        // been confirmed by the backend yet (not in response by id or name).
        const inFlightDocs = prev.filter(doc =>
          (doc._isOptimistic ||
            ['uploading', 'processing', 'upload_started'].includes(doc.status)) &&
          !backendIds.has(doc.id) &&
          !backendNames.has(doc.name)
        );
        return [...inFlightDocs, ...result.documents];
      });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      if (!silent) setHasApiError(true);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []); // ← no deps: setIsLoading/setHasApiError/setDocuments are stable

  // Keep the ref in sync so the interval closure always calls the latest version.
  loadDocumentsRef.current = loadDocuments;

  // ─── Polling — runs ONLY when activeScreen changes ───────────────────────────
  // All refs are used inside the closure to avoid dependency issues
  useEffect(() => {
    if (!DOCUMENT_SCREENS.includes(activeScreen)) return;

    let isMounted = true;

    const safeFetch = async (opts) => {
      if (!isMounted) return;

      // Suppress during upload cooldown window.
      if (lastUploadAt.current) {
        const elapsed = Date.now() - lastUploadAt.current;
        if (elapsed < UPLOAD_COOLDOWN_MS) {
          console.log(`[KnowledgeBaseUI] Suppressing fetch — upload cooldown (${Math.round((UPLOAD_COOLDOWN_MS - elapsed) / 1000)}s left)`);
          return;
        }
      }

      // Check if any documents are currently in upload/processing states
      const inFlight = documents.some(doc =>
        doc._isOptimistic ||
        ['uploading', 'processing', 'upload_started'].includes(doc.status)
      );

      if (inFlight && !hasInFlightDocsRef.current) {
        // First time detecting in-flight docs, log it
        console.log('[KnowledgeBaseUI] Pausing polling — documents are in-flight');
        hasInFlightDocsRef.current = true;
        return;
      } else if (!inFlight && hasInFlightDocsRef.current) {
        // In-flight docs completed, resume polling
        console.log('[KnowledgeBaseUI] Resuming polling — in-flight documents completed');
        hasInFlightDocsRef.current = false;
      } else if (inFlight) {
        // Still have in-flight docs, skip silently
        return;
      }

      // Suppress while a document is being approved/processed.
      if (processingDocsRef.current.size > 0) {
        console.log('[KnowledgeBaseUI] Skipping fetch — documents are being processed');
        return;
      }

      await loadDocumentsRef.current(opts);
    };

    // Immediate load on screen change.
    safeFetch();

    // Periodic background refresh every 30 s.
    const interval = setInterval(() => safeFetch({ silent: true }), 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      // Reset in-flight state when screen changes or component unmounts
      hasInFlightDocsRef.current = false;
    };
  }, [activeScreen]); // ← ONLY activeScreen — using refs for state checks

  // ─── Upload handler ──────────────────────────────────────────────────────────
  const handleUpload = async (files, category, user, language) => {
    lastUploadAt.current = Date.now();
    try {
      await uploadDocuments(files, category, setDocuments, documents, user, language);
      // Wait 3 s after the API confirms receipt, then do one silent refresh.
      setTimeout(() => {
        lastUploadAt.current = null;
        loadDocumentsRef.current({ silent: true });
      }, 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      lastUploadAt.current = null;
    }
  };

  // Persist active screen so refresh restores the same view.
  useEffect(() => {
    try {
      localStorage.setItem('activeScreen', activeScreen);
    } catch (err) { /* ignore */ }
  }, [activeScreen]);

  // ─── Approve handler ─────────────────────────────────────────────────────────
  const handleApprove = async (documentId) => {
    processingDocsRef.current.add(documentId);
    try {
      await processDocument(documentId, setDocuments);
    } catch (error) {
      console.error('Error processing document:', error);
    } finally {
      processingDocsRef.current.delete(documentId);
    }
  };

  // ─── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = async (documentId) => {
    try {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      processingDocsRef.current.delete(documentId);
    } catch (error) {
      console.error('Error removing document from UI:', error);
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setActiveScreen} />;
      case 'content':
        return <ContentLibraryScreen
          documents={documents}
          onViewDoc={() => { }}
          onNavigate={setActiveScreen}
          onApprove={handleApprove}
          onDelete={handleDelete}
          isLoading={isLoading}
          hasApiError={hasApiError}
          onRetry={() => window.location.reload()}
        />;
      case 'onboarding':
        return <OnboardingScreen
          documents={documents}
          onUpload={handleUpload}
          onApprove={handleApprove}
          onDelete={handleDelete}
          isLoading={isLoading}
          hasApiError={hasApiError}
          onRetry={() => window.location.reload()}
          currentUser={currentUser}
        />;
      case 'test':
        return <TestChatScreen
          documents={documents}
          onNavigate={setActiveScreen}
          isLoading={isLoading}
          hasApiError={hasApiError}
          onRetry={() => window.location.reload()}
          currentUser={currentUser}
        />;
      default:
        return <DashboardScreen onNavigate={setActiveScreen} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} currentUser={currentUser} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        {renderScreen()}
      </div>
    </div>
  );
};

export default KnowledgeBaseUI;