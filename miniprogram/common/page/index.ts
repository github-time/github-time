export default <Page.PageConstructor>function (options) {
  return Page({
    onShareAppMessage() {
      const pages = getCurrentPages() // 获取加载的页面
      const currentPage = pages[pages.length-1] // 获取当前页面的对象
      const url = currentPage.route // 当前页面url
      return {
        title: 'Github Time',
        path: `/${url}?s=true`
      }
    },
    ...options
  })
}
