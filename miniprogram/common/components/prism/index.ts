import hightlight from '../../lib/prism/index'

Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    code: {
      type: String,
      value: ''
    },
    language: {
      type: String,
      value: ''
    },
    height: {
      type: String,
      value: '100%'
    }
  },
  data: {
    codeRows: [],
    rawText: ''
  },
  observers: {
    'code, language' (code: string, language: string) {
      console.log('rerender code ...')
      try {
        const codeRowsCache = hightlight(code, language)
        this.setData({
          rawText: '',
          codeRows: codeRowsCache
        })
      } catch (e) {
        this.setData({
          rawText: this.data.code,
          codeRows: []
        })
      }
    }
  },
  methods: {
  }
})
