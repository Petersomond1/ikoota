// ikootaapi/socket.js
// ENHANCED SOCKET.IO - Combines your existing simplicity with security and features
// Supports both authenticated and guest users

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './utils/logger.js';

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            // ✅ ENHANCED: Support both development and production
            origin: process.env.NODE_ENV === 'production' 
                ? (process.env.ALLOWED_ORIGINS?.split(',') || [process.env.PUBLIC_CLIENT_URL])
                : true,
            credentials: true,
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    // ✅ ENHANCED: Optional authentication middleware
    // Unlike the strict version, this allows both authenticated and guest users
    io.use((socket, next) => {
        try {
            // Try to get token from multiple sources
            const token = socket.handshake.auth?.token || 
                         socket.handshake.headers?.authorization?.split(' ')[1] ||
                         socket.handshake.query?.token;
            
            if (token) {
                // If token provided, validate it
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    socket.userId = decoded.user_id;
                    socket.userRole = decoded.role;
                    socket.username = decoded.username || decoded.email;
                    socket.email = decoded.email;
                    socket.isAuthenticated = true;

                    logger.info('Authenticated user connected to socket', {
                        socketId: socket.id,
                        userId: decoded.user_id,
                        username: socket.username,
                        role: decoded.role
                    });
                } catch (tokenError) {
                    // Invalid token, treat as guest
                    logger.warn('Invalid token provided, treating as guest', {
                        socketId: socket.id,
                        error: tokenError.message
                    });
                    socket.isAuthenticated = false;
                    socket.userId = null;
                    socket.username = 'Guest';
                    socket.userRole = 'guest';
                }
            } else {
                // No token provided, treat as guest
                socket.isAuthenticated = false;
                socket.userId = null;
                socket.username = 'Guest';
                socket.userRole = 'guest';
                
                logger.debug('Guest user connected to socket', {
                    socketId: socket.id
                });
            }

            next();
        } catch (error) {
            logger.error('Socket authentication middleware error', error);
            // Don't block connection, just treat as guest
            socket.isAuthenticated = false;
            socket.userId = null;
            socket.username = 'Guest';
            socket.userRole = 'guest';
            next();
        }
    });

    io.on('connection', (socket) => {
        const connectionInfo = {
            socketId: socket.id,
            userId: socket.userId,
            username: socket.username,
            role: socket.userRole,
            isAuthenticated: socket.isAuthenticated,
            timestamp: new Date().toISOString()
        };

        logger.info('Socket connection established', connectionInfo);

        // ✅ ENHANCED: Smart room management
        // Join user to appropriate rooms based on authentication status
        if (socket.isAuthenticated) {
            // Authenticated users get personal rooms
            socket.join(`user_${socket.userId}`);
            socket.join('authenticated_users');
            
            // Admin users get admin room
            if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
                socket.join('admin_room');
                logger.adminActivity('Admin joined socket admin room', socket.userId);
            }
            
            // Member users get member room
            if (socket.userRole === 'member' || socket.userRole === 'pre_member') {
                socket.join('members_room');
            }
        } else {
            // Guest users join public room
            socket.join('public_room');
        }

        // Join everyone to general room (for global announcements)
        socket.join('general');

        // ✅ PRESERVED: Your existing sendMessage functionality (enhanced)
        socket.on('sendMessage', async (data) => {
            try {
                // ✅ ENHANCED: Add user info and validation
                const messageData = {
                    ...data,
                    from: socket.userId || 'guest',
                    fromUsername: socket.username,
                    fromRole: socket.userRole,
                    isAuthenticated: socket.isAuthenticated,
                    socketId: socket.id,
                    timestamp: new Date().toISOString()
                };

                // ✅ ENHANCED: Smart message routing
                if (data.room) {
                    // Send to specific room
                    socket.to(data.room).emit('receiveMessage', messageData);
                    logger.debug('Message sent to room', {
                        from: socket.username,
                        room: data.room,
                        messageId: data.id || 'unknown'
                    });
                } else {
                    // ✅ PRESERVED: Your original broadcast behavior
                    io.emit('receiveMessage', messageData);
                    logger.debug('Message broadcast to all users', {
                        from: socket.username,
                        messageId: data.id || 'unknown'
                    });
                }

            } catch (err) {
                logger.error('Error processing sendMessage', err, {
                    socketId: socket.id,
                    userId: socket.userId,
                    data
                });
                
                // Send error back to sender
                socket.emit('messageError', {
                    error: 'Failed to process message',
                    originalData: data,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // ✅ NEW: Enhanced messaging with different types
        socket.on('sendChatMessage', async (data) => {
            try {
                if (!socket.isAuthenticated) {
                    socket.emit('error', { message: 'Authentication required for chat messages' });
                    return;
                }

                const chatMessage = {
                    id: data.id || Date.now().toString(),
                    from: socket.userId,
                    fromUsername: socket.username,
                    to: data.to,
                    message: data.message,
                    type: 'chat',
                    timestamp: new Date().toISOString()
                };

                if (data.to) {
                    // Private message
                    socket.to(`user_${data.to}`).emit('receiveChatMessage', chatMessage);
                    socket.emit('receiveChatMessage', { ...chatMessage, sent: true });
                } else {
                    // Public chat
                    socket.to('authenticated_users').emit('receiveChatMessage', chatMessage);
                }

                logger.userAction('Chat message sent', socket.userId, {
                    to: data.to || 'public',
                    messageLength: data.message?.length || 0
                });

            } catch (err) {
                logger.error('Error processing chat message', err);
                socket.emit('chatError', { error: 'Failed to send chat message' });
            }
        });

        // ✅ NEW: Admin messaging
        socket.on('adminMessage', (data) => {
            if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
                const adminMessage = {
                    from: socket.username,
                    message: data.message,
                    type: data.type || 'announcement',
                    priority: data.priority || 'normal',
                    timestamp: new Date().toISOString()
                };

                // Send to specified room or all users
                const targetRoom = data.room || 'general';
                socket.to(targetRoom).emit('adminMessage', adminMessage);

                logger.adminActivity('Admin message sent', socket.userId, null, {
                    room: targetRoom,
                    type: data.type,
                    priority: data.priority
                });
            } else {
                socket.emit('error', { message: 'Admin privileges required' });
            }
        });

        // ✅ NEW: User status updates
        socket.on('updateStatus', (data) => {
            if (socket.isAuthenticated) {
                const statusUpdate = {
                    userId: socket.userId,
                    username: socket.username,
                    status: data.status,
                    message: data.message,
                    timestamp: new Date().toISOString()
                };

                socket.broadcast.emit('userStatusUpdate', statusUpdate);
                
                logger.userAction('Status updated', socket.userId, { status: data.status });
            }
        });

        // ✅ NEW: Typing indicators
        socket.on('typing', (data) => {
            if (socket.isAuthenticated) {
                if (data.to) {
                    socket.to(`user_${data.to}`).emit('userTyping', {
                        from: socket.userId,
                        fromUsername: socket.username,
                        isTyping: data.isTyping
                    });
                } else {
                    socket.broadcast.emit('userTyping', {
                        from: socket.userId,
                        fromUsername: socket.username,
                        isTyping: data.isTyping
                    });
                }
            }
        });

        // ✅ NEW: Join/leave rooms dynamically
        socket.on('joinRoom', (roomName) => {
            if (socket.isAuthenticated) {
                socket.join(roomName);
                socket.emit('roomJoined', { room: roomName });
                logger.userAction('Joined room', socket.userId, { room: roomName });
            }
        });

        socket.on('leaveRoom', (roomName) => {
            socket.leave(roomName);
            socket.emit('roomLeft', { room: roomName });
            if (socket.isAuthenticated) {
                logger.userAction('Left room', socket.userId, { room: roomName });
            }
        });

        // ✅ PRESERVED: Your existing disconnect handling (enhanced)
        socket.on('disconnect', (reason) => {
            const disconnectInfo = {
                socketId: socket.id,
                userId: socket.userId,
                username: socket.username,
                reason,
                duration: Date.now() - (socket.connectedAt || Date.now()),
                timestamp: new Date().toISOString()
            };

            logger.info('Socket disconnected', disconnectInfo);

            // Notify others if it was an authenticated user
            if (socket.isAuthenticated) {
                socket.broadcast.emit('userDisconnected', {
                    userId: socket.userId,
                    username: socket.username,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // ✅ ENHANCED: Better error handling
        socket.on('error', (error) => {
            logger.error('Socket error', error, {
                socketId: socket.id,
                userId: socket.userId,
                username: socket.username
            });
        });

        // ✅ NEW: Ping/pong for connection health
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });

        // Store connection time for duration calculation
        socket.connectedAt = Date.now();

        // Send welcome message
        socket.emit('connected', {
            message: 'Connected to Ikoota Socket Server',
            socketId: socket.id,
            isAuthenticated: socket.isAuthenticated,
            username: socket.username,
            role: socket.userRole,
            timestamp: new Date().toISOString()
        });
    });

    // ✅ ENHANCED: Global error handling
    io.engine.on('connection_error', (error) => {
        logger.error('Socket.IO connection error', error, {
            timestamp: new Date().toISOString()
        });
    });

    // ✅ NEW: Monitor connection count
    setInterval(() => {
        const socketCount = io.engine.clientsCount;
        if (socketCount > 0) {
            logger.debug('Active socket connections', { count: socketCount });
        }
    }, 60000); // Every minute

    logger.startup('Socket.IO server initialized successfully', null, {
        corsOrigin: process.env.NODE_ENV === 'production' 
            ? process.env.ALLOWED_ORIGINS 
            : 'development (all origins)',
        transports: ['websocket', 'polling'],
        authenticationMode: 'optional'
    });
    
    return io;
};

export default setupSocket;






// // Backend socket.io setup
// import { Server } from 'socket.io';

// const setupSocket = (server) => {
//   const io = new Server(server, {
//     cors: { origin: process.env.PUBLIC_CLIENT_URL, methods: ['GET', 'POST'] },
//   });

//   io.on('connection', (socket) => {
//     console.log('User connected:', socket.id);

//     socket.on('sendMessage', async (data) => {
//         try {
//             io.emit('receiveMessage', data);
//           } catch (err) {
//             console.error('Error processing message:', err);
//           }
//     });

//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//     });
//   });
// };

// export default setupSocket;
