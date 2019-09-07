import { Base64 } from 'js-base64'
import requestWithCache from './requestWithCache'
import callCloudFunctionWithCache from './callCloudFunctionWithCache'

const githubApiUrl = 'https://api.github.com'
// const githubApiUrl = 'https://github.whaleyou.club'

async function searchTopics ({
  keyword,
  pageSize,
  pageNo = 1
}: {keyword: string, pageSize: number, pageNo?: number}): Promise<github.topics.SearchResult> {
  const url = `${githubApiUrl}/search/topics?q=${keyword}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchTopics`)
  return new Promise((resolve, reject) => {
    requestWithCache({
      url,
      header: {
        Accept: 'application/vnd.github.mercy-preview+json'
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data as github.topics.SearchResult)
        } else {
          reject(new Error(`statusCode: ${res.statusCode}`))
        }
      }
    }, { timeout: 120, group: 'searchTopics'})
  })
}

async function getAllTopics () {
  console.log(`getAllTopics`)
  let pageNo = 0
  let topics: github.topics.SearchResultItem[] = []
  while (true) {
    pageNo++
    const res = await searchTopics ({ keyword: 'is:featured', pageNo, pageSize: 30 })
    topics = topics.concat(res.items)
    if (topics.length >= res.total_count || res.items.length === 0) {
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
}: {query: string, pageSize: number, pageNo?: number, sort?: string, order?: string}): Promise<github.repos.SearchResult> {
  const url = `${githubApiUrl}/search/repositories?q=${query}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchRepositories: keyword=${query}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return new Promise((resolve, reject) => {
    requestWithCache({
      url,
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data as github.repos.SearchResult)
        } else {
          reject(new Error(`statusCode: ${res.statusCode}`))
        }
      }
    }, { timeout: 30, group: 'searchRepositories'})
  })
}

async function searchUsers ({
  keyword,
  pageSize,
  pageNo = 1,
  sort = 'stars',
  order = 'desc'
}: {keyword: string, pageSize: number, pageNo?: number, sort?: string, order?: string}): Promise<github.users.SearchResult> {
  const url = `${githubApiUrl}/search/users?q=${keyword}&sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`searchUsers: keyword=${keyword}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return new Promise((resolve, reject) => {
    requestWithCache({
      url,
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data as github.users.SearchResult)
        } else {
          reject(new Error(`statusCode: ${res.statusCode}`))
        }
      }
    }, { timeout: 30, group: 'searchUsers'})
  })
}

async function getUserStaring ({
  owner,
  pageSize,
  pageNo = 1,
  sort = 'created',
  order = 'desc'
}: {owner: string, pageSize: number, pageNo?: number, sort?: string, order?: string}): Promise<github.repos.SearchResultItem> {
  const url = `${githubApiUrl}/users/${owner}/starred?sort=${sort}&order=${order}&per_page=${pageSize}&page=${pageNo}`
  console.log(`getUserStaring: owner=${owner}, pageSize=${pageSize}, pageNo=${pageNo}, sort=${sort}, order=${order}`)
  return new Promise((resolve, reject) => {
    requestWithCache({
      url,
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data as github.repos.SearchResultItem)
        } else {
          reject(new Error(`statusCode: ${res.statusCode}`))
        }
      }
    }, { timeout: 30, group: `getUserStaring#${owner}`})
  })
}

async function getFileTree ({
  fullRepoName,
  ref = 'master'
}: { fullRepoName:string, ref?: string }): Promise<github.repos.TreeItem[]> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/git/trees/${ref}?recursive=1`
  console.log(`getFileTree: fullRepoName=${fullRepoName}, ref=${ref}`)
  return new Promise((resolve, reject) => {
    requestWithCache({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve((res.data as {tree: any}).tree )
        } else {
          reject(new Error(`statusCode: ${res.statusCode}`))
        }
      }
    }, { timeout: 60, group: `getFileTree#${fullRepoName}`})
  })
}

async function getReadmeContent ({
  fullRepoName,
  ref = 'master'
}: {fullRepoName:string, ref?: string }) {
  const url = `${githubApiUrl}/repos/${fullRepoName}/readme?ref=${ref}`
  console.log(`getReadmeContent: fullRepoName=${fullRepoName}, ref=${ref}`)
  return new Promise((resolve, reject) => {
    requestWithCache({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          // TODO: 支持缓存 key 替换
          resolve(Base64.decode((res.data as github.repos.Contents).content))
        } else {
          reject(new Error(`statusCode: ${res.statusCode}`))
        }
      }
    }, { timeout: 60, group: `getFileContent#${fullRepoName}`}) // 共享 getFileContent 缓存组
  })
}

async function getFileContent ({
  fullRepoName,
  filePath,
  ref = 'master'
}: {fullRepoName:string, filePath: string, ref?: string }): Promise<string> {
  const url = `${githubApiUrl}/repos/${fullRepoName}/contents/${filePath}?ref=${ref}`
  console.log(`getFileContent: fullRepoName=${fullRepoName}, filePath=${filePath}, ref=${ref}`)
  return new Promise((resolve, reject) => {
    requestWithCache({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(Base64.decode((res.data as github.repos.Contents).content))
        } else {
          reject(new Error(`statusCode: ${res.statusCode}`))
        }
      }
    }, { timeout: 60, group: `getFileContent#${fullRepoName}`})
  })
}

async function getGithubTrending ({
  language = '',
  since = 'daily'
}: {language?:string, since?:'daily'|'weekly'|'monthly'} = {}): Promise<github.trending.SearchResultItem[]> {
  const url = `https://github-trending-api.now.sh?language=${language}&since=${since}`
  console.log(`getGithubTrending: language=${language} since=${since}`)
  return new Promise((resolve, reject) => {
    callCloudFunctionWithCache({
      name: 'request',
      data: {
        url
      },
      success: (res) => {
        if (res.errMsg === 'cloud.callFunction:ok' && (res.result as any).status === 200) {
          resolve((res.result as any).data)
        } else {
          reject(new Error(`errMsg: ${res.errMsg}`))
        }
      }
    }, { timeout: 60, group: `getGithubTrending`})
  })
}

export default {
  getAllTopics,
  searchTopics,
  searchRepositories,
  searchUsers,
  getFileContent,
  getReadmeContent,
  getFileTree,
  getUserStaring,
  getGithubTrending
}
