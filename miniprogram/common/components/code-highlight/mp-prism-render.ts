import Prism = require('prismjs')
import htmlParser = require('../../lib/wxParse/htmlparser')
import registerMoreLanguage from './components'

registerMoreLanguage(Prism)

type CodeRow = {
  text: string|number
  class?: string
}

type CodeRows = CodeRow[]

export default function (codeString: string, type: string, line = 1) {
  let html = Prism.highlight(codeString, Prism.languages[type] || {}, type)
  let codeSegments = html.split(/\n/)
  const codeRows: CodeRows[] = []
  codeSegments.forEach((segment: string) => {
    const res: CodeRow[] = [{ text: line }]
    if (segment === '') {
      res.push({ text: '' })
      line++
      codeRows.push(res)
      return
    }
    const spaces = segment.match(/^(\t+)/)
    if (spaces) {
      res.push({
        text: spaces[1].replace(/\t/g, '  ')
      })
    }
    let className: string
    htmlParser(segment, {
      start (_: string, attrs: htmlParser.Handler.Attr[]) {
        className = getClass(attrs)
      },
      end (/*tag*/) {
      },
      chars (text: string) {
        if (className !== '') {
          res.push({
            class: className,
            text
          })
        } else {
          res.push({
            text
          })
        }
        className = ''
      }
    })
    codeRows.push(res)
    line++
  })
  return codeRows
}

function getClass (attrs:htmlParser.Handler.Attr[] = []) {
  for (let i = 0; i < attrs.length; i++) {
    if (attrs[i].name === 'class') {
      return attrs[i].value
    }
  }
  return ''
}
