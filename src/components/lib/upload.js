import { s3 } from './aws-config';
const date = new Date().getTime().toString();




const upload = async (file) => {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `images/${Date.now()}_${file.name}`,
      Body: file,
      ACL: 'public-read',  // at configuration, public access blocked and ACLs disabled. so, ACLs were set to private, so I had to change it to public-read
    };
  
    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Location);
        }
      });
    });
  };
  
  export default upload;