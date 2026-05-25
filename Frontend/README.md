# Real-Time Collaborative Code Editor - Frontend

This directory contains the client-side implementation of the Real-Time Collaborative Code Editor. It provides the user interface for authenticating, managing rooms, writing code collaboratively, and communicating with peers via text chat.

## Tech Stack

*   **Framework:** React 19 + Vite
*   **Routing:** React Router DOM
*   **State Management & API:** React Hooks, Axios
*   **Real-time Communication:** Socket.io-client
*   **Code Editor:** Monaco Editor (@monaco-editor/react)
*   **Styling:** Tailwind CSS

## Directory Structure

```text
Frontend/
├── public/              # Static assets (favicon, manifest)
├── src/
│   ├── assets/          # Images and other bundled assets
│   ├── components/      # Reusable React components
│   │   ├── Auth/        # Login and registration forms
│   │   ├── Chat/        # Room chat box and messages
│   │   ├── Common/      # Modals, Navbar, generic UI elements
│   │   ├── Editor/      # Monaco editor wrapper, tabs, and console
│   │   └── Room/        # Room headers, settings, and user lists
│   ├── context/         # React Context providers
│   ├── hooks/           # Custom hooks (useEditor, useSocket, useRoom)
│   ├── pages/           # Main route components (Home, EditorRoom, Auth)
│   ├── services/        # API client and socket initialization
│   ├── utils/           # Constants, helpers, and formatters
│   ├── App.jsx          # Main application component and routing
│   └── main.jsx         # React DOM entry point
├── .env                 # Environment variables
├── eslint.config.js     # ESLint configuration
├── package.json         # Project dependencies and scripts
├── vercel.json          # Vercel deployment configuration
└── vite.config.js       # Vite bundler configuration
```

## Key Features

1.  **Authentication:** User registration and login flows.
2.  **Room Management:** Creating, joining, and managing collaborative sessions.
3.  **Real-Time Code Sync:** Seamlessly editing code with multiple users, powered by Monaco Editor and Socket.io.
4.  **Multi-File Support:** Creating, renaming, and deleting multiple files within a single room session.
5.  **Code Execution:** Running code directly from the browser using external compilation APIs.
6.  **Live Chat:** Real-time text messaging within active rooms.

## Environment Variables

To run the frontend locally, you need an `.env` file in the root of the `Frontend` directory with the following variables:

```properties
VITE_API_BASE_URL=<your_backend_api_url>
VITE_SOCKET_URL=<your_backend_socket_url>
```

## Scripts

*   `npm install`: Installs dependencies.
*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Builds the application for production.
*   `npm run preview`: Locally previews the production build.
