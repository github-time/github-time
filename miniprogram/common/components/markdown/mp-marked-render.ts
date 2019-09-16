
import * as marked from 'marked'
import htmlParser = require('../../lib/wxParse/htmlparser')
// @ts-ignore
import { strDiscode } from '../../lib/wxParse/wxDiscode'

type Tag = {
  tagName?: string
  text?: string
  src?: string
  href?: string
}

type ListItem = {
  itemValue: string|Tag[]
}

type Node = {
  type: string
  value: string|string[]|ListItem[]|Tag[]
  class?: string
  href?: string
  title?: string
  text?: string
}

let nodes: Node[] = []

const renderer = new marked.Renderer()

renderer.code = function (code: string, language: string) {
  nodes.push({
    type: 'code',
    value: code,
    class: language
  })
  return ''
}

renderer.blockquote = function (quote: string) {
  nodes.push({
    type: 'view',
    // @ts-ignore
    value: getBlockValue(quote, this.emojis),
    class: 'markdown-body-blockquote'
  })
  return ''
}

renderer.link = function (href: string, title: string, text: string) {
  nodes.push({
    type: 'link',
    value: '',
    title,
    href,
    text,
    class: ''
  })
  return ''
}

renderer.image = function (href: string, title: string, text: string) {
  nodes.push({
    type: 'image',
    value: '',
    title,
    // @ts-ignore
    href: encodeURI(/^http(|s):\/\//.test(href) ? href : this.contexPath + href),
    text,
    class: ''
  })
  return ''
}

renderer.html = function (html: string) {
  let res = ''
  htmlParser(html, {
    start (tagName: string, attrs: htmlParser.Handler.Attr[]) {
      res += '<' + tagName + ' class="markdown-body-' + tagName + '"'
      let align = ''
      let style = ''
      for (var i = 0; i < attrs.length; i++) {
        const name = attrs[i].name
        const escaped = attrs[i].escaped
        if (name === 'align') {
          align = escaped
        } else if (name === 'style') {
          style = escaped
        } else {
          res += ' ' + name + '="' + escaped + '"'
        }
      }
      if (align) style += ';text-align: center;'
      if (style) res += ' style="' + style + '"'
      res += '>'
    },
    end (tag: string) {
      res += '</' + tag + '>'
    },
    chars (text: string) {
      res += text
    }
  })
  nodes.push({
    type: 'html',
    value: res
  })
  return ''
}

renderer.heading = function (text: string, level: number) {
  nodes.push({
    type: 'view',
    // @ts-ignore
    value: getBlockValue(text, this.emojis),
    class: 'markdown-body-h' + level
  })
  return ''
}

renderer.hr = function () {
  nodes.push({
    type: 'view',
    value: [''],
    class: 'markdown-body-hr'
  })
  return ''
}

renderer.list = function (body: string) {
  const listItems = body.split('----listitem----')
  const value: ListItem[] = []
  listItems.forEach((li: string) => {
    if (/^\s*$/.test(li)) {
      return
    }
    value.push({
      // @ts-ignore
      itemValue: getBlockValue(li, this.emojis)
    })
  })
  nodes.push({
    type: 'list',
    value: value
  })
  return ''
}

renderer.listitem = function (text: string) {
  return text + '----listitem----'
}

renderer.paragraph = function (text: string) {
  let type = 'view'
  let value: string|Tag[] = ''
  if (/<img/.test(text) && /src="/.test(text)) {
    type = 'html'
    value = text
  } else {
    // @ts-ignore
    value = getBlockValue(text, this.emojis)
  }
  nodes.push({
    type,
    value,
    class: 'markdown-body-paragraph'
  })
  return ''
}

renderer.table = function (header: string, body: string) {
  header = header.replace(/<td/g, '<td class="markdown-body-td"').replace(/<tr/g, '<tr class="markdown-body-tr"')
  body = body.replace(/<td/g, '<td class="markdown-body-td"').replace(/<tr/g, '<tr class="markdown-body-tr"')
  body = body.replace(/:(\w+):/g, (m: string, g1: string) => {
    // @ts-ignore
    return this.emojis[g1] ? `<img class="emoji" src="${this.emojis[g1]}" />` : m
  })
  nodes.push({
    type: 'html',
    value: `
      <table class="markdown-body-table">
        <thead class="markdown-body-thead">${header}</thead>
        <tbody class="markdown-body-tbody">${body}</tbody>
      </table>
    `
  })
  return ''
}

function getBlockValue (blockString: string, emojis: {[key: string]: string}) {
  const value: Tag[] = []
  let tag: Tag|null = null
  blockString = blockString.replace(/:(\w+):/g, (m: string, g1: string) => {
    // @ts-ignore
    return emojis[g1] ? `<emoji src="${emojis[g1]}" />` : m
  })
  htmlParser(blockString, {
    start (tagName: string, attrs: htmlParser.Handler.Attr[]) {
      tag = { tagName }
      if (tagName === 'br') {
        tag.text = '\n'
        value.push(tag)
        tag = null
      } else if (tagName === 'img') {
        tag.src = getAttr(attrs, 'src')
        value.push(tag)
        tag = null
      } else if (tagName === 'emoji') {
        tag.src = getAttr(attrs, 'src')
        value.push(tag)
        tag = null
      } else if (tagName === 'a') {
        tag.href = getAttr(attrs, 'href')
      }
    },
    chars (text: string) {
      tag = tag || {}
      tag.text = strDiscode(text)
      value.push(tag)
      tag = null
    }
  })
  return value
}

function getAttr (attrs: htmlParser.Handler.Attr[], attr: string) {
  for (var i = 0; i < attrs.length; i++) {
    if (attrs[i].name === attr) {
      return attrs[i].escaped
    }
  }
  return ''
}

export default function (md: string, {emojis = {}, contexPath = ''}: {emojis: {}; contexPath: string}) {
  nodes = []
  // @ts-ignore
  renderer.emojis = emojis
  // @ts-ignore
  renderer.contexPath = contexPath
  marked(md, {
    renderer,
    headerIds: false,
    breaks: true
  })
  const generatedNodes = nodes
  nodes = []
  return generatedNodes
}
