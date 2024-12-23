const B2 = require("backblaze-b2")
const {b2AppId, b2AppKey, b2BukId} = require("./privateVars");

const Image = require("../models/imageModel")

const b2 = new B2({
    applicationKeyId: b2AppId,
    applicationKey: b2AppKey
})

const authenticateB2 = async () => {
    try {
        await b2.authorize()
    } catch (e) {
        throw new Error(e)
    }
}

const downloadFile = async (fileId) => {
    try {
        await authenticateB2()
        const file = await Image.findById(fileId).select('imageName').lean()
        if (!file) return "File not Found"
        return `https://f003.backblazeb2.com/file/InternetMagas2024/${file?.imageName.replace(/ /g, '+')}`
    } catch (e) {
        throw new Error(e)
    }
}

const deleteFile = async (fileName) => {
    try {
        const fileList = await b2.listFileNames({bucketId: b2BukId, prefix: fileName})
        if (fileList.data.files.length > 0) {
            const fileId = fileList.data.files[0].fileId
            await b2.deleteFileVersion({fileName: fileName, fileId: fileId})
            await Image.deleteOne({imageId: fileId})
        }
    } catch (e) {
        return e.message
    }
}

const uploadFile = async (file) => {
    try {
        const uploadUrlResponse = await b2.getUploadUrl({bucketId: b2BukId})

        const uploadedFile = await b2.uploadFile({
            uploadUrl: uploadUrlResponse.data.uploadUrl,
            uploadAuthToken: uploadUrlResponse.data.authorizationToken,
            fileName: file.originalname,
            mime: file.mimetype,
            data: file.buffer,
        })

        const newFile = new Image({
            imageId: uploadedFile.data.fileId,
            imageName: uploadedFile.data.fileName,
        })

        await newFile.save()

        return newFile._id
    } catch (e) {
        throw new Error(e)
    }
}

const downloadMultipleFiles = async (files) => {
    try {
        await authenticateB2()
        return await Promise.all(files.map(async file => {
            await downloadFile(file)
        }))
    } catch (e) {
        throw new Error(e)
    }
}

const uploadMultipleFiles = async (files) => {
    try {
        await authenticateB2()
        return await Promise.all(files.map(async (file) => await uploadFile(file)))
    } catch (e) {
        throw new Error(e)
    }
}

const deleteMultipleFiles = async (fileNames) => {
    try {
        await authenticateB2()
        await Promise.all(fileNames.map(async (file) => await deleteFile(file)))
    } catch (e) {
        throw new Error(e)
    }
}

module.exports = {
    uploadMultipleFiles,
    deleteMultipleFiles,
    downloadMultipleFiles,
    deleteFile,
    downloadFile,
}