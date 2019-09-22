export default [
  {
    test: /(^|\/)dockerfile$/i,
    type: 'docker'
  },
  {
    test: /(^|\/)makefile$/i,
    type: 'makefile'
  },
  {
    test: /(^|\/)\.\w+rc$/i,
    type: 'json'
  },
  {
    test: /(^|\/)\.\w+config$/i,
    type: 'properties'
  },
  {
    test: /\.m$/i,
    type: 'c'
  },
  {
    test: /\.h$/i,
    type: 'c'
  },
  {
    test: /\.md$/i,
    type: 'md'
  },
  {
    test: /\.vue$/i,
    type: 'html'
  },
  {
    test: /\.g4$/i,
    type: 'ebnf'
  },
  {
    test: /\.(png|jpeg|jpg|gif)$/i,
    type: 'img'
  },
  {
    test: /\.([^.]+)$/i,
    type: '$1'
  }
]
