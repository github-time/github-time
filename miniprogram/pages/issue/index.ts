//index.js
import Page from '../../common/page/index'
//获取应用实例
import { IMyApp } from '../../app'
import github from '../../utils/helper/githubApi'
const app = getApp<IMyApp>()

Page({
  data: {
    fullRepoName: '',
    issueDetail: {
      number: -1
    },
    repoTimelineQuery: null,
    async getRepoIssueTimeline (query: any, pageSize: number, pageNo: number) {
      const result = await github.getRepositoryIssueTimeline({
        fullRepoName: query.fullRepoName,
        issueNo: query.issueNo,
        pageSize,
        pageNo
      })
      // await sleep(2000)
      console.log('getRepoIssueTimeline+++', result)
      return result
    }
  },
  onLoad(options: any) {
    app.globalData.emojis.then((emojis) => {
      this.setData!({ emojis })
    })

    const fullRepoName = options.r
    this.setData!({ fullRepoName })

    if (options.i) {
      // 外部指定问题编号
      this.data.issueDetail.number = options.i
      this.setData!({
        issueDetail: this.data.issueDetail
      })
    } else if (app.globalData.issueDetail) {
      // 外部未指定，使用全局参数
      this.setData!({
        issueDetail: app.globalData.issueDetail
      })
      delete app.globalData.issueDetail
    }

    const issueDetail = this.data.issueDetail

    this.setData!({
      repoTimelineQuery: {
        fullRepoName,
        issueNo: issueDetail.number
      }
    })

    // app.footprints.push({
    //   type: 'repo',
    //   url: `/pages/repo-detail/index?r=${fullRepoName}`,
    //   meta: {
    //     title: fullRepoName
    //   }
    // })

    // if (repoDetail.id === undefined || (repoDetail.fork && !repoDetail.parent)) {
    //   ;(async () => {
    //     const result = await github.getRepositoryDetail(fullRepoName)
    //     if (result.status === 'done') {
    //       const detail = result.data!
    //       this.setData!({
    //         repoDetail: detail
    //       })
    //     } else if (result.status === 'error') {
    //       console.error('Load repository detail failed: ', result.error)
    //     }
    //   })()
    // } else {
    // }
  }
})
