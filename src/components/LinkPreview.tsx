/* eslint-disable @next/next/no-img-element */
import jsdom from 'jsdom'

async function LinkPreview({ url }: { url: string }) {
  let title = ''
  let description = ''
  let image = ''

  try {
    const response = await fetch(url)
    const data = await response.text()
    const doc = new jsdom.JSDOM(data)
    title = doc.window.document.querySelector('title')?.textContent || ''
    description =
      doc.window.document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content') || ''
    image =
      doc.window.document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute('content') || ''
  } catch (err) {
    // External sites can be unreachable or unparseable at build time; skip the
    // preview rather than failing the whole static export.
    console.error(`LinkPreview failed for ${url}`, err)
    return null
  }

  return (
    <a
      href={url}
      className="mb-4 block overflow-hidden rounded-lg border border-zinc-200 shadow-sm transition-all hover:shadow-lg hover:shadow-orange-300/60"
      rel="noopener noreferer"
      target="_blank"
    >
      <div className="p-4">
        <h3 className="mb-4 text-lg font-bold">{title}</h3>
        <p className="text-xs">
          {description.slice(0, 150)}
          {description.length > 150 && '...'}
        </p>
      </div>
      {image && (
        <img
          src={image}
          alt="Link Preview"
          width="400"
          height="400"
          className="w-full object-cover"
        />
      )}
    </a>
  )
}

export default LinkPreview
