# Pulse Video Platform

A comprehensive full-stack video upload, processing, and streaming application with content sensitivity analysis and real-time progress tracking.

## 🚀 Features

### Core Functionality

- **Video Upload & Processing**: Upload videos with automatic metadata extraction and thumbnail generation
- **Content Sensitivity Analysis**: Automated analysis for violence, adult content, hate speech, and explicit content
- **Video Streaming**: HTTP range request support for efficient video streaming
- **Real-time Progress Tracking**: Socket.io-powered live updates during processing

### User Management

- **Multi-tenant Architecture**: Organization-based data isolation
- **Role-Based Access Control (RBAC)**: Three roles - Viewer, Editor, Admin
- **JWT Authentication**: Secure access with refresh token support

### Dashboard & Analytics

- **Video Statistics**: Views, processing status, and sensitivity metrics
- **User Management** (Admin): Create, edit, and manage users

## 🏗️ Architecture

```
Pulse Video Platform/
├── backend/                 # Node.js + Express API
│   ├── config/             # Configuration files
│   ├── models/             # Mongoose schemas
│   ├── middleware/         # Auth, RBAC, upload, error handling
│   ├── services/           # Business logic (processing, analysis, streaming)
│   ├── controllers/        # Request handlers
│   ├── routes/             # API routes
│   ├── socket/             # Socket.io handlers
│   └── server.js           # Entry point
│
└── frontend/               # React + Vite SPA
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── context/        # React Context providers
    │   ├── pages/          # Page components
    │   └── services/       # API service modules
    └── index.html
```

## 📋 Prerequisites

- **Node.js** v18+
- **MongoDB** v6+ (local or Atlas)
- **FFmpeg** (required for video processing)

### Installing FFmpeg

**Windows:**

```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**

```bash
brew install ffmpeg
```

**Linux:**

```bash
sudo apt update && sudo apt install ffmpeg
```

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
# Replace with your MongoDB connection string
# Local: mongodb://localhost:27017/pulse_video_platform
# Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/pulse_video_platform
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets (Generate secure random strings)
# Use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Token Expiry
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=104857600

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Sensitivity Analysis (Optional - for production)
# AWS Rekognition
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Google Cloud Video Intelligence
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

#### Frontend (.env)

```env
# API URL
VITE_API_URL=http://localhost:5000/api

# Socket.io URL
VITE_SOCKET_URL=http://localhost:5000

# App Name
VITE_APP_NAME=Pulse Video Platform
```

### 3. Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

## 📚 API Documentation

### Authentication

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register new user    |
| POST   | `/api/auth/login`    | User login           |
| POST   | `/api/auth/refresh`  | Refresh access token |
| POST   | `/api/auth/logout`   | User logout          |
| GET    | `/api/auth/me`       | Get current user     |

### Videos

| Method | Endpoint                     | Description       | Role        |
| ------ | ---------------------------- | ----------------- | ----------- |
| GET    | `/api/videos`                | List all videos   | All         |
| GET    | `/api/videos/:id`            | Get video details | All         |
| POST   | `/api/videos/upload`         | Upload video      | Editor+     |
| PUT    | `/api/videos/:id`            | Update video      | Owner/Admin |
| DELETE | `/api/videos/:id`            | Delete video      | Owner/Admin |
| GET    | `/api/videos/:id/stream`     | Stream video      | All         |
| GET    | `/api/videos/:id/download`   | Download video    | All         |
| POST   | `/api/videos/:id/reanalyze`  | Re-run analysis   | Admin       |
| GET    | `/api/videos/stats/overview` | Get statistics    | All         |

### Users (Admin Only)

| Method | Endpoint            | Description      |
| ------ | ------------------- | ---------------- |
| GET    | `/api/users`        | List all users   |
| GET    | `/api/users/:id`    | Get user details |
| POST   | `/api/users`        | Create user      |
| PUT    | `/api/users/:id`    | Update user      |
| DELETE | `/api/users/:id`    | Delete user      |
| GET    | `/api/users/search` | Search users     |

### User Profile

| Method | Endpoint              | Description     |
| ------ | --------------------- | --------------- |
| PUT    | `/api/users/profile`  | Update profile  |
| PUT    | `/api/users/password` | Change password |

## 🔐 Role-Based Permissions

| Permission        | Viewer | Editor | Admin |
| ----------------- | :----: | :----: | :---: |
| View videos       |   ✅   |   ✅   |  ✅   |
| Upload videos     |   ❌   |   ✅   |  ✅   |
| Edit own videos   |   ❌   |   ✅   |  ✅   |
| Delete own videos |   ❌   |   ✅   |  ✅   |
| Edit any video    |   ❌   |   ❌   |  ✅   |
| Delete any video  |   ❌   |   ❌   |  ✅   |
| Manage users      |   ❌   |   ❌   |  ✅   |
| Re-analyze videos |   ❌   |   ❌   |  ✅   |

## 🔌 Real-time Events (Socket.io)

### Client → Server

| Event               | Payload   | Description                |
| ------------------- | --------- | -------------------------- |
| `subscribe:video`   | `videoId` | Subscribe to video updates |
| `unsubscribe:video` | `videoId` | Unsubscribe from updates   |

### Server → Client

| Event             | Payload                                  | Description          |
| ----------------- | ---------------------------------------- | -------------------- |
| `video:progress`  | `{ videoId, progress, status, message }` | Processing progress  |
| `video:completed` | `{ videoId, video }`                     | Processing completed |
| `video:error`     | `{ videoId, error }`                     | Processing failed    |

## 📁 Video Processing Pipeline

1. **Upload**: File validation and storage
2. **Metadata Extraction**: FFprobe extracts duration, resolution, codec info
3. **Thumbnail Generation**: FFmpeg creates preview thumbnail
4. **Sensitivity Analysis**: Content analysis for safety classification
5. **Status Update**: Video marked as completed/flagged

## 🎨 Frontend Components

### Layout

- `Layout.jsx` - Main app layout with sidebar
- `Navbar.jsx` - Top navigation bar
- `Sidebar.jsx` - Side navigation menu

### Common Components

- `Button.jsx` - Reusable button with variants
- `Modal.jsx` - Modal dialog component
- `VideoCard.jsx` - Video thumbnail card
- `StatusBadge.jsx` - Status indicator badges
- `ProgressBar.jsx` - Progress indicator

### Pages

- `Dashboard.jsx` - Overview and statistics
- `Upload.jsx` - Video upload with drag-drop
- `Videos.jsx` - Video library with filters
- `VideoPlayer.jsx` - Video playback page
- `Users.jsx` - User management (admin)
- `Settings.jsx` - User preferences

## 🔧 Configuration Options

### Video Upload Limits

Edit `backend/config/index.js`:

```javascript
upload: {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
}
```

### Sensitivity Thresholds

Edit `backend/services/sensitivityAnalysis.js`:

```javascript
const thresholds = {
  violence: 70, // Score above = flagged
  adult: 60,
  hateSpeech: 50,
  explicit: 55,
};
```

## 🚀 Production Deployment

### Backend

```bash
# Build (if using TypeScript)
npm run build

# Start production server
NODE_ENV=production npm start
```

### Frontend

```bash
# Build for production
npm run build

# Serve dist folder with nginx, Apache, or static host
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use secure JWT secrets (64+ characters)
- [ ] Configure MongoDB Atlas or production database
- [ ] Set proper CORS origins
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up file storage (S3, CloudFlare R2, etc.)

## 📝 Development Notes

### Adding Real Sensitivity Analysis

Replace the mock analysis in `backend/services/sensitivityAnalysis.js` with:

**AWS Rekognition:**

```javascript
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";

const client = new RekognitionClient({ region: process.env.AWS_REGION });
// Implementation...
```

**Google Cloud Video Intelligence:**

```javascript
import videoIntelligence from "@google-cloud/video-intelligence";

const client = new videoIntelligence.VideoIntelligenceServiceClient();
// Implementation...
```

### Extending the Platform

- Add video transcoding for multiple resolutions
- Implement video commenting system
- Add playlist/collection features
- Integrate CDN for video delivery
- Add video analytics and heatmaps

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and feature requests, please open a GitHub issue.
