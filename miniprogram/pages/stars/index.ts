//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'

//获取应用实例
import { IMyApp } from '../../app'
const app = getApp<IMyApp>()

Page({
  data: {
    cache_date: undefined,
    githubConfig: {} as any,
    currentTab: 'recommend',
    owner: '',
    keyword: '',
    showFilterView: false,
    query: {},
    async getUserStarsRepos (query: any, pageSize: number, pageNo: number) {
      const result = await github.getUserStaring({
        owner: query.owner,
        pageSize,
        pageNo,
      })
      // await new Promise((resolve) => {setTimeout(resolve, 2000)})
      return result
    }
  },
  onLoad() {
    this.loadUserStaring()
  },
  onShow(this: any) {
    const tabBar = this.getTabBar()
    if (tabBar) tabBar.init()
    if (app.settings.isGithubUserChanged(this)) {
      this.loadUserStaring()
    }
  },
  onStarRepoClick (e: any) {
    app.globalData.repoDetail = e.detail.item
    app.globalData.ownerDetail = e.detail.item.owner
    wx.navigateTo({
      url: e.detail.type === 'owner'
        ? '/pages/owner-detail/index'
        : '/pages/repo-detail/index'
    })
  },
  onToggleFilter() {
    this.setData!({
      showFilterView: !this.data.showFilterView
    })
  },
  onFilter () {

  },
  onCancel () {
    this.setData!({
      showFilterView: false
    })
  },
  onGotoSettings () {
    wx.navigateTo({
      url: '/pages/settings/index'
    })
  },
  onDataLoad (e: any) {
    this.setData!({
      cache_date: e.detail.cache_date
    })
  },
  async loadUserStaring () {
    const githubConfig = this.data.githubConfig = app.settings.get('githubConfig', {})
    const owner = githubConfig.user
    if (owner) {
      this.setData!({
        githubConfig,
        query: {
          owner
        }
      })
    } else {
      this.setData!({
        githubConfig
      })
    }
  }
})
