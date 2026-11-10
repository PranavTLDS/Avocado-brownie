# avocado&brownies

Luxury e-commerce site for avocado&brownies: a 3D hero plate, scroll story, shop, product pages, bag and checkout, plus an admin panel for editing the menu.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Edit the menu

Open `/#/admin` (passcode is set in `src/data.js`, `BRAND.adminPin`). While running locally with `npm run dev`, saves are written to `public/products.json` and `public/img/uploads/`. On a deployed static site, use **Export products.json** and replace `public/products.json`.

## Notes

- Prices and the WhatsApp order number in `src/data.js` are placeholders until real ones are supplied.
- The film lives in `film/` (HyperFrames). Rebuild scenes with `node film/gen.mjs`, render from that folder; the web copy is `public/video/film.mp4`.
- Brand: orange `#ff6d25`, cream `#fff6ea`, logo font Just Another Hand, primary font Creato Display (drop the font files into `public/fonts` to activate; Outfit is the fallback).
