type Footprint = {
  type: 'repo'|'owner'|'file',
  url: string
  timestamp: number,
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

export default {
  push (footprint: Footprint) {
    if (footprints.length === 0 || footprint.url !== footprints[0].url) {
      footprints.unshift(footprint)
      if (footprints.length > 100) footprints.length = 100
      wx.setStorageSync('footprints', JSON.stringify(footprints))
    }
  },

  getFootprint ({type, pageSize, pageNo}: {type: string, pageSize: number, pageNo: number}) {
    const pos = pageSize * (pageNo - 1)
    return footprints
      .filter((item) => !type || item.type === type)
      .slice(pos, pos + pageSize)
      .map((item) => {
        item = {...item}
        let t = (new Date().getTime() - item.timestamp) / 1000
        let s = '秒'
        console.log('++++++', t)
        if (t > 60) {
          t = t / 60
          s = '分钟'
          if (t > 60) {
            t = t / 60
            s = '小时'
            if (t > 24) {
              t = t / 24
              s = '天'
              if (t > 31) {
                t = t / 31
                s = '月'
                if (t > 12) {
                  t = t / 12
                  s = '年'
                }
              }
            }
          }
        }
        item.timestamp = `${t.toFixed()}${s} 之前` as any
        return item
      })
  }
}
