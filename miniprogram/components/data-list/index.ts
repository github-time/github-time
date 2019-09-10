//index.js
//获取应用实例
import { IMyApp } from '../../app'
// import * as Identicon from 'identicon.js'
// import md5 = require('blueimp-md5')

// const options = {
//   margin: 0.2,                              // 20% margin
//   size: 48,                                // 420px square
//   format: 'png'                             // use SVG instead of PNG
// }

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
      observer (this: any, val: any) {
        if (val && val.status === 'done') {
          // val.data.forEach((element: any) => {
          //   if (element.owner.avatar_url) {
          //     const hash = md5(element.owner.avatar_url)
          //     // @ts-ignore
          //     element.owner.avatar_placeholder = `data:image/png;base64,${new Identicon(hash, options).toString()}`
          //   }
          // })
          this.setData!({
            // list: val,
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
