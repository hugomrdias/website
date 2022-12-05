import { useEffect } from 'preact/hooks'
import { signal, effect } from '@preact/signals'

const cookie = signal(localStorage.getItem('ticktick-cookie') || '')
effect(() => localStorage.setItem('ticktick-cookie', cookie.value || ''))
const data = signal({
  title: '',
  description: '',
  image: '',
  tags: [],
})

function About() {
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
  useEffect(() => {
    if (parsedUrl.searchParams.get('text')) {
      fetch(
        window.location.origin +
          '/api/meta?url=' +
          parsedUrl.searchParams.get('text')
      )
        .then((rsp) => rsp.json())
        .then((rsp) => (data.value = rsp))
    }
  }, [])

  return (
    <div className="About">
      <h1>Share Data</h1>
      <label for="share-title">Title</label>
      <input
        readonly
        id="share-title"
        placeholder="Share Title"
        value={parsedUrl.searchParams.get('title') || ''}
      />
      <label for="share-text">Text</label>
      <input
        readonly
        id="share-text"
        value={parsedUrl.searchParams.get('text') || ''}
      />
      <label for="share-title">URL</label>
      <input
        readonly
        id="share-url"
        value={parsedUrl.searchParams.get('url') || ''}
      />

      <label for="data-title">Title</label>
      <input id="data-title" value={data.value.title} />
      <label for="data-description">Description: </label>
      <textarea
        id="data-description"
        type="text"
        value={data.value.description}
        placeholder="copy/paste ticktick cookie here"
      />
      <h5>Image:</h5>
      <img src={data.value.image} style="max-width: 200px" />
      <h5>Tags:</h5>
      <ul>
        {data.value.tags.map((tag) => {
          return (
            <li key={tag}>
              <input type="checkbox" id={tag} class="tags" value={tag} />
              <label for={tag}>{tag}</label>
            </li>
          )
        })}
      </ul>
      <button type="button" onClick={onSave}>
        Save
      </button>
      <br />
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
