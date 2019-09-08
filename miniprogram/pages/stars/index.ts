//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'

//获取应用实例
// import { IMyApp } from '../../app'
// const app = getApp<IMyApp>()

Page({
  data: {
    currentTab: 'recommend',
    owner: '',
    keyword: '',
    queriedPageNo: 0,
    pageSize: 10,
    repoList: [] as github.repos.SearchResultItem[],
    showFilterView: false
  },
  onLoad() {
    this.doSearch('vaniship')
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
  async doSearch (owner: string) {
    this.setData!({
      owner
    })
    this.data.queriedPageNo = 0
    wx.showLoading({
      title: '正在加载'
    })
    try {
      const searchResult = await github.getUserStaring({
        owner: owner,
        pageSize: this.data.pageSize
      })
      this.setData!({ repoList: searchResult })
    } catch (e) {

    }
    wx.hideLoading()
  },
  async onLoadMore () {
    const toQueryPageNo = Math.floor(this.data.repoList.length / this.data.pageSize) + 1
    if (this.data.queriedPageNo < toQueryPageNo) {
      try {
        const repos: github.repos.SearchResultItem = await github.getUserStaring({
          owner: this.data.owner,
          pageSize: this.data.pageSize,
          pageNo: toQueryPageNo
        })
        this.setData!({ repoList: this.data!.repoList.concat(repos) })
      } catch (e) {

      }
    }
  },
})
