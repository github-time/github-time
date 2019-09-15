//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'

//获取应用实例
// import { IMyApp } from '../../app'
// const app = getApp<IMyApp>()

Page({
  data: {
    currentTab: 'recommend',
    keyword: '',
    showFilterView: false,
    filters: {},
    query: {
      query: 'stars:>50000'
    },
    async searchRepos (query: any, pageSize: number, pageNo: number) {
      const result = await github.searchRepositories({
        query: query.query,
        pageSize,
        pageNo
      })
      await new Promise((resolve) => { setTimeout(resolve, 1000)})
      return {
        status: result.status,
        data: result.data.items
      }
    }
  },
  onShow(this: any) {
    const tabBar = this.getTabBar()
    if (tabBar) tabBar.init()
  },
  onToggleFilter() {
    this.setData!({
      showFilterView: !this.data.showFilterView
    })
  },
  onSearchBarFocus () {
    this.setData!({
      showFilterView: true
    })
  },
  onKeywordChange (e: any) {
    this.setData!({
      keyword: e.detail.value
    })
  },
  onKeywordClear () {
    this.setData!({
      keyword: ''
    })
  },
  onSearchCancel () {
    this.setData!({
      showFilterView: false
    })
  },
  makeQueryString (keyword: string, filters: any) {
    let query = ''

    // keyword 筛选
    if (keyword) {
      query += keyword
    }

    // Star 筛选
    const starMin = filters.star.min.enable ? filters.star.min.value : -1
    const starMax = filters.star.max.enable ? filters.star.max.value : -1
    if (starMin > 0 && starMax > 0) {
      query += `+stars:${Math.min(starMin, starMax)}..${Math.max(starMin, starMax)}`
    } else if (starMin > 0) {
      query += `+stars:>${starMin}`
    } else if (starMax > 0) {
      query += `+stars:<${starMax}`
    }

    // Fork筛选
    const forkMin = filters.fork.min.enable ? filters.fork.min.value : -1
    const forkMax = filters.fork.max.enable ? filters.fork.max.value : -1
    if (forkMin > 0 && forkMax > 0) {
      query += `+forks:${Math.min(forkMin, forkMax)}..${Math.max(forkMin, forkMax)}`
    } else if (forkMin > 0) {
      query += `+forks:>${forkMin}`
    } else if (forkMax > 0) {
      query += `+forks:<${forkMax}`
    }

    // 编程语言筛选
    for (let language of filters.languages) {
      query += `+language:${language}`
    }
    // 最新提交筛选
    if (filters.lastUpdateTime) {
      query += `+pushed:>${filters.lastUpdateTime}`
    }
    query = query.replace(/^\+/, '')

    console.log('query string: ', query)
    return query
  },
  onFilter (e: any) {
    this.setData!({
      showFilterView: false
    })
    this.data.filters = e.detail
    this.setData!({
      query: {
        query: this.makeQueryString(this.data.keyword, this.data.filters)
      }
    })
  }
})
