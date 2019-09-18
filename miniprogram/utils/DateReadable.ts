import Readable from './Readable'
import tinytime = require('tinytime')

const sec = 1000
const minu = sec * 60
const hour = minu * 60
const day = hour * 24
const week = day * 7
const month = day * 31
const year = day * 365

export default (format: string = '{YYYY}/{Mo}/{DD}') => {
  const template = tinytime(format, { padMonth: true, padDays: true })
  const config = {
    units: {
      s: sec,
      m: minu,
      h: hour,
      D: day,
      W: week,
      M: month,
      Y: year
    },
    partitions: [
      { range: [Number.MIN_SAFE_INTEGER, 0] },
      { desc: '刚刚', range: [0, '5s'] },
      { desc: '几秒钟前', range: [, '10s'] },
      { desc: '秒之前', range: [, '1m'], unit: 's' },
      { desc: '分钟之前', range: [, '1h'], unit: 'm' },
      { desc: '小时之前', range: [, '1D'], unit: 'h' },
      { desc: '天之前', range: [, '1W'], unit: 'D' },
      { desc: '周之前', range: [, '1M'], unit: 'W' },
      // { desc: '月之前', range: [, '1Y'], unit: 'M' },
      // { desc: '年之前', range: [, ], unit: 'Y' },
      { range: [, ] }
    ],
    toString (_: number, time: Date) {
      return template.render(new Date(time))
    }
  }
  return Readable(config)
}
