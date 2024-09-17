const B2 = require("backblaze-b2")
const {b2AppId, b2AppKey, b2BukId} = require("./privateVars");

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

const uploadFile = async (file) => {
    try {
        const uploadUrlResponse = await b2.getUploadUrl({b2BukId})

        const response = await b2.uploadFile({
            uploadUrl: uploadUrlResponse.data.uploadUrl,
            uploadAuthToken: uploadUrlResponse.data.authorizationToken,
            fileName: file.originalname,
            mime: file.mimetype,
            data: file.data,
        })

        const fileUrl = `https://f000.backblazeb2.com/file/InternetMagas2024/${file.originalname}`
        return { ...response.data, fileUrl }
    } catch (e) {
        throw new Error(e)
    }
}

module.exports = {
    authenticateB2,
    uploadFile,
}