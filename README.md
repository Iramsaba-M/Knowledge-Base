# Knowledge Management UI (KM-UI)

A modern React-based web application for managing documents, processing knowledge bases, and enabling AI-powered chat interactions. Built with Vite for fast development and production builds.

## Overview

KM-UI provides a comprehensive interface for:
- **Document Management**: Upload, organize, and manage documents with real-time progress tracking
- **Content Library**: Browse and filter documents by category with search capabilities
- **Knowledge Base Processing**: Process documents for knowledge base integration
- **AI Chat**: Interact with documents through an intelligent chat interface
- **User Dashboard**: Monitor activity, document statistics, and system health

## Features

✨ **Core Features**
- User authentication with session persistence
- Real-time document upload with WebSocket progress tracking
- Document classification and tagging
- Search and filter across content library
- Responsive dashboard with statistics
- Real-time activity feed
- Document approval workflow
- Archive/delete document management

🎨 **UI Components**
- Atomic design pattern with reusable components
- Tailwind CSS for styling
- Feature-rich component library (cards, badges, buttons, modals)
- Progress indicators and notifications
- Responsive layout with sidebar navigation

🔌 **Backend Integration**
- RESTful API integration with configurable endpoints
- WebSocket support for real-time updates
- Mock backend for development and testing
- Error handling and retry logic
- Request/response transformation

## Tech Stack

- **Frontend**: React 18+ with Hooks
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, PostCSS
- **Icons**: Lucide React
- **State Management**: React Context API, Local Storage
- **HTTP Client**: Fetch API
- **WebSocket**: Native WebSocket API
- **Linting**: ESLint

## Project Structure

```
src/
├── components/
│   ├── atomic/          # Reusable UI components (Button, Card, Input, etc.)
│   ├── feature/         # Feature-specific components (ChatMessage, DocumentCard, etc.)
│   └── layout/          # Layout components (PageHeader, Sidebar)
├── pages/               # Page components (Dashboard, ContentLibrary, KnowledgeBase, etc.)
├── hooks/               # Custom React hooks
├── integration/         # API integration and mock backend
├── assets/              # Static assets
├── App.jsx              # Main App component
└── main.jsx             # Application entry point
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd km-ui

# Install dependencies
npm install
```

### Development

```bash
# Start development server with mock backend
npm run dev
```

The application will start at `http://localhost:5173` (default Vite port) with the mock backend enabled for development.

### Building for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```
