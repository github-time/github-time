//index.js
import github from '../../utils/githubApi'

function parse (content: string, emojis: any) {
  const result = []
  let current = 0
  content.replace(/:(\w+):/g, (m: string, g1: string, index: number) => {
    if (current < index) {
      result.push({
        type: 'text',
        value: content.substr(current, index - current)
      })
      current = index
    }
    result.push({
      type: 'emoji',
      value: emojis[g1]
    })
    current = index + m.length
    return ''
  })
  if (current < content.length) {
    result.push({
      type: 'text',
      value: content.substr(current, content.length - current)
    })
  }
  return result
}

Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    content: {
      type: String,
      value: ''
    },
    emojis: {
      type: Object,
      value: {}
    }
  },
  data: {
    parsedContent: []
  },
  lifetimes: {
    async attached () {
      const emojis = await github.getGithubEmojis() as any
      this.setData({
        parsedContent: parse(this.data.content, emojis.data),
      })
    }
  }
})
