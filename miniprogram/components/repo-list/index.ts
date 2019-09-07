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
    repoList: {
      type: Array,
      value: []
    }
  },
  methods: {
    onRepoListItemClick (e: any) {
      app.globalData.repoDetail = e.currentTarget.dataset.detail
      wx.navigateTo({
        url: '../repo-detail/index'
      })
    },
    onOwnerIconClick (e: any) {
      app.globalData.ownerDetail = e.currentTarget.dataset.detail
      wx.navigateTo({
        url: '../owner-detail/index'
      })
    },
    onScrollToLower (e) {
      this.triggerEvent('scrolltolower', e)
    }
  }
})
