//index.js
import Page from '../../common/page/index'
import github from '../../utils/helper/githubApi'
import { IMyApp } from '../../app'

//获取应用实例
const app = getApp<IMyApp>()

const SINCE_MAP = {
  daily: '日',
  weekly: '周',
  monthly: '月'
}

type SinceKeys = keyof typeof SINCE_MAP

Page({
  data: {
    current: 'repos',
    index: 0,
    repoSinceDisplay: SINCE_MAP['daily'],
    userSinceDisplay: SINCE_MAP['daily'],
    tabs: [
      {
        key: 'repos',
        title: '仓库',
        icon: 'medal'
      },
      {
        key: 'developers',
        title: '开发者',
        icon: 'friendfamous'
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
    reposQuery: {
      since: 'daily' as SinceKeys,
      language: ''
    },
    usersQuery: {
      since: 'daily' as SinceKeys,
      language: ''
    },
    enableLoadTrendingUsers: false,
    async getTrendingRepos (query: any) {
      const result = await github.getGithubReposTrending({
        since: query.since,
        language: query.language,
        cleanCache: query.cleanCache
      })
      query.cleanCache = false
      // await sleep(2000)
      const data = result.data.map((item) => {
        return {
          name: item.name,
          full_name: `${item.author}/${item.name}`,
          description: item.description,
          language: item.language,
          currentPeriodStars: item.currentPeriodStars,
          stargazers_count: item.stars,
          forks_count: item.forks,
          owner: {
            avatar_url: item.avatar,
            login: item.author
          }
        }
      })
      return {
        status: result.status,
        data
      }
    },
    async getTrendingUsers (query: any) {
      const result = await github.getGithubUsersTrending({
        since: query.since,
        language: query.language,
        cleanCache: query.cleanCache
      })
      query.cleanCache = false
      // await sleep(2000)
      const data = result.data.map((user) => {
        user.repo = user.repo || {
          name: '',
          description: '',
          url: ''
        }
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
      return {
        status: result.status,
        data
      }
    }
  },

  onLoad() {
    // wx.getClipboardData({
    //   success (res) {
    //     const data = res.data || ''
    //     const matches = data.match(/^https:\/\/github\.com\/([^/]+\/[^/]+).*/)
    //     if (matches) {
    //       wx.navigateTo({
    //         url: `/pages/repo-detail/index?r=${matches[1]}`
    //       })
    //     }
    //   }
    // })
  },
  onShow(this: any) {
    const tabBar = this.getTabBar()
    if (tabBar) tabBar.init()
    const signal = app.globalData.signal
    if (signal && signal.event === 'select-code-language' && new Date().getTime() - signal.timestamp < 500) {
      signal.timestamp = 0
      if (this.data.current === 'repos') {
        this.setData({
          repoLanguageDisplay: signal.data.name
        })
        this.setData!({
          reposQuery: {
            since: this.data.reposQuery.since,
            language: signal.data.urlParam
          }
        })
      } else if (this.data.current === 'developers') {
        this.setData({
          userLanguageDisplay: signal.data.name
        })
        this.setData!({
          usersQuery: {
            since: this.data.usersQuery.since,
            language: signal.data.urlParam
          }
        })
      }
    }
  },

  onItemClick (e: any) {
    app.globalData.repoDetail = e.detail.item
    app.globalData.ownerDetail = e.detail.item.owner
    wx.navigateTo({
      url: e.detail.type === 'owner'
        ? '/pages/owner-detail/index'
        : '/pages/repo-detail/index'
    })
  },

  onTabsChange(e: any) {
    const { key } = e.detail
    const index = this.data.tabs.map((n: any) => n.key).indexOf(key)

    this.setData!({
        current: key,
        index,
    })

    if (key === 'developers') {
      this.setData!({enableLoadTrendingUsers: true})
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
      if (key === 'developers') {
        this.setData!({enableLoadTrendingUsers: true})
      }
    }
  },

  onActionClick (e: any) {
    if (e.detail.value.type === 'since') {
      if (this.data.current === 'repos') {
        this.setData!({
          repoSinceDisplay: SINCE_MAP[e.detail.value.value as SinceKeys],
          reposQuery: {
            since: e.detail.value.value,
            language: this.data.reposQuery.language
          }
        })
      } else if (this.data.current === 'developers') {
        this.setData!({
          userSinceDisplay: SINCE_MAP[e.detail.value.value as SinceKeys],
          usersQuery: {
            since: e.detail.value.value,
            language: this.data.usersQuery.language
          }
        })
      }
    } else if (e.detail.value.type === 'language') {
      wx.navigateTo({
        url: '/pages/language-selector/index'
      })
    }
  },

  onCacheSettingsClick () {
    if (this.data.current === 'repos') {
      this.setData!({
        reposQuery: {
          ...this.data.reposQuery,
          cleanCache: true
        }
      })
    } else if (this.data.current === 'developers') {
      this.setData!({
        usersQuery: {
          ...this.data.usersQuery,
          cleanCache: true
        }
      })
    }
  },
})
