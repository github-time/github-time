/* global Component */
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    model: {
      type: Object,
      value: {}
    },
    render: {
      type: Boolean,
      value: false
    }
  },
  data: {
    open: false,
    renderChild: false
  },
  methods: {
    // 这里是一个自定义方法
    toggle () {
      this.setData({
        open: !this.data.open,
        renderChild: true
      })
      const data = this.data.model
      if (data.content && data.content.type === 'blob') {
        this.triggerEvent('viewFile', {
          url: data.content.url,
          path: data.content.path,
          size: data.content.size
        })
      }
    },
    viewFile (e) {
      this.triggerEvent('viewFile', e.detail)
    }
  }
})
