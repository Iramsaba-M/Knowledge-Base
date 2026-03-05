/**
 * mockBackend.js
 *
 * Patches window.fetch and window.WebSocket to simulate the real backend.
 * Zero changes to any other file — just add ONE import to your app entry:
 *
 *   // src/index.js  (or main.jsx)
 *   if (process.env.NODE_ENV === 'development') {
 *     import './mockBackend';   // ← add this line, nothing else changes
 *   }
 *
 * Remove (or comment out) that import when the real backend is available.
 *
 * Simulates:
 *   POST   /upload              → upload response + WS progress stream
 *   GET    /documents           → paginated document list
 *   POST   /process-document    → approve a document
 *   DELETE /documents/delete    → archive a document
 *   POST   /auth/login          → mock login
 *   GET    /health              → health check
 *   WS     /ws/status           → upload_started → uploading → uploaded
 */

// ─── In-memory store ──────────────────────────────────────────────────────────

const USERS = [
  { id: 'user_001', email: 'admin@gmail.com', name: 'Admin', username: 'admin' },
];

let mockDocuments = [
  {
    document_id: 'doc_seed_001',
    file_name:   'Sample_Document.pdf',
    status:      'uploaded',
    state:       'uploaded',
    category:    'General',
    tag:         'General',
    file_type:   'pdf',
    file_size:   '1.20 MB',
    page_count:  5,
    uploaded_by: 'admin',
    user_id:     'admin@gmail.com',
    created_at:  new Date(Date.now() - 86400000).toISOString(),
    updated_at:  new Date(Date.now() - 86400000).toISOString(),
    is_active:   true,
    object_path: 'km-documents/PDF/doc_seed_001_Sample_Document.pdf',
  },
  {
    document_id: 'doc_seed_002',
    file_name:   'Vedas_Intro.docx',
    status:      'completed',
    state:       'completed',
    category:    'Vedas',
    tag:         'Vedas',
    file_type:   'docx',
    file_size:   '0.85 MB',
    page_count:  12,
    uploaded_by: 'admin',
    user_id:     'admin@gmail.com',
    created_at:  new Date(Date.now() - 172800000).toISOString(),
    updated_at:  new Date(Date.now() - 172800000).toISOString(),
    is_active:   true,
    object_path: 'km-documents/DOCX/doc_seed_002_Vedas_Intro.docx',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const randomId = () => 'doc_' + Math.random().toString(36).slice(2, 10);
const delay    = (ms) => new Promise(res => setTimeout(res, ms));

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Active WebSocket mock instances — keyed so we can push messages to them
const wsClients = new Set();

/** Push a progress event to all connected mock WS clients */
function broadcastWS(payload) {
  const msg = JSON.stringify(payload);
  wsClients.forEach(client => {
    if (client.readyState === 1) client._trigger('message', { data: msg });
  });
}

// ─── Upload progress simulation ───────────────────────────────────────────────
// Mirrors the exact WS payload sequence from the spec:
//   upload_started(0) → uploading(0) → uploading(10) → uploading(25)
//   → uploading(40) → uploaded(90) → [done]

async function simulateUploadProgress(documentId, fileName) {
  const steps = [
    { status: 'upload_started', state: 'upload_started', progress_percentage: 0,  message: 'Processing loading',                delay: 300  },
    { status: 'uploading',      state: 'uploading',      progress_percentage: 0,  message: 'Media processing started',          delay: 600  },
    { status: 'uploading',      state: 'uploading',      progress_percentage: 10, message: 'Fetching media file',               delay: 800  },
    { status: 'uploading',      state: 'uploading',      progress_percentage: 25, message: 'Uploading to storage',              delay: 900  },
    { status: 'uploading',      state: 'uploading',      progress_percentage: 40, message: 'Storing document metadata',         delay: 700  },
    { status: 'uploading',      state: 'uploading',      progress_percentage: 70, message: 'Finalizing upload',                 delay: 600  },
    { status: 'uploaded',       state: 'uploaded',       progress_percentage: 90, message: 'Upload completed successfully',     delay: 400  },
  ];

  for (const step of steps) {
    await delay(step.delay);
    broadcastWS({
      message_type:       'progress',
      document_id:        documentId,
      status:             step.status,
      state:              step.state,
      progress_percentage: step.progress_percentage,
      message:            step.message,
      file_name:          fileName,
    });
  }

  // Update in-memory store to reflect final uploaded state
  const doc = mockDocuments.find(d => d.document_id === documentId);
  if (doc) {
    doc.status = 'uploaded';
    doc.state  = 'uploaded';
  }
}

// Processing progress after approve (extracting → chunking → storing → completed)
async function simulateProcessingProgress(documentId) {
  const steps = [
    { status: 'extracting', state: 'extracting', progress_percentage: 20, message: 'Extracting text content',        delay: 800  },
    { status: 'extracting', state: 'extracting', progress_percentage: 40, message: 'Parsing document structure',     delay: 700  },
    { status: 'chunking',   state: 'chunking',   progress_percentage: 55, message: 'Chunking content',               delay: 900  },
    { status: 'chunking',   state: 'chunking',   progress_percentage: 70, message: 'Chunking video transcript',      delay: 800  },
    { status: 'storing',    state: 'storing',    progress_percentage: 85, message: 'Storing chunks in vector DB',    delay: 700  },
    { status: 'completed',  state: 'completed',  progress_percentage: 100, message: 'Processing completed: 8 chunks', delay: 500 },
  ];

  for (const step of steps) {
    await delay(step.delay);
    broadcastWS({
      message_type:       'progress',
      document_id:        documentId,
      status:             step.status,
      state:              step.state,
      progress_percentage: step.progress_percentage,
      message:            step.message,
    });
  }

  const doc = mockDocuments.find(d => d.document_id === documentId);
  if (doc) {
    doc.status = 'completed';
    doc.state  = 'completed';
  }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

const routes = {

  // POST /upload
  async upload(req) {
    const formData = await req.formData();
    const file     = formData.get('file');
    const category = formData.get('category') || 'General';
    const userId   = formData.get('user_id')   || '';
    const userName = formData.get('user_name') || '';

    if (!file) return jsonResponse({ detail: 'No file provided' }, 400);

    const docId    = randomId();
    const fileType = file.name.split('.').pop().toLowerCase();
    const fileSize = ((file.size || Math.random() * 10 * 1024 * 1024) / 1024 / 1024).toFixed(2) + ' MB';
    const now      = new Date().toISOString();

    const newDoc = {
      document_id:   docId,
      file_name:     file.name,
      status:        'uploaded',
      state:         'uploaded',
      category,
      tag:           category,
      file_type:     fileType,
      file_size:     fileSize,
      page_count:    null,
      uploaded_by:   userName || 'admin',
      user_id:       userId || 'admin@gmail.com',
      created_at:    now,
      updated_at:    now,
      is_active:     true,
      document_type: 'unstructured',
      format:        fileType,
      object_path:   `km-documents/${fileType.toUpperCase()}/${docId}_${file.name}`,
      storage_folder: fileType.toUpperCase(),
      message:       'Upload completed successfully',
      message_type:  'upload_progress',
      progress_percentage: null,
    };

    mockDocuments.unshift(newDoc);

    // Kick off async WS progress stream — does not block the HTTP response
    simulateUploadProgress(docId, file.name);

    return jsonResponse(newDoc);
  },

  // GET /documents
  listDocuments(url) {
    const params   = new URL(url).searchParams;
    const page     = parseInt(params.get('page')      || '1', 10);
    const pageSize = parseInt(params.get('page_size') || '10', 10);
    const active   = mockDocuments.filter(d => d.is_active);
    const start    = (page - 1) * pageSize;
    const slice    = active.slice(start, start + pageSize);

    return jsonResponse({
      documents: slice,
      pagination: {
        page,
        page_size: pageSize,
        total:     active.length,
        pages:     Math.ceil(active.length / pageSize),
      },
    });
  },

  // POST /process-document
  async processDocument(req) {
    const body       = await req.json();
    const documentId = body.document_id;
    const doc        = mockDocuments.find(d => d.document_id === documentId);

    if (!doc) return jsonResponse({ detail: 'Document not found' }, 404);

    doc.status = 'processing';
    doc.state  = 'processing';

    simulateProcessingProgress(documentId);

    return jsonResponse({ status: 'processing', document_id: documentId });
  },

  // DELETE /documents/delete
  async deleteDocument(req) {
    const body       = await req.json();
    const documentId = body.document_id;
    const doc        = mockDocuments.find(d => d.document_id === documentId);

    if (!doc) return jsonResponse({ detail: 'Document not found' }, 404);

    doc.is_active = false;
    return jsonResponse({ message: 'Document archived successfully', document_id: documentId });
  },

  // POST /auth/login
  async login(req) {
    const body = await req.json();
    const user = USERS.find(u => u.email === body.email);
    if (!user) return jsonResponse({ detail: 'Invalid credentials' }, 401);
    return jsonResponse({
      access_token: 'mock_token_' + Date.now(),
      token_type:   'bearer',
      user,
    });
  },

  // GET /health
  health() {
    return jsonResponse({ status: 'ok', mock: true });
  },
};

// ─── fetch interceptor ────────────────────────────────────────────────────────

const _realFetch = window.fetch.bind(window);

window.fetch = async function mockFetch(input, init = {}) {
  const url    = typeof input === 'string' ? input : input.url;
  const method = (init.method || 'GET').toUpperCase();

  // Only intercept requests to our API base URL
  const API_HOST = 'http://localhost:8001';
  if (!url.startsWith(API_HOST)) {
    return _realFetch(input, init);
  }

  const path = url.replace(API_HOST, '').split('?')[0];

  console.log(`[Mock] ${method} ${path}`);

  // Simulate network latency
  await delay(200 + Math.random() * 200);

  try {
    if (method === 'POST' && path === '/upload')
      return await routes.upload(new Request(url, init));

    if (method === 'GET' && path === '/documents')
      return routes.listDocuments(url);

    if (method === 'POST' && path === '/process-document')
      return await routes.processDocument(new Request(url, init));

    if (method === 'DELETE' && path === '/documents/delete')
      return await routes.deleteDocument(new Request(url, init));

    if (method === 'POST' && path === '/auth/login')
      return await routes.login(new Request(url, init));

    if (method === 'GET' && path === '/health')
      return routes.health();

    // Unhandled route — log and return 404 rather than hanging
    console.warn(`[Mock] Unhandled route: ${method} ${path}`);
    return jsonResponse({ detail: `Mock: no handler for ${method} ${path}` }, 404);
  } catch (err) {
    console.error('[Mock] Handler error:', err);
    return jsonResponse({ detail: 'Mock internal error: ' + err.message }, 500);
  }
};

// ─── WebSocket interceptor ────────────────────────────────────────────────────

const _RealWebSocket = window.WebSocket;

class MockWebSocket extends EventTarget {
  constructor(url) {
    super();
    this.url        = url;
    this.readyState = 0; // CONNECTING
    this.CONNECTING = 0;
    this.OPEN       = 1;
    this.CLOSING    = 2;
    this.CLOSED     = 3;

    this.onopen    = null;
    this.onmessage = null;
    this.onerror   = null;
    this.onclose   = null;

    wsClients.add(this);

    // Simulate connection established
    setTimeout(() => {
      this.readyState = 1; // OPEN
      console.log('[Mock WS] Connected to', url);
      this._trigger('open', {});
    }, 100);
  }

  /** Internal: fire an event + call the on* handler */
  _trigger(type, eventData) {
    const event = Object.assign(new Event(type), eventData);
    this.dispatchEvent(event);
    const handler = this['on' + type];
    if (typeof handler === 'function') handler(event);
  }

  send(data) {
    console.log('[Mock WS] send (ignored in mock):', data);
  }

  close(code = 1000, reason = '') {
    this.readyState = 3; // CLOSED
    wsClients.delete(this);
    this._trigger('close', { code, reason, wasClean: code === 1000 });
    console.log('[Mock WS] Closed');
  }
}

// Only patch if the URL targets our WS endpoint
const _OriginalWebSocket = window.WebSocket;
window.WebSocket = function PatchedWebSocket(url, protocols) {
  const WS_HOST = 'ws://192.168.4.116:8001';
  if (url && url.startsWith(WS_HOST)) {
    console.log('[Mock WS] Intercepted:', url);
    return new MockWebSocket(url);
  }
  return new _OriginalWebSocket(url, protocols);
};
// Copy static constants so code that checks WebSocket.OPEN etc. still works
Object.assign(window.WebSocket, _OriginalWebSocket);

// ─── Confirmation ─────────────────────────────────────────────────────────────
console.log('%c[mockBackend] Active — all API calls intercepted. Remove import when real BE is available.', 'color: #f59e0b; font-weight: bold;');