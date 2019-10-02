import DateReadable from '../data-readable/DateReadable'

const makeDateReadable = DateReadable()

type Bookmark = {
  type: 'repo'|'owner'|'file',
  url: string
  timestamp?: number,
  meta: {
    title: string,
    [key: string]: string
  }
}

const bookmarks: Bookmark[] = (() => {
  try {
    return JSON.parse(wx.getStorageSync('bookmarks'))
  } catch (e) {
    return []
  }
})()

function getIndex (url: string) {
  return bookmarks.findIndex(item => item.url === url)
}

export default {
  get (url: string) {
    const index = getIndex(url)
    return ~index ? bookmarks[index] : undefined
  },

  add (bookmark: Bookmark) {
    if (getIndex(bookmark.url) === -1) {
      // 未添加的书签
      bookmark.timestamp = new Date().getTime()
      bookmarks.unshift(bookmark)
      wx.setStorageSync('bookmarks', JSON.stringify(bookmarks))
    }
  },

  remove (url: string) {
    const index = getIndex(url)
    if (~index) {
      bookmarks.splice(index, 1)
      wx.setStorageSync('bookmarks', JSON.stringify(bookmarks))
    }
  },

  getBookmarks ({type, pageSize, pageNo}: {type: string, pageSize: number, pageNo: number}) {
    const pos = pageSize * (pageNo - 1)
    const now = new Date().getTime()
    return bookmarks
      .filter((item) => !type || item.type === type)
      .slice(pos, pos + pageSize)
      .map((item) => {
        item = {...item}
        item.timestamp = makeDateReadable(now - item.timestamp!, item.timestamp) as any
        return item
      })
  }
}
