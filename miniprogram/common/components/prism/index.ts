import hightlight from '../../lib/prism/index'

const PAGE_SIZE = 48

function debounce (this: any, func: Function, wait: number) {
  let timer = 0
  return function (this: any) {
    const context = this
    const args = arguments
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(context,args)
    }, wait)
  }
}

// 增量加载
// const renderNecessary = debounce(function (vm: any) {
//   vm.data.query.exec(() => {
//     const start = vm.data.firstVisibleLineNo
//     const end = Math.min(4096, start + 64)
//     if (end > vm.data.codeRows.length) {
//       vm.setData({
//         rawText: '',
//         codeRows: vm.data.codeRowsCache.slice(0, end)
//       })
//     }
//   })
// }, 300) as (vm: any) => void

// 可视化区域加载
const renderNecessary = debounce(function (vm: any) {
  vm.data.query.exec(() => {
    const currentStart = vm.data.currentStart
    const currentEnd = vm.data.currentEnd

    const pre = PAGE_SIZE / 2
    const post = PAGE_SIZE / 2
    const current = vm.data.firstVisibleLineNo
    const visibleStart = Math.max(0, current - pre)
    const visibleEnd = current + PAGE_SIZE + post

    if ((visibleStart < currentStart) || (visibleEnd > currentEnd)) {
      if (currentStart - visibleStart > pre || visibleEnd - currentEnd > post) {
        wx.showLoading({
          title: '加载中'
        })
      }
      // 前后各多渲染一页
      vm.data.currentStart = Math.max(0, visibleStart - PAGE_SIZE)
      vm.data.currentEnd = Math.min(6400, visibleEnd + PAGE_SIZE)
      console.log(`render part: ${vm.data.currentStart}-${vm.data.currentEnd}`)
      vm.data.maxRenderLineNo = Math.max(vm.data.maxRenderLineNo, vm.data.currentEnd)
      const codeRows = vm.data.codeRowsCache.slice(0, vm.data.maxRenderLineNo).map((row: any, index: number) => {
        if (index < vm.data.currentStart || index > vm.data.currentEnd) {
          return [row[0]]
        } else {
          return row
        }
      })
      vm.setData({
        rawText: '',
        codeRows
      })
      setTimeout(() => {
        wx.hideLoading()
      }, 300)
    }
  })
}, 150) as (vm: any) => void

Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    code: {
      type: String,
      value: ''
    },
    language: {
      type: String,
      value: ''
    },
    height: {
      type: String,
      value: '100%'
    }
  },
  data: {
    currentStart: 0,
    currentEnd: PAGE_SIZE * 2,
    firstVisibleLineNo: 0,
    maxRenderLineNo: 0,
    codeRowsCache: [],
    codeRows: [],
    rawText: ''
  },
  observers: {
    'code, language' (code: string, language: string) {
      console.log('rerender code ...')
      try {
        const codeRowsCache = hightlight(code, language)
        this.data.codeRowsCache = codeRowsCache
        this.setData({
          rawText: '',
          codeRows: codeRowsCache.slice(0, PAGE_SIZE * 2) // 仅渲染前 2 页
        })
      } catch (e) {
        this.setData({
          rawText: this.data.code,
          codeRows: []
        })
      }
    }
  },
  lifetimes: {
    ready () {
      let query = wx.createSelectorQuery().in(this)
      // 单次查询基准滚动条 top
      query.select('.code-scroll-view').boundingClientRect((rect) => {
        this.data.baseTop = rect.top
      }).exec()

      // 计算可见行号
      query = wx.createSelectorQuery().in(this)
      query.selectAll('.line-num').boundingClientRect((items: any) => {
        let index = 0
        for (let item of items) {
          if (item.bottom > this.data.baseTop) {
            this.data.firstVisibleLineNo = index
            break
          }
          index++
        }
      })
      this.data.query = query
    }
  },
  methods: {
    onScroll () {
      if (this.data.codeRows.length > 0) renderNecessary(this)
    }
  }
})
