export type Stemmer = (word: string) => string

export interface TokenizerConfig {
  enableStemming?: boolean
  enableStopWords?: boolean
  customStopWords?: ((stopWords: string[]) => string[]) | string[]
  stemmingFn?: Stemmer
  tokenizerFn?: Tokenizer
}

export type Tokenizer = (
  text: string,
  language: string,
  allowDuplicates: boolean,
  tokenizerConfig: TokenizerConfig,
  frequency?: boolean
) => string[]
