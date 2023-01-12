# TODO

- [ ] use onLoad event to make sure globalThis.google is loading
- [ ] add cache to fetch google certs
- [ ] change hono validation code https://github.com/honojs/hono/blob/main/docs/MIGRATION.md#v271---v2xx
- [ ] add env vars to vite ?

# Setup

## Google APIs

Setup project and get `Client ID`, instructions in the link below.

https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

## Deploy

```bash
pnpm run deploy
```

# Icons

## Favicon

- https://fonts.google.com/icons?icon.query=network&icon.style=Outlined
- https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
- https://jakearchibald.github.io/svgomg/

Theres a figma doc for sizing
png 192 and 512 should have borders
main svg icon should be the borderless version

```bash
inkscape ./icon-borderless.svg --export-width=32 --export-filename="./tmp.png"

convert ./tmp.png ./favicon.ico
rm ./tmp.png

inkscape ./icon.svg --export-width=512 --export-filename="./icon-512.png"
inkscape ./icon.svg --export-width=192 --export-filename="./icon-192.png"
inkscape ./icon.svg --export-width=180 --export-filename="./apple-touch-icon.png"

# https://maskable.app/editor for maskable icons 192 and 512 sizes

```

## Other icons

Sprite is in index.html
https://icomoon.io/app/#/select

Typicons set

# theme

https://m3.material.io/theme-builder#/custom

primary `#002d6d`
8a90a5
a786a7
919094

# Readability

- https://github.com/WebReflection/linkedom
- https://github.com/mozilla/readability
- https://github.com/postlight/parser

## Extract Metadata

https://github.com/gorango/rehype-extract-meta/blob/main/lib/candidates.js

# passkeys

- https://webauthn.guide/
- https://webauthn.io/
- https://passkeys.dev/
- https://www.passkeys.io/
- https://github.com/MasterKale/SimpleWebAuthn
- https://web.dev/passkey-registration/
- https://web.dev/passkey-form-autofill/
- https://developers.google.com/identity/passkeys
- https://developers.yubico.com/Passkeys/
- https://www.hanko.io/blog/passkeys-part-1
- https://github.com/herrjemand/awesome-webauthn
