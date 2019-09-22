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
    onAction (e) {
      console.log('md-action', e)
      this.triggerEvent('action', e.detail)
    }
  }
})
