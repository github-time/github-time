import DataStorage from './DataStorage'

export default class MemDataStorage implements DataStorage {
  private memData = {} as { [key: string]: string }

  set (key: string, val: string) {
    this.memData[key] = val
  }

  get (key: string) {
    return this.memData[key]
  }

  remove (key: string) {
    delete this.memData[key]
  }

  keys () {
    return Object.keys(this.memData)
  }

  print () {
    console.info('MemDataStorage', JSON.stringify(this.memData, null, 2))
  }
}
