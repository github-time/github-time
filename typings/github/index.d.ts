declare namespace github {
  namespace topics {
    type SearchResultItem = {
      name: string
      display_name: string
      short_description: string
      description: string
      created_by: string
      released: string
      created_at: string
      updated_at: string
      featured: boolean
      curated: boolean
      score: number
    }

    type SearchResult = {
      total_count: number
      incomplete_results: boolean
      items: SearchResultItem[]
    }
  }

  namespace users {
    type SearchResultItem = {
      login: string
      id: number
      node_id: string
      avatar_url: string
      gravatar_id: string
      url: string
      html_url: string
      followers_url: string
      subscriptions_url: string
      organizations_url: string
      repos_url: string
      received_events_url: string
      type: string
      score: number
    }

    type SearchResult = {
      total_count: number
      incomplete_results: boolean
      items: SearchResultItem[]
    }
  }
  namespace repos {
    type Contents = {
      type: string
      encoding: string
      size: number
      name: string
      path: string
      content: string
      sha: string
      url: string
      git_url: string
      html_url: string
      download_url: string
      _links: {
        git: string
        self: string
        html: string
      }
    }

    type TreeItem = {
      path: string
      type: string
      mode: string
      sha: string
      url: string
      size?: number
    }

    type OwnerInfo = {
      login: string
      id: number
      node_id: string
      avatar_url: string
      gravatar_id: string
      url: string
      received_events_url: string
      type: string
    }

    type SearchResultItem = {
      id: number
      node_id: string
      name: string
      full_name: string
      owner: OwnerInfo
      private: boolean
      html_url: string
      description: string
      fork: boolean
      url: string
      created_at: string
      updated_at: string
      pushed_at: string
      homepage: string
      size: number
      stargazers_count: number
      watchers_count: number
      language: string
      forks_count: number
      open_issues_count: number
      master_branch: string
      default_branch: string
      score: number
    }

    type SearchResult = {
      total_count: number
      incomplete_results: boolean
      items: SearchResultItem[]
    }

    type RepoDetail = {
      full_name: string
    }
  }
}
