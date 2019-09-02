export default interface DataStorage {
  set: (key: string, val: string) => void
  get: (key: string) => string
  remove: (key: string) => void
  keys: () => string[]
  print: () => void
}
