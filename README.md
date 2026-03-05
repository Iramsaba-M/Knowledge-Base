# Knowledge Management UI 

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

## Configuration

### API Endpoints
Configure API endpoints in `src/integration/apiConfig.js`:

```javascript
const API_BASE_URL = 'http://localhost:8001';
```

Update this to point to your backend server. The default is configured for local development.

### Mock Backend
The mock backend in `src/integration/Mockbackend.js` provides:
- Simulated document upload with progress streaming
- Mock document listing and filtering
- User authentication endpoints
- Document processing and deletion
- WebSocket status updates

**Enable mock backend**: It's automatically loaded in development mode (check `src/main.jsx`)

**Disable mock backend**: Comment out or remove the import in `src/main.jsx` when connecting to a real backend.

## API Endpoints

### Documents
- `GET /documents` - Fetch paginated document list
- `POST /upload` - Upload new documents
- `POST /process-document` - Process/approve document
- `DELETE /documents/delete` - Archive document

### Authentication
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### Chat
- `POST /chat/create` - Create new chat session
- `POST /chat` - Send chat message
- `GET /chat/history` - Fetch chat history

### WebSocket
- `WS /ws/status` - Real-time upload progress updates

## Component Architecture

### Atomic Components (`components/atomic/`)
Basic building blocks:
- `Button`, `Input`, `Card`, `Badge`
- `ProgressBar`, `ConfirmDialog`
- `Customdropdown`

### Feature Components (`components/feature/`)
Larger, feature-specific components:
- `DocumentCard`, `ChatMessage`
- `ActivityItem`, `ProgressPill`
- `UploadZone`, `ErrorNotification`

### Pages (`pages/`)
- `DashboardScreen` - Main dashboard with stats
- `ContentLibraryScreen` - Document library view
- `KnowledgeBaseUI` - Knowledge base management
- `TestChatScreen` - Chat interface
- `Onboardingscreen` - User onboarding flow

## Hooks

### useWebSocketStatus
Manages WebSocket connection state and real-time updates:

```javascript
const { isConnected, status, progress } = useWebSocketStatus(currentUser);
```

### WebSocketContext
Provides WebSocket state across the application using React Context.

## Development Tips

1. **Mock Data**: Seed documents are defined in `Mockbackend.js`. Modify or add documents there for testing.

2. **Component Debugging**: Use React DevTools to inspect component state and props.

3. **API Debugging**: Check browser DevTools Network tab to inspect API calls. With mock backend enabled, you'll see `[Mock]` prefixed logs in the console.

4. **Styling**: Use Tailwind CSS classes. Customize in `tailwind.config.js`.

5. **Hot Module Replacement**: Vite provides fast HMR. Changes to React components reflect instantly.

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
```

## Troubleshooting

### Mock data not showing
- Ensure mock backend import is active in `src/main.jsx`
- Check browser console for `[Mock]` log messages
- Verify API base URL matches in `Mockbackend.js` and `apiConfig.js` (both should use `http://localhost:8001`)

### WebSocket connection issues
- Ensure WebSocket URL is correctly configured
- Check browser console for connection errors
- Mock backend provides simulated WebSocket responses

### Build errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Check Node version compatibility (16+)

## Contributing

When adding new features:
1. Create components in appropriate folders (atomic/feature/layout)
2. Follow existing component structure and patterns
3. Use Tailwind CSS for styling consistency
4. Add proper error handling
5. Test with mock backend before switching to real backend

## License

[Add your license information here]

## Support

For issues or questions, please contact the development team or open an issue in the repository.
