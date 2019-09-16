//index.js
import Page from '../../common/page/index'
import { IMyApp } from '../../app'
import parseTree from '../../utils/parseTree'
import github from '../../utils/githubApi'
// @ts-ignore
import { $wuxToptips } from '../../common/lib/wux/index'

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
    test: /\.m$/i,
    type: 'c'
  },
  {
    test: /\.h$/i,
    type: 'c'
  },
  {
    test: /\.md$/i,
    type: 'md'
  },
  {
    test: /\.g4$/i,
    type: 'ebnf'
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
    emojis: {},
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
    },
    baseUrl: '',
    history:[] as string[]
  },
  onShareAppMessage () {
    return {
      title: 'Github Time',
      desc: `分享代码: ${this.data.repoDetail.full_name} ${this.data.filePath}`,
      path: `/pages/file-browser/index?r=${this.data.repoDetail.full_name}&p=${this.data.filePath}`
    }
  },
  onLoad (options: any) {
    app.globalData.emojis.then((emojis) => {
      this.setData!({ emojis })
    })

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
        fromShare: !!(options.r || options.p) && (options.f !== 'inner'),
        repoDetail: app.globalData.repoDetail,
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
  onMarkdownAction (e: any) {
    switch (e.detail.type) {
      case 'link-tap':
        const href = e.detail.data.href
        let matches = href.match(/^https:\/\/github.com\/(\w+)\/(\w+)/)
        if (matches) {
          // Github 内部链接
          const fullRepoName = `${matches[1]}/${matches[2]}`
          const login = matches[1]
          let filePath = 'README.md'
          matches = href.match(/^https:\/\/github.com\/\w+\/\w+\/blob\/(\w+)\/(.*)/)
          if (matches) {
            // 带文件路径
            // const branch = matches[1]
            filePath = matches[2].replace(/^\//, '')
          }
          console.log('github link:', href)
          app.globalData.repoDetail = {
            full_name: fullRepoName,
            owner: { login }
          } as any
          wx.navigateTo({
            url: `/pages/file-browser/index?r=${fullRepoName}&p=${filePath}&f=inner`
          })
        } else if (href.match(/^http(|s):\/\//)) {
          // 外部链接
          $wuxToptips().info({
            hidden: false,
            text: '外部链接，暂不支持跳转',
            duration: 1000,
            success() {},
          })
          console.log('outer link:', href)
        } else {
          // 内部链接
          const fullRepoName = this.data.repoDetail.full_name
          let filePath
          if (href.match(/^\//)) {
            // 绝对路径
            filePath = href.replace(/^\/+/, '')
          } else {
            filePath = this.data.filePath.replace(/[^\/]+$/, '') + href
          }
          console.log('repo link:', href)
          this.viewFile(fullRepoName, filePath)
        }
        break
    }
  },

  onBack () {
    if (this.data.history.length > 1) {
      this.data.history.pop()
      const filePath = this.data.history[this.data.history.length - 1]
      this.viewFile(this.data.repoDetail.full_name, filePath, true)
    }
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

  async viewFile (fullRepoName:string, filePath: string, isBack: boolean = false) {
    console.log(`viewFile: ${fullRepoName}/${filePath}`)
    wx.showLoading({
      title: '正在加载'
    })
    let pushHistory = !isBack
    const fileInfo = getFileInfo(filePath)
    if (fileInfo.type === 'img') {
      this.setData!({
        showSidebar: false,
        filePath,
        fileContent: '',
        fileType: fileInfo.type
      })
      setTimeout(wx.hideLoading, 1500)
    } else {
      const result= await github.getFileContent({
        fullRepoName,
        filePath,
      })
      if (result.status === 'done') {
        const content = result.data
        this.setData!({
          showSidebar: false,
          filePath,
          contexPath: `https://github.com/${fullRepoName}/raw/master/${filePath.replace(/[^\/]+$/, '')}`,
          fileContent: content,
          fileType: fileInfo.type
        })
      } else if (result.status === 'error') {
        $wuxToptips().error({
          hidden: false,
          text: '获取文件内容失败...',
          duration: 3000,
          success() {},
        })
        console.error('Get file content failed: ', result.error)
        pushHistory = false
      }
      wx.hideLoading()
    }
    if (pushHistory) this.data.history.push(filePath)
  }
})
