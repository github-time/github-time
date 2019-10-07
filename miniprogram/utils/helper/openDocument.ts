import { sleep, wrapLoading } from '../common'
import callCloudFunctionWithCache from '../data-fetcher/callCloudFunctionWithCache'
const baseFileId = 'github-time-mp.6769-github-time-mp-1300157824/downloader-cache'
const cacheKey = 'fileCacheIndex'

type CacheFileInfo = {
  path: string,
  hash: string
}

const cache = (() => {
  try {
    return JSON.parse(wx.getStorageSync(cacheKey))
  } catch (e) {
    return {}
  }
})() as { [key: string]: CacheFileInfo }

async function getFileHash (path: string): Promise<string> {
  return new Promise((resolve) => {
    wx.getFileInfo({
      filePath: path,
      digestAlgorithm: 'sha1',
      success (res) {
        resolve(res.digest)
      },
      fail () {
        resolve('')
      }
    })
  })
}

async function downloadFile (fileID: string): Promise<{status: 'done'|'error', data: any}> {
  return new Promise((resolve) => {
    wx.cloud.downloadFile({
      fileID,
      success (res) {
        resolve({
          status: 'done',
          data: res
        })
      },
      fail (e: any) {
        resolve({
          status: 'error',
          data: e.message
        })
      }
    })
  })
}

function doOpenDocument (
  filePath: string,
  fileType: 'doc'|'docx'|'xls'|'xlsx'|'ppt'|'pptx'|'pdf'
) {
  wx.openDocument({
    filePath,
    fileType,
    success: function () {
      console.log('打开文档成功')
    },
    fail (e) {
      console.log('openDocument error:', e)
      wx.showToast({
        title: '打开文档失败',
        icon: 'none',
        duration: 2000
      })
    }
  })
}

async function serverDownload (url: string, gitHash: string) {
  const data = `${baseFileId}/${gitHash}`
  const result = await wx.cloud.getTempFileURL({
    fileList: [`cloud://${baseFileId}/${gitHash}`]
  })
  if (result.fileList[0].tempFileURL) {
    // 服务已下载该文件
    console.log('Server file found.')
    return {
      status: 'done',
      data
    }
  }
  console.log('Do server download ...')
  const serverDownloadResult = await callCloudFunctionWithCache(
    {
      name: 'downloader',
      data: {
        url,
        gitHash
      }
    },
    false, // 禁用缓存
    { retry: 0 } // 禁止自动重试
  )
  let error = 'unknown'
  if (serverDownloadResult.errMsg === 'cloud.callFunction:ok') {
    const result = serverDownloadResult.result
    if (result.status === 200) {
      // 该文件服务器已下载完成
      return {
        status: 'done',
        data
      }
    } else if (result.status === 202) {
      // 该文件服务器正在下载
      wx.showLoading({
        title: '正在检查文件...'
      })
      let retry = 4
      while (true) {
        const result = await wx.cloud.getTempFileURL({
          fileList: [`cloud://${baseFileId}/${gitHash}`]
        })
        console.log('check cloud file: ', result)
        if (result.fileList[0].tempFileURL) {
          wx.hideLoading()
          return {
            status: 'done',
            data
          }
        }
        if (retry-- <= 0) break
        await sleep(5000) // 等待 5 秒
      }
      error = `server upload failed.`
      wx.hideLoading()
    } else {
      error = result.status
    }
  }
  return {
    status: 'error',
    data: error
  }
}

async function redownload (url: string, gitHash: string) {
  await wrapLoading('服务器正在处理请求...', async () => {
    const serverDownloadResult = await serverDownload(url, gitHash)
    let error = ''
    if (serverDownloadResult.status === 'done') {
      wx.showLoading({
        title: '下载中,请稍后...' // 更新加载信息
      })
      const downloadFileResult = await downloadFile(serverDownloadResult.data)
      if (downloadFileResult.status === 'done') {
        const filePath = downloadFileResult.data.tempFilePath
        cache[gitHash] = {
          path: filePath,
          hash: await getFileHash(filePath)
        }
        wx.setStorageSync(cacheKey, JSON.stringify(cache))
        const fileType = url.substr(url.lastIndexOf('.') + 1)
        doOpenDocument(filePath, fileType as any)
      } else {
        error = '下载失败，请稍后重试...'
      }
    } else {
      error = '文件较大，请稍后重试...'
    }
    if (error) {
      wx.showToast({
        title: error,
        icon: 'none',
        duration: 2000
      })
      await sleep(2000)
    }
  })
}

export default async function openDocument (url: string, gitHash: string) {
  console.log(`openDocument: ${url} [${gitHash}]`)
  const cacheFile = cache[gitHash]
  if (cacheFile && await getFileHash(cacheFile.path)) {
    // 缓存文件已存在，且 hash 匹配，直接打开
    const filePath = cacheFile.path
    console.log('open cache file:', filePath)
    const fileType = url.substr(url.lastIndexOf('.') + 1)
    doOpenDocument(filePath, fileType as any)
  } else {
    // 重新下载
    await redownload(url, gitHash)
  }
}
