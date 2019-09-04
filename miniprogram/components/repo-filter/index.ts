//index.js
import tinytime = require('tinytime')
const template = tinytime('{YYYY}-{Mo}-{DD}', { padMonth: true, padDays: true })

//获取应用实例
// import { IMyApp } from '../../app'
// const app = getApp<IMyApp>()

function getGradientValue (value: number) {
  if (value > 50) {
    return (value - 50) * 100000
  } else if (value > 40) {
    return (value - 40) * 10000
  } else if (value > 30) {
    return (value - 30) * 1000
  } else if (value > 20) {
    return (value - 20) * 100
  } else if (value > 10) {
    return (value - 10) * 10
  } else {
    return value
  }
}

const DAY = 1000 * 60 * 60 * 24
Component({
  properties: {
    hidden: {
      type: Boolean,
      value: true
    }
  },
  data: {
    updateTime: [
      {
        name: '今日',
        value: DAY
      },
      {
        name: '近一周',
        value: DAY * 7
      },
      {
        name: '近一个月',
        value: DAY * 30
      },
      {
        name: '近一年',
        value: DAY * 365
      }
    ],
    topics: [
      {
        name: 'Vue',
        value: 'Vue'
      }
    ],
    languages: [
      {
        name: 'Java',
        value: 'Java'
      },
      {
        name: 'JavaScript',
        value: 'JavaScript'
      },
      {
        name: 'TypeScript',
        value: 'TypeScript'
      },
      {
        name: 'C',
        value: 'C'
      },
      {
        name: 'C++',
        value: 'C++'
      },
      {
        name: 'Python',
        value: 'Python'
      },
      {
        name: 'Dart',
        value: 'Dart'
      }
    ],
    filters: {
      languages: [],
      lastUpdateTime: 0,
      star: {
        max: {
          enable: false,
          value: 0
        },
        min: {
          enable: false,
          value: 0
        }
      },
      fork: {
        max: {
          enable: false,
          value: 0
        },
        min: {
          enable: false,
          value: 0
        }
      }
    }
  },
  methods: {
    onLoad() {

    },
    onStarMinEnableChange () {
      const filters = this.data.filters
      filters.star.min.enable = !filters.star.min.enable
      this.setData!({
        filters
      })
    },
    onStarMaxEnableChange () {
      const filters = this.data.filters
      filters.star.max.enable = !filters.star.max.enable
      this.setData!({
        filters
      })
    },
    onStarMinChange (e: any) {
      const filters = this.data.filters
      filters.star.min.value = getGradientValue(e.detail.value)
      filters.star.min.enable = true
      this.setData!({
        filters
      })
    },
    onStarMaxChange (e: any) {
      const filters = this.data.filters
      filters.star.max.value = getGradientValue(e.detail.value)
      filters.star.max.enable = true
      this.setData!({
        filters
      })
    },
    onForkMinEnableChange () {
      const filters = this.data.filters
      filters.fork.min.enable = !filters.fork.min.enable
      this.setData!({
        filters
      })
    },
    onForkMaxEnableChange () {
      const filters = this.data.filters
      filters.fork.max.enable = !filters.fork.max.enable
      this.setData!({
        filters
      })
    },
    onForkMinChange (e: any) {
      const filters = this.data.filters
      filters.fork.min.value = getGradientValue(e.detail.value)
      filters.fork.min.enable = true
      this.setData!({
        filters
      })
    },
    onForkMaxChange (e: any) {
      const filters = this.data.filters
      filters.fork.max.value = getGradientValue(e.detail.value)
      filters.fork.max.enable = true
      this.setData!({
        filters
      })
    },
    onLanguagesChange (e: any) {
      this.data.filters.languages = e.detail.selected
    },
    onUpdateTimeChange (e: any) {
      if (e.detail.selected[0]) {
        const date = new Date(new Date().getTime() - e.detail.selected[0])
        this.data.filters.lastUpdateTime = template.render(date)
      } else {
        this.data.filters.lastUpdateTime = ''
      }
    },
    onSubmit () {
      console.log('filters:', this.data.filters)
      this.triggerEvent('submit', this.data.filters)
    },
    onCancel () {
      this.triggerEvent('cancel')
    }
  }
})
