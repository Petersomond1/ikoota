import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadObject = async (filePath, fileName) => {
  const fs = require('fs');
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName, // The name of the file to save in the bucket
    Body: fileContent,
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log("File uploaded successfully:", data);
  } catch (err) {
    console.error("Error uploading file:", err);
  }
};

export default uploadObject;
