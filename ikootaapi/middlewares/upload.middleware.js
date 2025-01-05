import multer from 'multer';
import path from 'path';
import AWS from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Set up multer storage to use memory storage
const storage = multer.memoryStorage();

// File filter to only accept certain file types
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|mp4|mp3|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not supported!'), false);
  }
};

// Multer upload middleware
const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter,
});

// Middleware to upload files to S3
const uploadToS3 = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new Error('No files uploaded'));
  }

  const uploadPromises = req.files.map(async file => {
    const fileKey = `${uuidv4()}-${file.originalname}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    
    return s3.upload(params).promise().then(data => ({
      type: file.mimetype.split('/')[0],
      fileUrl: data.Location,
    }));
  });

  Promise.all(uploadPromises)
    .then(files => {
      req.uploadedFiles = files;
      next();
    })
    .catch(err => next(err));
};

export { uploadMiddleware, uploadToS3 };