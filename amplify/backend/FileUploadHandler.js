const AWS = require('aws-sdk');
const crypto = require('crypto');

const s3 = new AWS.S3();
const kms = new AWS.KMS();

exports.handler = async (event) => {
    const bucketName = process.env.BUCKET_NAME;
    const key = event.headers['x-file-name'];

    if (!validateFileName(key)) {
        return { statusCode: 400, body: 'Invalid file name.' };
    }

    const presignedUrl = await generatePresignedUrl(bucketName, key);
    return { statusCode: 200, body: JSON.stringify({ url: presignedUrl }) };
};

const validateFileName = (fileName) => {
    // Implement your file validation logic here (e.g., checking file type, size)
    const validExtensions = ['.jpg', '.png', '.pdf'];
    const extension = path.extname(fileName);
    return validExtensions.includes(extension);
};

const generatePresignedUrl = async (bucket, key) => {
    const params = {
        Bucket: bucket,
        Key: key,
        Expires: 60 * 5, // URL expires in 5 minutes
        // Adding KMS encryption settings
        SSEKMSKeyId: process.env.KMS_KEY_ID,
        ServerSideEncryption: 'aws:kms',
    };
    return s3.getSignedUrlPromise('putObject', params);
};