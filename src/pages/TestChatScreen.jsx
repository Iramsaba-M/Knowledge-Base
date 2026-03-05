import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/atomic/Card';
import Button from '../components/atomic/Button';
import ChatMessage from '../components/feature/ChatMessage';
import { MessageSquare, Check, FileText, ChevronDown, ChevronRight, PlusCircle, History, Clock, Mic, MicOff, Trash2 } from 'lucide-react';
import { createChat, sendChatMessage, fetchChatHistory, fetchAllChatSessions, fetchChatTitles, clearChatHistory } from '../integration/api';

import ConfirmDialog from '../components/atomic/ConfirmDialog';

const TestChatScreen = ({ documents = [], onNavigate, isLoading, hasApiError, onRetry, currentUser }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I\'m your knowledge base assistant. Ask me anything about the uploaded documents.',
      sources: null
    }
  ]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [isInitializingChat, setIsInitializingChat] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const recognitionRef = useRef(null);
  

  // Initialize/Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [currentUser]);

  // const loadSessions = async () => {
  //   setIsLoadingSessions(true);
  //   setSessionsError(null);
  //   try {
  //     const userId = currentUser?.email || currentUser?.id || "";
  //     const result = await fetchChatTitles(userId);
  //     // Result is an array of { chat_id, title }
  //     // setChatSessions(Array.isArray(result) ? result : []);
  //     setChatSessions(Array.isArray(result) ? [...result].reverse() : []);
  //   } catch (error) {
  //     console.error('Failed to load sessions:', error);
  //     setSessionsError('Failed to load history.');
  //   } finally {
  //     setIsLoadingSessions(false);
  //   }
  // };

  const loadSessions = async (silent = false) => {
    if (!silent) setIsLoadingSessions(true);
    setSessionsError(null);
    try {
      const userId = currentUser?.email || currentUser?.id || "";
      const result = await fetchChatTitles(userId);
      // Result is an array of { chat_id, title }
      const sessions = Array.isArray(result) ? [...result].reverse() : [];
      setChatSessions(sessions);
      return result; // Return raw result for polling logic
    } catch (error) {
      console.error('Failed to load sessions:', error);
      if (!silent) setSessionsError('Failed to load history.');
    } finally {
      if (!silent) setIsLoadingSessions(false);
    }
  };

  const handleNewChat = async () => {
    setIsInitializingChat(true);
    setChatError(null);
    setChatId(null);
    setMessages([
      {
        role: 'assistant',
        text: 'Hello! I\'m your knowledge base assistant. Ask me anything about the uploaded documents.',
        sources: null
      }
    ]);
    try {
      const userId = currentUser?.email || currentUser?.id || "";
      const result = await createChat(userId);
      if (result && (result.chat_id || result.id)) {
        setChatId(result.chat_id || result.id);
        // Refresh sessions list to include new one if needed
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to start new chat:', error);
      setChatError('Failed to start new chat session.');
    } finally {
      setIsInitializingChat(false);
    }
  };

  const handleLoadSession = async (sid) => {
    if (sid === chatId) return;
    setIsInitializingChat(true);
    setChatError(null);
    setChatId(sid);
    try {
      const userId = currentUser?.email || currentUser?.id || "";
      const result = await fetchChatHistory(sid, userId);

      // Map history messages to UI internal format
      if (result && result.messages) {
        setMessages(result.messages.map(m => ({
          role: m.role,
          text: m.content || m.text,
          timestamp: m.timestamp,
          sources: m.sources || []
        })));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setChatError('Failed to load chat history.');
    } finally {
      setIsInitializingChat(false);
    }
  };

  const handleDeleteChat = (e, session) => {
    e.stopPropagation();
    setChatToDelete(session);
    setIsDeleteDialogOpen(true);
  };
 
  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
 
    setIsDeleteDialogOpen(false);
 
    try {
      const userId = currentUser?.email || currentUser?.id || "";
      await clearChatHistory(chatToDelete.chat_id, userId);
 
      // If the deleted chat was the active one, start a new chat
      if (chatId === chatToDelete.chat_id) {
        handleNewChat();
      }
 
      // Refresh the session list
      loadSessions(true); // Silent refresh
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete the conversation. Please try again.');
    } finally {
      setChatToDelete(null);
    }
  };

  // Initialize a new chat if none is active on mount (optional, or wait for user action)
  useEffect(() => {
    if (!chatId && !isInitializingChat && !chatError && messages.length <= 1) {
      // handleNewChat(); // Auto-start a new chat if needed
    }
  }, []);

  // Filter documents to show only those with 'ready' status
  const readyDocuments = documents.filter(doc => doc.status === 'completed');

  // State to track selected documents
  const [selectedDocs, setSelectedDocs] = useState([]);

  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState({});

  // Function to handle document selection
  const toggleDocumentSelection = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // Function to handle document selection (for checkbox)
  const handleDocumentCheckboxChange = (docId, isChecked) => {
    setSelectedDocs(prev => {
      if (isChecked) {
        // Add document if not already selected
        if (prev.includes(docId)) {
          return prev;
        }
        return [...prev, docId];
      } else {
        // Remove document if currently selected
        return prev.filter(id => id !== docId);
      }
    });
  };

  // Function to toggle category expansion
  const togglecategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Function to check if a category is fully selected
  const checkcategoryFullySelected = (categoryName) => {
    const categoryDocs = readyDocuments.filter(doc => {
      if (categoryName === 'Uncategoryged') {
        return !doc.category || doc.category === '' || doc.category === null;
      } else {
        return doc.category === categoryName;
      }
    });
    if (categoryDocs.length === 0) return false;
    return categoryDocs.every(doc => selectedDocs.includes(doc.id));
  };

  // Function to check how many documents in a category are selected
  const getcategorySelectedCount = (categoryName) => {
    const categoryDocs = readyDocuments.filter(doc => {
      if (categoryName === 'Uncategoryged') {
        return !doc.category || doc.category === '' || doc.category === null;
      } else {
        return doc.category === categoryName;
      }
    });
    return categoryDocs.filter(doc => selectedDocs.includes(doc.id)).length;
  };

  // Function to select all documents in a category
  const selectcategoryDocuments = (category) => {
    const categoryDocs = readyDocuments.filter(doc => {
      if (category === 'Uncategoryged') {
        return !doc.category || doc.category === '' || doc.category === null;
      } else {
        return doc.category === category;
      }
    });
    const categoryDocIds = categoryDocs.map(doc => doc.id);
    setSelectedDocs(prev => [...new Set([...prev, ...categoryDocIds])]);
  };

  // Function to deselect all documents in a category
  const deselectcategoryDocuments = (category) => {
    const categoryDocs = readyDocuments.filter(doc => {
      if (category === 'Uncategoryged') {
        return !doc.category || doc.category === '' || doc.category === null;
      } else {
        return doc.category === category;
      }
    });
    const categoryDocIds = categoryDocs.map(doc => doc.id);
    setSelectedDocs(prev => prev.filter(id => !categoryDocIds.includes(id)));
  };

  // Group documents by category
  const documentsBycategory = readyDocuments.reduce((acc, doc) => {
    const category = doc.category || 'Uncategoryged';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {});

  // Function to select all documents
  const selectAllDocuments = () => {
    setSelectedDocs(readyDocuments.map(doc => doc.id));
  };

  // Function to clear all selections
  const clearAllSelections = () => {
    setSelectedDocs([]);
  };

  // Speech Recognition Setup (Dictation)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false; // Stop when the user stops speaking
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let transcriptionBuffer = '';
    const initialInput = input;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const fullMessage = (initialInput.trim() ? `${initialInput.trim()} ${finalTranscript}` : finalTranscript);
        transcriptionBuffer = fullMessage;
        setInput(fullMessage);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-send if there's transcribed text
      if (transcriptionBuffer.trim()) {
        handleSend(transcriptionBuffer);
      }
    };

    recognition.start();
  };

  const handleSend = async (overrideMessage = null) => {
    const userMessage = typeof overrideMessage === 'string' ? overrideMessage : input;
    if (!userMessage.trim() || isInitializingChat || isSending) return;

    setIsSending(true);
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    try {
      const userId = currentUser?.email || currentUser?.id || "";

      // Auto-initialize chat if needed
      let activeChatId = chatId;
      if (!activeChatId) {
        setChatError(null);
        setIsInitializingChat(true);
        try {
          const initResult = await createChat(userId);
          if (initResult && (initResult.chat_id || initResult.id)) {
            activeChatId = initResult.chat_id || initResult.id;
            setChatId(activeChatId);
            loadSessions();
          } else {
            throw new Error("Failed to initialize session.");
          }
        } finally {
          setIsInitializingChat(false);
        }
      }

      // Determine category from selected documents
      let category = "";
      if (selectedDocs.length > 0) {
        const selectedDocObjects = readyDocuments.filter(doc => selectedDocs.includes(doc.id));
        if (selectedDocObjects.length > 0) {
          category = selectedDocObjects[0].category || "";
        }
      }

      const result = await sendChatMessage(userId, activeChatId, userMessage, category);

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: result.answer || 'I could not find an answer in the provided documents.',
        sources: result.sources || []
      }]);
  //   } catch (error) {
  //     console.error('Chat message failed:', error);
  //     setMessages(prev => [...prev, {
  //       role: 'assistant',
  //       text: 'Sorry, I encountered an error while processing your request. Please try again.',
  //       isError: true
  //     }]);
  //   } finally {
  //     setIsSending(false);
  //   }
  // };

   
      // Auto-refresh sessions to update titles and include new chats
      // We refresh immediately and then poll silently to catch the title without flickering
      loadSessions(true);
 
      let pollCount = 0;
      const maxPolls = 8; // Poll for up to 16 seconds
      const pollInterval = setInterval(async () => {
        pollCount++;
        const sessions = await loadSessions(true); // Silent refresh
 
        // Check if the current chat has a descriptive title yet
        if (Array.isArray(sessions)) {
          const currentSession = sessions.find(s => (s.chat_id || s.id) === activeChatId);
          if (currentSession && currentSession.title && currentSession.title !== "Untitled Chat") {
            clearInterval(pollInterval);
          }
        }
 
        if (pollCount >= maxPolls) clearInterval(pollInterval);
      }, 2000);
    } catch (error) {
      console.error('Chat message failed:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        isError: true
      }]);
    } finally {
      setIsSending(false);
    }
  };
 

  return (
    <div className="p-4 h-screen flex flex-col">
      <PageHeader
        title="Test Chat"
        subtitle="Test your knowledge base with sample queries"
      />

      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-4">
        {/* Left Sidebar: Session History */}
        <div className="col-span-2 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0" padding="p-0">
            <div className="p-4 border-b">
              <Button
                onClick={handleNewChat}
                variant="outline"
                className="w-full justify-start gap-2 border-dashed border-2 hover:bg-slate-50"
                icon={<PlusCircle size={18} className='bg-amber-800 text-white rounded-full' />}
              >
                New Chat
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <History size={14} />
                Recent Chats
              </div>

              {isLoadingSessions ? (
                <div className="p-4 text-center">
                  <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : sessionsError ? (
                <div className="px-2 py-4 text-xs text-red-500 text-center">
                  {sessionsError}
                  <button onClick={loadSessions} className="block mx-auto mt-1 text-primary-600 hover:underline">Retry</button>
                </div>
              ) : chatSessions.length === 0 ? (
                <div className="px-2 py-4 text-xs text-slate-400 text-center italic">
                  No previous chats
                </div>
              ) : (
                chatSessions.map((session) => (
                  <button
                    key={session.chat_id}
                    onClick={() => handleLoadSession(session.chat_id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors group relative ${chatId === session.chat_id
                      ? 'bg-primary-50 text-primary-700 font-medium border-2 border-primary-600'
                      : 'hover:bg-slate-100 text-slate-600'
                      }`}
                  >
                    {/* <div className="truncate text-sm pr-4">
                      {session.title || "Untitled Chat"}
                    </div> */}
                    <div className="flex justify-between items-center">
                      <div className="truncate text-sm pr-1 flex-1">
                        {session.title || "Untitled Chat"}
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(e, session)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      {/* <Clock size={10} /> */}
                      {/* {session.timestamp ? new Date(session.timestamp).toLocaleDateString() : 'Recent'} */}
                      {session.category && (
                        <span className="bg-slate-200 text-slate-600 px-1 rounded truncate max-w-[60px]">
                          {session.category}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="col-span-7 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0" padding="p-0">
            <div className="flex-1 overflow-y-auto p-6">
              {isInitializingChat ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-slate-500 flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p>Loading conversation...</p>
                  </div>
                </div>
              ) : chatError ? (
                <div className="flex justify-center items-center h-full">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <p className="text-red-700 mb-4">{chatError}</p>
                    <Button onClick={chatId ? () => handleLoadSession(chatId) : handleNewChat}>Retry</Button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                      <MessageSquare size={48} className="opacity-20" />
                      <p>Start a conversation by selecting some documents and asking a question.</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <ChatMessage key={idx} message={msg} />
                  ))}
                </>
              )}
            </div>

            <div className="border-t p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={!chatId ? "Select 'New Chat' to start..." : isSending ? "Waiting for response..." : "Type your test question..."}
                  disabled={!chatId || isInitializingChat || isSending}
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <button
                  onClick={toggleListening}
                  disabled={isInitializingChat || isSending}
                  className={`p-2 rounded-lg transition-all ${isListening
                    ? 'bg-amber-100 text-amber-600 animate-pulse ring-2 ring-amber-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? "Stop dictating" : "Dictate (Speech-to-Text)"}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <Button onClick={handleSend} disabled={!chatId || isInitializingChat || isSending} icon={<MessageSquare size={18} />}>
                  Send
                </Button>
              </div>
              {!chatId && !isInitializingChat && (
                <p className="text-xs text-primary-700 mt-2 text-center animate-pulse">
                  Click 'New Chat' or select a previous session to begin.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Document Selection */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          <Card>
            <h3 className="font-semibold mb-3">Active Knowledge</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <Check size={16} />
                <span>{readyDocuments.length} documents ready</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <Check size={16} />
                <span>{selectedDocs.length} documents selected</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <FileText size={16} />
                <span>Available for chat</span>
              </div>
            </div>
          </Card>

          {/* Document Selection Controls */}
          <Card>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Ready Documents</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllDocuments}
                  className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllSelections}
                  className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {isLoading ? (
                <p className="text-slate-500 text-center py-4">Loading documents...</p>
              ) : hasApiError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-yellow-800 font-medium mb-2">Connection Issue</div>
                  <div className="text-yellow-700 mb-3 text-sm">Unable to load documents. Chat functionality may be limited.</div>
                  <button
                    onClick={onRetry}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : readyDocuments.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {Object.entries(documentsBycategory).map(([category, docs]) => {
                    const isExpanded = expandedCategories[category] || false;
                    const categorySelectedCount = getcategorySelectedCount(category);
                    const iscategoryFullySelected = checkcategoryFullySelected(category);

                    return (
                      <div key={category} className="border border-slate-200 rounded-lg">
                        {/* category Header */}
                        <div
                          className="flex items-center gap-2 p-3 bg-slate-50 rounded-t-lg cursor-pointer hover:bg-slate-100"
                          onClick={() => togglecategory(category)}
                        >
                          <input
                            type="checkbox"
                            checked={iscategoryFullySelected}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (iscategoryFullySelected) {
                                deselectcategoryDocuments(category);
                              } else {
                                selectcategoryDocuments(category);
                              }
                            }}
                            className="rounded text-primary-600 focus:ring-primary-500"
                          />
                          {isExpanded ?
                            <ChevronDown size={16} className="text-slate-600" /> :
                            <ChevronRight size={16} className="text-slate-600" />
                          }
                          <FileText size={16} className="text-primary-600" />
                          <span className="font-medium text-slate-800 flex-1">{category}</span>
                          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                            {docs.length} files
                          </span>
                        </div>

                        {/* category Documents */}
                        {isExpanded && (
                          <div className="border-t border-slate-200">
                            {docs.map((doc) => (
                              <div
                                key={doc.id}
                                className={`flex items-center gap-2 p-2 pl-8 hover:bg-slate-50 ${selectedDocs.includes(doc.id) ? 'bg-primary-50 border-l-2 border-primary-200' : ''
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedDocs.includes(doc.id)}
                                  onChange={(e) => handleDocumentCheckboxChange(doc.id, e.target.checked)}
                                  className="rounded text-primary-600 focus:ring-primary-500"
                                />
                                <FileText size={14} className="text-slate-500" />
                                <span className="truncate text-sm">{doc.name}</span>
                                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {doc.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : documents.length > 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 mb-3">No documents are ready for chat yet.</p>
                  <p className="text-sm text-slate-400">Documents need to be processed before they can be used for chat.</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-500 mb-3">No documents available for chat.</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onNavigate && onNavigate('upload')}
                      className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 transition-colors"
                    >
                      Upload Documents
                    </button>
                    <button
                      onClick={() => onNavigate && onNavigate('content')}
                      className="px-3 py-1 border border-slate-300 rounded text-sm hover:bg-slate-100 transition-colors"
                    >
                      View Library
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Navigate to Content Library */}
          {onNavigate && (
            <Card>
              <p className="text-sm text-slate-600 mb-2">Need to manage documents?</p>
              <button
                onClick={() => onNavigate('content')}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
              >
                Go to Content Library
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7"></path>
                  <path d="M7 7h10v10"></path>
                </svg>
              </button>
            </Card>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${chatToDelete?.title || 'this conversation'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteChat}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default TestChatScreen;