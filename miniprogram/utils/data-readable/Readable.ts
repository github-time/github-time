type Formater = (val: number, ...args: any) => string

type Partition = {
  range: any[]
  desc?: string
  unit?: number|string
}

type Config = {
  units: {[key: string]: number}
  partitions: Partition[]
  toString?: Formater
}

export default (conf: Config) => {
  const units = conf.units

  function parse(val: string|number) {
    if (typeof val === 'string') {
      const u = units[val.substr(-1)]
      if (u) {
        return parseFloat(val.substr(0, val.length - 1)) * u
      }
    }
    return val
  }

  let last = 0
  conf.partitions = conf.partitions.map((item) => {
    if (item.range[0]) item.range[0] = parse(item.range[0])
    if (item.range[1]) item.range[1] = parse(item.range[1])
    if (item.unit) {
      item.unit = units[item.unit]
    }
    if (item.range[0] === undefined)item.range[0] = last
    if (item.range[1] === undefined)item.range[1] = Number.MAX_SAFE_INTEGER
    last = item.range[1] as number
    return item
  })

  return (val: number, ...args: any) => {
    const c = conf.partitions.find((item) => val >= item.range[0]! && val < item.range[1]!)
    if (!c || !c.desc) {
      return conf.toString ? conf.toString(val, ...args) : val
    } else if (c.unit) {
      return `${(val / (c.unit as number)).toFixed()}${c.desc}`
    } else {
      return c.desc
    }
  }
}
