import Readable from './Readable'

const config = {
  units: {
    K: 1000
  },
  partitions: [
    { range: [Number.MIN_SAFE_INTEGER, 0] },
    { desc: 'K', range: [, ], unit: 'K' },
  ]
}

export default Readable(config)
