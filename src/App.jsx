import React, { useState, useEffect } from 'react';
import KnowledgeBaseUI from "./pages/KnowledgeBaseUI";
import Login from "./Login";
import { WebSocketProvider } from './hooks/WebSocketContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        setIsLoggedIn(true);
      } catch (err) {
        console.error('Error restoring session:', err);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    // Persist user data to localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    // Remove user data from localStorage
    localStorage.removeItem('currentUser');
  };

  return (
    <div>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      ) : isLoggedIn ? (
        <WebSocketProvider>
          <KnowledgeBaseUI currentUser={currentUser} onLogout={handleLogout} />
        </WebSocketProvider>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App
