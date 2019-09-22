//index.js
import { IMyApp } from '../../app'
const app = getApp<IMyApp>()

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
      value: '',
      observer (this: any, content: string) {
        app.globalData.emojis.then((emojis) => {
          this.setData({
            parsedContent: parse(content, emojis),
          })
        })
      }
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
      app.globalData.emojis.then((emojis) => {
        this.setData({
          parsedContent: parse(this.data.content, emojis),
        })
      })
    }
  }
})
