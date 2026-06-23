
// src/hooks/useSocket.js
import { useEffect } from "react";
import { io } from "socket.io-client";

let socket = null;

const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
};

export const useSocket = (onQueueUpdate) => {
  useEffect(() => {
    const s = getSocket();

    s.on("queue:update", (data) => {
      if (onQueueUpdate) onQueueUpdate(data);
    });

    return () => {
      s.off("queue:update");
    };
  }, [onQueueUpdate]);
};