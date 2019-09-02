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
        this.setData({
          rawText: '',
          markdownNodes: markdownNodes
        })
      } catch (e) {
        this.setData({
          rawText: content,
          markdownNodes: []
        })
      }
    }
  }
})
