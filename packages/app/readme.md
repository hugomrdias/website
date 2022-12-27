# Icons

https://fonts.google.com/icons?icon.query=network&icon.style=Outlined
https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs

https://jakearchibald.github.io/svgomg/

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

# deploy

```bash
pnpm exec wrangler pages publish --project-name app --branch master dist
```

# theme

https://m3.material.io/theme-builder#/custom

primary `#002d6d`
8a90a5
a786a7
919094

# readability

https://github.com/jsdom/jsdom
https://github.com/WebReflection/linkedom
https://github.com/mozilla/readability
https://github.com/postlight/parser

# metadata

https://github.com/gorango/rehype-extract-meta/blob/main/lib/candidates.js
