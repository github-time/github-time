import CacheMagager, { CacheOptions, CacheInfo } from './CacheMagager'
import LocalDataStorage from '../data-storage/LocalDataStorage'

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

export type CallResult = {
  errMsg: string
  result: any
}
type Result = Promise<CallResult>
const callMap: { [key: string]: Result } = {}

export const cache = cacheMagager

export default function (params: ICloud.CallFunctionParam, opts: CacheOptions): Result {
  const callKey = JSON.stringify(params)
  const requesting = callMap[callKey]
  if (requesting) return requesting

  const promise = callMap[callKey] = new Promise<CallResult>((resolve) => {
    const retry = 1
    const key = opts.key || (params.name + JSON.stringify(params.data))
    if (opts.discard && opts.group) {
      cacheMagager.clear(opts.group)
    }
    const cacheData = cacheMagager.get(key, { group: opts.group })
    if (cacheData) {
      // 缓存命中
      resolve(cacheData)
      return
    }

    let n = 0
    const doCall = () => {
      // 发送请求
      console.log(`wx.cloud.callFunction: ${params.name} ${JSON.stringify(params.data)}`)
      wx.cloud.callFunction({
        // 云函数名称
        name: params.name,
        // 传给云函数的参数
        data: params.data,
        success: function (res: any) {
          console.log(`wx.cloud.callFunction success:`, res)
          let cacheInfo = {} as CacheInfo
          if (res.errMsg === 'cloud.callFunction:ok') {
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
        fail (e: any) {
          if (e.errCode === -404011 && n++ < retry) {
            console.log(`Call cloud function timeout retry ${n}`)
            setTimeout(doCall, 1000)
            // 请求超时
          } else {
            console.error('Call cloud function failed:', e)
            resolve({
              errMsg: e.errMsg,
              result: ''
            })
          }
        }
      })
    }
    doCall()
  }).then((res) => {
    delete callMap[callKey]
    return res
  }).catch((error) => {
    delete callMap[callKey]
    return { errMsg: error.errMsg, header: {}, result: '' }
  })

  return promise
}

