const axios = require('axios').default
const fs = require('fs')
const path = require('path')

const downloadFile = async (fileUrl, downloadFolder, ext = '.docx') => {
  const fileName = path.basename(fileUrl)
  const downloadPath = path.resolve(__dirname, downloadFolder)
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath)
  }
  const localFilePath = path.resolve(downloadPath, fileName + ext)
  //файл уже существует
  if (fs.existsSync(localFilePath)) return localFilePath

  try {
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream',
    })

    const w = response.data.pipe(fs.createWriteStream(localFilePath))

    return new Promise((resolve, reject) => {
      w.on('finish', () => resolve(w.path))
      w.on('error', () => reject())
    })
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = downloadFile