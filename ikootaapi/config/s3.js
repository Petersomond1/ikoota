import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-east-1" });

const uploadObject = async () => {
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: AWS_ACCESS_KEY,
    Body: AWS_SECRET_ACCESS_KEY,
  };

  try {
    const data = await s3Client.send(new PutObjectCommand(params));
    console.log("Success", data);
  } catch (err) {
    console.log("Error", err);
  }
};

uploadObject();