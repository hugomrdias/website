import { signal, effect } from '@preact/signals'
import useSWR from 'swr'
import Markdown from 'preact-markdown'
import { get } from './libs/utils.js'

const cookie = signal(localStorage.getItem('ticktick-cookie') || '')
effect(() => localStorage.setItem('ticktick-cookie', cookie.value || ''))
/**
 * @param {import('preact').Attributes} props
 */
function About(props) {
  const parsedUrl = new URL(window.location.href)

  const onInput = (event) => (cookie.value = event.target.value)
  const onSave = () => {
    const tags = [...document.querySelectorAll('.tags:checked')].map(
      (e) => e.value
    )

    fetch(window.location.origin + '/api/tick', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: parsedUrl.searchParams.get('text'),
        title: data.value.title,
        description: data.value.description,
        image: data.value.image,
        tags,
        cookie: cookie.value,
      }),
    })
      .then((rsp) => rsp.json())
      .then((rsp) => console.log(rsp))
  }

  const onSubscribe = (url) => () => {
    fetch('https://api.feedbin.com/v2/subscriptions.json', {
      method: 'POST',
      body: JSON.stringify({
        feed_url: url,
      }),
      headers: {
        Authorization: 'Basic aHVnb21yZGlhczo5KjNQLkM2Q2dCeGNBNFJhSm4uVQ==',
      },
    })
      .then((rsp) => rsp.json())
      .then((rsp) => console.log(rsp))
  }

  const { data, error } = useSWR('/api/meta', async (key) => {
    const out = await get(key, {
      title: parsedUrl.searchParams.get('title') || '',
      text: parsedUrl.searchParams.get('text') || '',
      url: parsedUrl.searchParams.get('url') || '',
    })
    console.log(out)
    return out
  })

  if (error) return <div>{error.info}</div>
  if (!data) return <div>loading...</div>

  return (
    <div className="About">
      <h1>Share Data</h1>
      <img src={data.image} style="max-width: 200px" width="200" height="200" />
      <blockquote cite={data.url}>
        {data.description}{' '}
        <footer>
          <cite>{data.title}</cite>
        </footer>
      </blockquote>
      {data.feeds.length > 0 ? (
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
                <tr key={feed.tittle}>
                  <td class="truncate">
                    {feed.title} <br />{' '}
                    <small>
                      <a href={feed.url} target="_blank" rel="noreferrer">
                        {feed.url}
                      </a>
                    </small>
                  </td>
                  <td>
                    <button onClick={onSubscribe(feed.url)}>Subscribe</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        ''
      )}
      <h5>Tags:</h5>
      <select id="multiple-select" multiple>
        {data.tags.map((tag) => {
          return (
            <option key={tag} value={tag}>
              {tag}
            </option>
          )
        })}
      </select>
      <button type="button" onClick={onSave}>
        Save
      </button>
      <br />

      <Markdown markdown={data.content} />
      <br />
      <label for="tick">ticktick cookie: </label>
      <textarea
        id="tick"
        type="text"
        value={cookie.value}
        onInput={onInput}
        placeholder="copy/paste ticktick cookie here"
      />
      <a href="/">Go Home</a>
    </div>
  )
}

export default About
