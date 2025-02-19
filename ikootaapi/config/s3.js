import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadFileToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };

  // try {
  //   const data = await s3Client.send(new PutObjectCommand(params));
  //   return data.Location; // Returns the S3 file URL
  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    return {
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`, // Return the S3 file URL
      type: file.mimetype,
    };

  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("File upload failed");
  }
};

// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import dotenv from 'dotenv';

// dotenv.config();

// const s3Client = new S3Client({ 
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const uploadObject = async (filePath, fileName) => {
//   const fs = require('fs');
//   const fileContent = fs.readFileSync(filePath);

//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: fileName, // The name of the file to save in the bucket
//     Body: fileContent,
//   };

//   try {
//     const data = await s3Client.send(new PutObjectCommand(params));
//     console.log("File uploaded successfully:", data);
//   } catch (err) {
//     console.error("Error uploading file:", err);
//   }
// };

// export default uploadObject;
