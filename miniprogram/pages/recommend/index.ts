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
    index: 0,
    repoSince: 'daily',
    repoSinceDisplay: SINCE_MAP['daily'],
    repoLanguage: '',
    userSince: 'daily',
    userSinceDisplay: SINCE_MAP['daily'],
    userLanguage: '',
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

    repoList: [null] as github.trending.Repository[] | [null],
    userList: [null] as github.trending.Developer[] | [null]
  },

  async loadReposTrending ({ since = 'daily', language = '' } : { since?: 'daily' | 'weekly' | 'monthly', language?: string } = {}) {
    this.setData!({
      repoSince: since,
      repoSinceDisplay: SINCE_MAP[since],
      repoLanguage: language,
      repoList: [null]
    })

    wx.showLoading({
      title: `显示${SINCE_MAP[since]}趋势`
    })
    const t = new Date().getTime()
    const data = (await github.getGithubReposTrending({ since, language })).map((item) => {
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

  async loadUsersTrending ({ since = 'daily', language = '' } : { since?: 'daily' | 'weekly' | 'monthly', language?: string } = {}) {
    this.setData!({
      userSince: since,
      userSinceDisplay: SINCE_MAP[since],
      erLanguage: language,
      userList: [null]
     })

    wx.showLoading({
      title: `显示${SINCE_MAP[since]}趋势`
    })
    const t = new Date().getTime()
    const data = (await github.getGithubUsersTrending({ since, language })).map((user) => {
      return {
        name: user.repo.name,
        full_name: `${user.username}/${user.repo.name}`,
        description: user.repo.description,
        html_url: user.repo.url,
        owner: {
          name: user.name,
          login: user.username,
          avatar_url: user.avatar,
          type: user.type,
          html_url: user.url
        }
      }
    })
    setTimeout(wx.hideLoading, 1000 - new Date().getTime() + t)
    // await new Promise((resolve) => { setTimeout(resolve, 1000) })
    this.setData!({ userList: data })
  },

  onLoad() {
    this.loadReposTrending()
  },

  onShow(this: any) {
    this.getTabBar().init()
    const signal = app.globalData.signal
    if (signal && signal.event === 'select-code-language' && new Date().getTime() - signal.timestamp < 500) {
      signal.timestamp = 0
      if (this.data.current === 'repos') {
        this.setData({
          repoLanguageDisplay: signal.data.name
        })
        this.loadReposTrending({since: this.data.repoSince, language: signal.data.urlParam})
      } else if (this.data.current === 'developers') {
        this.setData({
          userLanguageDisplay: signal.data.name
        })
        this.loadUsersTrending({since: this.data.userSince, language: signal.data.urlParam})
      }
    }
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
        current: key,
        index,
    })

    if (key === 'developers' && this.data.userList[0] === null) {
      this.loadUsersTrending()
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
    }
  },

  onActionClick (e: any) {
    if (e.detail.value.type === 'since') {
      if (this.data.current === 'repos') {
        this.loadReposTrending({since: e.detail.value.value, language: this.data.repoLanguage})
      } else if (this.data.current === 'developers') {
        this.loadUsersTrending({since: e.detail.value.value, language: this.data.userLanguage})
      }
    } else if (e.detail.value.type === 'language') {
      wx.navigateTo({
        url: '/pages/language-selector/index'
      })
    }
  }

})
