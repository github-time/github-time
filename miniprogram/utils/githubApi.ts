import { Base64 } from 'js-base64'
import requestWithCache from './requestWithCache'
import callCloudFunctionWithCache from './callCloudFunctionWithCache'

const githubApiUrl = 'https://api.github.com'

type ResultStatus = 'done'|'error'
type Result<T> = Promise<{
  status: ResultStatus
  error?: Error
  data: T
  cache_date?: number
}>

function nullSearchResult () {
  return {
    total_count: 0,
    incomplete_results: true,
    items: []
  }
}

async function searchTopics ({
  keyword,
  pageSize,
  pageNo = 1,
  cleanCache = false
}: {keyword: string, pageSize: number, pageNo?: number, cleanCache?: boolean}): Result<github.topics.SearchResult> {
  const url = `${githubApiUrl}/search/topics?q=${keyword}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchTopics`)
  return requestWithCache(
    {
      url,
      header: {
        Accept: 'application/vnd.github.mercy-preview+json'
      }
    },
    { timeout: 120, group: 'SearchData#topics', discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as github.topics.SearchResult,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: nullSearchResult()
      }
    }
  })
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
  cleanCache = false
}: {query: string, pageSize: number, pageNo?: number, sort?: string, order?: string, cleanCache?: boolean}): Result<github.repos.SearchResult> {
  const url = `${githubApiUrl}/search/repositories?q=${query}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchRepositories: keyword=${query}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: 'SearchData#repos', discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as github.repos.SearchResult,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: nullSearchResult()
      }
    }
  })
}

async function getRepositoryDetail (fullRepoName: string, cleanCache?: boolean): Result<github.repos.RepoDetail> {
  const url = `${githubApiUrl}/repos/${fullRepoName}`
  console.log(`getRepositoryDetail: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as github.repos.RepoDetail,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: {} as any
      }
    }
  })
}

async function getRepositoryBranches (fullRepoName: string, cleanCache?: boolean): Result<github.repos.RepoBranche[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/branches`
  console.log(`getRepositoryBranches: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as github.repos.RepoBranche[],
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: {} as any
      }
    }
  })
}

async function getUserDetail (owner: string, cleanCache?: boolean): Result<github.users.UserDetail> {
  const url = `${githubApiUrl}/users/${owner}`
  console.log(`getUserDetail: login=${owner}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `UserData#${owner}`, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as github.users.UserDetail,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: {} as any
      }
    }
  })
}

async function searchUsers ({
  keyword,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc',
  cleanCache = false
}: {keyword: string, pageSize: number, pageNo?: number, sort?: string, order?: string, cleanCache?: boolean}): Result<github.users.SearchResult> {
  const url = `${githubApiUrl}/search/users?q=${keyword}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchUsers: keyword=${keyword}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: 'SearchData#users', discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as github.users.SearchResult,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: nullSearchResult()
      }
    }
  })
}

async function getUserRepositories ({
  owner,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc',
  cleanCache = false
}: {owner: string, pageSize: number, pageNo?: number, sort?: string, order?: string, cleanCache?: boolean}): Result<github.repos.SearchResultItem[]> {
  const url = `${githubApiUrl}/users/${owner}/repos?sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchRepositories: owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `UserData#${owner}`, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as github.repos.SearchResultItem[],
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: []
      }
    }
  })
}

async function getUserStaring ({
  owner,
  pageSize,
  pageNo = 1,
  sort = 'created',
  order = 'desc',
  cleanCache = false
}: {owner: string, pageSize: number, pageNo?: number, sort?: string, order?: string, cleanCache?: boolean}): Result<github.repos.SearchResultItem[]> {
  const url = `${githubApiUrl}/users/${owner}/starred?sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`getUserStaring: owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `UserData#${owner}`, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as github.repos.SearchResultItem[],
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: []
      }
    }
  })
}

async function getFileTree ({
  fullRepoName,
  ref = 'master',
  cleanCache = false
}: { fullRepoName:string, ref?: string, cleanCache?: boolean }): Result<github.repos.TreeItem[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/git/trees/${ref}?recursive=1`
  console.log(`getFileTree: fullRepoName=${fullRepoName}, ref=${ref}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `RepoData#${fullRepoName}`, maxsize: 256 * 1024, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: (res.data as {tree: any}).tree,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: []
      }
    }
  })
}

async function getReadmeContent ({
  fullRepoName,
  ref = 'master',
  cleanCache = false
}: {fullRepoName:string, ref?: string, cleanCache?: boolean }): Result<string> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/readme?ref=${ref}`
  console.log(`getReadmeContent: fullRepoName=${fullRepoName}, ref=${ref}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      // TODO: 支持缓存 key 替换
      return {
        status: 'done' as ResultStatus,
        data: Base64.decode((res.data as github.repos.Contents).content),
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: ''
      }
    }
  })
}

async function getReadme ({
  fullRepoName,
  cleanCache = false
}: {fullRepoName:string, ref?: string, cleanCache?: boolean }): Result<{content: string, path: string, ref: string}> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/readme`
  console.log(`getReadme: fullRepoName=${fullRepoName}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then((res) => {
    let path = 'README.md'
    let ref = 'master'
    if (res.statusCode === 200) {
      // TODO: 支持缓存 key 替换
      const contentInfo = res.data as github.repos.Contents
      const matches = contentInfo.url.match(/^https:\/\/api\.github\.com\/repos\/[\w-]+\/[\w-]+\/contents\/(.*)?ref=(.*)$/)
      if (matches) {
        path = matches[1]
        ref =  matches[2]
      }
      return {
        status: 'done' as ResultStatus,
        data: {
          content: Base64.decode(contentInfo.content),
          path,
          ref
        },
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: {
          content: '',
          path,
          ref
        }
      }
    }
  })
}

async function getFileContent ({
  fullRepoName,
  filePath,
  ref = 'master',
  cleanCache = false
}: {fullRepoName:string, filePath: string, ref?: string, cleanCache?: boolean }): Result<string> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/contents/${filePath}?ref=${ref}`
  console.log(`getFileContent: fullRepoName=${fullRepoName}, filePath=${filePath}, ref=${ref}`)
  return requestWithCache(
    { url },
    { timeout: 30, group: `RepoData#${fullRepoName}`, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: Base64.decode((res.data as github.repos.Contents).content),
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: ''
      }
    }
  })
}

type EmojiMap = {[key: string]: string}

async function getGithubEmojis (cleanCache: boolean = false): Result<EmojiMap> {
  const url = `${githubApiUrl}/emojis`
  console.log(`getGithubEmojis...`)
  return requestWithCache(
    { url },
    { timeout: 60 * 24 * 7, group: `GithubEmojis`, maxsize: 512 * 1024, discard: cleanCache }
  ).then((res) => {
    if (res.statusCode === 200) {
      return {
        status: 'done' as ResultStatus,
        data: res.data as EmojiMap,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`statusCode: ${res.statusCode}`),
        data: {}
      }
    }
  })
}

async function getGithubReposTrending ({
  language = '',
  since = 'daily',
  cleanCache = false
}: {language?:string, since?:'daily'|'weekly'|'monthly', cleanCache?: boolean} = {}): Result<github.trending.Repository[]> {
  const url = `https://github-trending-api.now.sh/repositories?language=${language}&since=${since}`
  console.log(`getGithubRepoTrending: language=${language} since=${since}`)
  return callCloudFunctionWithCache(
    {
      name: 'request',
      data: {
        url
      }
    },
    { timeout: 60, group: 'TrendingData#repos', discard: cleanCache }
  ).then((res) => {
    if (res.errMsg === 'cloud.callFunction:ok' && (res.result as any).status === 200) {
      return {
        status: 'done' as ResultStatus,
        data: (res.result as any).data,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`errMsg: ${res.errMsg}`),
        data: []
      }
    }
  })
}

async function getGithubUsersTrending ({
  language = '',
  since = 'daily',
  cleanCache = false
}: {language?:string, since?:'daily'|'weekly'|'monthly', cleanCache?: boolean} = {}): Result<github.trending.Developer[]> {
  const url = `https://github-trending-api.now.sh/developers?language=${language}&since=${since}`
  console.log(`getGithubUserTrending: language=${language} since=${since}`)
  return callCloudFunctionWithCache(
    {
      name: 'request',
      data: {
        url
      }
    },
    { timeout: 60, group: 'TrendingData#users', discard: cleanCache }
  ).then((res) => {
    if (res.errMsg === 'cloud.callFunction:ok' && (res.result as any).status === 200) {
      return {
        status: 'done' as ResultStatus,
        data: (res.result as any).data,
        cache_date: (res as any).cache_date
      }
    } else {
      return {
        status: 'error' as ResultStatus,
        error: new Error(`errMsg: ${res.errMsg}`),
        data: []
      }
    }
  })
}

export default {
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
  getGithubReposTrending,
  getGithubUsersTrending
}
