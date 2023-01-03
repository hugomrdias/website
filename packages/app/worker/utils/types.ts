export interface Certificates {
  [index: string]: JwkCertificate
}

export interface JwkCertificate {
  kty: string
  alg: string
  use?: string
  kid: string
  n: string
  e: string
}
