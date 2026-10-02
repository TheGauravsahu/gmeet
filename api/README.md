# 🚀 AURA.MEET Backend API (Express.js & MongoDB)

A high-performance, modular backend API and real-time WebRTC signaling engine for video conferencing built with **Express.js**, **MongoDB (Mongoose)**, and **Socket.io**.

---

## 📑 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [REST API Reference](#-rest-api-reference)
  - [Health & Status](#health--status)
  - [Authentication](#authentication)
  - [Meeting Rooms](#meeting-rooms)
  - [Participants](#participants)
  - [In-Meeting Chat](#in-meeting-chat)
  - [Live Transcripts & AI Notes](#live-transcripts--ai-notes)
- [Real-Time WebRTC Signaling (Socket.io)](#-real-time-webrtc-signaling-socketio)
- [Scripts](#-scripts)

---

## ✨ Features

- **Robust REST API**: Built on Express.js with ES Modules, unified JSON response formats, and error handling.
- **MongoDB & Mongoose**: Schemas with validation, indexes, and relations for Users, Rooms, Participants, Messages, and Transcripts.
- **JWT Authentication & Guest Mode**: Supports both authenticated users and quick anonymous guest joins.
- **Meeting Code Generator**: Google Meet-style meeting codes (e.g. `xkq-yztp-prv` or `xkq-92m-prv`).
- **WebRTC Mesh Signaling**: Socket.io events for SDP offers, answers, ICE candidates, and peer discovery.
- **Live State Sync**: Real-time microphone mute/unmute, camera toggle, screen sharing, and hand raise broadcasts.
- **In-Call Chat & Live Transcriptions**: Persisted chat messages and real-time AI speech-to-text transcripts.
- **Production Hardened**: Includes Helmet for secure HTTP headers, CORS configuration, Morgan logging, rate limiting, and graceful process shutdown.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose 8.x
- **Real-Time Signaling**: Socket.io 4.x
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Security & Utilities**: `helmet`, `cors`, `express-rate-limit`, `morgan`, `dotenv`

---

## 📂 Directory Structure

```
api/
├── .env                  # Local environment configuration
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
├── package.json          # Node dependencies and scripts
├── README.md             # Backend documentation
└── src/
    ├── app.js            # Express app configuration & middleware
    ├── server.js         # HTTP server, Socket.io, & MongoDB initialization
    ├── config/
    │   ├── db.js         # Mongoose connection & reconnection logic
    │   └── index.js      # Central environment config
    ├── controllers/
    │   ├── authController.js        # User auth (register, login, profile)
    │   ├── messageController.js     # Chat messages in rooms
    │   ├── participantController.js # Room attendees & audio/video states
    │   ├── roomController.js        # Meeting room lifecycle
    │   └── transcriptController.js  # Live transcripts & AI speech notes
    ├── middlewares/
    │   ├── authMiddleware.js        # JWT protect & optional guest auth
    │   ├── errorHandler.js          # Centralized error handler
    │   └── notFoundHandler.js       # 404 route handler
    ├── models/
    │   ├── Message.js      # Chat messages schema
    │   ├── Participant.js  # Participant sessions schema
    │   ├── Room.js         # Meeting room schema
    │   ├── Transcript.js   # Live transcripts schema
    │   └── User.js         # User accounts schema with bcrypt
    ├── routes/
    │   ├── authRoutes.js        # /api/auth
    │   ├── healthRoutes.js      # /api/health
    │   ├── index.js             # Route aggregator
    │   └── roomRoutes.js        # /api/rooms (including nested routes)
    ├── sockets/
    │   └── meetingSocket.js     # WebRTC signaling & real-time events
    └── utils/
        ├── apiResponse.js       # Standardized response envelopes
        ├── codeGenerator.js     # Meeting code generator & validator
        └── logger.js            # Formatted console logger
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd api
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (already created by default):
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/gmeet
JWT_SECRET=aura_meet_jwt_secret_key_change_me_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3. Run the Server
- **Development mode (with auto-reload)**:
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```

---

## 📡 REST API Reference

All successful responses return `{ success: true, message: "...", data: { ... } }`.
Errors return `{ success: false, message: "...", errors: [...] }`.

### Health & Status

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/` | API status and links | None |
| `GET` | `/api/health` | Health check (checks MongoDB connectivity & uptime) | None |

#### Sample Health Response:
```json
{
  "status": "ok",
  "service": "gmeet-api",
  "timestamp": "2026-10-02T17:28:00.000Z",
  "uptime": 12,
  "database": {
    "status": "connected",
    "connected": true,
    "name": "gmeet"
  },
  "system": {
    "nodeVersion": "v22.14.0",
    "memoryUsage": "42 MB"
  }
}
```

---

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Login and receive Bearer JWT token | Public |
| `GET` | `/api/auth/me` | Get current authenticated user profile | Bearer Token |
| `PUT` | `/api/auth/profile` | Update profile (name, avatar) | Bearer Token |

#### Register Request Body:
```json
{
  "name": "Alex Rivera",
  "email": "alex@aura.ai",
  "password": "Password123!"
}
```

---

### Meeting Rooms

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/rooms` | Create a new room (generates code if omitted) | Public / Optional Token |
| `GET` | `/api/rooms` | List rooms created by the authenticated user | Bearer Token |
| `GET` | `/api/rooms/:roomCode` | Get details and settings for a room | Public |
| `PATCH` | `/api/rooms/:roomCode` | Update room settings (lock, allowChat, muteOnEntry) | Host / Public |
| `POST` | `/api/rooms/:roomCode/end` | Mark room as ended | Host / Public |

#### Create Room Request Body:
```json
{
  "title": "Weekly Engineering Sync",
  "customCode": "xkq-92m-prv", // optional; auto-generated if omitted
  "settings": {
    "isLocked": false,
    "muteOnEntry": false,
    "allowScreenShare": true,
    "allowChat": true
  }
}
```

---

### Participants

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/rooms/:roomCode/participants` | Get active participants in a meeting | Public |
| `POST` | `/api/rooms/:roomCode/participants/join` | Register participant join session | Public / Optional Token |
| `PATCH` | `/api/rooms/:roomCode/participants/:id` | Update mic/cam/hand state | Public |
| `POST` | `/api/rooms/:roomCode/participants/:id/leave` | Record participant departure | Public |

---

### In-Meeting Chat

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/rooms/:roomCode/messages?limit=50` | Retrieve chat history for the meeting | Public |
| `POST` | `/api/rooms/:roomCode/messages` | Post a chat message | Public / Optional Token |

#### Post Message Body:
```json
{
  "senderName": "Sarah Jenkins",
  "content": "Can everyone see my shared architecture diagram?"
}
```

---

### Live Transcripts & AI Notes

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/rooms/:roomCode/transcripts?limit=100` | Fetch speech transcripts for room | Public |
| `POST` | `/api/rooms/:roomCode/transcripts` | Append real-time transcript snippet | Public |

#### Post Transcript Body:
```json
{
  "speaker": "Elena Rostova",
  "text": "Sub-40ms latency confirmed across all Tokyo & Frankfurt nodes.",
  "confidence": 0.99
}
```

---

## ⚡ Real-Time WebRTC Signaling (Socket.io)

Connect a Socket.io client to `http://localhost:5000`.

### Client to Server Events:
- `join-room`: `{ roomCode, user: { displayName, avatar, peerId, isAudioMuted, isVideoMuted } }`
- `webrtc-offer`: `{ targetSocketId, offer }`
- `webrtc-answer`: `{ targetSocketId, answer }`
- `ice-candidate`: `{ targetSocketId, candidate }`
- `toggle-media-state`: `{ isAudioMuted, isVideoMuted, isScreenSharing }`
- `raise-hand`: `{ isHandRaised: true/false }`
- `send-message`: `{ content: "..." }`
- `live-transcript`: `{ speaker, text, confidence }`
- `leave-room`: Signals departure from meeting

### Server to Client Events:
- `existing-participants`: `{ participants: [...] }` (sent to newly joined peer)
- `user-joined`: `{ socketId, peerId, displayName, avatar, isAudioMuted, isVideoMuted }`
- `webrtc-offer`: `{ callerSocketId, offer }`
- `webrtc-answer`: `{ responderSocketId, answer }`
- `ice-candidate`: `{ senderSocketId, candidate }`
- `user-media-state-changed`: `{ socketId, isAudioMuted, isVideoMuted, isScreenSharing }`
- `user-raised-hand`: `{ socketId, displayName, isHandRaised }`
- `new-message`: `{ socketId, senderName, senderAvatar, content, timestamp }`
- `transcript-update`: `{ speaker, text, confidence, timestamp }`
- `user-left`: `{ socketId, displayName }`

---

## 🧪 Quick Test Commands

```bash
# Health check
curl http://localhost:5000/api/health

# Create room
curl -X POST http://localhost:5000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"title": "Sprint Review", "hostName": "Elena"}'

# Get room details
curl http://localhost:5000/api/rooms/<ROOM_CODE>
```
