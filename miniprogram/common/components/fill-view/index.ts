Component({
  options: {
    addGlobalClass: true,
  },
  data: {
    windowHeight: 0,
    scrollViewHeight: 0
  },
  lifetimes: {
    ready() {
      wx.getSystemInfo({
        success: (res) => {
          this.setData!({
              windowHeight: res.windowHeight
          })
        }
      })

      const query = wx.createSelectorQuery().in(this)
      query.select('.fill-view').boundingClientRect().exec((res: any) => {
        const top = res[0].top
        const scrollViewHeight = this.data.windowHeight - top
        this.setData!({
          scrollViewHeight: scrollViewHeight
        })
      })
    }
  }
})
