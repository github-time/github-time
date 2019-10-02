
import resolvePathname from './helper/resolve-pathname'

const sleep = async (time: number) => new Promise(resolve => { setTimeout(resolve, time) })

function parseRepoDetail (repoDetail: any) {
  const owner = repoDetail.owner = repoDetail.owner || {}
  owner.login = owner.login || repoDetail.full_name.split('/')[0]
  // repoDetail.default_branch = repoDetail.default_branch || 'master'
  return repoDetail
}

function getLinkInfo (url: string, context?: string): any {
  url = resolvePathname(url)
  // https://github.com/${owner}/${repo}
  let matches = url.match(/^https:\/\/github.com\/([\w-]+)\/([\w-]+)/)
  const result = {
    type: 'unknown',
    full_name: '',
    ref: '',
    filePath: ''
  }
  if (matches) {
    result.type = 'github' // github 链接
    // Github 内部链接
    const fullRepoName = `${matches[1]}/${matches[2]}`
    result.full_name = fullRepoName
    // https://github.com/${owner}/${repo}/blob/${path}
    matches = url.match(/^https:\/\/github.com\/[\w-]+\/[\w-]+\/blob\/([\w-]+)\/(.*)/)
    if (matches) {
      // 带文件路径
      result.ref = matches[1]
      result.filePath = matches[2].replace(/^\//, '')
    }
    console.log('github link:', url)
  } else if (url.match(/^http(|s):\/\//)) {
    result.type = 'normal' // 普通外部链接
    console.log('normal link:', url)
  } else {
    result.type = 'relative' // 相对链接
    console.log('relative link:', url)
    if (context) {
      return getLinkInfo(resolvePathname(url, context))
    }
  }
  return result
}

async function wrapLoading (title: string, task: Promise<void>|(() => Promise<void>)) {
  wx.showLoading({
    title
  })
  if (task instanceof Promise) {
    await task
  } else {
    await task()
  }
  wx.hideLoading()
}

export {
  sleep,
  wrapLoading,
  parseRepoDetail,
  getLinkInfo
}
