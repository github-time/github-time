//index.js
//获取应用实例
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    noData: {
      type: Boolean,
      value: false
    },
    loading: {
      type: Boolean,
      value: false
    },
    error: {
      type: Boolean,
      value: false
    }
  }
})
