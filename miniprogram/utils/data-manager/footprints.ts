import DateReadable from '../data-readable/DateReadable'

const makeDateReadable = DateReadable()

type Footprint = {
  type: 'repo'|'owner'|'file',
  url: string
  timestamp?: number,
  meta: {
    title: string,
    [key: string]: string
  }
}

const footprints: Footprint[] = (() => {
  try {
    return JSON.parse(wx.getStorageSync('footprints'))
  } catch (e) {
    return []
  }
})()

const MAX_SIZE = 100

export default {
  push (footprint: Footprint) {
    if (footprints.length === 0 || footprint.url !== footprints[0].url) {
      footprint.timestamp = new Date().getTime()
      footprints.unshift(footprint)
      if (footprints.length > MAX_SIZE) footprints.length = MAX_SIZE
      wx.setStorageSync('footprints', JSON.stringify(footprints))
    }
  },

  getFootprints ({type, pageSize, pageNo}: {type: string, pageSize: number, pageNo: number}) {
    const pos = pageSize * (pageNo - 1)
    const now = new Date().getTime()
    return footprints
      .filter((item) => !type || item.type === type)
      .slice(pos, pos + pageSize)
      .map((item) => {
        item = {...item}
        item.timestamp = makeDateReadable(now - item.timestamp!, item.timestamp) as any
        return item
      })
  }
}
