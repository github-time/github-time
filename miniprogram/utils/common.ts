
const sleep = async (time: number) => new Promise(resolve => { setTimeout(resolve, time) })

async function wrapLoading (title: string, task: Promise<void>|(() => Promise<void>)) {
  wx.showLoading({
    title
  })
  if (task instanceof Promise) {
    await task
  } else {
    await task()
  }
  wx.hideLoading()
}

export {
  sleep,
  wrapLoading
}
