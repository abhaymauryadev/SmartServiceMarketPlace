"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socket;

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io({
        path: "/api/socket",
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected:", socketRef.current.id);
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinBookingRoom = (bookingId) => {
    socketRef.current?.emit("join", bookingId);
  };

  const onBookingStatus = (callback) => {
    socketRef.current?.on("booking-status", callback);
  };

  return {
    socket: socketRef.current,
    joinBookingRoom,
    onBookingStatus,
  };
}
 // Client-side Socket.io hook for real-time booking updates.