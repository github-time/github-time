// 云函数入口文件
import axios from 'axios'
import * as cloud from 'wx-server-sdk'

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 限制最大为4M
const cacheDir = 'downloader-cache'
const baseFileId = `github-time-mp.6769-github-time-mp-1300157824/${cacheDir}`

const SPEED = 1000 / 1024 / 1024 / 0.04 // 每秒 0.04 M
cloud.init()
// 云函数入口函数
export async function main (event: any) {
  const {
    url,
    gitHash
  } = event

  const result = await cloud.getTempFileURL({
    fileList: [`cloud://${baseFileId}/${gitHash}`]
  })

  let wait = 0

  if (!result.fileList[0].tempFileURL) {
    const res = await axios({
      method: 'get',
      url: encodeURI(url),
      responseType: 'stream'
    })

    const size = res.headers['content-length']
    wait = Math.floor(size * SPEED)
    if (size > MAX_FILE_SIZE) {
      return {
        status: 413 // 超过文件大小限制
      }
    }

    cloud.uploadFile({
      cloudPath: `${cacheDir}/${gitHash}`,
      fileContent: res.data
    })
  }

  return {
    status: 200,
    wait
  }
}
