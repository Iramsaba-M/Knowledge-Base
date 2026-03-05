import React, { useState } from 'react';
import { Users, Database, Home, Upload, BookOpen, MessageSquare, ChevronDown, LayoutGrid, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

// Sidebar Component
const Sidebar = ({ activeScreen, setActiveScreen, currentUser, onLogout }) => {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { id: 'onboarding', icon: <Upload size={20} />, label: 'Onboarding' },
    { id: 'content', icon: <BookOpen size={20} />, label: 'Knowledge Library' },
    { id: 'test', icon: <MessageSquare size={20} />, label: 'Chat Assistant' },
  ];

  return (
    <div className={`${isCollapsed ? 'w-22' : 'w-68'} bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ease-in-out relative`}>
      {/* Logo Header */}
      <div className={`p-4 border-b border-gray-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[40px] w-10 h-10 bg-amber-800 rounded-xl flex items-center justify-center">
              <Database size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 truncate">KnowledgeHub</h1>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 bg-amber-800 rounded-xl flex items-center justify-center">
            <Database size={24} className="text-white" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`pl-1 text-gray-400 transition-colors ${isCollapsed ? 'mt-2' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Workspace Selector */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => !isCollapsed && setIsWorkspaceOpen(!isWorkspaceOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors ${isCollapsed ? 'justify-center p-2' : ''}`}
        >
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-gray-600" />
            {!isCollapsed && <span className="text-sm font-medium text-gray-900">Main Workspace</span>}
          </div>
          {!isCollapsed && <ChevronDown size={16} className={`text-gray-600 transition-transform ${isWorkspaceOpen ? 'rotate-180' : ''}`} />}
        </button>

        {!isCollapsed && isWorkspaceOpen && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="px-3 py-2 text-sm text-gray-600 hover:bg-white rounded cursor-pointer">
              Main Workspace
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all text-md ${activeScreen === item.id
              ? 'bg-amber-50 text-amber-900 font-medium'
              : 'text-gray-900 hover:bg-gray-50'
              }`}
            title={isCollapsed ? item.label : ''}
          >
            <span className={activeScreen === item.id ? 'text-amber-800' : 'text-gray-800'}>
              {item.icon}
            </span>
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Section - Bottom */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 mb-2`}>
          <div className="w-8 h-8 min-w-[32px] bg-amber-100 rounded-full flex items-center justify-center">
            <Users size={16} className="text-amber-800" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-800 truncate">{currentUser?.email || 'admin@kb.com'}</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={`w-full text-left ${isCollapsed ? 'text-center' : 'px-3'} py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors`}
        >
          {isCollapsed ? 'Logout' : 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;