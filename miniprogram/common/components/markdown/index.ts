import render from './mp-marked-render'

Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    content: {
      type: String,
      value: ''
    },
    height: {
      type: String,
      value: '100%'
    },
    emojis: {
      type: Object,
      value: {}
    },
    contextPath: {
      type: String,
      value: {}
    },
    preview: {
      type: Boolean,
      value: true
    }
  },
  data: {
    baseTop: 0,
    scrollTop: 0,
    markdownNodes: []
  },
  observers: {
    'content,preview' (content: string, preview: boolean) {
      if (!preview) return // 非预览模式无需解析
      try {
        console.log('render with markdown ...')
        const markdownNodes = render(content, {
          emojis: this.data.emojis,
          contextPath: this.data.contextPath
        })
        const longContent = markdownNodes.length > 150
        this.setData({
          markdownNodes: longContent ? markdownNodes.slice(0, 50) : markdownNodes
        })
        // console.log('markdown nodes:', markdownNodes.slice(0, 100))
        if (longContent) {
          setTimeout(() => {
            this.setData({
              markdownNodes: markdownNodes
            })
          }, 1000)
        }
      } catch (e) {
        console.log('render with markdown failed:', e)
        console.log('render raw data...')
        this.setData({
          preview: false, // 解析失败，降级到代码展示
          markdownNodes: []
        })
      }
    }
  },
  methods: {
    onScroll (e: any) {
      this.data.scrollTop = e.detail.scrollTop
    },
    onAction (e) {
      console.log('md-action', e)
      if (e.detail.type === 'link-tap' && /^#.*/.test(e.detail.data.href)) {
        // 拦截内部锚点跳转
        const query = wx.createSelectorQuery().in(this)
        query.select('.' + e.detail.data.href.substr(1)).boundingClientRect((item: any) => {
          if (item) {
            this.setData({
              scrollTop: item.top - this.data.baseTop + this.data.scrollTop
            })
          }
        }).exec()
      } else {
        this.triggerEvent('action', e.detail)
      }
    }
  },
  lifetimes: {
    ready () {
      const query = wx.createSelectorQuery().in(this)
      // 单次查询基准滚动条 top
      query.select('.markdown-scroll-view').boundingClientRect((rect) => {
        if (rect) this.data.baseTop = rect.top
      }).exec()
    }
  }
})
