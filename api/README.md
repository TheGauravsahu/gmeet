# AURA.MEET API

This document describes the backend REST API for the AURA.MEET video conferencing application.

The API is built with Node.js, Express, MongoDB/Mongoose, and JWT-based auth. It exposes room lifecycle, participant state, chat, transcript, and AI assistant endpoints.

## Base URL

- Local development: `http://localhost:5000`
- API prefix: `/api`

## Technology Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT for authenticated routes
- Socket.IO for real-time meeting signaling

## Environment

Create a `.env` file in `api/` using the values from `.env.example`.

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/gmeet
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

Aura AI uses this backend-only key for in-call `@aura` questions and meeting
tools through the Interactions API with `gemini-3.5-flash-lite`. Do not send the
key from the browser or place it in a `VITE_` variable.

## Running the API

```bash
cd api
npm install
npm run dev
```

Production mode:

```bash
npm start
```

## Response Format

All endpoints return a JSON envelope with the same shape:

### Success response

```json
{
  "success": true,
  "message": "Room details retrieved",
  "data": {
    "room": {
      "roomCode": "abc-defg-hij"
    }
  }
}
```

### Error response

```json
{
  "success": false,
  "message": "Room 'abc-defg-hij' not found",
  "errors": []
}
```

## Authentication

Some endpoints require a JWT token. Pass it in the `Authorization` header:

```http
Authorization: Bearer YOUR_JWT_HERE
```

A token is returned from:

- `POST /api/auth/register`
- `POST /api/auth/login`

## Routes

### GET `/`

Returns basic API metadata.

Example response:

```json
{
  "name": "AURA.MEET Backend API",
  "status": "online",
  "version": "1.0.0",
  "documentation": "/api/health",
  "endpoints": {
    "health": "/api/health",
    "auth": "/api/auth",
    "rooms": "/api/rooms"
  }
}
```

### GET `/api/health`

Checks service health and database connectivity.

Example response:

```json
{
  "status": "ok",
  "service": "gmeet-api",
  "timestamp": "2026-10-02T17:28:00.000Z",
  "uptime": 45,
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

### Auth endpoints

#### POST `/api/auth/register`

Create a new user account.

Request body:

```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "password": "Password123!",
  "avatar": "https://example.com/avatar.png"
}
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f1c4d2...",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "avatar": "https://example.com/avatar.png",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/login`

Authenticate and receive a JWT.

Request body:

```json
{
  "email": "alex@example.com",
  "password": "Password123!"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f1c4d2...",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "avatar": "https://example.com/avatar.png",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET `/api/auth/me`

Get the current authenticated user.

Headers:

```http
Authorization: Bearer YOUR_JWT_HERE
```

#### PUT `/api/auth/profile`

Update the current user's profile.

Request body:

```json
{
  "name": "Alex Rivera",
  "avatar": "https://example.com/new-avatar.png"
}
```

---

### Room endpoints

#### POST `/api/rooms`

Create a meeting room.

Authentication: optional auth supported.

Request body:

```json
{
  "title": "Weekly Engineering Sync",
  "description": "Sprint planning and release review",
  "customCode": "abc-defg-hij",
  "hostName": "Alex Rivera",
  "scheduledFor": "2026-10-02T18:00:00.000Z",
  "settings": {
    "isLocked": false,
    "muteOnEntry": false,
    "allowScreenShare": true,
    "allowChat": true,
    "requireHostApproval": false,
    "aiTranscriptionEnabled": true
  }
}
```

Notes:

- If `customCode` is omitted, a room code is generated automatically.
- Room codes follow a Google Meet-like pattern such as `abc-defg-hij`.
- `scheduledFor` sets the status to `scheduled` when included.

Example response:

```json
{
  "success": true,
  "message": "Meeting room created successfully",
  "data": {
    "room": {
      "id": "64f1c4d2...",
      "roomCode": "abc-defg-hij",
      "title": "Weekly Engineering Sync",
      "description": "Sprint planning and release review",
      "hostName": "Alex Rivera",
      "status": "active",
      "settings": {
        "isLocked": false,
        "muteOnEntry": false,
        "allowScreenShare": true,
        "allowChat": true,
        "requireHostApproval": false,
        "aiTranscriptionEnabled": true
      },
      "scheduledFor": null,
      "startedAt": "2026-10-02T17:30:00.000Z",
      "meetingUrl": "/meet/abc-defg-hij"
    }
  }
}
```

#### GET `/api/rooms`

List rooms for the authenticated user.

Authentication: required.

Optional query:

```http
GET /api/rooms?hostName=Alex%20Rivera
```

#### GET `/api/rooms/:roomCode`

Fetch a room by its code.

Example:

```http
GET /api/rooms/abc-defg-hij
```

#### PATCH `/api/rooms/:roomCode`

Update room metadata/settings.

Authentication: required for authenticated host ownership checks.

Request body example:

```json
{
  "title": "Updated Meeting Title",
  "description": "New agenda",
  "settings": {
    "isLocked": true,
    "allowChat": false
  }
}
```

#### POST `/api/rooms/:roomCode/end`

Mark a room as ended.

Authentication: required for host validation.

#### DELETE `/api/rooms/:roomCode`

Delete a meeting room record.

---

### Participant endpoints

#### GET `/api/rooms/:roomCode/participants`

Return active participants in the room.

Example:

```json
{
  "success": true,
  "message": "Active participants retrieved",
  "data": {
    "count": 2,
    "participants": [
      {
        "_id": "64f1c4d2...",
        "roomCode": "abc-defg-hij",
        "displayName": "Alex Rivera",
        "avatar": "https://example.com/avatar.png",
        "role": "host",
        "isAudioMuted": false,
        "isVideoMuted": false,
        "isScreenSharing": false,
        "isHandRaised": false,
        "isActive": true,
        "joinedAt": "2026-10-02T17:30:00.000Z"
      }
    ]
  }
}
```

#### POST `/api/rooms/:roomCode/participants/join`

Register a participant's join session.

Request body:

```json
{
  "displayName": "Sam Lee",
  "avatar": "https://example.com/sam.png",
  "socketId": "socket-123",
  "peerId": "peer-456",
  "isAudioMuted": false,
  "isVideoMuted": false
}
```

Authentication: optional. If a JWT is supplied, the user profile is used.

#### PATCH `/api/rooms/:roomCode/participants/:participantId`

Update the participant's media/hand state.

Request body:

```json
{
  "isAudioMuted": true,
  "isVideoMuted": false,
  "isScreenSharing": true,
  "isHandRaised": false
}
```

#### POST `/api/rooms/:roomCode/participants/:participantId/leave`

Mark a participant as left.

---

### Message endpoints

#### GET `/api/rooms/:roomCode/messages?limit=50`

Return recent room chat messages.

#### POST `/api/rooms/:roomCode/messages`

Send a chat message in a room.

Request body:

```json
{
  "senderName": "Sam Lee",
  "senderAvatar": "https://example.com/sam.png",
  "content": "Can everyone see the screen?",
  "type": "text"
}
```

Notes:

- `content` is required and cannot be empty.
- If `allowChat` is disabled on the room, the API rejects the request with `403`.

---

### AI assistant endpoint

#### POST `/api/rooms/:roomCode/ai-chat`

Ask AURA AI for help based on recent room messages.

Request body:

```json
{
  "prompt": "Summarize the last few notes from this meeting.",
  "apiKey": "optional-gemini-api-key",
  "senderName": "Alex Rivera"
}
```

Example response:

```json
{
  "success": true,
  "message": "Aura AI replied successfully",
  "data": {
    "reply": "Here is a summary of the key discussion points...",
    "senderName": "Aura AI",
    "timestamp": "2026-10-02T17:35:00.000Z"
  }
}
```

---

### Transcript endpoints

#### GET `/api/rooms/:roomCode/transcripts?limit=100`

Return transcript logs for the room.

#### POST `/api/rooms/:roomCode/transcripts`

Append a transcript chunk or speaker note.

Request body:

```json
{
  "speaker": "Elena Rostova",
  "text": "Latency is stable across the global nodes.",
  "confidence": 0.99
}
```

Example response:

```json
{
  "success": true,
  "message": "Transcript logged",
  "data": {
    "transcript": {
      "roomCode": "abc-defg-hij",
      "speaker": "Elena Rostova",
      "text": "Latency is stable across the global nodes.",
      "confidence": 0.99,
      "timestamp": "2026-10-02T17:36:00.000Z"
    }
  }
}
```

---

## Socket.IO real-time signaling

The backend also exposes Socket.IO events for real-time meeting functionality.

Connect to:

```text
http://localhost:5000
```

### Client-to-server events

- `join-room`
- `webrtc-offer`
- `webrtc-answer`
- `ice-candidate`
- `toggle-media-state`
- `raise-hand`
- `send-message`
- `live-transcript`
- `leave-room`

### Server-to-client events

- `existing-participants`
- `user-joined`
- `webrtc-offer`
- `webrtc-answer`
- `ice-candidate`
- `user-media-state-changed`
- `user-raised-hand`
- `new-message`
- `transcript-update`
- `user-left`

---

## Common status codes

- `200` OK
- `201` Created
- `400` Bad request
- `401` Unauthorized
- `403` Forbidden
- `404` Not found
- `500` Internal server error

## Quick tests

```bash
# Health check
curl http://localhost:5000/api/health

# Create room
curl -X POST http://localhost:5000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"title":"Sprint Review","hostName":"Elena"}'

# Get room details
curl http://localhost:5000/api/rooms/abc-defg-hij

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Rivera","email":"alex@example.com","password":"Password123!"}'
```

## Notes

- The API validates room codes and normalizes them to lowercase.
- Protected endpoints rely on JWT identity and can support guest access when the request is optional.
- Room and participant records are persisted in MongoDB and used by the real-time signaling layer.
