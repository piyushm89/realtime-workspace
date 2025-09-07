# Realtime Workspace

A real-time collaborative workspace application with drawing capabilities and video calls.

## Features

- 🎨 Real-time collaborative drawing canvas
- 👥 Live user presence and cursor tracking
- 📹 WebRTC video calls
- 🎯 Room-based collaboration
- 💬 Socket.io for real-time communication
- 🎨 Multiple drawing tools (pen, eraser)
- 🎨 Color and brush size selection

## Tech Stack

### Frontend (Client)
- React 18
- Tailwind CSS
- Socket.io Client
- WebRTC APIs
- Canvas API

### Backend (Server)
- Node.js
- Express
- Socket.io
- UUID for room generation

### WebRTC
- Peer-to-peer video communication
- STUN servers for NAT traversal
- Real-time signaling

## Project Structure

```
realtime-workspace/
├── client/ (React + Tailwind)
│   ├── components/
│   │   ├── Canvas.js
│   │   ├── UserList.js
│   │   └── VideoCall.js
│   ├── pages/
│   │   ├── Home.js
│   │   └── Workspace.js
│   ├── sockets/
│   │   └── useSocket.js
│   ├── webrtc/
│   │   └── useWebRTC.js
│   ├── styles/
│   │   └── index.css
│   └── App.js
├── server/ (Node.js + Express)
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   │   └── socketHandlers.js
│   ├── controllers/
│   └── server.js
├── webrtc/ (WebRTC signaling logic)
│   └── signaling.js
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install root dependencies:**
   ```bash
   cd realtime-workspace
   npm install
   ```

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start both the server (port 5000) and client (port 3000) concurrently.

### Manual Setup

If you prefer to start servers individually:

1. **Start the server:**
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Start the client (in another terminal):**
   ```bash
   cd client
   npm install
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter a username
3. Either create a new room or join an existing one with a room ID
4. Start collaborating! You can:
   - Draw on the shared canvas
   - See other users' cursors and drawings in real-time
   - Start video calls with other participants
   - Use different drawing tools and colors

## Environment Variables

### Server (.env)
```
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Client
```
REACT_APP_SERVER_URL=http://localhost:5000
```

## Scripts

### Root level
- `npm run dev` - Start both client and server
- `npm run install-all` - Install dependencies for all packages
- `npm run build` - Build the client for production
- `npm start` - Start the production server

### Server
- `npm start` - Start the server
- `npm run dev` - Start the server with nodemon

### Client
- `npm start` - Start the development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
