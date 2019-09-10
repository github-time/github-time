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
    test: /\.g4$/i,
    type: 'ebnf'
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
    lastTap: 0,
    fromShare: true,
    marginTop: 0,
    filePath: '',
    fileContent: '',
    fileType: 'unknown',
    treeData: [],
    showSidebar: false,
    repoDetail: {
      id: undefined,
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

    const fullRepoName = options.r || this.data.repoDetail.full_name
    const filePath = options.p || ''

    if (fullRepoName && filePath) {
      this.viewFile(fullRepoName, filePath)
    }

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

    if (!filePath) {
      // 显示目录树
      this.showFileTree ()
    }
  },
  onTapViewer (e: any) {
    if (e.timeStamp - this.data.lastTap < 250) {
      this.showFileTree()
    }
    this.data.lastTap = e.timeStamp
  },
  onViewFileClick (e: any) {
    this.viewFile(this.data.repoDetail.full_name, e.detail.path)
  },
  showFileTree () {
    if (this.data.treeData.length === 0) {
      this.loadFileTree(this.data.repoDetail.full_name)
    }
    if (this.data.repoDetail.id === undefined) {
      this.loadRepositoryDetail(this.data.repoDetail.full_name)
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

  async loadRepositoryDetail (fullRepoName: string) {
    const result = await github.getRepositoryDetail(fullRepoName)
    if (result.status === 'done') {
      this.setData!({
        repoDetail: result.data
      })
    } else if (result.status === 'error') {
      console.error('Get repository detail failed: ', result.error)
    }
  },

  async loadFileTree (fullRepoName:string) {
    wx.showLoading({
      title: '正在加载'
    })
    const result = await github.getFileTree({ fullRepoName })
    if (result.status === 'done') {
      try {
        this.setData!({
          treeData: parseTree(result.data!).tree
        });
      } catch (e) {
        console.error('Parse file tree failed: ', e)
      }
    } else if (result.status === 'error'){
      console.error('Get file tree failed: ', result.error)
    }
    wx.hideLoading()
  },

  async viewFile (fullRepoName:string, filePath: string) {
    wx.showLoading({
      title: '正在加载'
    })
    const result= await github.getFileContent({
      fullRepoName,
      filePath
    })
    if (result.status === 'done') {
      const content = result.data
      const fileInfo = getFileInfo(filePath)
      this.setData!({
        showSidebar: false,
        filePath,
        fileContent: content,
        fileType: fileInfo.type
      })
    } else if (result.status === 'error') {
      console.error('Get file content failed: ', result.error)
    }
    wx.hideLoading()
  }
})
