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
    contexPath: {
      type: String,
      value: {}
    }
  },
  data: {
    rawText: '',
    markdownNodes: []
  },
  observers: {
    'content' (content: string) {
      try {
        console.log('render with markdown ...')
        const markdownNodes = render(content, {
          emojis: this.data.emojis,
          contexPath: this.data.contexPath
        })
        const longContent = markdownNodes.length > 150
        this.setData({
          rawText: '',
          markdownNodes: longContent ? markdownNodes.slice(0, 50) : markdownNodes
        })

        if (longContent) {
          setTimeout(() => {
            this.setData({
              rawText: '',
              markdownNodes: markdownNodes
            })
          }, 1000)
        }
      } catch (e) {
        console.log('render with markdown failed:', e)
        console.log('render raw data...')
        this.setData({
          rawText: content,
          markdownNodes: []
        })
      }
    }
  },
  methods: {
    onLinkTap (e) {
      this.triggerEvent('action', {
        type: 'link-tap',
        data: e.currentTarget.dataset
      })
    },
    viewImage (e) {
      const imgUrl = e.currentTarget.dataset.url
      wx.previewImage({
        urls: [imgUrl],
        current: imgUrl
      })
    }
  }
})
