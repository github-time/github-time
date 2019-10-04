//index.js
import * as minimatch from 'minimatch'
import Page from '../../common/page/index'
import { IMyApp } from '../../app'
import parseTree from '../../utils/data-parser/parseTree'
import github from '../../utils/helper/githubApi'
// @ts-ignore
import { $wuxToptips } from '../../common/lib/wux/index'
import fileTypeMap from './file-types'
import openDocument from '../../utils/helper/openDocument'
import { sleep, wrapLoading, getLinkInfo, parseRepoDetail, doHideLoading, setDataSync } from '../../utils/common'
import bookmarks from '../../utils/data-manager/bookmarks'

const MAX_OPEN_FILE_SIZE = 3 * 1024 * 1024 // 限制最大为2M

type FileState = {
  isBack: boolean
  scrollTop: number
  selected: number[]
}

type HistoryItem = {
  ref: string,
  path: string,
  scrollTop: number,
  selected: number[]
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
    fileSelected: [],
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
    mdPreview: true,
    isBookmarded: false
  },
  onShareAppMessage () {
    const current = this.data.history[this.data.history.length - 1]
    const scrollTop = current && current.scrollTop || 0
    const selected = current && current.selected || []
    return {
      title: 'Github Time',
      desc: `分享代码: ${this.data.repoDetail.full_name} ${this.data.filePath}`,
      path: `/pages/file-browser/index?r=${this.data.repoDetail.full_name}&b=${this.data.ref}&p=${this.data.filePath}&y=${scrollTop}&m=${selected.join(',')}&s=true`
    }
  },
  async onLoad (options: any) {
    // r 仓库 p 路径 s 分享标识 m 选中行 y 滚动
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
      const repoDetail = parseRepoDetail(app.globalData.repoDetail)
      this.setData!({
        repoDetail,
        ref: repoDetail.default_branch
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
    const selected = options.m ? options.m.split(',').map((n: string) => parseInt(n)) : []
    const scrollTop = options.y ? parseInt(options.y) : 0
    this.viewFile(fullRepoName, ref, filePath, {
      isBack: false,
      selected,
      scrollTop
    })
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
  onKeywordClear () {
    this.setData!({
      keyword: ''
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
    wx.showLoading({
      title: `切换到${this.data.mdPreview ? '代码' : '预览'}视图`
    })
    this.setData!({
      mdPreview: !this.data.mdPreview
    }, doHideLoading(500))
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
  onRepoTitleClick () {
    app.globalData.repoDetail = this.data.repoDetail as any
    app.globalData.ownerDetail = app.globalData.repoDetail!.owner
    wx.navigateTo({
      url: '/pages/repo-detail/index'
    })
  },
  onRepoUrlCopyClick () {
    wx.setClipboardData({
      data: `https://github.com/${this.data.repoDetail.full_name}`,
      success () {
        wx.showToast({
          title: '仓库链接已复制'
        })
      }
    })
  },
  onMarkdownAction (e: any) {
    switch (e.detail.type) {
      case 'link-tap':
        const href = e.detail.data.href
        const context = `https://github.com/${this.data.repoDetail.full_name}/blob/${this.data.ref}/${this.data.filePath}`
        const linkInfo = getLinkInfo(href, context)
        switch (linkInfo.type) {
          case 'github':
            const fullRepoName = linkInfo.full_name
            const filePath = linkInfo.filePath
            const ref = linkInfo.ref
            if (fullRepoName === this.data.repoDetail.full_name) {
              // 本仓库链接,直接打开
              this.viewFile(fullRepoName, this.data.ref, filePath)
            } else {
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

  onBack () {
    if (this.data.history.length > 1) {
      this.data.history.pop()
      const fullRepoName = this.data.repoDetail.full_name
      const history = this.data.history[this.data.history.length - 1]
      this.viewFile(fullRepoName, history.ref, history.path, {
        isBack: true,
        scrollTop: history.scrollTop,
        selected: history.selected
      })
      this.loadFileTree(fullRepoName, history.ref)
      this.setData!({
        showHistoryBack: this.data.history.length > 1
      })
    }
  },

  onScrollTopChange (e: any) {
    const current = this.data.history[this.data.history.length - 1]
    if (current) {
      current.scrollTop = e.detail.scrollTop
    }
  },

  onCodeSelectChange (e: any) {
    const current = this.data.history[this.data.history.length - 1]
    if (current) {
      current.selected = e.detail.selected
    }
  },

  onBookmark () {
    const fullRepoName = this.data.repoDetail.full_name
    const ref = this.data.ref
    const filePath = this.data.filePath
    const url = `/pages/file-browser/index?r=${fullRepoName}&b=${ref}&p=${filePath}`
    if (this.data.isBookmarded) {
      bookmarks.remove(url)
    } else {
      bookmarks.add({
        type: 'file',
        url,
        meta: {
          title: `${fullRepoName}/@${ref}/${filePath}`
        }
      })
    }
    this.setData!({
      isBookmarded: !this.data.isBookmarded
    })
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
    await wrapLoading('正在加载', async () => {
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
    })
  },

  async viewFile (fullRepoName: string, ref: string, filePath: string, { isBack = false, scrollTop = 0, selected = []}: FileState = {} as FileState) {
    if (!filePath) {
      this.showFileTree()
      return
    }
    console.log(`viewFile: ref=${ref} ${fullRepoName}/${filePath}`)
    const fileInfo = getFileInfo(filePath)
    if (fileInfo.type === 'document' && this.data.treeData.length === 0) {
      await this.loadFileTree(this.data.repoDetail.full_name, this.data.ref)
    }
    const fileMeta = this.data.fileMap[filePath] || {}
    console.log('fileMeta:', fileMeta)
    const showSidebar = false
    const fileTooLarge = fileMeta.size > MAX_OPEN_FILE_SIZE
    const fileSize = (fileMeta.size / 1024 / 1024).toFixed(2) + 'M'
    const contextPath = `https://github.com/${fullRepoName}/raw/master/${filePath.replace(/[^\/]+$/, '')}`
    let pushHistory = !isBack
    let fileContent = ''
    if (!fileTooLarge) {
      wrapLoading('正在加载', async () => {
        if (fileInfo.type === 'img') {
          await sleep(1000) // 等待1s
        } else if (fileInfo.type === 'document') {
          fileContent = fileInfo.name
        } else {
          const result= await github.getFileContent({
            fullRepoName,
            filePath,
            ref
          })
          if (result.status === 'done') {
            fileContent = result.data
          } else if (result.status === 'error') {
            $wuxToptips().error({
              hidden: false,
              text: '获取文件内容失败...',
              duration: 3000
            })
            console.error('Get file content failed: ', result.error)
            pushHistory = false
          }
        }
        await setDataSync(this, {
          showSidebar,
          fileTooLarge,
          ref,
          contextPath,
          filePath,
          fileSize,
          fileContent,
          fileType: fileInfo.type,
          fileGitHash: fileMeta.sha,
          fileScrollTop: scrollTop,
          fileSelected: selected
        }, 300, {
          onLongWait () {
            wx.showLoading({
              title: '努力加载中...'
            })
          }
        })
      })
    }
    if (pushHistory) {
      this.data.history.push({
        ref: this.data.ref,
        path: filePath,
        scrollTop,
        selected
      })
      this.setData!({
        showHistoryBack: this.data.history.length > 1
      })
    }
    const url = `/pages/file-browser/index?r=${fullRepoName}&b=${ref}&p=${filePath}`
    app.footprints.push({
      type: 'file',
      url,
      meta: {
        title: `${fullRepoName}/@${ref}/${filePath}`
      }
    })
    this.setData!({
      isBookmarded: !!bookmarks.get(url)
    })
  },
  previewImage (e: any) {
    const imgUrl = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [imgUrl],
      current: imgUrl
    })
  }
})
