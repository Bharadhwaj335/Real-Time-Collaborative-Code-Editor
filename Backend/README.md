# Real-Time Collaborative Code Editor - Backend

This directory contains the server-side implementation of the Real-Time Collaborative Code Editor. It provides the RESTful API, WebSocket server for real-time code synchronization, database connections, and user authentication.

## Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB with Mongoose
*   **Real-time Communication:** Socket.io
*   **Authentication:** JWT (JSON Web Tokens)
*   **Password Hashing:** bcryptjs
*   **Code Execution:** Judge0 API Integration

## Directory Structure

```text
Backend/
├── Controllers/       # Request handlers and business logic
├── Models/            # Mongoose database schemas
├── Services/          # Helper services and third-party API integrations
├── config/            # Environment and database configuration files
├── middlewares/       # Express middlewares (auth, error handling)
├── routes/            # API route definitions
├── socket/            # Socket.io event handlers (collaboration, chat)
├── utils/             # Utility functions and helpers
├── server.js          # Entry point of the application
├── package.json       # Project dependencies and scripts
└── .env               # Environment variables (ignored in git)
```

## Database Schemas

The application uses MongoDB to store user data, room information, and chat messages. Below are the primary Mongoose schemas used.

### User Schema

Stores user authentication details and profile information.

*   `name` (String, required)
*   `username` (String, default empty)
*   `email` (String, required, unique, lowercase)
*   `password` (String, required, minlength: 6)
*   `avatarUrl` (String, default empty)
*   `timestamps` (createdAt, updatedAt)

### Room Schema

Manages collaborative sessions, including active participants and stored files.

*   `roomId` (String, required, unique)
*   `name` / `roomName` (String, default empty)
*   `language` / `currentLanguage` (String, default: "javascript")
*   `code` (String, default empty)
*   `visibility` (String, enum: ["private", "public"], default: "private")
*   `maxParticipants` (Number, min: 2, max: 50, default: 8)
*   `users` (Array of Subdocuments):
    *   `id` (String, required)
    *   `name` (String, required)
    *   `status` (String, default: "online")
*   `files` (Array of Subdocuments):
    *   `id` (String, required)
    *   `name` (String, required)
    *   `language` (String, default: "javascript")
    *   `code` (String, default empty)
    *   `lastEditedBy` (String)
    *   `lastEditedAt` (Date)
*   `activeFileId` (String)
*   `createdBy` (String)
*   `timestamps` (createdAt, updatedAt)

### Message Schema

Stores chat messages sent within a specific room.

*   `roomId` (String, required, indexed)
*   `user` (Subdocument):
    *   `id` (String, required)
    *   `name` (String, required)
*   `text` (String, required)
*   `timestamp` (Date, default: Date.now)

## Environment Variables

To run the backend locally, you need an `.env` file in the root of the `Backend` directory with the following variables:

```properties
PORT=<your_port_number>
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_secure_jwt_secret>
JUDGE0_API_URL=<judge0_api_url>
JUDGE0_API_KEY=<your_judge0_api_key>
CLIENT_URL=<your_frontend_url>
```

## Scripts

*   `npm install`: Installs dependencies.
*   `npm run dev`: Starts the server in development mode using file watching.
*   `npm start`: Starts the server in production mode.
