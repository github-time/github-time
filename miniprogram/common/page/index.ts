export default <Page.PageConstructor>function (options) {
  return Page({
    onShareAppMessage() {
      return {
        title: 'Github Time'
      }
    },
    ...options
  })
}
