declare namespace github {
  namespace trending {
    type RepositoryBuiltBy = {
      avatar: string
      href: string
      username: string
    }

    type Repository = {
      author: string
      avatar: string
      builtBy: RepositoryBuiltBy[]
      currentPeriodStars: 508
      description: string
      forks: number
      language: string
      languageColor: string
      name: string
      stars: number
      url: string
    }

    type Repo = {
      name: string
      description: string
      url: string
    }

    type Developer = {
      username: string
      name: string
      type: string
      url: string
      avatar: string
      repo: Repo
    }
  }
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

    type UserDetail = {
      login: string
      id: number
      node_id: string
      avatar_url: string
      gravatar_id: string
      url: string
      html_url: string
      followers_url: string
      following_url: string
      gists_url: string
      starred_url: string
      subscriptions_url: string
      organizations_url: string
      repos_url: string
      events_url: string
      received_events_url: string
      type: string
      site_admin: boolean
      name: string
      company: string
      blog: string
      location: string
      email: string
      hireable: string
      bio: string
      public_repos: number
      public_gists: number
      followers: number
      following: number
      created_at: string
      updated_at: string
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

    type Commit = {
      sha: string
      url: string
    }
    type RepoBranche = {
      name: string
      commit: Commit
      protected: boolean
    }
  }

  namespace events {
    type UserEvent = {
      id: number
      type: string
      actor: {
        id: number
        login: string
        display_login: string
        gravatar_id: string
        url: string
        avatar_url: string
      }
      repo: {
        id: number
        name: string
        url: string
      }
      payload: {
        action: string
      }
      public: boolean
      created_at: string
      org: {
        id: number
        login: string
        gravatar_id: string
        url: string
        avatar_url: string
      }
    }
  }

  namespace issues {
    type SearchResultItem = {
      url: string
      repository_url: string
      labels_url: string
      comments_url: string
      events_url: string
      html_url: string
      id: number,
      node_id: string
      number: number,
      title: string
      user: {
        login: string
        id: number,
        node_id: string
        avatar_url: string
        gravatar_id: string
        url: string
        html_url: string
        followers_url: string
        following_url: string
        gists_url: string
        starred_url: string
        subscriptions_url: string
        organizations_url: string
        repos_url: string
        events_url: string
        received_events_url: string
        type: string
        site_admin: boolean
      },
      labels: [],
      state: string
      locked: boolean,
      assignee: null,
      assignees: [],
      milestone: null,
      comments: 0,
      created_at: string
      updated_at: string
      closed_at: string
      author_association: string
      body: string
    }

    type SearchResult = {
      total_count: number
      incomplete_results: boolean
      items: SearchResultItem[]
    }

    type IssueTimeline = {
      url: string
      html_url: string
      issue_url: string
      id: number,
      node_id: string
      user: {
        login: string
        id: number,
        node_id: string
        avatar_url: string
        gravatar_id: string
        url: string
        html_url: string
        followers_url: string
        following_url: string
        gists_url: string
        starred_url: string
        subscriptions_url: string
        organizations_url: string
        repos_url: string
        events_url: string
        received_events_url: string
        type: string
        site_admin: boolean
      },
      created_at: string
      updated_at: string
      author_association: string
      body: string
      event: string
      actor: {
        login: string
        id: number,
        node_id: string
        avatar_url: string
        gravatar_id: string
        url: string
        html_url: string
        followers_url: string
        following_url: string
        gists_url: string
        starred_url: string
        subscriptions_url: string
        organizations_url: string
        repos_url: string
        events_url: string
        received_events_url: string
        type: string
        site_admin: boolean
      }
    }

    type IssueEvent = {
      id: number,
      node_id: string
      url: string
      actor: {
        login: string
        id: number
        node_id: string
        avatar_url: string
        gravatar_id: number
        url: string
        html_url: string
        followers_url: string
        following_url: string
        gists_url: string
        starred_url: string
        subscriptions_url: string
        organizations_url: string
        repos_url: string
        events_url: string
        received_events_url: string
        type: string
        site_admin: boolean
      }
      event: string
      commit_id: string
      commit_url: string
      created_at: string
      issue: {
        url: string
        repository_url: string
        labels_url: string
        comments_url: string
        events_url: string
        html_url: string
        id: number
        node_id: string
        number: number
        title: string
        user: {
          login: string
          id: number
          node_id: string
          avatar_url: string
          gravatar_id: number
          url: string
          html_url: string
          followers_url: string
          following_url: string
          gists_url: string
          starred_url: string
          subscriptions_url: string
          organizations_url: string
          repos_url: string
          events_url: string
          received_events_url: string
          type: string
          site_admin: boolean
        },
        labels: []
        state: string
        locked: boolean
        assignee: null
        assignees: []
        milestone: null
        comments: number
        created_at: string
        updated_at: string
        closed_at: string
        author_association: string
        pull_request: {
          url: string
          html_url: string
          diff_url: string
          patch_url: string
        }
        body: string
      }
    }
  }
}
