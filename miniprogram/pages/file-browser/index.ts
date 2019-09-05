//index.js
//获取应用实例
import { IMyApp } from '../../app'
import parseTree from '../../utils/parseTree'
import github from '../../utils/githubApi'

const app = getApp<IMyApp>()

const fileTypeMap = [
  {
    test: /(^|\/)dockerfile$/i,
    type: 'docker'
  },
  {
    test: /(^|\/)makefile$/i,
    type: 'makefile'
  },
  {
    test: /(^|\/)\.\w+rc$/i,
    type: 'json'
  },
  {
    test: /(^|\/)\.\w+config$/i,
    type: 'properties'
  },
  {
    test: /\.md$/i,
    type: 'md'
  },
  {
    test: /\.(png|jpeg|jpg|gif)$/i,
    type: 'img'
  },
  {
    test: /\.([^.]+)$/i,
    type: '$1'
  }
]

function getFileInfo (path: string) {
  for (let item of fileTypeMap) {
    const matches = path.match(item.test)
    if (matches) {
      return {
        path,
        type: item.type.replace('$1', matches[1])
      }
    }
  }
  return {
    path,
    type: 'unknown'
  }
}

Page({
  data: {
    fileContent: '',
    fileType: 'unknown',
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
