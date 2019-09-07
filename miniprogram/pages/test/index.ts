//index.js
import Page from '../../common/page/index'
//获取应用实例
// import { IMyApp } from '../../app'

// const app = getApp<IMyApp>()

// import jsfile from '../../mock/jsfile'
// import mdfile from '../../mock/mdfile'

Page({
  data: {
    myContent: '',
    myLanguage: '',
    myCode: ''
  },
  onLoad() {
    // this.setData!({
    //   myLanguage: 'js',
    //   myCode: jsfile
    // })

    // wx.request({
    //   url: 'https://raw.githubusercontent.com/udock/vue-cli-plugin-udock/master/README.md',
    //   success: (res) => {
    //     console.log(res)
    //     this.setData!({
    //       myContent: res.data
    //     })
    //   },
    // })
  }
})
