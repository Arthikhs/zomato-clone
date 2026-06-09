import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppData } from "./AppContext";
import { realtimeService } from "../main";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuth } = useAppData();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuth) {
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const s = io(realtimeService, {
      auth: { token: localStorage.getItem("token") },
      transports: ["websocket"],
    });

    setSocket(s);

    s.on("connect", () => console.log("Socket Connected", s.id));
    s.on("disconnect", () => console.log("Socket Disconnected"));
    s.on("connect_error", (err) => console.log("Socket Error:", err.message));

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [isAuth]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
