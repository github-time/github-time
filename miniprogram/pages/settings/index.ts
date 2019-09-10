//index.js
import Page from '../../common/page/index'
//获取应用实例
import { IMyApp } from '../../app'
const app = getApp<IMyApp>()

Page({
  data: {
    githubConfig: {} as any
  },
  onLoad () {

  },
  onShow () {
    this.setData!({
      githubConfig: app.settings.get('githubConfig', {})
    })
  },
  onSave () {
    app.settings.set('githubConfig', this.data.githubConfig)
    wx.navigateBack({
      delta: 1
    })
  },
  onGithubUserChange (e: any) {
    this.data.githubConfig.user = e.detail.value
  },
  onGithubTokenChange (e: any) {
    this.data.githubConfig.token = e.detail.value
  }
})
