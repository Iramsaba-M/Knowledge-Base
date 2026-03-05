// API Integration Module for Knowledge Base Application
import { apiEndpoints } from './apiConfig';

// Helper function to safely map API response fields to document object
const mapApiResponseToDocument = (apiResponse, fallbackDoc, category, currentUser) => {
  if (!apiResponse) return fallbackDoc;

  // Safe field accessor with multiple fallback options
  const getField = (field, ...fallbacks) => {
    for (const key of [field, ...fallbacks]) {
      if (apiResponse[key] !== undefined && apiResponse[key] !== null) {
        return apiResponse[key];
      }
    }
    return undefined;
  };

  const documentId = getField('document_id', 'id', 'doc_id') || fallbackDoc.id;
  const fileName = getField('file_name', 'filename', 'name') || fallbackDoc.name;
  const status = getField('status') || fallbackDoc.status || 'uploaded';
  const fileType = getField('file_type', 'fileType', 'type', 'document_type') || fallbackDoc.fileType || '—';
  const fileSize = getField('file_size', 'filesize', 'size') || fallbackDoc.size || '—';
  const createdAt = getField('created_at', 'createdAt', 'uploaded_at', 'uploadedAt');
  const uploadedByField = getField('uploaded_by', 'uploadedBy', 'user_name', 'userName', 'user_id', 'userId') || (currentUser && (currentUser.name || currentUser.email)) || fallbackDoc.uploader;
  const pageCount = getField('page_count', 'pageCount', 'pages') || fallbackDoc.pages || '—';
  const categoryField = getField('category') || category || fallbackDoc.category || 'General';
  const tagField = getField('tag', 'tags') || fallbackDoc.tag || '';
  const objectPath = getField('object_path', 'objectPath', 'path');
  const documentType = getField('document_type', 'documentType');
  const words = getField('words', 'word_count', 'wordCount');
  const language = getField('language', 'lang');
  const checksum = getField('checksum', 'hash', 'file_hash');

  // Ensure uploader is always a plain string — never an object.
  // Raw API fields can contain nested objects that break React rendering.
  const safeUploader = typeof uploadedByField === 'string'
    ? uploadedByField
    : (uploadedByField?.name || uploadedByField?.email || String(uploadedByField ?? 'Unknown'));

  return {
    ...fallbackDoc,
    id: documentId,
    name: fileName,
    status: status,
    state: status,
    progress: status === 'processing' ? 50 : 100,
    documentType: documentType || fileType,
    fileType: fileType,
    file_type: (fileType || '').toLowerCase(),
    objectPath: objectPath,
    category: categoryField,
    tag: tagField,
    size: fileSize,
    pages: pageCount,
    words: words,
    language: language,
    checksum: checksum,
    uploadedDate: createdAt ? createdAt.split('T')[0] : (fallbackDoc?.uploadedDate || '—'),
    uploadedDateTime: createdAt ? createdAt.replace('T', ' ').split('.')[0].slice(0, 16) : (fallbackDoc?.uploadedDateTime || '—'),
    uploader: safeUploader,
    uploadedBy: safeUploader,
    userName: safeUploader,
    is_active: true,
    // NOTE: do NOT spread ...apiResponse here. Raw API fields can contain objects
    // (e.g. nested user data) that overwrite safely-extracted strings and cause
    // React "Objects are not valid as a React child" crashes.
  };
};

// Function to upload documents to the backend API
// NOTE: This function manages its own optimistic state via setDocuments.
// Callers should NOT call fetchAllDocuments immediately after this returns —
// doing so races with the backend and overwrites in-flight docs.
// Instead, callers should wait (see UPLOAD_COOLDOWN_MS in KnowledgeBaseUI)
// and use the merge-aware loadDocuments helper.
export const uploadDocuments = async (files, category, setDocuments, documents, currentUser = null, language = null) => {
  console.log('uploadDocuments called with files:', files);
  const formData = new FormData();

  // Add each file to the form data
  files.forEach(file => {
    formData.append('file', file, file.name);
  });

  // Add tag to form data
  if (category) {
    formData.append('category', category);  // matches curl spec: --form 'category=...'
    // formData.append('tag', category);            // also send as tag for backward compat
  }

  // Add language to form data
  if (language) {
    formData.append('language', language);
  }

  // Add user information to form data
  if (currentUser) {
    formData.append('user_id', currentUser.email || '');
    formData.append('user_name', currentUser.name || currentUser.username || '');
  }

  try {
    // Store the original file names to match with API response
    const originalFileNames = files.map(file => file.name);

    // Update documents state to show upload in progress
    const newDocuments = [];
    files.forEach((file, index) => {
      const extMatch = file.name.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
      const fileType = extMatch ? extMatch[1].toLowerCase() : '';
      const now = new Date();
      const newDoc = {
        id: Date.now() + index, // temporary ID
        name: file.name,
        status: 'upload_started',
        progress: 0,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: fileType,
        pages: '-',
        words: null,
        category: category || 'uncategorized',
        tag: category || '',
        language: language || 'en',
        uploadedDate: now.toISOString().split('T')[0],
        uploadedDateTime: now.toISOString().slice(0, 16).replace('T', ' '),
        uploader: currentUser ? String(currentUser.name || currentUser.email || currentUser.username || 'Unknown') : 'Unknown',
        uploadedBy: currentUser ? String(currentUser.name || currentUser.email || currentUser.username || 'Unknown') : 'Unknown',
        is_active: true,
        _isOptimistic: true,
        _originalName: file.name
      };
      newDocuments.push(newDoc);
    });

    setDocuments(prev => [...newDocuments, ...prev]);

    // Make API call to upload the document using configured endpoint
    const response = await fetch(apiEndpoints.UPLOAD_DOCUMENT, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();

      // Normalize API responses into an array
      const apiResponses = Array.isArray(result) ? result : [result];

      // Update document status and metadata based on API response
      setDocuments(prev => prev.map(doc => {
        const isProcessing = files.some(file => file.name === doc.name && doc.status === 'upload_started');
        if (isProcessing) {
          // Try to find matching API response by file name or fallback to first
          const apiResponse = apiResponses.find(r => {
            const rFileName = r.file_name || r.filename || r.name;
            const rDocId = r.document_id || r.id || r.doc_id;
            return (rFileName && rFileName === doc.name) || (rDocId && rDocId === doc.id);
          }) || apiResponses[0];

          // Use the new mapping helper for robust field alignment
          return mapApiResponseToDocument(apiResponse, doc, category, currentUser);
        }
        return doc;
      }));

      // Return the API response for the caller to use if needed
      return result;
    } else {
      throw new Error(`Upload failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Upload error:', error);

    // Update document status to error but keep them visible
    setDocuments(prev => prev.map(doc => {
      const isFailed = files.some(file => file.name === doc.name && doc.status === 'upload_started');
      if (isFailed) {
        return { ...doc, status: 'failed', progress: 0, is_active: true, errorMessage: error.message };
      }
      return doc;
    }));

    // Re-throw the error so the caller knows about the failure
    throw error;
  }
};

// Additional API functions can be added here as needed

// Function to fetch all documents from the backend with pagination
export const fetchAllDocuments = async (page = 1, pageSize = 10) => {
  try {
    const response = await fetch(`${apiEndpoints.LIST_DOCUMENTS}?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        // "ngrok-skip-browser-warning": "true"
      }
    });

    if (response.ok) {
      const result = await response.json();

      // Transform the API response to match the existing document structure with flexible field mapping
      const transformedDocuments = (result.documents || []).map(doc => {
        // Safe field accessor with fallback options
        const getField = (field, ...fallbacks) => {
          for (const key of [field, ...fallbacks]) {
            if (doc[key] !== undefined && doc[key] !== null) {
              return doc[key];
            }
          }
          return undefined;
        };

        const documentId = getField('document_id', 'id', 'doc_id');
        const fileName = getField('file_name', 'filename', 'name');
        const status = getField('status');
        const createdAt = getField('created_at', 'createdAt', 'uploaded_at');
        const fileType = getField('file_type', 'fileType', 'type', 'document_type');
        const fileSize = getField('file_size', 'filesize', 'size');
        const pageCount = getField('page_count', 'pageCount', 'pages');
        const userName = getField('user_name', 'userName', 'uploaded_by', 'uploader');
        const userId = getField('user_id', 'userId', 'uid');
        const category = getField('category', 'cat');
        const tag = getField('tag', 'tags');
        const isActive = getField('is_active', 'isActive', 'active');

        return {
          id: documentId,
          name: fileName,
          status: status,
          category: category,
          tag: tag,
          progress: status === 'processing' ? 50 : 100,
          size: fileSize || '—',
          pages: pageCount || '—',
          words: getField('words', 'word_count', 'wordCount'),
          documentType: fileType,
          fileType: fileType,
          storage: getField('storage', 'location'),
          createdAt: createdAt,
          updatedAt: getField('updated_at', 'updatedAt', 'modified_at'),
          userId: userId,
          userName: userName,
          uploader: typeof userName === 'string' ? userName : String(userName ?? '—'),
          uploadedBy: typeof userName === 'string' ? userName : String(userName ?? '—'),
          version: getField('version', 'v'),
          is_active: isActive !== undefined ? isActive : true,
          checksum: getField('checksum', 'hash', 'file_hash'),
          objectPath: getField('object_path', 'objectPath', 'path'),
          uploadedDate: createdAt ? createdAt.split('T')[0] : '—',
          uploadedDateTime: createdAt ? createdAt.replace('T', ' ').split('.')[0].slice(0, 16) : '—',
          language: getField('language', 'lang'),

          // NOTE: do NOT spread ...doc here — raw API fields may contain objects
          // that cause React "Objects are not valid as a React child" crashes.
        };
      });

      return {
        documents: transformedDocuments,
        pagination: result.pagination
      };
    } else {
      throw new Error(`Fetch documents failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching documents:', error.message);
    throw error;
  }
};

// Function to fetch all documents from the backend
export const fetchDocuments = async () => {
  try {
    const response = await fetch(apiEndpoints.FETCH_DOCUMENTS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // "ngrok-skip-browser-warning": "true"
      },
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      throw new Error(`Fetch documents failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

// Function to delete a document from the backend
export const deleteDocument = async (documentId) => {
  try {
    const response = await fetch(`${apiEndpoints.DELETE_DOCUMENT}/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Delete document failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Track documents currently being processed to prevent duplicates
const processingQueue = new Set();

// Function to process/approve a document
export const processDocument = async (documentId, setDocuments) => {
  // Prevent duplicate processing of the same document
  if (processingQueue.has(documentId)) {
    console.log(`[processDocument] Document ${documentId} is already being processed`);
    return;
  }

  try {
    console.log('Processing document:', documentId);
    processingQueue.add(documentId);

    // Update document status to processing immediately and trigger re-render
    setDocuments(prev => {
      const updatedDocs = prev.map(doc =>
        doc.id === documentId ? { ...doc, status: 'processing', progress: 0 } : doc
      );
      console.log(`[processDocument] Updated document ${documentId} status to processing`);
      return updatedDocs;
    });

    // Make API call to process the document
    const response = await fetch(apiEndpoints.PROCESS_DOCUMENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        document_id: documentId
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Process document successful:', result);

      // Update document status based on API response
      setDocuments(prev => prev.map(doc => {
        if (doc.id === documentId) {
          let newStatus = result?.status || 'completed';
          // After processing, document should be in 'completed' state
          if (newStatus === 'ready') {
            newStatus = 'completed';
          }

          console.log(`[API] Process document response for ${documentId}: status=${newStatus}`);

          return {
            ...doc,
            status: newStatus,
            progress: 100,
            ...(result?.document_type && { documentType: result.document_type }),
            ...(result?.object_path && { objectPath: result.object_path })
          };
        }
        return doc;
      }));

      return result;
    } else {
      throw new Error(`Process document failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Process document error:', error);

    // Update document status to error
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId ? { ...doc, status: 'error', progress: 0 } : doc
    ));

    // Removed alert to let WebSocket handle error display
    // alert(`Process document failed: ${error.message || 'Unknown error occurred'}`);

    throw error;
  } finally {
    // Always remove from processing queue
    processingQueue.delete(documentId);
    console.log(`[processDocument] Removed document ${documentId} from processing queue`);
  }
};

// Function to start a new chat session
export const createChat = async (userId = "") => {
  try {
    const response = await fetch(apiEndpoints.CHAT_CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Chat creation failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Function to send a chat message and get a response
export const sendChatMessage = async (userId, chatId, query, category = "") => {
  try {
    const response = await fetch(apiEndpoints.CHAT_QUERY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        chat_id: chatId,
        query: query,
        category: category
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Chat query failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error getting chat response:', error);
    throw error;
  }
};

// Function to fetch chat history for a specific session
export const fetchChatHistory = async (chatId, userId = "") => {
  try {
    const url = apiEndpoints.CHAT_HISTORY.replace('{chat_id}', chatId) + `?user_id=${userId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Fetch history failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Function to fetch all chat sessions for a user
export const fetchAllChatSessions = async (userId = "") => {
  try {
    const response = await fetch(`${apiEndpoints.LIST_CHATS}?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `List chats failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error listing chat sessions:', error);
    throw error;
  }
};

// Function to fetch chat titles (chat_id and title) for a user
export const fetchChatTitles = async (userId = "") => {
  try {
    const url = apiEndpoints.LIST_CHAT_TITLES.replace('{user_id}', encodeURIComponent(userId));
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Fetch chat titles failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching chat titles:', error);
    throw error;
  }
};

// Function to clear/delete a chat session
export const clearChatHistory = async (chatId, userId = "") => {
  try {
    const url = apiEndpoints.CHAT_CLEAR.replace('{chat_id}', chatId) + `?user_id=${userId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Empty body as per curl spec
    });
 
    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Clear chat failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
};

// Function to check API health/status
export const checkHealth = async () => {
  try {
    const response = await fetch(apiEndpoints.HEALTH_CHECK, {
      method: 'GET',
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Health check failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

// Function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await fetch(apiEndpoints.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Registration failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Function to login a user
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(apiEndpoints.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (response.ok) {
      const data = await response.json();
      // Store the token and user data in localStorage
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        // Also store user info if available
        if (data.user) {
          localStorage.setItem('user_info', JSON.stringify(data.user));
        }
      }
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Login failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Function to logout a user
export const logoutUser = async () => {
  try {
    // Remove stored tokens and user info
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');

    // Optionally call backend logout endpoint
    const response = await fetch(apiEndpoints.LOGOUT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    }).catch(() => { }); // Ignore errors during logout

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Function to get current user info
export const getCurrentUser = () => {
  try {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// Function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  return !!token;
};

// Function to delete a document using a JSON body (matches provided curl)
export const deleteDocumentByBody = async (documentId) => {
  try {
    const response = await fetch(`${apiEndpoints.FETCH_DOCUMENTS}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ document_id: documentId })
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errText = await response.text().catch(() => '');
      throw new Error(`Delete (body) failed: ${response.status} ${errText}`);
    }
  } catch (error) {
    console.error('Error deleting document (body):', error);
    throw error;
  }
};