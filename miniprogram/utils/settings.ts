const PREFIX = 'settings'
function get (key: string, defaultValue?: any) {
  try {
    const value = wx.getStorageSync(`${PREFIX}.${key}`)
    if (value !== '') return JSON.parse(value)
  } catch (e) {}
  return defaultValue
}

function set (key: string, value: any) {
  if (typeof value !== 'string') {
    value = JSON.stringify(value)
  }
  wx.setStorageSync(`${PREFIX}.${key}`, value)
}

export default {
  get,
  set,
  isGithubUserChanged (context: any) {
    const githubConfig = get('githubConfig', {})
    return context.data.githubConfig.user !== githubConfig.user ||
      context.data.githubConfig.token !== githubConfig.token
  }
}
