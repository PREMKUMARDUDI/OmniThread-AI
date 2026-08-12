# OmniThread

[![Live Demo](https://img.shields.io/badge/Live-Demo-success)](#)

A modern, full-stack AI conversational platform inspired by Google Gemini.  
Built with React, Node.js, MongoDB, Express—and features a powerful **stateful context engine** that seamlessly maintains conversational memory, alongside a robust MVC backend with strict IDOR security protections.

## 🚀 Features

- **Contextual AI Chat:** Seamless integration with Google Gemini API, maintaining perfect conversation history for multi-turn interactions.
- **Thread Management:** Create, update (rename), browse, and delete individual chat sessions.
- **Media Processing:** Send images and documents along with text prompts using Base64 encoding.
- **Simulated Streaming (Typewriter Effect):** Smooth, word-by-word text rendering via frontend interval timing for a dynamic reading experience.
- **State-Driven Routing:** Built a seamless, zero-page-refresh architecture using React Context to conditionally render overlay modals instead of traditional frontend routing.
- **Google-Style Profile System:** Centered account card layout with Base64 profile picture uploads, dynamic camera/trash hover states, and live updates.
- **Account Lifecycle Management:** Secure account deletion with a friction-based UI/UX warning flow and automatic cascading database cleanup for all associated threads.
- **Zero-Page-Refresh Auth:** Fully integrated SPA authentication via overlay modals (Login, Signup, Profile Edit).
- **Secure Two-Way Referencing:** Synchronized `User` and `Thread` relationships using MongoDB `$push` and `$pull` operators.
- **Auto-Scrolling UI:** Chat window automatically pins to the latest user prompt upon thread switching or message generation.

### 🧠 Conversational Context Engine & Security Core

The backend contains a highly optimized REST API built on strict MVC principles. It acts as a secure middleware between the client and the Gemini API, ensuring data privacy and logical state management.

#### **Core Architectural Highlights**

- **IDOR Protection:** Every single database operation (fetch, rename, delete, chat) enforces a strict `userId: req.user.id` check alongside the `threadId`. This Zero-Trust architecture ensures users can never access or modify other users' data, even if they guess a UUID.
- **Perfect Memory Formatting:** The server intercepts database chat histories and dynamically maps them into the precise `{ role: "user" | "model", parts: [...] }` timeline structure required by the Gemini LLM, appending the newest prompt at the end before dispatch.
- **Base64 Payload Handling:** Bypasses complex S3/Multer configurations by safely encoding, transmitting, and storing user profile pictures directly in MongoDB via an increased Express body limit (`50mb`).
- **Two-Way Database Sync:** Employs NoSQL best practices. Creating a new chat securely `$push`es the `threadId` into the User's array, and deleting a chat `$pull`s it out, keeping relational integrity flawless.

## 🏗️ Architecture

### System Design

```

┌──────────────────┐      HTTP/REST API     ┌─────────────────┐
│    Frontend      │  ◄──────────────────►  │   Backend       │
│    (React)       │     (Axios Client)     │   (Node.js)     │
│  SPA & Modals    │                        │   REST API      │
└──────────────────┘                        └─────────────────┘
        │                                           │
        │                                           │
        │                                           │    ┌─────────────────┐
        │                                           ├──► │ Google Gemini   │
        │                                           │    │    LLM API      │
        │                                           │    └─────────────────┘
        │                                           │
        │                                           │
   ┌────▼────┐                                 ┌────▼────┐
   │ Versel  │                                 │ MongoDB │
   │ Hosting │                                 │Database │
   └─────────┘                                 └─────────┘

```

## 🛠️ Tech Stack

- **Frontend:** React (Hooks, Context API, Refs), Axios, UUIDv1, React-Markdown, rehype-highlight
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT (JSON Web Tokens), bcrypt (via Auth Controller)
- **AI Integration:** Google Gemini API
- **Architecture:** Model-View-Controller (MVC)

## 📁 Project Structure

```bash

OmniThread/
├── backend/                           # Node.js Express Server
│   ├── config/                        # Database configuration
│   │   └── db.js                      # MongoDB connection setup
│   ├── controllers/                   # Business logic handlers
│   │   ├── authController.js          # Login and registration logic
│   │   ├── threadController.js        # Chat, CRUD for threads, Gemini API calls
│   │   └── userController.js          # User profile updates and data fetching
│   ├── middleware/                    # Custom server middlewares
│   │   └── authMiddleware.js          # JWT verification and user extraction
│   ├── models/                        # Database schemas
│   │   ├── User.js                    # User profile schema
│   │   └── Thread.js                  # Thread schema
│   ├── routes/                        # API endpoint definitions
│   │   ├── authRoutes.js              # Auth routing
│   │   ├── threadRoutes.js            # Thread routing
│   │   └── userRoutes.js              # User routing
│   ├── utils/                         # Helper functions
│   │   └── gemini.js                  # Context formatter and Gemini API connector
│   ├── server.js                      # Server entry point
│   ├── package.json                   # Backend dependencies
│   └── .env                           # Environment variables
│
├── frontend/                          # React Application
│   ├── public/                        # Static assets
│   ├── src/                           # Source code
│   │   ├── api/
│   │   │   └── client.js              # Axios interceptor for JWT injection
│   │   ├── components/                # UI Components
│   │   │   ├── Chat.jsx               # Message rendering and simulated streaming
│   │   │   ├── ChatWindow.jsx         # Main interaction window & Gemini profile card
│   │   │   └── Sidebar.jsx            # Thread navigation and creation
│   │   ├── context/
│   │   │   └── MyContext.jsx          # Global state management (Auth, Threads, UI)
│   │   ├── Modals/
│   │   │   ├── AuthModal.jsx          # Auth edit overlay
│   │   │   └── ProfileModal.jsx       # Profile edit overlay
│   │   ├── styles/
│   │   │   ├── Chat.css               # CSS for Chat.jsx
│   │   │   ├── ChatWindow.css         # CSS for ChatWindow.jsx
│   │   │   └── Sidebar.css            # CSS for Sidebar.jsx
│   │   └── App.jsx                    # React entry point
│   ├── package.json                   # Frontend dependencies
│   └── vite.config.js                 # Vite build configuration
└── README.md

```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration with profile creation
- `POST /api/auth/login` - User authentication with JWT token generation

### Profile Management

- `GET /api/user/profile` - Fetch authenticated user data
- `PUT /api/user/profile` - Update username, email, or Base64 profile image
- `DELETE /api/user/profile` - Delete user account and cascade-delete all associated threads

### Thread & Chat Management

- `GET /api/thread` — Get all threads for the authenticated user
- `GET /api/thread/:threadId` — Get a specific thread for the authenticated user
- `PATCH /api/thread/:threadId` — Rename a thread title
- `DELETE /api/thread/:threadId` — Delete a single thread securely
- `POST /api/thread/chat` — Send a prompt + context history to Gemini and save response

## 📊 Database Schema

### User Model

```javascript
{
  username: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  profileImage: String (default: ""),
  threads: [Schema.Types.ObjectId (ref: "Thread")]
}
```

### Thread Model

```javascript
{
  threadId: String (required, unique),
  userId: Schema.Types.ObjectId (ref: "User", required),
  title: String (default: "New Chat"),
  messages: [{
    role: String (enum: ["user", "assistant"], required),
    content: String (required),
    timestamp: Date (default: Date.now)
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🌐 Deployment

The application's frontend is deployed on **Vercel** with its backend deployed on **Render** platform:

- **Frontend**: `#`
- **Backend API**: `#`

### Deployment Configuration

- **Platform**: Vercel(Frontend) & Render(Backend)
- **Build Process**: Automatic deployment from GitHub
- **Environment**: Configured with `GEMINI_API_KEY`, `MONGO_URI`, and `JWT_SECRET`
- **Payload Limits**: Express JSON limits extended to 50mb to support Base64 media arrays and profile pictures.
- **CORS**: Configured for cross-origin requests between services

## 🧪 Testing & Quality

### Code Quality

- **Security**: IDOR prevention on all threaded routes, JWT-based Route Protection.
- **State Management**: Centralized React Context preventing prop-drilling, synchronized localStorage for session persistence.
- **Data Integrity**: Enforced two-way referencing in MongoDB to ensure orphaned threads are never left behind during deletion.
- **UI/UX**: Dynamic React refs for auto-scrolling, friction-based destructive action flow, overlay modals for uninterrupted flow.

### Performance Optimizations

- **Database**: Indexed queries for improved performance
- **Caching**: Strategic use of React Context for state management
- **Bundle Size**: Optimized dependencies and code splitting

## 👩‍💻 Author

**Prem Kumar Dudi**

- GitHub: [@PREMKUMARDUDI](https://github.com/PREMKUMARDUDI)
- LinkedIn: [Connect with me](https://linkedin.com/in/dudipremkumar)

## 🙏 Acknowledgments

- Inspired by Google Gemini UI/UX
- Powered by Google Generative AI

---

⭐ **Star this repository if you found it helpful!**

_Building systems, not just websites._
