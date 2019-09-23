//index.js
import Page from '../../common/page/index'
//获取应用实例
import { IMyApp } from '../../app'
import github from '../../utils/githubApi'

// import remuData from '../../mock/remu-export-data'

// const tagMap: {[key: string]: string} = {}
// remuData.tags.forEach(item => {
//   tagMap[item.id] = item.name
// })

const app = getApp<IMyApp>()

Page({
  data: {
    fromShare: true,
    current: 'summary',
    tabs: [
      {
        key: 'summary',
        title: '项目摘要',
        icon: 'medal'
      },
      {
        key: 'readme',
        title: '项目介绍',
        icon: 'text'
      },
      {
        key: 'issues',
        title: '问题',
        icon: 'question'
      },
      {
        key: 'discuss',
        title: '讨论',
        icon: 'community'
      }
    ],
    actions: [{
			text: '查看作者',
			type: 'viewOwner',
		}, {
			text: '浏览代码',
			type: 'viewCode',
		}],
    istrue: false,
    readmeLoaded: false,
    currentTab: 'summary',
    list: [{
      name: 'summary',
      text: "项目摘要",
      // badge: 'New'
    },
    {
      name: 'readme',
      text: "Readme",
    },
    {
      name: 'issues',
      text: "Issues",
    },
    {
      name: 'discuss',
      text: "评论",
    }],
    readmeContent: '',
    readmeRef: 'master',
    readmeFilePath: 'README.md',
    repoDetail: {
      id: undefined as undefined|number,
      full_name: 'vuejs/vue',
      owner: {
        login: 'vuejs'
      }
    },
    tags: [] as string[],
    contextPath: '',
    emojis: {}
  },
  onShareAppMessage () {
    return {
      title: 'Github Time',
      desc: `分享仓库: ${this.data.repoDetail.full_name}`,
      path: `/pages/repo-detail/index?r=${this.data.repoDetail.full_name}&s=true`
    }
  },
  onLoad(options: any) {
    this.setData!({
      fromShare: !!options.s
    })

    app.globalData.emojis.then((emojis) => {
      this.setData!({ emojis })
    })

    if (options.r) {
      // 外部指定仓库
      this.data.repoDetail.full_name = options.r
      this.setData!({
        repoDetail: this.data.repoDetail,
      })
    } else if (app.globalData.repoDetail) {
      // 外部未指定，使用全局参数
      this.setData!({
        repoDetail: app.globalData.repoDetail
      })
      delete app.globalData.repoDetail
      delete app.globalData.ownerDetail
    }

    const repoDetail = this.data.repoDetail
    const fullRepoName = repoDetail.full_name

    app.footprint.push({
      type: 'repo',
      url: `/pages/repo-detail/index?r=${fullRepoName}`,
      timestamp: new Date().getTime(),
      meta: {
        title: fullRepoName
      }
    })

    if (repoDetail.id !== undefined) {
      this.loadTags(repoDetail.id)
    } else {
      ;(async () => {
        const result = await github.getRepositoryDetail(fullRepoName)
        if (result.status === 'done') {
          const detail = result.data!
          this.setData!({
            repoDetail: detail
          })
          this.loadTags(detail.id)
        } else if (result.status === 'error') {
          console.error('Load repository detail failed: ', result.error)
        }
      })()
    }
  },
  onTabsChange(e: any) {
    const { key } = e.detail
    const index = this.data.tabs.map((n) => n.key).indexOf(key)
    this.setData!({
        current: key,
        index,
    })
    this.loadReadmeContent()
  },

  // onSwiperChange(e: any) {
  //   const { current: index, source } = e.detail
  //   const { key } = this.data.tabs[index]

  //   if (!!source) {
  //     this.setData!({
  //       current: key,
  //       index,
  //     })
  //     this.loadReadmeContent()
  //   }
  // },

  onMarkdownAction () {
    wx.showToast({
      icon: 'loading',
      title: '使用代码浏览器打开...',
      duration: 500
    })
    setTimeout(() => {
      wx.hideToast()
      app.globalData.repoDetail = this.data.repoDetail as any
      app.globalData.ownerDetail = this.data.repoDetail.owner as any
      wx.navigateTo({
        url: `/pages/file-browser/index?r=${this.data.repoDetail.full_name}&b=${this.data.readmeRef}&p=${this.data.readmeFilePath}`
      })
    }, 500)
  },

  async loadReadmeContent () {
    if (!this.data.readmeLoaded && this.data.current === 'readme') {
      this.data.readmeLoaded = true;
      wx.showLoading({
        title: '正在加载'
      })
      const result = await github.getReadme({
        fullRepoName: this.data.repoDetail.full_name
      })
      if (result.status === 'done') {
        this.setData!({
          readmeRef: result.data.ref,
          readmeFilePath: result.data.path,
          readmeContent: result.data.content,
          contextPath: `https://github.com/${this.data.repoDetail.full_name}/raw/master/`,
        })
      } else if (result.status === 'error'){
        console.error('Get readme content failed: ', result.error)
      }
      wx.hideLoading()
    }
  },

  onAction (e: any) {
    if (e.detail.action.type === 'viewCode') {
      app.globalData.repoDetail = this.data.repoDetail as any
      app.globalData.ownerDetail = this.data.repoDetail.owner as any
      wx.navigateTo({
        url: '/pages/file-browser/index'
      })
    } else if (e.detail.action.type === 'viewOwner') {
      this.viewOwner()
    }
  },
  viewOwner () {
    app.globalData.repoDetail = this.data.repoDetail as any
    app.globalData.ownerDetail = this.data.repoDetail.owner as any
    wx.navigateTo({
      url: '/pages/owner-detail/index'
    })
  },
  onRemoveTag (e: any) {
    const tag = e.currentTarget.dataset.detail
    wx.showModal({
      title: `确认`,
      content: `确定要移除标签 [${tag}] 吗？`,
      success () {
        console.log('remove tag', tag)
      }
    })
  },
  onAddTag () {
    this.setData!({
      istrue: true
    })
  },
  closeDialog () {
    this.setData!({
      istrue: false
    })
  },

  loadTags (repoId: number) {
    console.log('loadTags', repoId)
    // const tagIds = (remuData.repoWithTags as any)[repoId]
    // let tags = []
    // if (tagIds) {
    //   tags = tagIds.map((item: string) => tagMap[item])
    // }
    // this.setData!({
    //   tags
    // })
  }
})
