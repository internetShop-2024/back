const {Storage} = require('@google-cloud/storage');
const Multer = require('multer');
const {format} = require('util')
const path = require("path");

const storage = new Storage({
    projectId: 'copper-tempo-429108-h9',
    keyFilename: 'copper-tempo-429108-h9-30c2d356394d.json'
});

const bucket = storage.bucket('copper-tempo-429108-h9.appspot.com');

const multer = Multer({
    storage: Multer.memoryStorage(),
});

const uploadImageToGCS = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject('No file uploaded');
        }

        const blob = bucket.file(file.originalname);
        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', () => {
            const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
            resolve(publicUrl);
        });

        blobStream.end(file.buffer);
    });
};

const testBucketConnection = async () => {
    try {
        const [files] = await bucket.getFiles();
        return files;
    } catch (error) {
        console.log('Failed to connect to bucket: ' + error.message)
    }
};

testBucketConnection().then(r => {
    console.log("alsdasdas")
})

module.exports = {multer, uploadImageToGCS};
