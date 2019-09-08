//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'

//获取应用实例
// import { IMyApp } from '../../app'
// const app = getApp<IMyApp>()

Page({
  data: {
    owner: '',
    pageSize: 5,
    queriedPageNo: 0,
    current: 'repos',
    tabs: [
      {
        key: 'repos',
        title: '我的仓库'
      },
      {
        key: 'activity',
        title: '动态'
      },
      {
        key: 'footprint',
        title: '足迹'
      },
      {
        key: 'issues',
        title: 'Issues'
      },
      {
        key: 'message',
        title: '留言'
      }
    ],
    repoList: [] as github.repos.SearchResultItem[]
  },
  onLoad() {
    this.loadUserRepos('vaniship')
  },
  onTabsChange(e: any) {
    const { key } = e.detail
    const index = this.data.tabs.map((n) => n.key).indexOf(key)

    this.setData!({
        key,
        index,
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
    const zanCodeUrl = 'https://6769-github-time-mp-1300157824.tcb.qcloud.la/common/images/github-time-zancode.jpeg?sign=af482ff2a4fe00cc50d7812b1b27d752&t=1567909481'
    wx.previewImage({
      urls: [zanCodeUrl],
      current: zanCodeUrl
    })
  },

  async loadUserRepos (owner: string) {
    this.setData!({
      owner
    })

    if (!owner) return

    console.log('list user repos:', owner)
    this.data.queriedPageNo = 0
    wx.showLoading({
      title: '正在加载'
    })
    try {
      const repos = await github.getUserRepositories({
        owner,
        pageSize: this.data.pageSize
      })
      this.setData!({ repoList: repos })
    } catch (e) {

    }
    wx.hideLoading()
  },
  async onLoadMore () {
    const toQueryPageNo = Math.floor(this.data.repoList.length / this.data.pageSize) + 1
    if (this.data.queriedPageNo < toQueryPageNo) {
      try {
        const repos = await github.getUserRepositories({
          owner: this.data.owner,
          pageSize: this.data.pageSize,
          pageNo: toQueryPageNo
        })
        this.setData!({ repoList: this.data!.repoList.concat(repos) })
      } catch (e) {

      }
    }
  }
})
