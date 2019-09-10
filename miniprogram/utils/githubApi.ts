import { Base64 } from 'js-base64'
import requestWithCache from './requestWithCache'
import callCloudFunctionWithCache from './callCloudFunctionWithCache'

const githubApiUrl = 'https://api.github.com'

type Result<T> = Promise<{
  status: 'done'|'error'
  error?: Error
  data: T
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
  pageNo = 1
}: {keyword: string, pageSize: number, pageNo?: number}): Result<github.topics.SearchResult> {
  const url = `${githubApiUrl}/search/topics?q=${keyword}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchTopics`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      header: {
        Accept: 'application/vnd.github.mercy-preview+json'
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve({
            status: 'done',
            data: res.data as github.topics.SearchResult
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: nullSearchResult()
          })
        }
      }
    }, { timeout: 120, group: 'SearchData#topics'})
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
  order = 'desc'
}: {query: string, pageSize: number, pageNo?: number, sort?: string, order?: string}): Result<github.repos.SearchResult> {
  const url = `${githubApiUrl}/search/repositories?q=${query}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchRepositories: keyword=${query}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      success(res) {
        if (res.statusCode === 200) {
          resolve({
            status: 'done',
            data: res.data as github.repos.SearchResult
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: nullSearchResult()
          })
        }
      }
    }, { timeout: 30, group: 'SearchData#repos'})
  })
}

async function getRepositoryDetail (fullRepoName: string): Result<github.repos.SearchResultItem> {
  const url = `${githubApiUrl}/repos/${fullRepoName}`
  console.log(`getRepositoryDetail: fullRepoName=${fullRepoName}`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      success(res) {
        if (res.statusCode === 200) {
          resolve({
            status: 'done',
            data: res.data as github.repos.SearchResultItem
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: {} as any
          })
        }
      }
    }, { timeout: 30, group: `RepoData#${fullRepoName}`})
  })
}

async function searchUsers ({
  keyword,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc'
}: {keyword: string, pageSize: number, pageNo?: number, sort?: string, order?: string}): Result<github.users.SearchResult> {
  const url = `${githubApiUrl}/search/users?q=${keyword}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchUsers: keyword=${keyword}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      success(res) {
        if (res.statusCode === 200) {
          resolve({
            status: 'done',
            data: res.data as github.users.SearchResult
          })
        } else {
          resolve({
            status: 'done',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: nullSearchResult()
          })
        }
      }
    }, { timeout: 30, group: 'SearchData#users'})
  })
}

async function getUserRepositories ({
  owner,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc'
}: {owner: string, pageSize: number, pageNo?: number, sort?: string, order?: string}): Result<github.repos.SearchResultItem[]> {
  const url = `${githubApiUrl}/users/${owner}/repos?sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchRepositories: owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      success(res) {
        if (res.statusCode === 200) {
          resolve({
            status: 'done',
            data: res.data as github.repos.SearchResultItem[]
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: []
          })
        }
      }
    }, { timeout: 30, group: `UserData#${owner}`})
  })
}

async function getUserStaring ({
  owner,
  pageSize,
  pageNo = 1,
  sort = 'created',
  order = 'desc'
}: {owner: string, pageSize: number, pageNo?: number, sort?: string, order?: string}): Result<github.repos.SearchResultItem[]> {
  const url = `${githubApiUrl}/users/${owner}/starred?sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`getUserStaring: owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      success(res) {
        if (res.statusCode === 200) {
          resolve({
            status: 'done',
            data: res.data as github.repos.SearchResultItem[]
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: []
          })
        }
      }
    }, { timeout: 30, group: `UserData#${owner}`})
  })
}

async function getFileTree ({
  fullRepoName,
  ref = 'master'
}: { fullRepoName:string, ref?: string }): Result<github.repos.TreeItem[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/git/trees/${ref}?recursive=1`
  console.log(`getFileTree: fullRepoName=${fullRepoName}, ref=${ref}`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve({
            status: 'done',
            data: (res.data as {tree: any}).tree
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: []
          })
        }
      }
    }, { timeout: 60, group: `RepoData#${fullRepoName}`})
  })
}

async function getReadmeContent ({
  fullRepoName,
  ref = 'master'
}: {fullRepoName:string, ref?: string }): Result<string> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/readme?ref=${ref}`
  console.log(`getReadmeContent: fullRepoName=${fullRepoName}, ref=${ref}`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          // TODO: 支持缓存 key 替换
          resolve({
            status: 'done',
            data: Base64.decode((res.data as github.repos.Contents).content)
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: ''
          })
        }
      }
    }, { timeout: 60, group: `RepoData#${fullRepoName}`}) // 共享 getFileContent 缓存组
  })
}

async function getFileContent ({
  fullRepoName,
  filePath,
  ref = 'master'
}: {fullRepoName:string, filePath: string, ref?: string }): Result<string> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/contents/${filePath}?ref=${ref}`
  console.log(`getFileContent: fullRepoName=${fullRepoName}, filePath=${filePath}, ref=${ref}`)
  return new Promise((resolve) => {
    requestWithCache({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve({
            status: 'done',
            data: Base64.decode((res.data as github.repos.Contents).content)
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`statusCode: ${res.statusCode}`),
            data: ''
          })
        }
      }
    }, { timeout: 60, group: `RepoData#${fullRepoName}`})
  })
}

async function getGithubReposTrending ({
  language = '',
  since = 'daily'
}: {language?:string, since?:'daily'|'weekly'|'monthly'} = {}): Result<github.trending.Repository[]> {
  const url = `https://github-trending-api.now.sh/repositories?language=${language}&since=${since}`
  console.log(`getGithubRepoTrending: language=${language} since=${since}`)
  return new Promise((resolve) => {
    callCloudFunctionWithCache({
      name: 'request',
      data: {
        url
      },
      success: (res) => {
        if (res.errMsg === 'cloud.callFunction:ok' && (res.result as any).status === 200) {
          resolve({
            status: 'done',
            data: (res.result as any).data
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`errMsg: ${res.errMsg}`),
            data: []
          })
        }
      }
    }, { timeout: 60, group: 'TrendingData#repos' })
  })
}

async function getGithubUsersTrending ({
  language = '',
  since = 'daily'
}: {language?:string, since?:'daily'|'weekly'|'monthly'} = {}): Result<github.trending.Developer[]> {
  const url = `https://github-trending-api.now.sh/developers?language=${language}&since=${since}`
  console.log(`getGithubUserTrending: language=${language} since=${since}`)
  return new Promise((resolve) => {
    callCloudFunctionWithCache({
      name: 'request',
      data: {
        url
      },
      success: (res) => {
        if (res.errMsg === 'cloud.callFunction:ok' && (res.result as any).status === 200) {
          resolve({
            status: 'done',
            data: (res.result as any).data
          })
        } else {
          resolve({
            status: 'error',
            error: new Error(`errMsg: ${res.errMsg}`),
            data: []
          })
        }
      }
    }, { timeout: 60, group: `TrendingData#users`})
  })
}

export default {
  getAllTopics,
  searchTopics,
  searchRepositories,
  getRepositoryDetail,
  searchUsers,
  getFileContent,
  getReadmeContent,
  getFileTree,
  getUserStaring,
  getUserRepositories,
  getGithubReposTrending,
  getGithubUsersTrending
}
