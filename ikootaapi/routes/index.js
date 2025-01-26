import express from 'express';
import authRoutes from './authRoutes.js';
import surveyRoutes from './surveyRoutes.js';
import teachingsRoutes from './teachingsRoutes.js';
import userRoutes from './userRoutes.js';
import chatRoutes from './chatRoutes.js';
import adminRoutes from './adminRoutes.js';
import classRoutes from './classRoutes.js';
import commentRoutes from './commentRoutes.js';
import app from '../app.js';

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/survey", surveyRoutes);

router.use("/teachings", teachingsRoutes);

router.use("/users", userRoutes);

router.use("/chats", chatRoutes);

router.use("/admin", adminRoutes);

router.use("/classes", classRoutes);

router.use("/comments", commentRoutes);

export default router;