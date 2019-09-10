//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'

//获取应用实例
import { IMyApp } from '../../app'
const app = getApp<IMyApp>()

type RepoList = {
  status: string,
  data: github.repos.SearchResultItem[]
}

Page({
  data: {
    githubConfig: {} as any,
    currentTab: 'recommend',
    owner: '',
    keyword: '',
    queriedPageNo: 0,
    pageSize: 10,
    repoList: {
      status: 'init'
    } as RepoList,
    showFilterView: false
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
  async loadUserStaring () {
    const githubConfig = this.data.githubConfig = app.settings.get('githubConfig', {})
    const owner = githubConfig.user
    if (owner) {
      this.setData!({
        githubConfig,
        repoList: { status: 'loading' },
        owner
      })
      this.data.queriedPageNo = 0
      const result = await github.getUserStaring({
        owner: owner,
        pageSize: this.data.pageSize
      })
      this.setData!({ repoList: result })
    } else {
      this.setData!({
        githubConfig,
        repoList: { status: 'done', data: [] }
      })
    }
  },
  async onLoadMore () {
    const toQueryPageNo = Math.floor(this.data.repoList.data.length / this.data.pageSize) + 1
    if (this.data.queriedPageNo < toQueryPageNo) {
      const result = await github.getUserStaring({
        owner: this.data.owner,
        pageSize: this.data.pageSize,
        pageNo: toQueryPageNo
      })
      this.setData!({
        repoList: {
          status: result.status,
          data: this.data!.repoList.data.concat(result.data!)
        }
      })
    }
  },
})
