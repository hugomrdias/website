export interface Metadata {
  title: string | null | undefined
  image: string | null | undefined
  description: string | null | undefined
  feeds: Feed[] | null | undefined
}

interface Feed {
  title: string | null
  url: string
}
