import marked from '../../lib/marked/index'

Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    content: {
      type: String,
      value: ''
    }
  },
  data: {
    rawText: '',
    markdownNodes: []
  },
  observers: {
    'content' (content: string) {
      console.log('rerender code ...')
      try {
        const markdownNodes = marked(content, 'apis.getImgRawPath()')
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
        this.setData({
          rawText: content,
          markdownNodes: []
        })
      }
    }
  }
})
