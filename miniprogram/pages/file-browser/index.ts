//index.js
import Page from '../../common/page/index'
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
    fromShare: true,
    marginTop: 0,
    filePath: '',
    fileContent: '',
    fileType: 'unknown',
    treeData: [],
    showSidebar: false,
    repoDetail: {
      full_name: 'vuejs/vue',
      name: '...',
      fork: false,
      stargazers_count: 0,
      watchers_count: 0,
      language: '...',
      forks_count: 0,
      open_issues_count: 0,
      master_branch: '...',
      default_branch: '...'
    }
  },
  onShareAppMessage () {
    return {
      title: 'Github Time',
      desc: `分享代码: ${this.data.repoDetail.full_name} ${this.data.filePath}`,
      path: `/pages/file-browser/index?r=${this.data.repoDetail.full_name}&p=${this.data.filePath}`
    }
  },
  onLoad (options: any) {
    const query = wx.createSelectorQuery().in(this)
    query.select('.top-search-bar').boundingClientRect().exec((res: any) => {
      this.setData!({
        marginTop: res[0].top
      })
    })

    if (app.globalData.repoDetail) {
      this.setData!({
        fromShare: false,
        repoDetail: app.globalData.repoDetail
      })
    }

    const fullRepoName = options.r || this.data.repoDetail.full_name
    const filePath = options.p || ''

    if (fullRepoName && filePath) {
      this.viewFile(fullRepoName, filePath)
    }

    if (!filePath) {
      // 显示目录树
      this.setData!({
        showSidebar: true,
      })
      // 加载目录树
      this.loadFileTree(fullRepoName)
    }
  },
  onViewFileClick (e: any) {
    this.viewFile(this.data.repoDetail.full_name, e.detail.path)
  },
  showFileTree () {
    if (this.data.treeData.length === 0) {
      this.loadFileTree(this.data.repoDetail.full_name)
    }
    this.setData!({
      showSidebar: true
    })
  },
  hideFileTree () {
    this.setData!({
      showSidebar: false
    })
  },

  async loadFileTree (fullRepoName:string) {
    wx.showLoading({
      title: '正在加载'
    })
    try {
      const treeData = parseTree(await github.getFileTree({ fullRepoName })).tree
      this.setData!({
        treeData
      });
    } catch (e) {}
    wx.hideLoading()
  },
  async viewFile (fullRepoName:string, filePath: string) {
    wx.showLoading({
      title: '正在加载'
    })
    try {
      const content = await github.getFileContent({
        fullRepoName,
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
  }
})
