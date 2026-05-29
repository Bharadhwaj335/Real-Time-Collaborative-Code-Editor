# Real-Time Collaborative Code Editor

A full-stack web application enabling multiple users to collaborate on code in real-time with live cursor tracking, file management, code execution, and instant messaging.

##  Features

- **Real-time Code Collaboration** – Multiple users edit files simultaneously with live sync
- **Multi-file Support** – Create, rename, and delete files within rooms; automatic language detection
- **Live Cursor Tracking** – See collaborators' cursor positions and selections in real-time
- **Code Execution** – Execute code directly in the browser with syntax highlighting (supports 10+ languages)
- **Instant Messaging** – Built-in chat for collaborators within a room
- **Guest Support** – Join rooms as a guest without creating an account
- **Persistent Guest Identity** – Guest ID saved in localStorage, preserved across page refreshes
- **Authentication** – Secure JWT-based authentication with refresh token flow
- **Rate Limiting** – Protected endpoints with configurable rate limiting
- **Code Size Validation** – Prevents abuse with 50KB code size limit on execution
- **Responsive UI** – Modern, dark-themed interface built with React and Tailwind CSS

## Live Demo

View the deployed live application at:

https://real-time-collaborative-code-editor-one.vercel.app

##  Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Judge0 API Key** (for code execution) – [Get free tier here](https://rapidapi.com/judge0-official/api/judge0-ce)

##  Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Bharadhwaj335/Real-Time-Collaborative-Code-Editor.git
cd Real-Time-Collaborative-Code-Editor
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=
# Or use MongoDB Atlas:
# MONGO_URI=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Judge0 Configuration (for code execution)
JUDGE0_API_KEY=your-judge0-api-key
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_BASE_URL=

# CORS Configuration
FRONTEND_URL=
```

### 3. Frontend Setup

```bash
cd ../Frontend
npm install
```

Create a `.env` file in the `Frontend` directory:

```env
VITE_API_BASE_URL=
VITE_SOCKET_URL=
```

##  Running the Application

### Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** – Update `MONGO_URI` in Backend `.env`

### Start Backend Server

```bash
cd Backend
npm run dev
```

The backend will start on `http://localhost:5000`

### Start Frontend Development Server

In a new terminal:

```bash
cd Frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

##  API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "userId",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Refresh Access Token
```
POST /api/auth/refresh
Cookie: refreshToken=...

Response: 200 OK
{
  "success": true,
  "token": "newAccessToken",
  "user": { ... }
}
```

**Note:** Refresh token is stored in an httpOnly cookie. Access tokens expire in 15 minutes; refresh tokens last 7 days.

### Code Execution Endpoints

#### Execute Code
```
POST /api/code/execute
Authorization: Bearer {token}
Content-Type: application/json
Rate Limit: 15 requests per 60 seconds per IP

{
  "code": "print('Hello, World!')",
  "language": "python",
  "stdin": ""
}

Response: 200 OK
{
  "success": true,
  "stdout": "Hello, World!",
  "stderr": "",
  "error": ""
}
```

**Supported Languages:**
- javascript, typescript, python, java, cpp, c, go, rust, html, css

**Constraints:**
- Code size: max 50KB
- Execution timeout: 5 seconds
- Rate limit: 15 executions per 60 seconds


##  Security Features

- **JWT Authentication** – Secure token-based authentication
- **Refresh Token Flow** – 15-minute access tokens + 7-day refresh tokens
- **httpOnly Cookies** – Refresh tokens stored securely
- **Rate Limiting** – 15 code executions per 60 seconds per IP
- **Code Size Validation** – Max 50KB per submission
- **CORS Protection** – Configurable cross-origin requests
- **Password Hashing** – bcrypt with salt rounds
- **Input Validation** – Sanitized file names and code payloads

##  Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `mongod`
- Check `MONGO_URI` in `.env`
- Verify MongoDB credentials if using Atlas

### "Code execution failing"
- Verify Judge0 API key in `.env`
- Check Judge0 API quotas (free tier: 100 requests/day)
- Ensure code size is < 50KB

### "Guest ID changes on refresh"
- Fixed in latest version – guest identity now persists in localStorage

### "Token expires silently"
- Automatic refresh implemented – ensure `/api/auth/refresh` is working
- Check browser cookies for `refreshToken`

### "Rate limit hit"
- Limit: 15 code executions per 60 seconds per IP
- Wait before retrying or use different IP

### "Socket connection issues"
- Check WebSocket URL in Frontend `.env`
- Ensure backend server is running on correct port
- Check CORS settings

##  Performance Optimizations

- **Debounced MongoDB Saves** – CODE_CHANGE debounced 3 seconds to reduce DB write load
- **Request Queuing** – Socket.io handles concurrent updates gracefully
- **Token Refresh Queue** – Failed requests re-queued on token refresh
- **File Caching** – Client-side file state to minimize network requests
