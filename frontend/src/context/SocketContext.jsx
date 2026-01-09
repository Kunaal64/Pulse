import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [videoUpdates, setVideoUpdates] = useState({});
  const { token, isAuthenticated } = useAuth();

  // Connect to socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("🔌 Socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    // Listen for video processing updates
    newSocket.on("processing:update", (data) => {
      console.log("📊 Processing update:", data);
      setVideoUpdates((prev) => ({
        ...prev,
        [data.videoId]: {
          ...prev[data.videoId],
          progress: data.progress,
          message: data.message,
          status: data.status,
        },
      }));
    });

    // Listen for upload complete
    newSocket.on("upload:complete", (data) => {
      console.log("✅ Upload complete:", data);
      setVideoUpdates((prev) => ({
        ...prev,
        [data.videoId]: {
          ...prev[data.videoId],
          uploadComplete: true,
          message: data.message,
        },
      }));
    });

    // Listen for sensitivity analysis completion
    newSocket.on("sensitivity:complete", (data) => {
      console.log("🔍 Sensitivity complete:", data);
      setVideoUpdates((prev) => ({
        ...prev,
        [data.videoId]: {
          ...prev[data.videoId],
          sensitivityStatus: data.status,
          sensitivityScore: data.score,
          sensitivityReasons: data.reasons,
        },
      }));
    });

    // Listen for video ready
    newSocket.on("video:ready", (data) => {
      console.log("🎬 Video ready:", data);
      setVideoUpdates((prev) => ({
        ...prev,
        [data.videoId]: {
          ...prev[data.videoId],
          ready: true,
          video: data.video,
        },
      }));
    });

    // Listen for processing errors
    newSocket.on("processing:error", (data) => {
      console.error("❌ Processing error:", data);
      setVideoUpdates((prev) => ({
        ...prev,
        [data.videoId]: {
          ...prev[data.videoId],
          error: data.error,
          status: "failed",
        },
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  // Subscribe to video updates
  const subscribeToVideo = useCallback(
    (videoId) => {
      if (socket && isConnected) {
        socket.emit("subscribe:video", videoId);
      }
    },
    [socket, isConnected]
  );

  // Unsubscribe from video updates
  const unsubscribeFromVideo = useCallback(
    (videoId) => {
      if (socket && isConnected) {
        socket.emit("unsubscribe:video", videoId);
      }
    },
    [socket, isConnected]
  );

  // Clear video update
  const clearVideoUpdate = useCallback((videoId) => {
    setVideoUpdates((prev) => {
      const newUpdates = { ...prev };
      delete newUpdates[videoId];
      return newUpdates;
    });
  }, []);

  // Get update for specific video
  const getVideoUpdate = useCallback(
    (videoId) => {
      return videoUpdates[videoId] || null;
    },
    [videoUpdates]
  );

  const value = {
    socket,
    isConnected,
    videoUpdates,
    subscribeToVideo,
    unsubscribeFromVideo,
    clearVideoUpdate,
    getVideoUpdate,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
