//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'
//获取应用实例
import { IMyApp } from '../../app'

const app = getApp<IMyApp>()

Page({
  data: {
    fromShare: true,
    ownerDetail: {
      id: undefined as undefined|number,
      login: 'vuejs'
    },
    current: 'repos',
    tabs: [
      {
        key: 'repos',
        title: 'Ta的仓库'
      },
      {
        key: 'activity',
        title: 'Ta的动态'
      }
    ],
    query: null,
    async getUserRepos (query: any, pageSize: number, pageNo: number) {
      const result = await github.getUserRepositories({
        owner: query.owner,
        pageSize,
        pageNo
      })
      // await new Promise((resolve) => {setTimeout(resolve, 2000)})
      return result
    }
  },
  onShareAppMessage () {
    return {
      title: 'Github Time',
      desc: `分享开发者: ${this.data.ownerDetail.login}`,
      path: `/pages/owner-detail/index?o=${this.data.ownerDetail.login}`
    }
  },
  onLoad(options: any) {
    this.setData!({
      fromShare: !!options.s
    })

    // 如果有，使用全局参数
    if (app.globalData.ownerDetail) {
      this.setData!({
        ownerDetail: app.globalData.ownerDetail
      })
    }
    const ownerDetail = this.data.ownerDetail

    const owner = options.o || ownerDetail.login

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
