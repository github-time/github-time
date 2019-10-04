import CacheMagager, { CacheOptions, CacheInfo } from './CacheMagager'
import LocalDataStorage from '../data-storage/LocalDataStorage'

const PREFIX = 'rc'

const cacheMagager = new CacheMagager({
  storage: new LocalDataStorage(PREFIX)
})

// 执行垃圾回收
cacheMagager.gc()

// 打印缓存报告
const report = cacheMagager.report()
for (let key in report.groups) {
  console.log(`${PREFIX} group ${key}: ${(report.groups[key] / 1024).toFixed(2)} K`)
}
console.log(`${PREFIX} totalSize: ${(report.totalSize / 1024 / 1024).toFixed(2)} M`)
type Result = Promise<wx.RequestSuccessCallbackResult>

const requestMap: { [key: string]: Result } = {}

export const cache = cacheMagager

export default function (req: wx.RequestOption, opts: CacheOptions|false, { successCode = 200, retry = 1, retryWait = 1000} = {}): Result {
  const requestKey = JSON.stringify(req)
  const requesting = requestMap[requestKey]
  if (requesting) return requesting

  const promise = requestMap[requestKey] = new Promise<wx.RequestSuccessCallbackResult>((resolve) => {
    let key: string
    if (opts !== false) {
      key = opts.key || req.url
      if (opts.discard && opts.group) {
        cacheMagager.clear(opts.group)
      }
      const cacheData = cacheMagager.get(key, { group: opts.group })
      if (cacheData) {
        // 缓存命中
        resolve(cacheData)
        return
      }
    }

    let n = 0
    const doRequest = () => {
      // 发送请求
      console.log(`wx.request(${req.method || 'GET'}): ${req.url}`)
      wx.request({
        url: req.url,
        header: req.header,
        method: req.method,
        success(res) {
          console.log(`wx.request(${req.method || 'GET'}) success:`, res)
          let cacheInfo = {} as CacheInfo
          if (res.statusCode === successCode && opts !== false) {
            // 请求成功，缓存数据
            const groupInfo = cacheMagager.put(key, JSON.stringify(res), {
              group: opts.group,
              timeout: opts.timeout,
              maxsize: opts.maxsize
            })
            if (groupInfo) {
              cacheInfo.cache_date = groupInfo.c
            }
          }
          resolve({
            ...cacheInfo,
            ...res
          })
        },
        fail (res) {
          if (n++ < retry) {
            console.log(`wx.request failed retry ${n}`)
            setTimeout(doRequest, retryWait)
            // 请求超时
          } else {
            console.log(`wx.request failed:`, res)
            resolve({ statusCode: 500, header: {}, data: res.errMsg })
          }
        }
      })
    }
    doRequest()
  }).then((res) => {
    delete requestMap[requestKey]
    return res
  }).catch((error) => {
    delete requestMap[requestKey]
    return { statusCode: 500, header: {}, data: error.errMsg }
  })

  return promise
}

