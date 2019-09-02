import DataStorage from './DataStorage'

export default class LocalDataStorage implements DataStorage {
  constructor (private PREFIX: string) {}

  set (key: string, val: string) {
    wx.setStorageSync(`${this.PREFIX}.${key}`, val)
  }

  get (key: string) {
    return wx.getStorageSync(`${this.PREFIX}.${key}`)
  }

  remove (key: string) {
    wx.removeStorageSync(`${this.PREFIX}.${key}`)
  }

  keys () {
    const FULL_PREFIX = this.PREFIX + '.'
    const nPREFIX = FULL_PREFIX.length
    return wx.getStorageInfoSync().keys
      .filter(item => {
        return item.startsWith(FULL_PREFIX)
      })
      .map(item => {
        return item.substr(nPREFIX)
      })
  }

  print () {
    console.info('MemDataStorage', wx.getStorageInfoSync())
  }
}
