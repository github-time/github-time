// @ts-ignore
import marked = require('./marked')
// @ts-ignore
import blockRender = require('./block-render')

const renderer = new marked.Renderer()
blockRender.init(renderer)

export default function (md: string, imgPath: string) {
  const nodes: any = []
  blockRender.initNodes(nodes)
  marked(md, {
    renderer,
    headerIds: false,
    baseUrl: imgPath,
    breaks: true
  })
  return blockRender.getNodes()
}
