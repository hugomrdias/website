/* eslint-disable no-nested-ternary */
import useSWR from 'swr'
import Markdown from 'preact-markdown'
import { get, post } from './libs/utils.js'
import useUser from './libs/use-user.js'
import { Footer, TopBar } from './app.jsx'
import { useState } from 'preact/hooks'

/**
 * @param {import('preact').Attributes} props
 */
function Share(props) {
  const { user } = useUser({
    redirectTo: '/login',
  })

  const [isFetchingFeed, setFetchingFeed] = useState()
  const [isSaving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState()

  const onSave = async () => {
    const tags = [...document.querySelectorAll('#tags option:checked')].map(
      // @ts-ignore
      (e) => e.value
    )

    setSaving(true)
    const out = await post('/api/bookmark', {
      ...data,
      tags,
    })

    setSaveResult(JSON.stringify(out, null, 2))
    setSaving(false)
  }

  const feedSubscribe = useSWR(isFetchingFeed, async (key) => {
    await post('/api/subscribe', {
      feed: isFetchingFeed,
    })
    // eslint-disable-next-line unicorn/no-useless-undefined
    setFetchingFeed(undefined)
  })

  const { data, error } = useSWR('/api/meta', async (key) => {
    const parsedUrl = new URL(window.location.href)
    const out = await get(key, {
      title: parsedUrl.searchParams.get('title') || '',
      text: parsedUrl.searchParams.get('text') || '',
      url: parsedUrl.searchParams.get('url') || '',
    })
    return out
  })

  return (
    <>
      <TopBar user={user} title="Share" />
      {error ? (
        <div>{error.info}</div>
      ) : !data ? (
        <div>loading...</div>
      ) : (
        <div className="About">
          <img
            src={data.image}
            style="max-width: 200px"
            width="200"
            height="200"
          />
          <blockquote cite={data.url}>
            {data.description}{' '}
            <footer>
              <cite>{data.title}</cite>
            </footer>
          </blockquote>
          {data.feeds.length > 0 ? (
            <>
              <table>
                <colgroup>
                  <col style="width: 80%;" />
                  <col style="width: 150px;" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Feed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.feeds.map((feed) => {
                    return (
                      <tr key={feed.title}>
                        <td class="truncate">
                          {feed.title} <br />{' '}
                          <small>
                            <a href={feed.url} target="_blank" rel="noreferrer">
                              {feed.url}
                            </a>
                          </small>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setFetchingFeed(feed.url)
                            }}
                            disabled={isFetchingFeed}
                          >
                            {isFetchingFeed === feed.url ? '...' : 'Subscribe'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {feedSubscribe.error && <p>{feedSubscribe.error.info}</p>}
            </>
          ) : (
            ''
          )}
          <h5>Tags:</h5>
          <select id="tags" multiple>
            {data.tags.map((tag) => {
              return (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              )
            })}
          </select>
          <button type="button" onClick={onSave}>
            {isSaving ? 'Saving' : 'Save'}
          </button>
          {saveResult && <textarea value={saveResult} />}
          <br />

          <details>
            <summary>Preview</summary>
            <Markdown markdown={data.content} />
          </details>
        </div>
      )}

      <Footer />
    </>
  )
}

export default Share
