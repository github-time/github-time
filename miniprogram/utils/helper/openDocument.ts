import { sleep } from '../common'
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

async function serverDownload (url: string, gitHash: string): Promise<{status: string, data: any}> {
  return new Promise(async (resolve) => {
    const fileId = `${baseFileId}/${gitHash}`
    const result = await wx.cloud.getTempFileURL({
      fileList: [`cloud://${baseFileId}/${gitHash}`]
    })
    if (result.fileList[0].tempFileURL) {
      // 服务已下载该文件
      console.log('Server file found.')
      resolve({
        status: 'done',
        data: fileId
      })
      return
    }

    console.log('Do server download ...')
    wx.cloud.callFunction({
      // 云函数名称
      name: 'downloader',
      // 传给云函数的参数
      data: {
        url,
        gitHash
      },
      async success (res: any) {
        if (res.result.status === 200) {
          resolve({
            status: 'done',
            data: fileId
          })
        } else if (res.result.status === 202) {
          wx.showLoading({
            title: '正在检查文件...'
          })
          let retry = 4
          let data = ''
          while (true) {
            const result = await wx.cloud.getTempFileURL({
              fileList: [`cloud://${baseFileId}/${gitHash}`]
            })
            console.log('check cloud file: ', result)
            if (result.fileList[0].tempFileURL) {
              data = fileId
              break
            }
            if (retry-- <= 0) break
            await sleep(5000) // 等待 5 秒
          }
          if (data) {
            resolve({
              status: 'done',
              data
            })
          } else {
            resolve({
              status: 'error',
              data: `server upload failed.`
            })
          }
        } else {
          resolve({
            status: 'error',
            data: `${res.result.status}`
          })
        }
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

async function redownload (url: string, gitHash: string) {
  wx.showLoading({
    title: '服务器正在处理请求...'
  })

  const result = await serverDownload(url, gitHash)

  wx.showLoading({
    title: '下载中,请稍后...'
  })
  if (result.status === 'done') {
    wx.cloud.downloadFile({
      fileID: result.data,
      async success (res) {
        const filePath = res.tempFilePath
        cache[gitHash] = {
          path: filePath,
          hash: await getFileHash(filePath)
        }
        wx.setStorageSync(cacheKey, JSON.stringify(cache))
        wx.hideLoading()
        const fileType = url.substr(url.lastIndexOf('.') + 1)
        doOpenDocument(filePath, fileType as any)
      },
      fail () {
        wx.hideLoading()
        wx.showToast({
          title: '下载失败，请稍后重试...',
          icon: 'none',
          duration: 2000
        })
      }
    })
  } else {
    wx.hideLoading()
    wx.showToast({
      title: '文件较大，请稍后重试...',
      icon: 'none',
      duration: 2000
    })
  }
}

export default async function openDocument (url: string, gitHash: string) {
  console.log(`openDocument: ${url} [${gitHash}]`)
  const cacheFile = cache[gitHash]
  if (cacheFile) {
    // 有缓存
    const filePath = cacheFile.path
    if (await getFileHash(filePath)) {
      // 缓存文件已存在，且 hash 匹配，直接打开
      console.log('open cache file:', filePath)
      const fileType = url.substr(url.lastIndexOf('.') + 1)
      doOpenDocument(filePath, fileType as any)
    } else {
      await redownload(url, gitHash)
    }
  } else {
    await redownload(url, gitHash)
  }
}


