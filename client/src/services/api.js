const configuredApiUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');
const API_BASE_URL = configuredApiUrl.endsWith('/api')
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;

/**
 * Universal API requester handling headers, JSON encoding, and errors
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('aura_meet_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Authentication
  auth: {
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    getMe: () => request('/auth/me'),
    updateProfile: (data) =>
      request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Rooms
  rooms: {
    createRoom: (roomData) =>
      request('/rooms', {
        method: 'POST',
        body: JSON.stringify(roomData),
      }),
    getRoom: (roomCode) => request(`/rooms/${roomCode}`),
    getUserRooms: (params = '') => request(`/rooms${params ? `?${params}` : ''}`),
    updateRoom: (roomCode, settings) =>
      request(`/rooms/${roomCode}`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
    endRoom: (roomCode) =>
      request(`/rooms/${roomCode}/end`, {
        method: 'POST',
      }),
    deleteRoom: (roomCode) =>
      request(`/rooms/${roomCode}`, {
        method: 'DELETE',
      }),
  },

  // Participants
  participants: {
    getParticipants: (roomCode) => request(`/rooms/${roomCode}/participants`),
    joinRoom: (roomCode, participantData) =>
      request(`/rooms/${roomCode}/participants/join`, {
        method: 'POST',
        body: JSON.stringify(participantData),
      }),
    updateState: (roomCode, participantId, state) =>
      request(`/rooms/${roomCode}/participants/${participantId}`, {
        method: 'PATCH',
        body: JSON.stringify(state),
      }),
    leaveRoom: (roomCode, participantId) =>
      request(`/rooms/${roomCode}/participants/${participantId}/leave`, {
        method: 'POST',
      }),
  },

  // In-Meeting Chat
  messages: {
    getMessages: (roomCode, limit = 50) =>
      request(`/rooms/${roomCode}/messages?limit=${limit}`),
    sendMessage: (roomCode, messageData) =>
      request(`/rooms/${roomCode}/messages`, {
        method: 'POST',
        body: JSON.stringify(messageData),
      }),
  },

  // Aura AI Assistant
  ai: {
    askAura: (roomCode, data) =>
      request(`/rooms/${roomCode}/ai-chat`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Live Transcripts
  transcripts: {
    getTranscripts: (roomCode, limit = 100) =>
      request(`/rooms/${roomCode}/transcripts?limit=${limit}`),
    addTranscript: (roomCode, transcriptData) =>
      request(`/rooms/${roomCode}/transcripts`, {
        method: 'POST',
        body: JSON.stringify(transcriptData),
      }),
  },
};
