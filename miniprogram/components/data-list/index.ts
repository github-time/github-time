//index.js
//获取应用实例
import { IMyApp } from '../../app'

const app = getApp<IMyApp>()
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    hidden: {
      type: Boolean,
      value: false
    },
    list: {
      type: Object,
      value: {
        status: 'loading',
        data: []
      },
      observer (this: any, val: any[]) {
        if (val && val[0] !== null) {
          this.setData!({
            isLoading: false
          })
        }
      }
    },
    itemTemplate: {
      type: String,
      value: 'repo'
    },
    showLoadMore: {
      type: Boolean,
      value: false
    },
    autoLoadMore: {
      type: Boolean,
      value: false
    },
    isLoading: {
      type: Boolean,
      value: false
    },
  },
  methods: {
    onItemClick (e: any) {
      app.globalData.repoDetail = e.currentTarget.dataset.detail
      wx.navigateTo({
        url: '../repo-detail/index'
      })
    },
    onIconClick (e: any) {
      app.globalData.ownerDetail = e.currentTarget.dataset.detail
      wx.navigateTo({
        url: '../owner-detail/index'
      })
    },
    onScrollEnd (e) {
      if (this.data.autoLoadMore) {
        this.setData!({isLoading: true})
        this.triggerEvent('loadmore', e)
      }
    },
    onLoadMoreClick (e) {
      if (this.data.list.status === 'error') {
        this.setData!({isLoading: true})
        this.triggerEvent('retry', e)
      } else {
        this.setData!({isLoading: true})
        this.triggerEvent('loadmore', e)
      }
    }
  }
})
