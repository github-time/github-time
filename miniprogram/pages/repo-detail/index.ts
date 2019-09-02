//index.js
//获取应用实例
import { IMyApp } from '../../app'
import github from '../../utils/githubApi'

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
    repoDetail: {} as github.repos.RepoDetail
  },
  onLoad() {
    const repoDetail = app.globalData.repoDetail || {
      full_name: 'vuejs/vue'
    }

    this.setData!({
      repoDetail
    });
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
          const readmeContent = await github.getFileContent({
            fullRepoName: this.data.repoDetail.full_name,
            filePath: 'README.md'
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
