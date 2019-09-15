//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'

//获取应用实例
import { IMyApp } from '../../app'
const app = getApp<IMyApp>()

Page({
  data: {
    githubConfig: {} as any,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    current: 'repos',
    tabs: [
      {
        key: 'repos',
        title: '我的仓库'
      },
      // {
      //   key: 'activity',
      //   title: '动态'
      // },
      {
        key: 'footprint',
        title: '足迹'
      },
      // {
      //   key: 'issues',
      //   title: 'Issues'
      // },
      // {
      //   key: 'message',
      //   title: '留言'
      // }
    ],
    query: {},
    async getUserRepos (query: any, pageSize: number, pageNo: number) {
      const result = await github.getUserRepositories({
        owner: query.owner,
        pageSize,
        pageNo
      })
      // await new Promise((resolve) => {setTimeout(resolve, 2000)})
      return result
    }
  },
  onLoad() {
    if (app.globalData.userInfo) {
      this.setData!({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = (res: any) => {
        this.setData!({
          userInfo: { ...this.data.userInfo, ...res.userInfo },
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData!({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    this.setData!({userInfo: this.data.userInfo})
    this.loadUserRepos()
  },
  onShow(this: any) {
    const tabBar = this.getTabBar()
    if (tabBar) tabBar.init()
    if (app.settings.isGithubUserChanged(this)) {
      this.loadUserRepos()
    }
  },

  getUserInfo (e: any) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData!({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  onTabsChange(e: any) {
    const { key } = e.detail
    const index = this.data.tabs.map((n) => n.key).indexOf(key)

    this.setData!({
      current: key,
      index,
    })
  },
  onSwiperChange(e: any) {
    const { current: index, source } = e.detail
    const { key } = this.data.tabs[index]

    if (!!source) {
      this.setData!({
        current: key,
        index,
      })
    }
  },
  showAd () {
    let rewardedVideoAd: any
    // @ts-ignore
    if(wx.createRewardedVideoAd){
      // @ts-ignore
      rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: '' })
      rewardedVideoAd.onLoad(() => {
        console.log('onLoad event emit')
        rewardedVideoAd.show();
      })
      rewardedVideoAd.onError((err: any) => {
        console.log('onError event emit', err)
      })
      rewardedVideoAd.onClose((res: any) => {
        console.log('onClose event emit', res)
        if (res && res.isEnded) {
          console.log('正常播放结束', res)
        } else {
          console.log('播放中途退出')
        }
      })
    }
  },
  showQrcode () {
    const zanCodeUrl = app.globalData.zanCodeUrl
    wx.previewImage({
      urls: [zanCodeUrl],
      current: zanCodeUrl
    })
  },
  showThanks () {
    wx.navigateTo({
      url: '/pages/thanks/index'
    })
  },
  showLogs () {
    wx.navigateTo({
      url: '/pages/logs/index'
    })
  },
  showSettings () {
    wx.navigateTo({
      url: '/pages/settings/index'
    })
  },

  async loadUserRepos () {
    const githubConfig = this.data.githubConfig =  app.settings.get('githubConfig', {})
    const owner = githubConfig.user
    if (owner) {
      wx.showLoading({
        title: '正在加载'
      })
      this.setData!({
        query: { owner },
        githubConfig
      })
      wx.hideLoading()
    } else {
      this.setData!({
        githubConfig
      })
    }
  }
})
