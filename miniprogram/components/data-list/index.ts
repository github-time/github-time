//index.js
//获取应用实例
// import * as Identicon from 'identicon.js'
// import md5 = require('blueimp-md5')

// const options = {
//   margin: 0.2,                              // 20% margin
//   size: 48,                                // 420px square
//   format: 'png'                             // use SVG instead of PNG
// }

Component({
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  properties: {
    hidden: {
      type: Boolean,
      value: false
    },
    itemTemplate: {
      type: String,
      value: 'repo'
    },
    autoLoad: {
      type: Boolean,
      value: false,
      observer (this: any, val) {
        if (val) {
          this.reloadData()
        }
      }
    },
    showLoadMore: {
      type: Boolean,
      value: false
    },
    autoLoadMore: {
      type: Boolean,
      value: false
    },
    key: {
      type: String,
      value: 'id'
    },
    query: {
      type: Object,
      value: {},
      observer (this: any) {
        if (!this.data.autoLoad) return
        this.reloadData()
      }
    },
    pageSize: {
      type: Number,
      value: 5
    },
    fetchData: {
      type: Function,
      value: () => []
    }
  },
  data: {
    toQueryPageNo: 1,
    list: [],
    status: 'init',
    reloadBusy: false,
    loadMoreBusy: false
  },
  lifetimes: {
    async attached () {
      if (this.data.autoLoad) {
        // @ts-ignore
        this.reloadData()
      }
    }
  },
  methods: {
    onItemClick (e: any) {
      this.triggerEvent('itemclick', {
        item: e.currentTarget.dataset.detail,
        type: e.mark.type
      })
    },
    onScrollEnd () {
      if (this.data.autoLoadMore) {
        // @ts-ignore
        this.onLoadMoreClick()
      }
    },
    onLoadMoreClick () {
      if (this.data.status !== 'no-data' && this.data.status !== 'loading') {
        // 设置为加载中状态
        this.setData({
          status: 'loading',
        })
        this.triggerEvent(this.data.status === 'error' ? 'retry' : 'loadmore')
        // @ts-ignore
        this.loadMoreData()
      }
    },
    async reloadData () {
      if (this.data.reloadBusy || !this.data.query) return
      this.data.reloadBusy = true
      this.setData({
        status: 'loading',
        toQueryPageNo: 1,
        list: [],
      })
      this.triggerEvent('reload')
      // @ts-ignore
      await this.loadMoreData()
      this.data.reloadBusy = false
    },
    async loadMoreData () {
      if (this.data.loadMoreBusy) return
      this.data.loadMoreBusy = true
      const result = await this.data.fetchData(this.data.query, this.data.pageSize, this.data.toQueryPageNo)
      if (result.status === 'done') {
        this.triggerEvent('dataload', result)
        if (result.data.length < this.data.pageSize) {
          // 返回数据不足一页
          result.status = 'no-data'
        } else {
          this.data.toQueryPageNo++
        }
      }
      this.setData({
        status: result.status,
        list: this.data.list.concat(result.data)
      })
      this.data.loadMoreBusy = false
    }
  }
})
