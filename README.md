# Ecommerce Catalog

This project uses React + Vite for the storefront and keeps product data in local JSON files under `src/data`.

## Recommended Catalog Pipeline

For a Python full stack workflow, a practical combo is:

1. `DummyJSON` for product metadata
2. `Unsplash` for product-style images

That gives you a fast way to create large seed catalogs for development.

## Generate Electronics Data

This repo now includes a generator script:

```bash
npm run generate:electronics
```

To generate a larger dataset:

```bash
npm run generate:electronics:1000
```

Optional environment variable:

```bash
UNSPLASH_ACCESS_KEY=your_key_here
```

If `UNSPLASH_ACCESS_KEY` is present, the script queries the Unsplash API for image results. If it is missing, the script falls back to placeholder image URLs.

Default output file:

```bash
src/data/electronics_products.json
```

You can also customize the command manually:

```bash
node scripts/generate_catalog_from_dummyjson.mjs --count 500 --output src/data/electronics_products.json
```

## Import Product Dataset From RapidAPI

Use a local env file instead of hardcoding your key.

Create `.env.local`:

```bash
RAPIDAPI_KEY=your_rotated_key
RAPIDAPI_HOST=real-time-amazon-data.p.rapidapi.com
RAPIDAPI_URL=https://real-time-amazon-data.p.rapidapi.com/search
```

Then run:

```bash
npm run fetch:rapidapi:products
```

To fetch more products across multiple pages and queries:

```bash
npm run fetch:rapidapi:products:more
```

Optional flags:

```bash
node scripts/fetch_product_dataset_from_rapidapi.mjs --query=smartwatch --page=1 --pages=5 --country=US
```

You can also search multiple terms in one run:

```bash
node scripts/fetch_product_dataset_from_rapidapi.mjs --queries=smartwatch,headphones,laptop,tablet,camera --pages=5 --country=US
```

The script normalizes common RapidAPI/Amazon-style fields into:

```bash
src/data/electronics_products.json
```

## Scrape Flipkart Data

If you want to pull product data directly from Flipkart, use the Python scraper in `scapper/`.

Install Python dependencies:

```bash
pip install -r scapper/requirements.txt
```

Save the raw scraped structure:

```bash
python scapper/flipkart_scraper.py --query laptop --pages 1 --max-products 12 --format raw
```

Write directly into the storefront dataset shape:

```bash
python scapper/flipkart_scraper.py --query laptop --pages 1 --max-products 12 --format app --output src/data/electronics_products.json
```

There is also a package shortcut:

```bash
npm run scrape:flipkart
```

Flipkart frequently changes markup and may rate-limit or block scraping, so selectors in this script may need updates over time.

## Deploy To Vercel

This app is ready for Vercel deployment. Import the repository into Vercel and deploy; the checked-in `vercel.json` supplies the build command, output directory, security headers, and SPA route fallback.

Build settings:

```bash
Build command: npm run build
Output directory: dist
Install command: npm ci
```

No environment variables are required for the storefront build. The RapidAPI variables in `.env.example` are only used by the optional catalog-fetching scripts.

SPA routing is configured in:

```bash
vercel.json
```

So deep links like:

```bash
/products?category=Mobiles
```

will resolve correctly after deployment.

You can also deploy from the CLI:

```bash
npx vercel
npx vercel --prod
```

## Deploy To Netlify

Netlify remains supported through `netlify.toml` and `public/_redirects`.
