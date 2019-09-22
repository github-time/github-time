/* global Component */
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    model: {
      type: Object,
      value: {}
    }
  },
  methods: {
    onAction (e) {
      console.log('md-view action', e)
      this.triggerEvent('action', e.detail)
    },
    onViewTap (e) {
      const item = e.currentTarget.dataset.detail
      if (item.tagName === 'a') {
        console.log('md-view onLinkTap', item)
        this.triggerEvent('action', {
          type: 'link-tap',
          data: item
        })
      }
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
