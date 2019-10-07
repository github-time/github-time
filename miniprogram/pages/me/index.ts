//index.js
import Page from '../../common/page/index'
import github from '../../utils/helper/githubApi'
import footprints from '../../utils/data-manager/footprints'

//获取应用实例
import { IMyApp } from '../../app'
import bookmarks from '../../utils/data-manager/bookmarks'
const app = getApp<IMyApp>()
const githubConfig = app.settings.get('githubConfig', {})

Page({
  data: {
    githubConfig,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    current: 'repos',
    index: 0,
    tabs: [
      {
        key: 'repos',
        title: '仓库',
        icon: 'medal'
      },
      {
        key: 'activity',
        title: '动态',
        icon: 'activity'
      },
      {
        key: 'bookmark',
        title: '收藏',
        icon: 'favor'
      },
      {
        key: 'footprints',
        title: '足迹',
        icon: 'footprint'
      },
      // {
      //   key: 'issues',
      //   title: '问题',
      //   icon: 'question'
      // },
      // {
      //   key: 'message',
      //   title: '留言',
      //   icon: 'message'
      // }
    ],
    query: {
      owner: githubConfig.user
    },
    async getUserRepos (query: any, pageSize: number, pageNo: number) {
      const result = await github.getUserRepositories({
        owner: query.owner,
        pageSize,
        pageNo
      })
      // await sleep(2000)
      return result
    },
    enableLoadUserEvents: false,
    userEventQuery: {
      owner: githubConfig.user
    },
    async getUserEvents (query: any, pageSize: number, pageNo: number) {
      const result = await github.getUserEvents({
        owner: query.owner,
        pageSize,
        pageNo
      })
      // await sleep(2000)
      return result
    },
    footprintQuery: {},
    async getFootprints (query: any, pageSize: number, pageNo: number) {
      return {
        status: 'done',
        data: footprints.getFootprints({
          type: query.type,
          pageSize,
          pageNo
        })
      }
    },
    bookmarkQuery: {},
    async getBookmarks (query: any, pageSize: number, pageNo: number) {
      return {
        status: 'done',
        data: bookmarks.getBookmarks({
          type: query.type,
          pageSize,
          pageNo
        })
      }
    }
  },
  onShareAppMessage () {
    const user = this.data.githubConfig.user
    if (user) {
      return {
        title: 'Github Time',
        desc: `分享开发者: ${user}`,
        path: `/pages/owner-detail/index?o=${user}&s=true`
      }
    } else {
      return {
        title: 'Github Time',
        desc: 'Github 推荐',
        path: `/pages/recommend/index`
      }
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
  },
  onShow(this: any) {
    const tabBar = this.getTabBar()
    if (tabBar) tabBar.init()

    this.setData({
      footprintQuery: {},
      bookmarkQuery: {}
    })

    if (app.settings.isGithubUserChanged(this)) {
      this.refreshUserData()
    }
  },

  viewMoreUserRepos () {
    app.globalData.ownerDetail = { login: this.data.githubConfig.user } as any
    wx.navigateTo({
      url: '/pages/owner-detail/index'
    })
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
    if (key === 'activity') {
      this.setData!({ enableLoadUserEvents: true })
    }
  },
  onSwiperChange(e: any) {
    const { current: index, source } = e.detail
    const { key } = this.data.tabs[index]

    if (!!source) {
      this.setData!({
        current: key,
        index,
      })
      if (key === 'activity') {
        this.setData!({ enableLoadUserEvents: true })
      }
    }
  },
  onUserRepoClick (e: any) {
    app.globalData.repoDetail = e.detail.item
    app.globalData.ownerDetail = e.detail.item.owner
    wx.navigateTo({
      url: e.detail.type === 'owner'
        ? '/pages/owner-detail/index'
        : '/pages/repo-detail/index'
    })
  },
  onFootprintClick (e: any) {
    console.log('onFootprintClick', e.detail)
    wx.navigateTo({
      url: e.detail.item.url
    })
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

  async refreshUserData () {
    const githubConfig = app.settings.get('githubConfig', {})
    const owner = githubConfig.user
    this.setData!({
      githubConfig,
      ...(owner ? { query: { owner } } : {}),
      ...(owner ? { userEventQuery: { owner } } : {})
    })
  }
})
