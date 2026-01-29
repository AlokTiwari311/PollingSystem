import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Ye apna server ka URL hai, jahan se socket connect hoga.
const SOCKET_URL = 'https://pollingsystem-1-f5te.onrender.com/';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Socket connection banao
        const socketInstance = io(SOCKET_URL);
        setSocket(socketInstance);

        // Jab component unmount ho to disconnect kar dena chahiye, memory leak na ho.
        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Socket instance return kardo taaki components use kar sakein.
    return socket;
};
