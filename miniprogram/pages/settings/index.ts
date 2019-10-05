//index.js
import Page from '../../common/page/index'
import github from '../../utils/helper/githubApi'
import { sleep, wrapLoading } from '../../utils/common'
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
  async onSave () {
    if (this.data.githubConfig.token) {
      // 验证 Token
      await wrapLoading('正在验证令牌...', async () => {
        const result = await github.checkToken(this.data.githubConfig.token)

        if (result.status === 'done' && result.data.login) {
          // 更新用户名
          this.data.githubConfig.user = result.data.login
          this.setData!({
            githubConfig: this.data.githubConfig
          })
          wx.showToast({
            title: '令牌验证成功!',
            icon: 'success',
            duration: 1000
          })
        } else {
          wx.showToast({
            title: '令牌验证失败!',
            icon: 'none',
            duration: 1000
          })
        }
        await sleep(1000)
      })
    }

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
