//index.js
//获取应用实例
import { IMyApp } from '../../app'
import parseTree from '../../utils/parseTree'
import github from '../../utils/githubApi'

const app = getApp<IMyApp>()

const imgMap = ['png', 'jpeg', 'jpg', 'gif']

function getFileInfo (path: string) {
  const fileInfo = {
    path,
    type: 'text'
  }
  const matches = path.match(/\.([a-zA-Z]+)$/)
  const type = (matches && matches[1]) || ''
  if (type === 'md') {
    fileInfo.type = 'md'
  } else if (imgMap.indexOf(type) > -1) {
    fileInfo.type = 'img'
  } else {
    fileInfo.type = type
  }
  return fileInfo
}

Page({
  data: {
    fileContent: '',
    fileType: 'text',
    treeData: [],
    showSidebar: true,
    repoDetail: {
      full_name: 'vuejs/vue',
      name: 'vue',
      fork: false,
      stargazers_count: 1,
      watchers_count: 2,
      language: 'vue',
      forks_count: 3,
      open_issues_count: 4,
      master_branch: 'master',
      default_branch: 'master'
    }
  },
  onLoad () {
    const repoDetail = app.globalData.repoDetail || {
      full_name: 'vuejs/vue'
    }

    this.setData!({
      repoDetail
    });

    (async () => {
      wx.showLoading({
        title: '正在加载'
      })
      try {
        const treeData = parseTree(await github.getFileTree({ fullRepoName: repoDetail.full_name })).tree
        console.log('treeData', treeData)
        this.setData!({
          treeData
        });
      } catch (e) {}
      wx.hideLoading()
    })()
  },
  async viewFile (e: any) {
    wx.showLoading({
      title: '正在加载'
    })
    try {
      const filePath = e.detail.path
      const content = await github.getFileContent({
        fullRepoName: this.data.repoDetail.full_name,
        filePath
      })
      console.log('content:', content)
      const fileInfo = getFileInfo(filePath)
      this.setData!({
        showSidebar: false,
        filePath,
        fileContent: content,
        fileType: fileInfo.type
      })
    } catch (e) {}
    wx.hideLoading()
  },
  toggleMenu () {
    this.setData!({
      showSidebar: true
    })
  },
  clickCodeView () {
    this.setData!({
      showSidebar: false
    })
  }
})
