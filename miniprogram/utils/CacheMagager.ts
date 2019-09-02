import DataStorage from './data-storage/DataStorage'

type GroupData = {
  n: number
  i: number
  e: number
  k: { [key: string]: number }
}

type CacheMagagerOptions = {
  storage: DataStorage
  gcThrottle?: number
}

export type CacheOptions = {
  group?: string
  timeout?: number
}

export default class CacheMagager {
  private storage: DataStorage
  private groupIndexKey: string
  private groupIndex: number
  private nextGc = new Date().getTime()
  private gcThrottle: number

  constructor ({ storage, gcThrottle = 1 }: CacheMagagerOptions) {
    this.gcThrottle = gcThrottle * 1000 * 60
    this.storage = storage
    this.groupIndexKey = `gi`
    this.groupIndex = parseInt(storage.get(this.groupIndexKey)) || 0
  }

  private getGroupData (options: CacheOptions): GroupData | null {
    const storage = this.storage
    const groupKey = `g.${options.group}`
    try {
      // 尝试从存储中恢复
      return JSON.parse(storage.get(groupKey))
    } catch (e) {}
    return null
  }

  get (key: string, options: CacheOptions) {
    const storage = this.storage
    const groupData = this.getGroupData(options)
    if (groupData) {
      try {
        const cacheData = JSON.parse(storage.get(`${groupData.e}.${groupData.n}.${groupData.k[key]}`) || 'null')
        if (cacheData) {
          // 缓存命中
          console.log(`use cache: ${options.group}:${key}`)
          return cacheData
        }
      } catch (e) {
        console.warn('parse cache data failed: ', e)
      }
    }
    return null
  }

  put (key: string, value: string, options: CacheOptions) {
    const storage = this.storage
    const now = new Date().getTime()
    const groupKey = `g.${options.group}`
    let groupData = this.getGroupData(options)
    if (groupData === null || (now > groupData.e)) {
      // 没有缓存组，或缓存组过期，重置缓存数据
      this.groupIndex = (this.groupIndex + 1) % 10000
      groupData = {
        n: this.groupIndex,
        e: now + (options.timeout || 1) * 1000 * 60, // 默认过期时间为 1 分钟
        k: {},
        i: 0
      }
      storage.set(this.groupIndexKey, this.groupIndex + '')
    }
    groupData.i++
    groupData.k[key] = groupData.i
    // 更新缓存组数据索引
    storage.set(groupKey, JSON.stringify(groupData))
    // 写入缓存组数据内容
    storage.set(`${groupData.e}.${groupData.n}.${groupData.i}`, value)

    this.gc()
  }

  gc () {
    const now = new Date().getTime()
    if (now > this.nextGc) {
      this.nextGc += this.gcThrottle
      this.storage.keys().forEach(key => {
        const expire = parseInt(key.split('.')[0])
        if (expire > 0) {
          if (now > expire) {
            // 过期缓存
            console.log(`gc cache key==> ${key}`)
            this.storage.remove(key)
          }
        }
      })
    }
  }
}
