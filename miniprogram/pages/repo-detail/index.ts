//index.js
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
    repoDetail: {} as github.repos.SearchResultItem,
    tags: [] as string[]
  },
  onLoad() {
    const repoDetail = app.globalData.repoDetail || {
      full_name: 'vuejs/vue'
    }

    const repoId = (repoDetail as github.repos.SearchResultItem).id + ''
    const tagIds = (remuData.repoWithTags as any)[repoId]
    let tags = []
    if (tagIds) {
      tags = tagIds.map((item: string) => tagMap[item])
    }

    this.setData!({
      repoDetail,
      tags
    })
  },
  tabChange (e: any) {
    this.setData!({
      currentTab: e.detail.item.name
    })

    if (!this.data.readmeLoaded) {
      this.data.readmeLoaded = true;
      (async () => {
        wx.showLoading({
          title: '正在加载'
        });
        try {
          const readmeContent = await github.getReadmeContent({
            fullRepoName: this.data.repoDetail.full_name
          })
          this.setData!({
            readmeContent
          })
        } catch (e) {}
        wx.hideLoading()
      })()
    }
  },
  browserCode () {
    wx.navigateTo({
      url: '/pages/file-browser/index'
    })
  }
})
