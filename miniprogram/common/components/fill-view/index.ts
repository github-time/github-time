Component({
  options: {
    addGlobalClass: true,
  },
  data: {
    otherHeight: ''
  },
  lifetimes: {
    ready() {
      const query = wx.createSelectorQuery().in(this)
      query.select('.fill-view').boundingClientRect().exec((res: any) => {
        const top = res[0].top + 'px'
        const tabBarHeight = this.getTabBar() ? '92rpx' : '0px'
        this.setData!({
          otherHeight: `(${top} + ${tabBarHeight})`
        })
      })
    }
  }
})
