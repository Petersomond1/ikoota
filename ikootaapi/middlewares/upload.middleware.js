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

// //Bucket policy
// // 1
// {
//   "Version": "2012-10-17",
//   "Id": "Policy1732020836947",
//   "Statement": [
//       {
//           "Sid": "Stmt1732020833229",
//           "Effect": "Allow",
//           "Principal": {
//               "AWS": "arn:aws:iam::701333809618:user/Petersomond"
//           },
//           "Action": [
//               "s3:DeleteObject",
//               "s3:GetObject",
//               "s3:PutObject"
//           ],
//           "Resource": "arn:aws:s3:::ikoota/*"
//       }
//   ]
// }

// // 2
// {
//   "Version": "2012-10-17",
//   "Statement": [
//     {
//       "Sid": "PublicReadGetObject",
//       "Effect": "Allow",
//       "Principal": "*",
//       "Action": "s3:GetObject",
//       "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
//     }
//   ]
// }


// //ikoota/ikootaapi/config/s3.js
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { v4 as uuidv4 } from "uuid";
// import dotenv from 'dotenv';

// dotenv.config();

// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// export const uploadFileToS3 = async (file) => {
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: `${uuidv4()}-${file.originalname}`,
//     Body: file.buffer,
//     ContentType: file.mimetype,
//     ACL: 'public-read', // Ensure this is set to public-read
//   };

//   try {
//     const data = await s3Client.send(new PutObjectCommand(params));
//     return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`; // Return the S3 file URL
//   } catch (error) {
//     console.error("Error uploading file to S3:", error);
//     throw new Error("File upload failed");
//   }
// };


// {
// 	"Version": "2012-10-17",
// 	"Id": "Policy1732020836947",
// 	"Statement": [
// 		{
// 			"Sid": "Stmt1732020833229",
// 			"Effect": "Allow",
// 			"Principal": {
// 				"AWS": "arn:aws:iam::701333809618:user/Petersomond"
// 			},
// 			"Action": [
// 				"s3:DeleteObject",
// 				"s3:GetObject",
// 				"s3:PutObject"
// 			],
// 			"Resource": "arn:aws:s3:::ikoota/*"
// 		},
// 		{
// 			"Sid": "PublicReadGetObject",
// 			"Effect": "Allow",
// 			"Principal": "*",
// 			"Action": "s3:GetObject",
// 			"Resource": "arn:aws:s3:::ikoota/*"
// 		}
// 	]
// }