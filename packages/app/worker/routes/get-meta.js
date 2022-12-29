import { parse } from '../mercury/index.js'
import { tokenize } from '../tokenizer/index.js'
import { validator } from 'hono/validator'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkStringify from 'remark-stringify'

export function metaValidator() {
  return validator((v) => ({
    url: v.query('url').isOptional(),
    text: v.query('text').isRequired(),
  }))
}

/** @type {import('../bindings.js').AppHandler<import('../bindings.js').ExtractValidationType<metaValidator>>} */
export async function getMeta(c) {
  const { url, text } = c.req.valid()
  const urlParsed = new URL(url || text)
  const { meta, raw } = await parse(urlParsed)

  const titleTags = tokenize(meta.title || '', { enableStopWords: true })
  const descriptionTags = tokenize(meta.description || '', {
    enableStopWords: true,
  })

  const file = await unified()
    .use(rehypeParse)
    .use(rehypeRemark)
    .use(remarkStringify)
    .process(raw)

  return c.json({
    url: url || text,
    title: meta.title,
    description: meta.description,
    image: meta.image,
    tags: [...new Set([...titleTags, ...descriptionTags])],
    feeds: meta.feeds,
    content: String(file),
  })
}
