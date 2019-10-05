//index.js
import Page from '../../common/page/index'
import github from '../../utils/helper/githubApi'
//获取应用实例
import { IMyApp } from '../../app'

const app = getApp<IMyApp>()

Page({
  data: {
    ownerDetail: {
      id: undefined as undefined|number,
      login: 'vuejs'
    },
    current: 'repos',
    tabs: [
      {
        key: 'repos',
        title: 'Ta的仓库',
        icon: 'medal'
      },
      {
        key: 'activity',
        title: 'Ta的动态',
        icon: 'activity'
      }
    ],
    query: null,
    async getUserRepos (query: any, pageSize: number, pageNo: number) {
      const result = await github.getUserRepositories({
        owner: query.owner,
        pageSize,
        pageNo
      })
      // await sleep(2000)
      return result
    }
  },
  onShareAppMessage () {
    return {
      title: 'Github Time',
      desc: `分享开发者: ${this.data.ownerDetail.login}`,
      path: `/pages/owner-detail/index?o=${this.data.ownerDetail.login}&s=true`
    }
  },
  onLoad(options: any) {
    if (options.o) {
      // 外部指定开发者
      this.data.ownerDetail.login = options.o
      this.setData!({
        ownerDetail: this.data.ownerDetail,
      })
    } else if (app.globalData.ownerDetail) {
      // 外部未指定，使用全局参数
      this.setData!({
        ownerDetail: app.globalData.ownerDetail,
      })
      delete app.globalData.repoDetail
      delete app.globalData.ownerDetail
    }

    const ownerDetail = this.data.ownerDetail
    const owner = ownerDetail.login

    app.footprints.push({
      type: 'owner',
      url: `/pages/owner-detail/index?o=${owner}`,
      meta: {
        title: owner
      }
    })

    ;(async () => {
      const result = await github.getUserDetail(owner)
      if (result.status === 'done') {
        const detail = app.globalData.ownerDetail = result.data!
        this.setData!({
          ownerDetail: detail
        })
      } else if (result.status === 'error') {
        console.error('Load user detail failed: ', result.error)
      }
    })()
    this.loadUserRepos()
  },
  onRepoClick (e: any) {
    app.globalData.repoDetail = e.detail.item
    app.globalData.ownerDetail = e.detail.item.owner
    wx.navigateTo({
      url: '/pages/repo-detail/index'
    })
  },
  onTabsChange(e: any) {
    const { key } = e.detail
    const index = this.data.tabs.map((n) => n.key).indexOf(key)

    this.setData!({
      current: key,
      index,
    })
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
  async loadUserRepos () {
    const owner = this.data.ownerDetail.login
    if (owner) {
      this.setData!({
        query: {
          owner
        }
      })
    }
  }
})
