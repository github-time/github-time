import DataStorage from '../data-storage/DataStorage'
import md5 = require('blueimp-md5')

type GroupData = {
  n: number // 缓存组 id
  c: number // 缓存创建时间
  e: number // 过期时间
  i: number // 缓存索引 id
  k: { [key: string]: number } // 缓存索引
}

type CacheMagagerOptions = {
  storage: DataStorage
  maxCacheItemSize?: number
  gcThrottle?: number
}

export type CacheOptions = {
  key?: string
  group?: string
  timeout?: number
  maxsize?: number
  discard?: boolean
}

export type CacheInfo = {
  cache_date: number
}

export default class CacheMagager {
  private storage: DataStorage
  private groupIndexKey: string
  private groupIndex: number
  private nextGc = new Date().getTime()
  private maxCacheItemSize: number
  private gcThrottle: number

  constructor ({ storage, maxCacheItemSize = 128 * 1024, gcThrottle = 1 }: CacheMagagerOptions) {
    this.gcThrottle = gcThrottle * 1000 * 60
    this.maxCacheItemSize = maxCacheItemSize
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
    key = md5(key)
    const storage = this.storage
    const groupData = this.getGroupData(options)
    if (groupData) {
      try {
        const cacheData = JSON.parse(storage.get(`${groupData.e}.${groupData.n}.${groupData.k[key]}`) || 'null')
        if (cacheData) {
          // 命中缓存数据
          console.log(`use cache: ${options.group}:${key}`)
          cacheData.cache_date = groupData.c
          return cacheData
        }
      } catch (e) {
        console.warn('parse cache data failed: ', e)
      }
    }
    return null
  }

  put (key: string, value: string, options: CacheOptions) {
    key = md5(key)
    const maxsize = options.maxsize || this.maxCacheItemSize
    if (value.length > maxsize) {
      console.log(`Data too big ${(value.length / 1024).toFixed(2)}K, limit=${(maxsize / 1024).toFixed(2)}K`, '')
      return null
    }
    const storage = this.storage
    const now = new Date().getTime()
    const groupKey = `g.${options.group}`
    let groupData = this.getGroupData(options)
    if (groupData === null || (now > groupData.e)) {
      // 没有缓存组，或缓存组过期，重置缓存数据
      this.groupIndex = (this.groupIndex + 1) % 10000
      groupData = {
        n: this.groupIndex,
        c: now,
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
    return groupData
  }

  report () {
    const storage = this.storage
    let totalSize = 0
    const groups: { [key: string]: number } = {}
    storage.keys().forEach(key => {
      if (key.startsWith('g.')) {
        // 缓存组
        const groupData = JSON.parse(storage.get(key)) as GroupData
        const group = key.substr(2)
        groups[group] = groups[group] || 0
        for (let k in groupData.k) {
          groups[group] += storage.get(`${groupData.e}.${groupData.n}.${groupData.k[k]}`).length
        }
      }
      totalSize += storage.get(key).length
    })
    return {
      totalSize,
      groups
    }
  }

  clear (group: string|undefined) {
    const storage = this.storage
    if (group) {
      const groupData = this.getGroupData({group})
      if (groupData) {
        for (let key in groupData.k) {
          // 清理引用数据
          storage.remove(`${groupData.e}.${groupData.n}.${groupData.k[key]}`)
        }
        // 清理组数据
        storage.remove(`g.${group}`)
      }
    } else {
      storage.keys().forEach(key => {
        storage.remove(key)
      })
    }
  }

  gc () {
    const now = new Date().getTime()
    if (now > this.nextGc) {
      const storage = this.storage
      this.nextGc += this.gcThrottle
      storage.keys().forEach(key => {
        const type = key.split('.')[0]
        let expire
        if (type === 'g') {
          // 缓存组
          expire = (JSON.parse(storage.get(key)) as GroupData).e
        } else {
          expire = parseInt(type)
        }
        if (expire > 0) {
          if (now > expire) {
            // 过期缓存
            console.log(`gc cache key==> ${key}`)
            storage.remove(key)
          }
        }
      })
    }
  }
}
