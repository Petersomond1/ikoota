import express from 'express';

// import authRoutes from './auth.routes.js';
// import userRoutes from './user.routes.js';
// import classRoutes from './class.routes.js';
// import contentRoutes from './content.routes.js';
// import adminRoutes from './admin.routes.js';

const router = express.Router();

router.use("/auth", (req, res, next) => {
    console.log('Request received at /auth');
    next();
}, 
// authRoutes
);

router.use("/users", (req, res, next) => {
    console.log('Request received at /users');
    next();
}, 
// userRoutes
);

router.use("/classes", (req, res, next) => {
    console.log('Request received at /classes');
    next();
}, 
// classRoutes
);

router.use("/content", (req, res, next) => {
    console.log('Request received at /content');
    next();
}, 
// contentRoutes
);

router.use("/admin", (req, res, next) => {
    console.log('Request received at /admin');
    next();
}, 
// adminRoutes
);

export default router;