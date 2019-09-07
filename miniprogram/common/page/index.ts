export default <Page.PageConstructor>function (options) {
  return Page({
    onShow() {
      const tabBar = this.getTabBar()
      if (tabBar) tabBar.init()
    },
    onShareAppMessage() {
      return {
        title: 'Github Time'
      }
    },
    ...options
  })
}
