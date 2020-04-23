
import * as marked from 'marked'
import md5 = require('blueimp-md5')
import htmlParser = require('../../lib/wxParse/htmlparser')
// @ts-ignore
import { strDiscode } from '../../lib/wxParse/wxDiscode'

type EmojiMap = {[key: string]: string}

type Tag = {
  tagName?: string
  text?: string|null
  value?: Tag[]
  href?: string
}

type Node = {
  id: number
  type: string
  class?: string
  title?: string
  text?: string
  value: Tag[]|string
  children?: Tag[]
  deleted?: boolean
}

const renderer = new marked.Renderer()
let nodes: Node[] = []
let nodeIndex = 0
let vars:any[] = []
let varIndex = 0

function rest () {
  nodeIndex = 0
  varIndex = 0
  vars = []
  nodes = []
}

function getFixedImagePath (path: string, contextPath: string) {
  return /^http(|s):\/\//.test(path)
    ? path.replace(/^(https:\/\/(?:www\.|)github.com\/[^/]+\/[^/]+\/)blob\//,'$1raw/')
    : contextPath + path
}

function getAttr (attrs: htmlParser.Handler.Attr[], attr: string) {
  for (var i = 0; i < attrs.length; i++) {
    if (attrs[i].name === attr) {
      return attrs[i].escaped
    }
  }
  return ''
}

function tagToHtml (tag: Tag) {
  if (!tag) return ''
  if (tag.tagName) {
    if (tag.tagName === 'img') {
      return `<img src="${tag.href}" class="image-in-table"/>`
    } else {
      let html = ''
      if (tag.value) {
        for (let item of tag.value) {
          html += tagToHtml(item)
        }
      }
      if (tag.tagName === 'a') {
        return `<a href="${tag.href}" class="markdown-body-a">${html}</a>`
      } else {
        return `<${tag.tagName} class="markdown-body-${tag.tagName}">${html}</${tag.tagName}>`
      }
    }
  } else {
    return tag.text || ''
  }
}

function getHashAnchor (href: string) {
  return `anchor-${md5(href).substr(0, 8)}`
}

function parse (text: string, contextPath: string, emojis: EmojiMap) {
  const value: Tag[] = []
  let tag: Tag|null = null
  // 处理表情符号
  text = text.replace(/:(\w+):/g, (m: string, g1: string) => {
    // @ts-ignore
    return emojis[g1] ? `<emoji src="${emojis[g1]}" />` : m
  })
  // @ts-ignore
  htmlParser(text, {
    start (tagName: string, attrs: htmlParser.Handler.Attr[]) {
      tag = { tagName, value: [] }
      if (tagName === 'br') {
        tag.text = '\n'
        value.push(tag)
        tag = null
      } else if (tagName === 'img') {
        tag.text = null
        tag.href = getFixedImagePath(getAttr(attrs, 'src'), contextPath)
        value.push(tag)
      } else if (tagName === 'emoji') {
        tag.text = null
        tag.href = getAttr(attrs, 'src')
        value.push(tag)
      } else if (tagName === 'a') {
        tag.text = null
        tag.href = getAttr(attrs, 'href')
        value.push(tag)
      } else {
        value.push(tag)
      }
    },
    chars (text: string) {
      text = strDiscode(text)
      if (tag) {
        if (tag.text === null) {
          // 使用 value 接收文本
          tag.value!.push({text})
        } else {
          // 使用 text 接收文本
          tag.text = text
        }
      } else {
        // 独立的文字
        value.push({text})
      }
      tag = null
    }
  })
  return value
}

function compile (text: string, contextPath: string, emojis: EmojiMap) {
  const value:Tag[] = []
  // 解析标签
  const values = parse(text, contextPath, emojis)
  for (let val of values) {
    if (val.text) {
      text = val.text
      let current = 0
      text.replace(/__\$\$(node|var):(\d+)\$\$__/g, (m: string, ref: string, idStr: string, index: number) => {
        if (current < index) {
          value.push({
            ...val,
            text: text.substr(current, index - current) // 普通文本
          })
          current = index
        }
        let v
        let id = parseInt(idStr)
        if (ref === 'node' && nodes[id]) {
          nodes[id].deleted = true // 将节点标记为删除
          v = nodes[id].value
        } else if (ref === 'var') {
          v = vars[id]
        }
        if (v) {
          // 翻译成功
          value.push(...[].concat(v))
        } else {
          // 未找到相关变量，原样输出
          value.push({
            ...val,
            text: m
          })
        }
        current = index + m.length
        return ''
      })
      if (current < text.length) {
        value.push({
          ...val,
          text: text.substr(current, text.length - current) // 普通文本
        })
      }
    } else {
      value.push(val)
    }
  }
  return value
}

let listData:number[] = []

function dealList () {
  if (listData.length > 0) {
    const children: Tag[] = []
    listData.forEach(id => {
      children.push(...[].concat(vars[id]))
    })
    nodes.push({
      id: nodeIndex++,
      type: 'list',
      value: [],
      children
    })
    listData = []
  }
}

// 块级元素解析
// 代码块
renderer.code = function (code: string, language: string) {
  dealList()
  nodes.push({
    id: nodeIndex++,
    type: 'code',
    value: code,
    class: language
  })
  return ''
}

// 引用块
renderer.blockquote = function (quote: string) {
  dealList()
  nodes.push({
    id: nodeIndex++,
    type: 'view',
    // @ts-ignore
    value: compile(quote, this.contextPath, this.emojis),
    class: 'markdown-body-blockquote'
  })
  return ''
}

// 普通段落
renderer.paragraph = function (text: string) {
  dealList()
  nodes.push({
    id: nodeIndex,
    type: 'view',
    // @ts-ignore
    value: compile(text, this.contextPath, this.emojis),
    class: 'markdown-body-paragraph'
  })
  return `__$$node:${nodeIndex++}$$__`
}

// 列表
renderer.list = function (body: string) {
  const childrenIds = body.split(',').slice(0, -1)
  if (childrenIds.length > 1) {
    vars.push(childrenIds.map(id => vars[parseInt(id)]))
    listData.push(varIndex)
    return `:__$$var:${varIndex++}$$__`
  } else {
    listData.push(parseInt(childrenIds[0]))
    return `:__$$var:${childrenIds[0]}$$__`
  }
}

// 列表项
renderer.listitem = function (text: string) {
  let matches = text.match(/:__\$\$var:(\d+)\$\$__$/)
  let children
  if (matches) {
    listData.pop()
    text = text.substr(0, text.length - matches[0].length)
    children = [].concat(vars[parseInt(matches[1])])
  }

  vars.push({
    // @ts-ignore
    value: compile(text, this.contextPath, this.emojis),
    children
  })
  return `${varIndex++},`
}

// 表格
renderer.table = function (header: string, body: string) {
  header = header.replace(/<td/g, '<td class="markdown-body-td"').replace(/<tr/g, '<tr class="markdown-body-tr"')
  body = body.replace(/<td/g, '<td class="markdown-body-td"').replace(/<tr/g, '<tr class="markdown-body-tr"')
  body = body.replace(/:(\w+):/g, (m: string, g1: string) => {
    // @ts-ignore
    return this.emojis[g1] ? `<img class="emoji" src="${this.emojis[g1]}" />` : m
  })
  body = body.replace(/__\$\$var:(\d+)\$\$__/g, (_: string, idStr: string) => tagToHtml(vars[parseInt(idStr)]))
  nodes.push({
    id: nodeIndex++,
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

renderer.html = function (html: string) {
  let res = ''
  // @ts-ignore
  const contextPath = this.contextPath
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
        } else if (name === 'src') {
          // 修正图片地址
          res += ' ' + name + '="' + getFixedImagePath(escaped, contextPath) + '"'
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
  dealList()
  nodes.push({
    id: nodeIndex++,
    type: 'html',
    value: res
  })
  return ''
}

renderer.heading = function (text: string, level: number, raw: string, slugger: any) {
  dealList()
  nodes.push({
    id: nodeIndex++,
    type: 'view',
    // @ts-ignore
    value: compile(text, this.contextPath, this.emojis),
    class: `markdown-body-h${level} ${getHashAnchor(slugger.slug(raw))}`,
  })
  return ''
}

renderer.hr = function () {
  dealList()
  nodes.push({
    id: nodeIndex++,
    type: 'view',
    value: [],
    class: 'markdown-body-hr'
  })
  return ''
}

renderer.link = function (href: string, title: string, text: string) {
  href = decodeURI(href)
  if (/^#.*/.test(href)) {
    href = '#' + getHashAnchor(href.substr(1))
  }
  vars.push({
    tagName: 'a',
    title,
    // @ts-ignore
    value: compile(text, this.contextPath, this.emojis),
    href
  })
  return `__$$var:${varIndex++}$$__`
}

renderer.image = function (href: string, title: string, text: string) {
  vars.push({
    tagName: 'img',
    title,
    text,
    // @ts-ignore
    href: getFixedImagePath(href, this.contextPath)
  })
  return `__$$var:${varIndex++}$$__`
}

export default function (md: string, {emojis = {}, contextPath = ''}: {emojis: {}; contextPath: string}) {
  rest()
  // @ts-ignore
  renderer.emojis = emojis
  // @ts-ignore
  renderer.contextPath = contextPath
  marked(md, {
    renderer,
    headerIds: false
  })
  dealList()
  // console.log('markdown nodes:', nodes)
  const generatedNodes = nodes
  rest()
  return generatedNodes.filter(node => !node.deleted)
}
