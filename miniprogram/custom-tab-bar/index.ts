Component({
  options: {
    addGlobalClass: true
  },
  data: {
    loading: true,
    current: '',
    list: [
      {
        key: 'recommend',
        text: '推荐',
        icon: 'hot',
        url: '/pages/recommend/index'
      },
      {
        key: 'discover',
        text: '发现',
        icon: 'discover',
        url: '/pages/discover/index'
      },
      {
        key: 'stars',
        text: 'Stars',
        icon: 'favorfill',
        url: '/pages/stars/index'
      },
      {
        key: 'me',
        text: '我',
        icon: 'people',
        url: '/pages/me/index'
      }
    ]
  },
  methods: {
    onChange(event) {
      const item = this.data.list.find((item: any) => item.key === event.detail.key)
      wx.switchTab({
        url: item.url
      });
    },
    init () {
      const page = getCurrentPages().pop() as Page.PageInstance;
      this.setData({
        current: this.data.list.find((item: any) => item.url === `/${page.route}`).key
      })
    }
  },
  lifetimes: {
    ready () {
      this.setData({
        loading: false
      })
    }
  }
})
