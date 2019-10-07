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
    index: 0,
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
    },
    enableLoadUserEvents: false,
    userEventQuery: null,
    async getUserEvents (query: any, pageSize: number, pageNo: number) {
      const result = await github.getUserEvents({
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
    this.loadUserEvents()
  },
  onRepoClick (e: any) {
    app.globalData.repoDetail = e.detail.item
    app.globalData.ownerDetail = e.detail.item.owner
    wx.navigateTo({
      url: '/pages/repo-detail/index'
    })
  },
  onUserEventClick (e: any) {
    switch (e.detail.type) {
      case 'owner':
        if (this.data.ownerDetail.login !== e.detail.item.actor.login) {
          wx.navigateTo({
            url: `/pages/owner-detail/index?o=${e.detail.item.actor.login}`
          })
        }
        break;
      case 'repo':
        wx.navigateTo({
          url: `/pages/repo-detail/index?r=${e.detail.item.repo.name}`
        })
        break;
      case 'fork-repo':
        wx.navigateTo({
          url: `/pages/repo-detail/index?r=${e.detail.item.payload.forkee.full_name}`
        })
        break;
    }
  },
  onTabsChange(e: any) {
    const { key } = e.detail
    const index = this.data.tabs.map((n) => n.key).indexOf(key)

    this.setData!({
      current: key,
      index,
    })

    if (key === 'activity') {
      this.setData!({enableLoadUserEvents: true})
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
      if (key === 'activity') {
        this.setData!({enableLoadUserEvents: true})
      }
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
  },
  async loadUserEvents () {
    const owner = this.data.ownerDetail.login
    if (owner) {
      this.setData!({
        userEventQuery: {
          owner
        }
      })
    }
  }
})
