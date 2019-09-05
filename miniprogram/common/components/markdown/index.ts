import render from './mp-marked-render'

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
      try {
        console.log('render with markdown ...')
        const markdownNodes = render(content, '')
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
  }
})
