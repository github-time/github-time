//index.js
import Page from '../../common/page/index'
//获取应用实例
import { IMyApp } from '../../app'
import github from '../../utils/helper/githubApi'
// @ts-ignore
import { $wuxToptips } from '../../common/lib/wux/index'
import { wrapLoading, getLinkInfo, parseRepoDetail } from '../../utils/common'

// import remuData from '../../mock/remu-export-data'

// const tagMap: {[key: string]: string} = {}
// remuData.tags.forEach(item => {
//   tagMap[item.id] = item.name
// })

const app = getApp<IMyApp>()

Page({
  data: {
    index: 0,
    current: 'summary',
    tabs: [
      {
        key: 'summary',
        title: '摘要',
        icon: 'medal'
      },
      {
        key: 'readme',
        title: '介绍',
        icon: 'text'
      },
      {
        key: 'activity',
        title: '动态',
        icon: 'activity'
      },
      {
        key: 'issues',
        title: '问题',
        icon: 'question'
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
    }],
    noReadme: false,
    readmeContent: '',
    readmeRef: 'master',
    readmeFilePath: 'README.md',
    repoDetail: {
      id: undefined as undefined|number,
      full_name: 'vuejs/vue',
      fork: false,
      parent: undefined,
      owner: {
        login: 'vuejs'
      }
    },
    tags: [] as string[],
    contextPath: '',
    emojis: {},
    githubConfig: {
      user: '',
      token: ''
    },
    isStarred: false,
    enableLoadRepoEvents: false,
    repoEventQuery: null,
    async getRepoEvents (query: any, pageSize: number, pageNo: number) {
      const result = await github.getRepositoryEvents({
        fullRepoName: query.fullRepoName,
        pageSize,
        pageNo
      })
      // await sleep(2000)
      return result
    },
    enableLoadRepoIssues: false,
    repoIssueQuery: null,
    async getRepoIssues (query: any, pageSize: number, pageNo: number) {
      const result = await github.searchIssues({
        keyword: `repo:${query.fullRepoName}`,
        pageSize,
        pageNo
      })
      // await sleep(2000)
      return {
        status: result.status,
        data: result.data.items
      }
    }
  },
  onShareAppMessage () {
    return {
      title: 'Github Time',
      desc: `分享仓库: ${this.data.repoDetail.full_name}`,
      path: `/pages/repo-detail/index?r=${this.data.repoDetail.full_name}&s=true`
    }
  },
  onLoad(options: any) {
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

    app.footprints.push({
      type: 'repo',
      url: `/pages/repo-detail/index?r=${fullRepoName}`,
      meta: {
        title: fullRepoName
      }
    })

    if (repoDetail.id === undefined || (repoDetail.fork && !repoDetail.parent)) {
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
    } else {
      this.loadTags(repoDetail.id)
    }

    const githubConfig = this.data.githubConfig = app.settings.get('githubConfig', {})

    if (githubConfig && githubConfig.token) {
      (async () => {
        const result = await github.isStarred(this.data.repoDetail.full_name)
        this.setData!({
          githubConfig,
          isStarred: result.data
        })
      })()
    }

    this.loadRepoEvents()
    this.loadRepoIssues()
  },
  onTabsChange(e: any) {
    const { key } = e.detail
    const index = this.data.tabs.map((n) => n.key).indexOf(key)
    this.setData!({
        current: key,
        index,
    })

    switch (key) {
      case 'readme':
        this.loadReadmeContent()
        break
      case 'activity':
        this.setData!({
          enableLoadRepoEvents: true
        })
        break
      case 'issues':
        this.setData!({
          enableLoadRepoIssues: true
        })
        break
    }
  },
  async onStaring () {
    const githubConfig = this.data.githubConfig
    if (githubConfig && githubConfig.token) {
      await wrapLoading('请稍候...', async () => {
        let isStarred = this.data.isStarred
        if (this.data.isStarred) {
          const result = await github.unstar(this.data.repoDetail.full_name)
          if (result.status === 'done') isStarred = false
        } else {
          const result = await github.star(this.data.repoDetail.full_name)
          if (result.status === 'done') isStarred = true
        }
        this.setData!({
          isStarred
        })
      })
    } else {
      wx.showToast({
        title: '操作失败:未设置账户令牌'
      })
    }
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

  onMarkdownAction (e: any) {
    switch (e.detail.type) {
      case 'link-tap':
        const href = e.detail.data.href
        const context = `https://github.com/${this.data.repoDetail.full_name}/blob/master/`
        const linkInfo = getLinkInfo(href, context)
        switch (linkInfo.type) {
          case 'github':
            const fullRepoName = linkInfo.full_name
            const filePath = linkInfo.filePath
            const ref = linkInfo.ref
            const repoDetail = parseRepoDetail({ full_name: fullRepoName })
            if (filePath) {
              // 指定了文件路径，跳转到代码浏览器
              app.globalData.repoDetail = repoDetail
              wx.navigateTo({
                url: `/pages/file-browser/index?r=${fullRepoName}&b=${ref}&p=${filePath}`
              })
            } else {
              // 仓库链接，跳转到仓库详情
              app.globalData.repoDetail = repoDetail
              app.globalData.ownerDetail = (app.globalData.repoDetail as any).owner
              wx.navigateTo({
                url: `/pages/repo-detail/index?r=${fullRepoName}`
              })
            }

            break

          case 'normal':
            $wuxToptips().info({
              hidden: false,
              text: `外部链接，暂不支持跳转\n${href}`,
              duration: 1000
            })

            wx.setClipboardData({
              data: href,
              success () {
                wx.showToast({
                  title: `链接已复制`,
                  duration: 2000
                })
              }
            })
            console.log('outer link:', href)
            break

          default:
            $wuxToptips().info({
              hidden: false,
              text: `链接类型未知...\n${href}`,
              duration: 1000
            })
            break
        }
    }
  },

  async loadReadmeContent () {
    if (!this.data.readmeLoaded && this.data.current === 'readme') {
      this.data.readmeLoaded = true
      await wrapLoading('正在加载', async () => {
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
          if (result.error && result.error.code === 404) {
            this.setData!({
              noReadme: true
            })
          }
        }
      })
    }
  },

  onAction (e: any) {
    if (e.detail.action.type === 'viewCode') {
      this.viewCode()
    } else if (e.detail.action.type === 'viewOwner') {
      this.viewOwner()
    }
  },
  viewParent () {
    app.globalData.repoDetail = (this.data.repoDetail as any).parent
    app.globalData.ownerDetail = app.globalData.repoDetail!.owner
    wx.navigateTo({
      url: '/pages/repo-detail/index'
    })
  },
  viewCode () {
    app.globalData.repoDetail = this.data.repoDetail as any
    app.globalData.ownerDetail = app.globalData.repoDetail!.owner
    wx.navigateTo({
      url: '/pages/file-browser/index'
    })
  },
  viewOwner () {
    app.globalData.repoDetail = this.data.repoDetail as any
    app.globalData.ownerDetail = app.globalData.repoDetail!.owner
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
  },

  async loadRepoEvents () {
    const fullRepoName = this.data.repoDetail.full_name
    if (fullRepoName) {
      this.setData!({
        repoEventQuery: {
          fullRepoName
        }
      })
    }
  },

  async loadRepoIssues () {
    const fullRepoName = this.data.repoDetail.full_name
    if (fullRepoName) {
      this.setData!({
        repoIssueQuery: {
          fullRepoName
        }
      })
    }
  },

  onRepoEventClick (e: any) {
    switch (e.detail.type) {
      case 'owner':
        wx.navigateTo({
          url: `/pages/owner-detail/index?o=${e.detail.item.actor.login}`
        })
        break;
      case 'repo':
        if (this.data.repoDetail.full_name !== e.detail.item.repo.name) {
          wx.navigateTo({
            url: `/pages/repo-detail/index?r=${e.detail.item.repo.name}`
          })
        }
        break;
      case 'fork-repo':
        wx.navigateTo({
          url: `/pages/repo-detail/index?r=${e.detail.item.payload.forkee.full_name}`
        })
        break;
    }
  },

  onRepoIssueClick (e: any) {
    app.globalData.issueDetail = e.detail.item
    wx.navigateTo({
      url: `/pages/issue/index?r=${this.data.repoDetail.full_name}`
    })
  }
})
