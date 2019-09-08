//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'
import { IMyApp } from '../../app'

//获取应用实例
const app = getApp<IMyApp>()

const SINCE_MAP = {
  daily: '日',
  weekly: '周',
  monthly: '月'
}

Page({
  data: {
    current: 'repos',
    tabs: [
      {
        key: 'repos',
        title: '仓库'
      },
      {
        key: 'developers',
        title: '开发者'
      }
    ],
    buttons: [
      {
        label: '每月',
        icon: 'calendar',
        type: 'since',
        value: 'monthly'
      },
      {
        label: '，每周',
        icon: 'time',
        type: 'since',
        value: 'weekly'
      },
      {
        label: '每日',
        icon: 'countdown',
        type: 'since',
        value: 'daily'
      },
      {
        type: 'language',
        label: '语言',
        icon: 'read',
      }
    ],

    since: 'daily',
    language: '',
    repoList: [] as github.repos.SearchResultItem[]
  },

  async loadReposTrending ({ since = 'daily', language = '' } : { since?: 'daily' | 'weekly' | 'monthly', language?: string } = {}) {
    this.data.since = since
    this.data.language = language
    this.setData!({ repoList: [null] })

    wx.showLoading({
      title: `显示${SINCE_MAP[since]}趋势`
    })
    const t = new Date().getTime()
    const data = (await github.getGithubTrending({ since, language })).map((item) => {
      return {
        name: item.name,
        full_name: `${item.author}/${item.name}`,
        description: item.description,
        language: item.language,
        currentPeriodStars: item.currentPeriodStars,
        stargazers_count: item.stars,
        forks_count: item.forks,
        owner: {
          avatar_url: item.avatar
        }
      }
    })
    setTimeout(wx.hideLoading, 1000 - new Date().getTime() + t)
    // await new Promise((resolve) => { setTimeout(resolve, 1000) })
    this.setData!({ repoList: data })
  },

  onLoad() {
    this.loadReposTrending()
  },

  onRepoListItemClick (e: any) {
    app.globalData.repoDetail = e.currentTarget.dataset.detail
    wx.navigateTo({
      url: '../repo-detail/index'
    })
  },

  onTabsChange(e: any) {
    const { key } = e.detail
    const index = this.data.tabs.map((n) => n.key).indexOf(key)

    this.setData!({
        key,
        index,
    })
  },

  onSwiperChange(e: any) {
    const { current: index, source } = e.detail
    const { key } = this.data.tabs[index]

    if (!!source) {
      this.setData!({
        key,
        index,
      })
    }
  },

  onActionClick (e: any) {
    if (e.detail.value.type === 'since') {
      this.loadReposTrending({since: e.detail.value.value})
    }
  }

})
