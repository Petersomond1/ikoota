// Backend socket.io setup
import { Server } from 'socket.io';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.PUBLIC_CLIENT_URL, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('sendMessage', async (data) => {
        try {
            io.emit('receiveMessage', data);
          } catch (err) {
            console.error('Error processing message:', err);
          }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

export default setupSocket;
