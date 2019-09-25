//index.js
import * as minimatch from 'minimatch'
import Page from '../../common/page/index'
import { IMyApp } from '../../app'
import parseTree from '../../utils/parseTree'
import github from '../../utils/githubApi'
// @ts-ignore
import { $wuxToptips } from '../../common/lib/wux/index'
import fileTypeMap from './file-types'
import openDocument from '../../utils/openDocument'

const MAX_OPEN_FILE_SIZE = 3 * 1024 * 1024 // 限制最大为2M

type HistoryItem = {
  ref: string,
  path: string
}

type FileMeta = {
  size: number,
  sha: string
}

const app = getApp<IMyApp>()

function getFileInfo (path: string) {
  const index = path.lastIndexOf('/')
  const name = index === -1 ? path : path.substr(index + 1)
  for (let item of fileTypeMap) {
    const matches = path.match(item.test)
    if (matches) {
      return {
        name,
        path,
        type: item.type.replace('$1', matches[1])
      }
    }
  }
  return {
    name,
    path,
    type: 'unknown'
  }
}

function debounce (this: any, func: Function, wait: number) {
  let timer = 0
  return function (this: any) {
    const context = this
    const args = arguments
    clearTimeout(timer)
    // @ts-ignore
    timer = setTimeout(() => {
      func.apply(context,args)
    }, wait)
  }
}

const doFileSearch = debounce((vm: any, query: string) => {
  let maxCount = 25
  const pathList = Object.keys(vm.data.fileMap)
  const result = [] as string[] || pathList.filter((item: string) => {
    if (maxCount > 0) {
      if (minimatch(item, query, {matchBase: true})) {
        maxCount--
        return true
      }
    }
    return false
  })
  if (maxCount > 0) {
    pathList.forEach((item: string) => {
        if (maxCount > 0 && minimatch(item, `*${query}*`, {matchBase: true}) && result.indexOf(item) === -1) {
        result.push(item)
        maxCount--
      }
    })
  }
  vm.setData!({
    fileSearchResult: result
  })
}, 300) as (vm: any, query: string) => void

Page({
  data: {
    showSidebar: false,
    lastTap: 0,
    marginTop: 0,
    emojis: {},
    keyword: '',
    ref: '',
    fileTooLarge: false,
    fileSize: '',
    fileGitHash: '',
    filePath: '',
    fileContent: '',
    contextPath: '',
    fileType: 'unknown',
    repoDetail: {
      id: undefined,
      full_name: 'vuejs/vue',
      name: '',
      fork: false,
      stargazers_count: 0,
      watchers_count: 0,
      language: '',
      forks_count: 0,
      open_issues_count: 0,
      master_branch: '',
      default_branch: ''
    },
    treeData: [],
    fileMap: {} as { [key: string]: FileMeta },
    fileSearchResult: [] as string[],
    showFileSearchResult: false,
    history: [] as HistoryItem[],
    branches: [] as string[],
    showHistoryBack: false,
    mdPreview: true
  },
  onShareAppMessage () {
    return {
      title: 'Github Time',
      desc: `分享代码: ${this.data.repoDetail.full_name} ${this.data.filePath}`,
      path: `/pages/file-browser/index?r=${this.data.repoDetail.full_name}&b=${this.data.ref}&p=${this.data.filePath}&s=true`
    }
  },
  async onLoad (options: any) {
    // 加载表情图标地址
    app.globalData.emojis.then((emojis) => {
      this.setData!({ emojis })
    })

    // 计算侧边栏 margin-top
    const query = wx.createSelectorQuery().in(this)
    query.select('.top-search-bar').boundingClientRect().exec((res: any) => {
      this.setData!({
        marginTop: res[0].top
      })
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
        repoDetail: app.globalData.repoDetail,
        ref: app.globalData.repoDetail.default_branch
      })
      delete app.globalData.repoDetail
      delete app.globalData.ownerDetail
    }

    if (options.b) {
      // 外部指定分支
      this.setData!({
        ref: options.b
      })
    }

    const repoDetail = this.data.repoDetail

    const fullRepoName = repoDetail.full_name
    if (!fullRepoName) {
      $wuxToptips().error({
        hidden: false,
        text: '未指定仓库...',
        duration: 3000,
        success: () => {
          // 自动返回上一步
          wx.navigateBack({ delta: 1 })
        },
      })
      return
    }

    let ref = this.data.ref
    if (!ref) {
      // 参数不全，获取仓库详情
      const repoDetail = await this.loadRepositoryDetail(fullRepoName)
      if (repoDetail) {
        // 更新参数
        ref = repoDetail.default_branch
        this.setData!({
          repoDetail,
          ref
        })
      } else {
        return
      }
    }

    const filePath = options.p || ''
    if (filePath) {
      // 指定了文件路径，直接显示文件内容
      this.viewFile(fullRepoName, ref, filePath)
    } else {
      // 未指定文件路径，显示文件目录树
      this.showFileTree()
    }
  },
  downloadAndViewDocument () {
    const url = `https://github.com/${this.data.repoDetail.full_name}/raw/${this.data.ref}/${this.data.filePath}`
    openDocument(
      url,
      this.data.fileGitHash
    )
  },
  onBranchPickerChange (e: any) {
    const ref = this.data.branches[e.detail.value]
    this.setData!({ ref })
    this.loadFileTree(this.data.repoDetail.full_name, ref)
  },
  onTapViewer (e: any) {
    this.setData!({
      showFileSearchResult: false
    })
    if (e.timeStamp - this.data.lastTap < 250) {
      this.showFileTree()
    }
    this.data.lastTap = e.timeStamp
  },
  async onSearchFocus () {
    if (this.data.treeData.length === 0) {
      await this.loadFileTree(this.data.repoDetail.full_name, this.data.ref)
    }
    this.setData!({
      showSidebar: false,
      showFileSearchResult: true
    })
  },
  onSearchChange (e: any) {
    const query = e.detail.value
    this.setData!({
      keyword: query
    })
    console.log('search:', query)

    doFileSearch(this, query)
  },
  onSearchResultItemClick (e: any) {
    this.viewFile(this.data.repoDetail.full_name, this.data.ref, e.currentTarget.dataset.path)
    this.setData!({
      showFileSearchResult: false
    })
  },
  onViewFileClick (e: any) {
    this.viewFile(this.data.repoDetail.full_name, this.data.ref, e.detail.path)
  },
  switchMdMode () {
    this.setData!({
      mdPreview: !this.data.mdPreview
    })
    wx.showToast({
      title: `切换到${this.data.mdPreview ? '预览' : '代码'}视图`,
      icon: 'loading',
      duration: 1000
    })
  },
  showFileTree () {
    if (this.data.branches.length === 0) {
      github.getRepositoryBranches(this.data.repoDetail.full_name).then((result) => {
        if (result.status === 'done') {
          this.setData!({
            branches: result.data.map((item) => item.name)
          })
        }
      })
    }
    if (this.data.treeData.length === 0) {
      this.loadFileTree(this.data.repoDetail.full_name, this.data.ref)
    }
    if (this.data.repoDetail.id === undefined) {
      this.loadRepositoryDetail(this.data.repoDetail.full_name).then((repoDetail) => {
        if (repoDetail) {
          this.setData!({ repoDetail })
        }
      })
    }
    this.setData!({
      showFileSearchResult: false,
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
        let matches = href.match(/^https:\/\/github.com\/([\w-]+)\/([\w-]+)/)
        if (matches) {
          // Github 内部链接
          const fullRepoName = `${matches[1]}/${matches[2]}`
          const login = matches[1]
          let filePath = 'README.md'
          matches = href.match(/^https:\/\/github.com\/[\w-]+\/[\w-]+\/blob\/([\w-]+)\/(.*)/)
          if (matches) {
            // 带文件路径
            // const branch = matches[1]
            filePath = matches[2].replace(/^\//, '')
          }
          console.log('github link:', href)
          if (fullRepoName === this.data.repoDetail.full_name) {
            // 本仓库链接,直接打开
            this.viewFile(fullRepoName, this.data.ref, filePath)
          } else {
            // 其他仓库链接,跳转新页
            app.globalData.repoDetail = {
              full_name: fullRepoName,
              owner: { login }
            } as any
            wx.navigateTo({
              url: `/pages/file-browser/index?r=${fullRepoName}&p=${filePath}`
            })
          }
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
          this.viewFile(fullRepoName, this.data.ref, filePath)
        }
        break
    }
  },

  onBack () {
    if (this.data.history.length > 1) {
      this.data.history.pop()
      const fullRepoName = this.data.repoDetail.full_name
      const history = this.data.history[this.data.history.length - 1]
      this.viewFile(fullRepoName, history.ref, history.path, true)
      this.loadFileTree(fullRepoName, history.ref)
      this.setData!({
        showHistoryBack: this.data.history.length > 1
      })
    }
  },

  async loadRepositoryDetail (fullRepoName: string) {
    const result = await github.getRepositoryDetail(fullRepoName)
    if (result.status === 'done') {
      return result.data
    } else if (result.status === 'error') {
      $wuxToptips().error({
        hidden: false,
        text: '获取仓库详情失败...',
        duration: 3000,
        success() {},
      })
      console.error('Get repository detail failed: ', result.error)
    }
    return null
  },

  async loadFileTree (fullRepoName: string, ref: string) {
    wx.showLoading({
      title: '正在加载'
    })
    const result = await github.getFileTree({ fullRepoName, ref })
    if (result.status === 'done') {
      try {
        const fileMap = {} as {[key: string]: FileMeta}
        result.data.filter(item => item.type === 'blob').forEach(item => {
          fileMap[item.path] = {
            size: item.size!,
            sha: item.sha
          }
        })
        this.setData!({
          fileMap,
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

  async viewFile (fullRepoName: string, ref: string, filePath: string, isBack: boolean = false) {
    console.log(`viewFile: ref=${ref} ${fullRepoName}/${filePath}`)
    const fileInfo = getFileInfo(filePath)
    if (fileInfo.type === 'document' && this.data.treeData.length === 0) {
      await this.loadFileTree(this.data.repoDetail.full_name, this.data.ref)
    }
    const fileMeta = this.data.fileMap[filePath] || {}
    console.log('fileMeta:', fileMeta)
    const showSidebar = false
    let pushHistory = !isBack
    if (fileMeta.size > MAX_OPEN_FILE_SIZE) {
      this.setData!({
        showSidebar,
        filePath,
        fileSize: (fileMeta.size / 1024 / 1024).toFixed(2) + 'M',
        fileTooLarge: true
      })
    } else {
      wx.showLoading({
        title: '正在加载'
      })
      const fileTooLarge = false
      if (fileInfo.type === 'img') {
        this.setData!({
          showSidebar,
          fileTooLarge,
          ref,
          filePath,
          fileContent: '',
          fileType: fileInfo.type
        })
        setTimeout(wx.hideLoading, 1500)
      } else if (fileInfo.type === 'document') {
        this.setData!({
          showSidebar,
          fileTooLarge,
          ref,
          fileGitHash: fileMeta.sha,
          filePath,
          fileSize: (fileMeta.size / 1024 / 1024).toFixed(2) + 'M',
          fileContent: fileInfo.name,
          fileType: fileInfo.type
        })
        wx.hideLoading()
      } else {
        const result= await github.getFileContent({
          fullRepoName,
          filePath,
          ref
        })
        if (result.status === 'done') {
          const content = result.data
          this.setData!({
            showSidebar,
            fileTooLarge,
            ref,
            filePath,
            contextPath: `https://github.com/${fullRepoName}/raw/master/${filePath.replace(/[^\/]+$/, '')}`,
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
    }
    if (pushHistory) {
      this.data.history.push({
        ref: this.data.ref,
        path: filePath
      })
      this.setData!({
        showHistoryBack: this.data.history.length > 1
      })
    }
    app.footprint.push({
      type: 'file',
      url: `/pages/file-browser/index?r=${fullRepoName}&b=${ref}&p=${filePath}`,
      timestamp: new Date().getTime(),
      meta: {
        title: `${fullRepoName}/@${ref}/${filePath}`
      }
    })
  },
  viewImage (e: any) {
    const imgUrl = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [imgUrl],
      current: imgUrl
    })
  }
})
