import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" });

const uploadObject = async () => {
  const params = {
    Bucket: "your-bucket-name",
    Key: "your-object-key",
    Body: "your-object-body",
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log("Success", data);
  } catch (err) {
    console.log("Error", err);
  }
};

uploadObject();