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

                // ✅ NEW: Classroom-specific chat handling
                if (data.room && data.room.startsWith('classroom_')) {
                    // Store classroom message in database
                    try {
                        if (socket.isAuthenticated && data.classId) {
                            // Import database connection
                            const { default: db } = await import('./config/db.js');

                            // Store message in database
                            await db.query(`
                                INSERT INTO class_content (
                                    class_id, title, content_type, content_text,
                                    created_by, is_published, is_active
                                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                            `, [
                                data.classId,
                                'Chat Message',
                                'chat_message',
                                data.message,
                                socket.userId,
                                true,
                                true
                            ]);

                            logger.userActivity('Classroom chat message stored', socket.userId, {
                                classId: data.classId,
                                room: data.room,
                                messageLength: data.message?.length || 0
                            });
                        }
                    } catch (dbError) {
                        logger.error('Failed to store classroom message', dbError);
                        // Continue with real-time delivery even if storage fails
                    }

                    // Send to classroom room
                    socket.to(data.room).emit('receiveMessage', messageData);
                    // Also send back to sender for confirmation
                    socket.emit('receiveMessage', { ...messageData, sent: true });

                    logger.debug('Classroom message sent', {
                        from: socket.username,
                        room: data.room,
                        classId: data.classId,
                        messageId: data.id || 'unknown'
                    });
                } else if (data.room) {
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

        // ✅ NEW: Typing indicators (enhanced for classrooms)
        socket.on('typing', (data) => {
            if (socket.isAuthenticated) {
                const typingData = {
                    from: socket.userId,
                    fromUsername: socket.username,
                    isTyping: data.isTyping,
                    timestamp: new Date().toISOString()
                };

                if (data.room && data.room.startsWith('classroom_')) {
                    // Classroom-specific typing
                    socket.to(data.room).emit('userTyping', typingData);

                    logger.debug('Classroom typing indicator', {
                        from: socket.username,
                        room: data.room,
                        isTyping: data.isTyping
                    });
                } else if (data.to) {
                    // Private typing
                    socket.to(`user_${data.to}`).emit('userTyping', typingData);
                } else {
                    // Public typing
                    socket.broadcast.emit('userTyping', typingData);
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

        // ✅ ENHANCED: Message reactions
        socket.on('messageReaction', async (data) => {
            try {
                if (!socket.isAuthenticated) {
                    socket.emit('error', { message: 'Authentication required for reactions' });
                    return;
                }

                const reactionData = {
                    messageId: data.messageId,
                    reaction: data.reaction,
                    userId: socket.userId,
                    username: socket.username,
                    timestamp: new Date().toISOString()
                };

                // Store reaction in database if it's a classroom message
                if (data.classId && data.room?.startsWith('classroom_')) {
                    try {
                        const { default: db } = await import('./config/db.js');
                        await db.execute(
                            'INSERT INTO chat_reactions (message_id, user_id, reaction, created_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE reaction = VALUES(reaction)',
                            [data.messageId, socket.userId, data.reaction]
                        );
                    } catch (dbError) {
                        logger.error('Failed to store reaction', dbError);
                    }
                }

                // Broadcast reaction to room
                if (data.room) {
                    socket.to(data.room).emit('messageReaction', reactionData);
                    socket.emit('messageReaction', { ...reactionData, sent: true });
                }

                logger.userActivity('Message reaction added', socket.userId, {
                    messageId: data.messageId,
                    reaction: data.reaction,
                    room: data.room
                });
            } catch (err) {
                logger.error('Error processing message reaction', err);
                socket.emit('error', { message: 'Failed to add reaction' });
            }
        });

        // ✅ ENHANCED: Message deletion (moderation)
        socket.on('deleteMessage', async (data) => {
            try {
                if (!socket.isAuthenticated) {
                    socket.emit('error', { message: 'Authentication required for moderation' });
                    return;
                }

                // Check if user has moderation rights
                const canModerate = socket.userRole === 'admin' ||
                                  socket.userRole === 'instructor' ||
                                  socket.userRole === 'super_admin';

                if (!canModerate) {
                    socket.emit('error', { message: 'Insufficient permissions for moderation' });
                    return;
                }

                // Mark message as deleted in database
                if (data.classId && data.room?.startsWith('classroom_')) {
                    try {
                        const { default: db } = await import('./config/db.js');
                        await db.execute(
                            'UPDATE content SET is_deleted = TRUE, deleted_by = ?, deleted_at = NOW() WHERE id = ?',
                            [socket.userId, data.messageId]
                        );
                    } catch (dbError) {
                        logger.error('Failed to delete message in database', dbError);
                    }
                }

                const deletionData = {
                    messageId: data.messageId,
                    deletedBy: socket.userId,
                    moderator: socket.username,
                    timestamp: new Date().toISOString()
                };

                // Broadcast deletion to room
                if (data.room) {
                    socket.to(data.room).emit('messageDeleted', deletionData);
                    socket.emit('messageDeleted', { ...deletionData, sent: true });
                }

                logger.userActivity('Message deleted by moderator', socket.userId, {
                    messageId: data.messageId,
                    room: data.room,
                    classId: data.classId
                });
            } catch (err) {
                logger.error('Error processing message deletion', err);
                socket.emit('error', { message: 'Failed to delete message' });
            }
        });

        // ✅ ENHANCED: Pin messages
        socket.on('pinMessage', async (data) => {
            try {
                if (!socket.isAuthenticated) {
                    socket.emit('error', { message: 'Authentication required for pinning' });
                    return;
                }

                const canPin = socket.userRole === 'admin' ||
                              socket.userRole === 'instructor' ||
                              socket.userRole === 'super_admin';

                if (!canPin) {
                    socket.emit('error', { message: 'Insufficient permissions for pinning' });
                    return;
                }

                // Store pinned message in database
                if (data.classId && data.room?.startsWith('classroom_')) {
                    try {
                        const { default: db } = await import('./config/db.js');
                        await db.execute(
                            'INSERT INTO pinned_messages (class_id, message_id, message_content, author, pinned_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                            [data.classId, data.messageId, data.message, data.author, socket.userId]
                        );
                    } catch (dbError) {
                        logger.error('Failed to pin message', dbError);
                    }
                }

                const pinData = {
                    messageId: data.messageId,
                    message: data.message,
                    author: data.author,
                    pinnedBy: socket.username,
                    timestamp: new Date().toISOString()
                };

                // Broadcast pin to room
                if (data.room) {
                    socket.to(data.room).emit('messagePinned', pinData);
                    socket.emit('messagePinned', { ...pinData, sent: true });
                }

                logger.userActivity('Message pinned', socket.userId, {
                    messageId: data.messageId,
                    room: data.room,
                    classId: data.classId
                });
            } catch (err) {
                logger.error('Error processing message pin', err);
                socket.emit('error', { message: 'Failed to pin message' });
            }
        });

        // ✅ ENHANCED: Stop typing indicator
        socket.on('stopTyping', (data) => {
            if (socket.isAuthenticated && data.room) {
                const stopTypingData = {
                    from: socket.userId,
                    fromUsername: socket.username,
                    classId: data.classId,
                    timestamp: new Date().toISOString()
                };

                socket.to(data.room).emit('userStoppedTyping', stopTypingData);
            }
        });

        // ✅ ENHANCED: File upload for chat
        socket.on('uploadChatFile', async (data) => {
            try {
                if (!socket.isAuthenticated) {
                    socket.emit('error', { message: 'Authentication required for file upload' });
                    return;
                }

                // Validate file type and size
                const allowedTypes = ['image/', 'audio/', 'video/', 'application/pdf', 'text/'];
                const maxSize = 50 * 1024 * 1024; // 50MB

                if (!allowedTypes.some(type => data.fileType.startsWith(type))) {
                    socket.emit('uploadError', { message: 'File type not allowed' });
                    return;
                }

                if (data.fileSize > maxSize) {
                    socket.emit('uploadError', { message: 'File too large (max 50MB)' });
                    return;
                }

                // Process file upload (integrate with existing S3 upload)
                const uploadData = {
                    userId: socket.userId,
                    classId: data.classId,
                    fileName: data.fileName,
                    fileType: data.fileType,
                    fileSize: data.fileSize,
                    timestamp: new Date().toISOString()
                };

                socket.emit('uploadProgress', { progress: 0 });

                // Simulate upload progress (real implementation would use S3)
                for (let i = 0; i <= 100; i += 20) {
                    setTimeout(() => {
                        socket.emit('uploadProgress', { progress: i });
                    }, i * 10);
                }

                setTimeout(() => {
                    socket.emit('uploadComplete', {
                        ...uploadData,
                        fileUrl: `/uploads/chat/${data.classId}/${Date.now()}-${data.fileName}`
                    });
                }, 1000);

                logger.userActivity('Chat file uploaded', socket.userId, {
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    classId: data.classId
                });
            } catch (err) {
                logger.error('Error processing file upload', err);
                socket.emit('uploadError', { message: 'File upload failed' });
            }
        });

        // ✅ ENHANCED: Announcements (instructor/admin only)
        socket.on('sendAnnouncement', async (data) => {
            try {
                if (!socket.isAuthenticated) {
                    socket.emit('error', { message: 'Authentication required for announcements' });
                    return;
                }

                const canAnnounce = socket.userRole === 'admin' ||
                                   socket.userRole === 'instructor' ||
                                   socket.userRole === 'super_admin';

                if (!canAnnounce) {
                    socket.emit('error', { message: 'Insufficient permissions for announcements' });
                    return;
                }

                const announcementData = {
                    id: Date.now().toString(),
                    type: 'announcement',
                    message: `📢 ANNOUNCEMENT: ${data.message}`,
                    from: socket.userId,
                    fromUsername: socket.username,
                    classId: data.classId,
                    room: data.room,
                    timestamp: new Date().toISOString(),
                    priority: data.priority || 'normal'
                };

                // Store announcement in database
                if (data.classId && data.room?.startsWith('classroom_')) {
                    try {
                        const { default: db } = await import('./config/db.js');
                        await db.execute(
                            'INSERT INTO content (class_id, title, content, author_id, content_type, status, is_approved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                            [data.classId, 'Classroom Announcement', announcementData.message, socket.userId, 'announcement', 'published', true]
                        );
                    } catch (dbError) {
                        logger.error('Failed to store announcement', dbError);
                    }
                }

                // Broadcast announcement to room
                if (data.room) {
                    socket.to(data.room).emit('receiveMessage', announcementData);
                    socket.emit('receiveMessage', { ...announcementData, sent: true });
                }

                logger.userActivity('Announcement sent', socket.userId, {
                    room: data.room,
                    classId: data.classId,
                    priority: data.priority
                });
            } catch (err) {
                logger.error('Error processing announcement', err);
                socket.emit('error', { message: 'Failed to send announcement' });
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



