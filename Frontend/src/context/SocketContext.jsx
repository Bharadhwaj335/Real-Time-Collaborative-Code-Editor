/* eslint-disable react-refresh/only-export-components */

import { createContext, useEffect, useMemo, useState } from "react";
import socket, { connectSocket, disconnectSocket } from "../services/socket";
import { getStoredToken } from "../utils/helpers";

export const SocketContext = createContext({
  socket,
  isConnected: false
});

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const token = getStoredToken();

    if (token) {
      connectSocket(token);
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      disconnectSocket();
    };
  }, []);

  const contextValue = useMemo(
    () => ({ socket, isConnected }),
    [isConnected]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};