import { IMyApp } from '../app'
const app = getApp<IMyApp>()

Component({
  /**
   * 组件的一些选项
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  /**
   * 组件的对外属性
   */
  // @ts-ignore
  properties: {
    bgColor: {
      type: String,
      value: ''
    },
    showHome: {
      type: [Boolean, String],
      value: false
    },
    bgImage: {
      type: String,
      value: ''
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    Custom: app.globalData.Custom,
    isBack: false,
    fromShare: false
  },
  lifetimes: {
    ready () {
      const pages = getCurrentPages() // 获取加载的页面
      const currentPage = pages[pages.length-1] // 获取当前页面的对象
      const options = (currentPage as any).options
      this.setData!({
        isBack: pages.length > 1,
        fromShare: options && options.s && currentPage.route !== 'pages/recommend/index'
      })
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    BackPage() {
      wx.navigateBack({
        delta: 1
      })
    },
    toHome(){
      wx.reLaunch({
        url: '/pages/recommend/index',
      })
    }
  }
})
