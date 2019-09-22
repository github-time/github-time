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
      this.triggerEvent('action', e.detail)
    }
  }
})
