Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    selected: {
      type: Number,
      value: 0
    },
    list: {
      type: Array,
      value: []
    },
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      this.triggerEvent('change', { item: data.detail, index: data.index });
      this.setData({
        selected: data.index
      })
    }
  }
})
