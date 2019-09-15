//index.js
import Page from '../../common/page/index'
import github from '../../utils/githubApi'

//获取应用实例
// import { IMyApp } from '../../app'

// const app = getApp<IMyApp>()
const thanksRepos = [
  {
    name: 'github-trending-api',
    full_name: 'huchenme/github-trending-api',
    owner: {
      login: 'huchenme'
    },
    description: ':octocat: The missing APIs for GitHub trending projects and developers 📈',
    language: 'TypeScript'
  },
  {
    name: 'wux-weapp',
    full_name: 'wux-weapp/wux-weapp',
    owner: {
      login: 'wux-weapp'
    },
    description: ':dog: 一套组件化、可复用、易扩展的微信小程序 UI 组件库',
    language: 'JavaScript'
  },
  {
    name: 'ColorUI',
    full_name: 'weilanwl/ColorUI',
    owner: {
      login: 'weilanwl'
    },
    description: '鲜亮的高饱和色彩，专注视觉的小程序组件库',
    language: 'Vue'
  }
]
Page({
  data: {
    query: {
      finalData: []
    },
    finalThanksRepos: [] as any[],
    getThanksRepos (this: any, query: any) {
      return {
        status: 'done',
        data: query.finalData.length > 0 ? query.finalData : thanksRepos
      }
    }
  },
  onLoad() {
    this.loadThanksReposDetail()
  },
  async loadThanksReposDetail () {
    if (this.data.finalThanksRepos.length !== thanksRepos.length) {
      const task = []
      for (let repo of thanksRepos) {
        task.push(github.getRepositoryDetail(repo.full_name))
      }
      const results = await Promise.all(task)
      this.setData!({
        query: {
          finalData: results.map((result) => result.data)
        }
      })
    }
  }
})
