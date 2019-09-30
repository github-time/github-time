import { Base64 } from 'js-base64'
import requestWithCache from '../data-fetcher/requestWithCache'
import callCloudFunctionWithCache, { CallResult } from '../data-fetcher/callCloudFunctionWithCache'

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

type Token = {
  user: string,
  token: string
}

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

function requestFactory (req: wx.RequestOption, token?: Token) {
  if (token && token.token) {
    req.header = req.header || {}
    ;(req.header as any).Authorization = `token ${token.token}`
  }
  return req
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

async function checkToken (token: Token, cleanCache = false): Result<github.users.UserDetail> {
  const url = `${githubApiUrl}/user`
  console.log(`checkToken`)
  return requestWithCache(
    requestFactory({ url }, token),
    { timeout: 120, group: 'CheckToken', discard: cleanCache, key: token.token }
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
  token,
  cleanCache = false
}: {
  keyword: string,
  pageSize: number,
  pageNo?: number,
  token?: Token,
  cleanCache?: boolean
}): Result<github.topics.SearchResult> {
  const url = `${githubApiUrl}/search/topics?q=${keyword}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchTopics`)
  return requestWithCache(
    requestFactory({
      url,
      header: { Accept: 'application/vnd.github.mercy-preview+json' }
    }, token),
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

async function searchRepositories ({
  query,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc',
  token,
  cleanCache = false
}: {
  query: string,
  pageSize: number,
  pageNo?: number,
  sort?: string,
  order?: string,
  token?: Token,
  cleanCache?: boolean
}): Result<github.repos.SearchResult> {
  const url = `${githubApiUrl}/search/repositories?q=${query}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchRepositories: keyword=${query}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    requestFactory({ url }, token),
    { timeout: 30, group: 'SearchData#repos', discard: cleanCache }
  ).then(resultFactory({ nullData: nullSearchResult() }))
}

async function getRepositoryDetail (fullRepoName: string, token?: Token, cleanCache?: boolean): Result<github.repos.RepoDetail> {
  const url = `${githubApiUrl}/repos/${fullRepoName}`
  console.log(`getRepositoryDetail: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ url }, token),
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory<github.repos.RepoDetail>())
}

async function getRepositoryBranches (fullRepoName: string, token?: Token, cleanCache?: boolean): Result<github.repos.RepoBranche[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/branches`
  console.log(`getRepositoryBranches: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ url }, token),
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory({ nullData: [] }))
}

async function getUserDetail (owner: string, token?: Token, cleanCache?: boolean): Result<github.users.UserDetail> {
  let url
  let key = ''
  if (token && owner === token.user) {
    key = `${token.token}:user`
    url = `${githubApiUrl}/user`
  } else {
    url = `${githubApiUrl}/users/${owner}`
  }
  console.log(`getUserDetail: login=${owner}`)
  return requestWithCache(
    requestFactory({ url }, token),
    { timeout: 30, group: `UserData#${owner}`, discard: cleanCache, key }
  ).then(resultFactory<github.users.UserDetail>())
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
    { url },
    { timeout: 30, group: 'SearchData#users', discard: cleanCache }
  ).then(resultFactory({ nullData: nullSearchResult() }))
}

async function getUserRepositories ({
  owner,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc',
  token,
  cleanCache = false
}: {
  owner: string,
  pageSize: number,
  pageNo?: number,
  sort?: string,
  order?: string,
  token?: Token,
  cleanCache?: boolean
}): Result<github.repos.SearchResultItem[]> {
  let url
  let key = ''
  const query = `repos?sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  if (token && token.token && owner === token.user) {
    key = `${token.token}:${query}`
    url = `${githubApiUrl}/user/${query}`
  } else {
    url = `${githubApiUrl}/users/${owner}/${query}`
  }
  console.log(`searchRepositories: owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    requestFactory({ url }, token),
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
    { url },
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
    { url },
    { timeout: 30, group: `RepoData#${fullRepoName}`, maxsize: 256 * 1024, discard: cleanCache }
  ).then(resultFactory({ nullData: [] }))
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
    { url },
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
    { url },
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
    { url },
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then(resultFactory({
    nullData: '',
    successData: res => Base64.decode(res.data.content)
  }))
}

async function star (fullRepoName: string, token: Token): Result<boolean> {
  const url = `${githubApiUrl}/user/starred/${fullRepoName}`
  console.log(`star: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ method: 'PUT', url }, token),
    false, // 关闭缓存
    { successCode: 204 }
  ).then(resultFactory({ nullData: false, successData: () => true }, 204))
}

async function unstar (fullRepoName: string, token: Token): Result<boolean>  {
  const url = `${githubApiUrl}/user/starred/${fullRepoName}`
  console.log(`unstar: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ method: 'DELETE', url }, token),
    false, // 关闭缓存
    { successCode: 204 }
  ).then(resultFactory({ nullData: false, successData: () => true }, 204))
}

async function isStarred (fullRepoName: string, token: Token): Result<boolean>  {
  const url = `${githubApiUrl}/user/starred/${fullRepoName}`
  console.log(`isStarred: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    requestFactory({ url }, token),
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
  const url = `https://github-trending-api.now.sh/repositories?language=${language}&since=${since}`
  console.log(`getGithubRepoTrending: language=${language} since=${since}`)
  return callCloudFunctionWithCache(
    cloudRequestFactory(url),
    { timeout: 60, group: 'TrendingData#repos', discard: cleanCache }
  ).then(resultFactory({ nullData: [], successData: (res) => res.result.data }))
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
  const url = `https://github-trending-api.now.sh/developers?language=${language}&since=${since}`
  console.log(`getGithubUserTrending: language=${language} since=${since}`)
  return callCloudFunctionWithCache(
    cloudRequestFactory(url),
    { timeout: 60, group: 'TrendingData#users', discard: cleanCache }
  ).then(resultFactory({ nullData: [], successData: (res) => res.result.data }))
}

export default {
  checkToken,
  getAllTopics,
  searchTopics,
  searchRepositories,
  getRepositoryDetail,
  getRepositoryBranches,
  getUserDetail,
  searchUsers,
  getFileContent,
  getReadmeContent,
  getReadme,
  getFileTree,
  getUserStaring,
  getUserRepositories,
  getGithubEmojis,
  star,
  unstar,
  isStarred,
  getGithubReposTrending,
  getGithubUsersTrending
}
