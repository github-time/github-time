//index.js
//获取应用实例
import github from '../../utils/githubApi'

// import { IMyApp } from '../../app'
// const app = getApp<IMyApp>()

Page({
  data: {
    currentTab: 'recommend',
    keyword: '',
    queriedPageNo: 0,
    pageSize: 10,
    repoList: [] as github.repos.SearchResultItem[],
    showFilterView: !false
  },
  onLoad() {

  },
  onToggleFilter() {
    this.setData!({
      showFilterView: !this.data.showFilterView
    })
  },
  onFilter (e: any) {
    this.setData!({
      showFilterView: false
    })

    const filters = e.detail
    let search = ''

    // Star筛选
    const starMin = filters.star.min.enable ? filters.star.min.value : -1
    const starMax = filters.star.max.enable ? filters.star.max.value : -1
    if (starMin > 0 && starMax > 0) {
      search += `+stars:${Math.min(starMin, starMax)}..${Math.max(starMin, starMax)}`
    } else if (starMin > 0) {
      search += `+stars:>${starMin}`
    } else if (starMax > 0) {
      search += `+stars:<${starMax}`
    }

    // Fork筛选
    const forkMin = filters.fork.min.enable ? filters.fork.min.value : -1
    const forkMax = filters.fork.max.enable ? filters.fork.max.value : -1
    if (forkMin > 0 && forkMax > 0) {
      search += `+forks:${Math.min(forkMin, forkMax)}..${Math.max(forkMin, forkMax)}`
    } else if (forkMin > 0) {
      search += `+forks:>${forkMin}`
    } else if (forkMax > 0) {
      search += `+forks:<${forkMax}`
    }

    // 编程语言筛选
    for (let language of filters.languages) {
      search += `+language:${language}`
    }
    // 最新提交筛选
    if (filters.lastUpdateTime) {
      search += `+pushed:>${filters.lastUpdateTime}`
    }
    search = search.substr(1)

    console.log('search: ', search)

    this.doSearch(search)
  },
  onCancel () {
    this.setData!({
      showFilterView: false
    })
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
  }
})
