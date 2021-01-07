import { Base64 } from 'js-base64'
import requestWithCache from '../data-fetcher/requestWithCache'
import callCloudFunctionWithCache, { CallResult } from '../data-fetcher/callCloudFunctionWithCache'
import settings from '../data-manager/settings'

const githubApiUrl = 'https://api.github.com'

type EmojiMap = {[key: string]: string}

type SuccessResult<T> = {
  status: 'done'
  data: T,
  cache_date?: number
}

type ErrorResult<T> = {
  status: 'error'
  error: {
    code: number | string
  },
  data: T
}

type Result<T> = Promise<SuccessResult<T>|ErrorResult<T>>

function nullSearchResult () {
  return {
    total_count: 0,
    incomplete_results: true,
    items: []
  }
}

function errorResult<T> (code: number|string, nullData: T): ErrorResult<T> {
  return {
    status: 'error',
    error: { code },
    data: nullData
  }
}

function successResult<T> (data: T, res: wx.RequestSuccessCallbackResult|CallResult): SuccessResult<T> {
  return {
    status: 'done',
    data,
    cache_date: (res as any).cache_date
  }
}

function requestFactory (request: wx.RequestOption) {
  const githubConfig = settings.get('githubConfig', {})
  const token = githubConfig && githubConfig.token // 尝试使用token
  const user = githubConfig && githubConfig.user
  if (token) {
    request.header = request.header || {}
    ;(request.header as any).Authorization = `token ${token}`
  }
  return {
    request,
    token,
    user
  }
}

function cloudRequestFactory (url: string) {
  return {
    name: 'request',
    data: {
      url
    }
  }
}

function resultFactory<T> (
  {
    nullData = {} as T,
    successData = res => res.data
  }:{
    nullData?: T,
    successData?: (res: any) => T
  } = {},
  successCode = 200
) {
  return (res: wx.RequestSuccessCallbackResult|CallResult) => {
    if ('statusCode' in res) {
      return res.statusCode === successCode
        ? successResult<T>(successData(res), res)
        : errorResult(res.statusCode, nullData)
    } else {
      const result = res.result as any
      return res.errMsg === 'cloud.callFunction:ok' && result.status === successCode
        ? successResult<T>(successData(res), res)
        : errorResult(res.errMsg, nullData)
    }
  }
}

async function checkToken (token: string, cleanCache = false): Result<github.users.UserDetail> {
  console.log(`checkToken`)
  return requestWithCache(
    {
      url: `${githubApiUrl}/user`,
      header: { Authorization:`token ${token}`}
    },
    { timeout: 120, group: 'CheckToken', discard: cleanCache, key: token}
  ).then(resultFactory({ nullData: {} as github.users.UserDetail }))
}

async function getGithubEmojis (cleanCache: boolean = false): Result<EmojiMap> {
  const url = `${githubApiUrl}/emojis`
  console.log(`getGithubEmojis...`)
  return requestWithCache(
    { url },
    { timeout: 60 * 24 * 7, group: `GithubEmojis`, maxsize: 512 * 1024, discard: cleanCache }
  ).then(resultFactory<EmojiMap>())
}

async function searchTopics ({
  keyword,
  pageSize,
  pageNo = 1,
  cleanCache = false
}: {
  keyword: string,
  pageSize: number,
  pageNo?: number,
  cleanCache?: boolean
}): Result<github.topics.SearchResult> {
  const url = `${githubApiUrl}/search/topics?q=${keyword}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchTopics`)
  return requestWithCache(
    requestFactory({
      url,
      header: { Accept: 'application/vnd.github.mercy-preview+json' }
    }).request,
    { timeout: 120, group: 'SearchData#topics', discard: cleanCache }
  ).then(resultFactory({ nullData: nullSearchResult() }))
}

async function getAllTopics () {
  console.log(`getAllTopics`)
  let pageNo = 0
  let topics: github.topics.SearchResultItem[] = []
  while (true) {
    pageNo++
    const result = await searchTopics ({ keyword: 'is:featured', pageNo, pageSize: 30 })
    topics = topics.concat(result.data!.items)
    if (topics.length >= result.data!.total_count || result.data!.items.length === 0) {
      break
    }
  }
  return topics
}

async function searchUsers ({
  keyword,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc',
  cleanCache = false
}: {
  keyword: string,
  pageSize: number,
  pageNo?: number,
  sort?: string,
  order?: string,
  cleanCache?: boolean
}): Result<github.users.SearchResult> {
  const url = `${githubApiUrl}/search/users?q=${keyword}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchUsers: keyword=${keyword}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: 'SearchData#users', discard: cleanCache }
  ).then(resultFactory({ nullData: nullSearchResult() }))
}

async function searchRepositories ({
  query,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc',
  cleanCache = false
}: {
  query: string,
  pageSize: number,
  pageNo?: number,
  sort?: string,
  order?: string,
  cleanCache?: boolean
}): Result<github.repos.SearchResult> {
  const url = `${githubApiUrl}/search/repositories?q=${query}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchRepositories: keyword=${query}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: 'SearchData#repos', discard: cleanCache }
  ).then(resultFactory({ nullData: nullSearchResult() }))
}

async function searchIssues ({
  keyword,
  pageSize,
  pageNo = 1,
  sort = '',
  order = 'desc',
  cleanCache = false
}: {
  keyword: string,
  pageSize: number,
  pageNo?: number,
  sort?: string,
  order?: string,
  cleanCache?: boolean
}): Result<github.issues.SearchResult> {
  let group = 'SearchData#issues'
  const matches = keyword.match(/\brepo:([\w-]+\/[\w-]+)/)
  if (matches) {
    group = `RepoData#${matches[1]}$issues`
  }
  const url = `${githubApiUrl}/search/issues?q=${keyword}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchIssues: keyword=${keyword}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group, discard: cleanCache }
  ).then(resultFactory({ nullData: nullSearchResult() }))
}

async function getRepositoryDetail (fullRepoName: string, cleanCache?: boolean): Result<github.repos.RepoDetail> {
  const url = `${githubApiUrl}/repos/${fullRepoName}`
  console.log(`getRepositoryDetail: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory<github.repos.RepoDetail>())
}

async function getRepositoryBranches (fullRepoName: string, cleanCache?: boolean): Result<github.repos.RepoBranche[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/branches`
  console.log(`getRepositoryBranches: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory({ nullData: [] }))
}

async function getRepositoryEvents ({
  fullRepoName,
  pageSize,
  pageNo = 1,
  cleanCache = false
}: {
  fullRepoName: string,
  pageSize: number,
  pageNo?: number,
  cleanCache?: boolean
}): Result<github.events.UserEvent[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/events?per_page=${pageSize}&page=${pageNo}`
  console.log(`getRepositoryEvents: repo=${fullRepoName}, pageSize=${pageSize}, pageNo=${pageNo}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory({ nullData: [] }))
}

async function getRepositoryIssueEvents ({
  fullRepoName,
  pageSize,
  pageNo = 1,
  cleanCache = false
}: {
  fullRepoName: string,
  pageSize: number,
  pageNo?: number,
  cleanCache?: boolean
}): Result<github.issues.IssueEvent[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/issues/events?per_page=${pageSize}&page=${pageNo}`
  console.log(`getRepositoryIssueEvents: repo=${fullRepoName}, pageSize=${pageSize}, pageNo=${pageNo}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory({ nullData: [] }))
}

async function getRepositoryIssueTimeline ({
  fullRepoName,
  issueNo,
  pageSize,
  pageNo = 1,
  cleanCache = false
}: {
  fullRepoName: string,
  issueNo: number,
  pageSize: number,
  pageNo?: number,
  cleanCache?: boolean
}): Result<github.issues.IssueTimeline[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/issues/${issueNo}/timeline?per_page=${pageSize}&page=${pageNo}`
  console.log(`getRepositoryIssueTimeline: repo=${fullRepoName}, pageSize=${pageSize}, pageNo=${pageNo}`)
  return requestWithCache(
    requestFactory({
      url,
      header: { Accept: 'application/vnd.github.mockingbird-preview' }
    }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}$issues`, discard: cleanCache }
  ).then(resultFactory({ nullData: [] }))
}

async function getUserDetail (owner: string, cleanCache?: boolean): Result<github.users.UserDetail> {
  let key = ''
  const req = requestFactory({ url: `${githubApiUrl}/user` })
  if (req.token && owner === req.user) {
    key = `${req.token}:user`
  } else {
    req.request.url = `${githubApiUrl}/users/${owner}`
  }
  console.log(`getUserDetail(${req.request.url}): login=${owner}`)
  return requestWithCache(
    req.request,
    { timeout: 30, group: `UserData#${owner}`, discard: cleanCache, key }
  ).then(resultFactory<github.users.UserDetail>())
}

async function getUserRepositories ({
  owner,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc',
  cleanCache = false
}: {
  owner: string,
  pageSize: number,
  pageNo?: number,
  sort?: string,
  order?: string,
  cleanCache?: boolean
}): Result<github.repos.SearchResultItem[]> {
  let key = ''
  const query = `repos?sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  const req = requestFactory({ url: `${githubApiUrl}/user/${query}` })

  if (req.token && owner === req.user) {
    key = `${req.token}:${query}`
  } else {
    req.request.url = `${githubApiUrl}/users/${owner}/${query}`
  }
  console.log(`getUserRepositories(${req.request.url}): owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    req.request,
    { timeout: 30, group: `UserData#${owner}`, discard: cleanCache, key }
  ).then(resultFactory({ nullData: [] }))
}

async function getUserStaring ({
  owner,
  pageSize,
  pageNo = 1,
  sort = 'created',
  order = 'desc',
  cleanCache = false
}: {
  owner: string,
  pageSize: number,
  pageNo?: number,
  sort?: string,
  order?: string,
  cleanCache?: boolean
}): Result<github.repos.SearchResultItem[]> {
  const url = `${githubApiUrl}/users/${owner}/starred?sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`getUserStaring: owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `UserData#${owner}`, discard: cleanCache }
  ).then(resultFactory({ nullData: [] }))
}

async function getUserEvents ({
  owner,
  pageSize,
  pageNo = 1,
  cleanCache = false
}: {
  owner: string,
  pageSize: number,
  pageNo?: number,
  cleanCache?: boolean
}): Result<github.events.UserEvent[]> {
  const url = `${githubApiUrl}/users/${owner}/events?per_page=${pageSize}&page=${pageNo}`
  console.log(`getUserEvents: owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `UserData#${owner}`, discard: cleanCache }
  ).then(resultFactory({ nullData: [] }))
}

async function getFileTree ({
  fullRepoName,
  ref = 'master',
  cleanCache = false
}: {
  fullRepoName: string,
  ref?: string,
  cleanCache?: boolean
}): Result<github.repos.TreeItem[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/git/trees/${ref}?recursive=1`
  console.log(`getFileTree: fullRepoName=${fullRepoName}, ref=${ref}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}`, maxsize: 256 * 1024, discard: cleanCache }
  ).then(resultFactory({ nullData: [], successData: res => res.data.tree }))
}

async function getReadmeContent ({
  fullRepoName,
  ref = 'master',
  cleanCache = false
}: {
  fullRepoName: string,
  ref?: string,
  cleanCache?: boolean
}): Result<string> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/readme?ref=${ref}`
  console.log(`getReadmeContent: fullRepoName=${fullRepoName}, ref=${ref}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory({
    nullData: '',
    successData: res => Base64.decode(res.data.content)
  }))
}

async function getReadme ({
  fullRepoName,
  cleanCache = false
}: {
  fullRepoName: string,
  ref?: string,
  cleanCache?: boolean
}): Result<{content: string, path: string, ref: string}> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/readme`
  console.log(`getReadme: fullRepoName=${fullRepoName}`)
  let path = 'README.md'
  let ref = 'master'
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory({
    nullData: {
      content: '',
      path,
      ref
    },
    successData: res => {
      const contentInfo = res.data as github.repos.Contents
      const matches = contentInfo.url.match(/^https:\/\/api\.github\.com\/repos\/[\w-]+\/[\w-]+\/contents\/(.*)?ref=(.*)$/)
      if (matches) {
        path = matches[1]
        ref =  matches[2]
      }
      return {
        content: Base64.decode(contentInfo.content),
        path,
        ref
      }
    }
  }))
}

async function getFileContent ({
  fullRepoName,
  filePath,
  ref = 'master',
  cleanCache = false
}: {
  fullRepoName:string,
  filePath: string,
  ref?: string,
  cleanCache?: boolean
}): Result<string> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/contents/${filePath}?ref=${ref}`
  console.log(`getFileContent: fullRepoName=${fullRepoName}, filePath=${filePath}, ref=${ref}`)
  return requestWithCache(
    requestFactory({ url }).request,
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory({
    nullData: '',
    successData: res => Base64.decode(res.data.content)
  }))
}

async function star (fullRepoName: string): Result<boolean> {
  const url = `${githubApiUrl}/user/starred/${fullRepoName}`
  console.log(`star: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ method: 'PUT', url }).request,
    false, // 关闭缓存
    { successCode: 204 }
  ).then(resultFactory({ nullData: false, successData: () => true }, 204))
}

async function unstar (fullRepoName: string): Result<boolean>  {
  const url = `${githubApiUrl}/user/starred/${fullRepoName}`
  console.log(`unstar: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ method: 'DELETE', url }).request,
    false, // 关闭缓存
    { successCode: 204 }
  ).then(resultFactory({ nullData: false, successData: () => true }, 204))
}

async function isStarred (fullRepoName: string): Result<boolean>  {
  const url = `${githubApiUrl}/user/starred/${fullRepoName}`
  console.log(`isStarred: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ url }).request,
    false, // 关闭缓存
    { successCode: 204 }
  ).then(resultFactory({ nullData: false, successData: () => true }, 204))
}

async function getGithubReposTrending ({
  language = '',
  since = 'daily',
  cleanCache = false
}: {
  language?: string,
  since?:'daily'|'weekly'|'monthly',
  cleanCache?: boolean
} = {}): Result<github.trending.Repository[]> {
  // const url = `https://github-trending-api.now.sh/repositories?language=${language}&since=${since}`
  console.log(`getGithubRepoTrending: language=${language} since=${since}`)
  return callCloudFunctionWithCache(
    // cloudRequestFactory(url),
    {
      name: 'github-trending',
      data: {
        type: 'repositories',
        params: {
          language,
          since
        }
      }
    },
    { timeout: 60, group: 'TrendingData#repos', discard: cleanCache }
  ).then(resultFactory({ nullData: [], successData: (res) => {
    console.log(res.result.data)
    return res.result.data
  }}))
}

async function getGithubUsersTrending ({
  language = '',
  since = 'daily',
  cleanCache = false
}: {
  language?: string,
  since?: 'daily'|'weekly'|'monthly',
  cleanCache?: boolean
} = {}): Result<github.trending.Developer[]> {
  // const url = `https://github-trending-api.now.sh/developers?language=${language}&since=${since}`
  console.log(`getGithubUserTrending: language=${language} since=${since}`)
  return callCloudFunctionWithCache(
    // cloudRequestFactory(url),
    {
      name: 'github-trending',
      data: {
        type: 'developers',
        params: {
          language,
          since
        }
      }
    },
    { timeout: 60, group: 'TrendingData#users', discard: cleanCache }
  ).then(resultFactory({ nullData: [], successData: (res) => res.result.data }))
}

export default {
  checkToken,
  getGithubEmojis,
  getAllTopics,
  searchTopics,
  searchUsers,
  searchRepositories,
  searchIssues,
  getRepositoryDetail,
  getRepositoryBranches,
  getRepositoryEvents,
  getRepositoryIssueEvents,
  getRepositoryIssueTimeline,
  getUserDetail,
  getUserStaring,
  getUserEvents,
  getUserRepositories,
  getFileTree,
  getFileContent,
  getReadmeContent,
  getReadme,
  star,
  unstar,
  isStarred,
  getGithubReposTrending,
  getGithubUsersTrending
}
