import CacheMagager, { CacheOptions } from './CacheMagager'
import LocalDataStorage from './data-storage/LocalDataStorage'

const PREFIX = 'cc'

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

export default function (params: ICloud.CallFunctionParam, opts: CacheOptions) {
  const key = opts.key || (params.name + JSON.stringify(params.data))
  const cacheData = cacheMagager.get(key, { group: opts.group })
  if (cacheData) {
    // 缓存命中
    params.success!(cacheData)
    return
  }

  // 发送请求
  console.log(`wx.cloud.callFunction: ${params.name} ${JSON.stringify(params.data)}`)
  wx.cloud.callFunction({
    // 云函数名称
    name: params.name,
    // 传给云函数的参数
    data: params.data,
    success: function (res: any) {
      console.log(`wx.cloud.callFunction success:`, res)
      if (res.errMsg === 'cloud.callFunction:ok') {
        // 请求成功，缓存数据
        cacheMagager.put(key, JSON.stringify(res), { group: opts.group, timeout: opts.timeout })
      }
      params.success!(res)
    },
    fail: console.error
  })
}

