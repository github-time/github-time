//index.js
//获取应用实例
import github from '../../utils/githubApi'
import { IMyApp } from '../../app'

const app = getApp<IMyApp>()
Page({
  data: {
    currentTab: 'recommend',
    keyword: '',
    queriedPageNo: 0,
    pageSize: 10,

    list: [{
      name: 'recommend',
      text: "推荐",
      // badge: 'New'
    },
    {
      name: 'trend',
      text: "趋势",
    },
    {
      name: 'categories',
      text: "分类",
    }],
    repoList: [] as github.repos.SearchResultItem[]
  },
  //事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onLoad() {
    // if (app.globalData.userInfo) {
    //   this.setData!({
    //     userInfo: app.globalData.userInfo,
    //     hasUserInfo: true,
    //   })
    // } else if (this.data.canIUse){
    //   // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //   // 所以此处加入 callback 以防止这种情况
    //   app.userInfoReadyCallback = (res) => {
    //     this.setData!({
    //       userInfo: res,
    //       hasUserInfo: true
    //     })
    //   }
    // } else {
    //   // 在没有 open-type=getUserInfo 版本的兼容处理
    //   wx.getUserInfo({
    //     success: res => {
    //       app.globalData.userInfo = res.userInfo
    //       this.setData!({
    //         userInfo: res.userInfo,
    //         hasUserInfo: true
    //       })
    //     }
    //   })
    // }

    this.doSearch('stars:>10000')

    ;(async () => {
      const res = await github.getAllTopics()
      console.log(res
        .sort((a, b) => {
          return a.name > b.name ? 1 : -1
        })
        .map(item => {
          return item.name
        })
      )
    })()
  },

  searchRepo(e: any) {
    this.doSearch(e.detail.value)
  },

  inputChange (e: any) {
    this.searchRepo(e)
  },

  async doSearch (keyword: string) {
    if (keyword === this.data.keyword) return

    this.setData!({
      keyword
    })
    if (!keyword) return
    console.log('do search:', keyword)
    this.data.queriedPageNo = 0
    wx.showLoading({
      title: '正在加载'
    })
    try {
      const searchResult = await github.searchRepositories({
        keyword,
        pageSize: this.data.pageSize
      })
      this.setData!({ repoList: searchResult.items })
    } catch (e) {

    }
    wx.hideLoading()
  },

  onRepoListItemClick (e: any) {
    app.globalData.repoDetail = e.currentTarget.dataset.detail
    wx.navigateTo({
      url: '../repo-detail/index'
    })
  },

  async lower () {
    const toQueryPageNo = Math.floor(this.data.repoList.length / this.data.pageSize) + 1
    if (this.data.queriedPageNo < toQueryPageNo) {
      try {
        const repos: github.repos.SearchResult = await github.searchRepositories({
          keyword: this.data.keyword,
          pageSize: this.data.pageSize,
          pageNo: toQueryPageNo
        })
        this.setData!({ repoList: this.data!.repoList.concat(repos.items) })
      } catch (e) {

      }
    }
  },

  getUserInfo(e: any) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData!({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  tabChange(e: any) {
    this.setData!({
      currentTab: e.detail.item.name
    })
  }
})
