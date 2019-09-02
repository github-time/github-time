Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    multiSelect: {
      type: Boolean,
      value: false
    },
    extClass: {
      type: String,
      value: ''
    },
    selected: {
      type: Array,
      value: []
    },
    list: {
      type: Array,
      value: []
    },
  },
  methods: {
    onClear () {
      this.setData({
        selected: []
      })
      this.triggerEvent('change', { selected: this.data.selected })
    },
    onButtonToggle(e) {

      const data = e.currentTarget.dataset
      const value = data.detail.value
      const index = this.data.selected.indexOf(value)
      if (this.data.multiSelect) {
        if (index === -1) {
          this.data.selected.push(value)
        } else {
          this.data.selected.splice(index, 1)
        }
      } else {
        this.data.selected = [value]
      }

      this.setData({
        selected: this.data.selected
      })
      this.triggerEvent('change', { selected: this.data.selected })
    }
  }
})
