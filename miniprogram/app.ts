//app.ts
import settings from './utils/settings'

type Signal = {
  timestamp: number
  event: string
  data: any
}

export interface IMyApp {
  userInfoReadyCallback?(res: wx.UserInfo): void
  settings: typeof settings
  globalData: {
    StatusBar: number
    CustomBar: number
    Custom: wx.Rect
    zanCodeUrl: string
    ownerDetail?: github.repos.OwnerInfo
    repoDetail?: github.repos.SearchResultItem
    userInfo?: wx.UserInfo
    signal?: Signal
  }
}

App<IMyApp>({
  onLaunch() {
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        let custom = wx.getMenuButtonBoundingClientRect();
        this.globalData.Custom = custom;
        this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
      }
    })

    if (wx.cloud) {
      wx.cloud.init({
        traceUser: true
      })
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: (res: any) => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  settings,
  globalData: {
    StatusBar: 0,
    CustomBar: 0,
    Custom: {} as wx.Rect,
    zanCodeUrl: 'https://6769-github-time-mp-1300157824.tcb.qcloud.la/common/images/github-time-zancode.jpeg?sign=af482ff2a4fe00cc50d7812b1b27d752&t=1567909481'
  }
})
