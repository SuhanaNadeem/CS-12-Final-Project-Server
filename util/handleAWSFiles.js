const AWS = require("aws-sdk");
const AmazonS3URI = require("amazon-s3-uri");

require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

async function doesS3URLExist(imageUrl) {
  try {
    const { region, bucket, key } = AmazonS3URI(imageUrl);
    if (region && bucket && key) {
      return true;
    }
  } catch (err) {
    return false;
  }
}
module.exports.doesS3URLExist = doesS3URLExist;

async function handleCsFileDelete(fileKey) {
  return new Promise((resolve, reject) => {
    s3.deleteObject(
      {
        Bucket: process.env.S3_CS_BUCKET,
        Key: fileKey,
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}
module.exports.handleCsFileDelete = handleCsFileDelete;

async function getCsFile(fileKey) {
  return new Promise((resolve, reject) => {
    s3.getObject(
      {
        Bucket: process.env.S3_CS_BUCKET,
        Key: fileKey,
      },
      (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}
module.exports.getCsFile = getCsFile;
