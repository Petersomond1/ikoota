import AWS from 'aws-sdk';
import { CognitoUserPool } from 'amazon-cognito-identity-js';

AWS.config.update({
  region: 'AWS_REGION',
  accessKeyId: 'AWS_ACCESS_KEY',
  secretAccessKey: 'AWS_SECRET_ACCESS_KEY',
});

const poolData = {
  UserPoolId: 'USER_POOL_ID',
  ClientId: 'CLIENT_ID',
};

export const userPool = new CognitoUserPool(poolData);
export const s3 = new AWS.S3();
export const rds = new AWS.RDS();




