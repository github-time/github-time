import CacheMagager, { CacheOptions } from './CacheMagager'
import LocalDataStorage from './data-storage/LocalDataStorage'

const cacheMagager = new CacheMagager({
  storage: new LocalDataStorage('rc')
})

// 执行垃圾回收
cacheMagager.gc()

// 打印缓存报告
const report = cacheMagager.report()
for (let key in report.groups) {
  console.log(`group ${key}: ${(report.groups[key] / 1024).toFixed(2)} K`)
}
console.log(`totalSize: ${(report.totalSize / 1024 / 1024).toFixed(2)} M`)

export default function requestWithCache (req: wx.RequestOption, opts: CacheOptions) {
  const key = req.url
  const cacheData = cacheMagager.get(key, { group: opts.group })
  if (cacheData) {
    // 缓存命中
    req.success!(cacheData)
    return
  }

  // 发送请求
  console.log(`wx.request: ${req.url}`)
  wx.request({
    url: req.url,
    header: req.header,
    success(res) {
      console.log(`wx.request success:`, res)
      if (res.statusCode === 200) {
        // 请求成功，缓存数据
        cacheMagager.put(key, JSON.stringify(res), { group: opts.group, timeout: opts.timeout })
      }
      req.success!(res)
    },
    fail (res) {
      console.log(`wx.request failed:`, res)
      req.success!({statusCode: 500, header: {}, data: res.errMsg })
    }
  })
}

