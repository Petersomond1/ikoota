// ikootaapi/middlewares/upload.middleware.js
import multer from 'multer';
import path from 'path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Configure AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up multer storage to use memory storage
const storage = multer.memoryStorage();

// File filter to only accept certain file types
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|mp4|mp3|m4a|webm|pdf|txt/;
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
}).fields([
  { name: "media1", maxCount: 1 },
  { name: "media2", maxCount: 1 },
  { name: "media3", maxCount: 1 },
]);

// Middleware to upload files to S3
const uploadToS3 = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) return next();

    const uploadedFiles = await Promise.all(
      Object.values(req.files).flat().map(async (file) => {
        const fileKey = `${uuidv4()}-${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read', // Ensure this is set to public-read
        };
        await s3Client.send(new PutObjectCommand(params));

        // Construct the S3 URL
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        return { url: fileUrl, type: file.mimetype.split("/")[0] };
      })
    );

    req.uploadedFiles = uploadedFiles;
    next();
  } catch (err) {
    console.log("here is the issue", err);
    next(err);
  }
};

export { uploadMiddleware, uploadToS3 };

