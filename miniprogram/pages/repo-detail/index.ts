//index.js
import Page from '../../common/page/index'
//获取应用实例
import { IMyApp } from '../../app'
import github from '../../utils/githubApi'

import remuData from '../../mock/remu-export-data'

const tagMap: {[key: string]: string} = {}
remuData.tags.forEach(item => {
  tagMap[item.id] = item.name
})

const app = getApp<IMyApp>()

Page({
  data: {
    fromShare: true,
    current: 'summary',
    tabs: [
      {
        key: 'summary',
        title: '项目摘要'
      },
      {
        key: 'readme',
        title: '项目介绍'
      },
      {
        key: 'issues',
        title: '问题'
      },
      {
        key: 'discuss',
        title: '讨论'
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
    repoDetail: {
      id: undefined as undefined|number,
      full_name: 'vuejs/vue'
    },
    tags: [] as string[]
  },
  onShareAppMessage () {
    return {
      title: 'Github Time',
      desc: `分享仓库: ${this.data.repoDetail.full_name}`,
      path: `/pages/repo-detail/index?r=${this.data.repoDetail.full_name}`
    }
  },
  onLoad(options: any) {
    const fullRepoName = options.r || this.data.repoDetail.full_name

    if (app.globalData.repoDetail) {
      this.setData!({
        fromShare: false,
        repoDetail: app.globalData.repoDetail
      })
    } else {
      this.setData!({
        repoDetail: {
          full_name: fullRepoName
        }
      })
    }

    const repoDetail = this.data.repoDetail
    if (repoDetail.id !== undefined) {
      this.loadTags(repoDetail.id)
    } else {
      (async () => {
        const result = await github.getRepositoryDetail(repoDetail.full_name)
        if (result.status === 'done') {
          const detail = app.globalData.repoDetail = result.data!
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

  async loadReadmeContent () {
    if (!this.data.readmeLoaded && this.data.current === 'readme') {
      this.data.readmeLoaded = true;
      wx.showLoading({
        title: '正在加载'
      })
      const result = await github.getReadmeContent({
        fullRepoName: this.data.repoDetail.full_name
      })
      if (result.status === 'done') {
        this.setData!({
          readmeContent: result.data
        })
      } else if (result.status === 'error'){
        console.error('Get readme content failed: ', result.error)
      }
      wx.hideLoading()
    }
  },

  onAction (e: any) {
    if (e.detail.action.type === 'viewCode') {
      wx.navigateTo({
        url: '/pages/file-browser/index'
      })
    } else if (e.detail.action.type === 'viewOwner') {
      this.viewOwner()
    }
  },
  viewOwner () {
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
    const tagIds = (remuData.repoWithTags as any)[repoId]
    let tags = []
    if (tagIds) {
      tags = tagIds.map((item: string) => tagMap[item])
    }
    this.setData!({
      tags
    })
  }
})
