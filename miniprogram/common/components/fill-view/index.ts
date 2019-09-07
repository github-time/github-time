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
        const top = res[0].top
        const tabBarHeight = this.getTabBar() ? 50 : 0
        this.setData!({
          otherHeight: (top + tabBarHeight) + 'px'
        })
      })
    }
  }
})
