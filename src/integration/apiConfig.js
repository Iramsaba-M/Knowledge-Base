// API Configuration File
// Centralized configuration for all API endpoints, base URLs, and related settings

const API_BASE_URL = 'http://localhost:8001';

// WebSocket URL (automatically derived from API_BASE_URL)
const WS_BASE_URL = API_BASE_URL.replace(/^https/, 'ws');

const apiEndpoints = {
  // Document Management
  UPLOAD_DOCUMENT: `${API_BASE_URL}/upload`,
  FETCH_DOCUMENTS: `${API_BASE_URL}/documents`,
  DELETE_DOCUMENT: `${API_BASE_URL}/documents`,
  GET_DOCUMENT: `${API_BASE_URL}/documents/{id}`,
  PROCESS_DOCUMENT: `${API_BASE_URL}/process-document`,
  LIST_DOCUMENTS: `${API_BASE_URL}/documents`,

  // Chat and Knowledge Base
  CHAT_CREATE: `${API_BASE_URL}/chat/create`,
  CHAT_QUERY: `${API_BASE_URL}/chat`,
  CHAT_HISTORY: `${API_BASE_URL}/chat/{chat_id}/history`,
  LIST_CHATS: `${API_BASE_URL}/chat/history`,
  LIST_CHAT_TITLES: `${API_BASE_URL}/title/{user_id}`,
  CHAT_CLEAR: `${API_BASE_URL}/chat/{chat_id}/clear`,

  //Get User Chats

  // User Management
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  PROFILE: `${API_BASE_URL}/auth/profile`,

  // Analytics and Monitoring
  ANALYTICS: `${API_BASE_URL}/analytics`,
  ACTIVITY_LOG: `${API_BASE_URL}/activity`,

  // System Configuration
  SETTINGS: `${API_BASE_URL}/settings`,
  HEALTH_CHECK: `${API_BASE_URL}/health`,

  // WebSocket Endpoints
  WS_STATUS: `${WS_BASE_URL}/ws/status`
};

// Additional configuration settings
const apiConfig = {
  // timeout: 30000, // 30 seconds
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Enable/disable debug logging
  debug: process.env.NODE_ENV === 'development'
};

export {
  API_BASE_URL,
  WS_BASE_URL,
  apiEndpoints,
  apiConfig
};