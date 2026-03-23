import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const siteUrl = 'https://www.namshycart.com';

const canonicalizeImageUrl = (url = '') => {
  if (!url) return '';

  return url
    .trim()
    .replace(/https?:\/\/rukmini\d*\.flipcart\.com/i, 'https://rukminim.flipkart.com')
    .replace(/https?:\/\/rukminim\d*\.flipcart\.com/i, 'https://rukminim.flipkart.com')
    .replace(/\/image\/\d+\/\d+\//, '/image/ORIGINAL/ORIGINAL/')
    .replace(/([?&])q=\d+/g, '$1')
    .replace(/([?&])frame=\d+/g, '$1')
    .replace(/[?&]+$/, '');
};

const uniqueImages = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    if (!item) return false;
    const key = canonicalizeImageUrl(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeName = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();

const hasValidProductPrice = (product) => Number(product.price) > 0;

const scoreProduct = (product) => {
  const imageCount = Array.isArray(product.images) ? product.images.length : 0;
  const featureCount = Array.isArray(product.featureImages) ? product.featureImages.length : 0;

  return (
    imageCount * 100 +
    featureCount * 20 +
    (Number(product.reviewsCount) || 0) +
    (Number(product.rating) || 0) * 10
  );
};

const mergeProductGroup = (products) => {
  const sorted = [...products].sort((left, right) => scoreProduct(right) - scoreProduct(left));
  const primary = sorted[0];
  const lowestPrice = Math.min(...sorted.map((product) => Number(product.price) || 0).filter((price) => price > 0));
  const highestOriginalPrice = Math.max(...sorted.map((product) => Number(product.originalPrice) || 0), Number(primary.originalPrice) || 0);
  const images = uniqueImages(sorted.flatMap((product) => product.images || []));
  const featureImages = uniqueImages(sorted.flatMap((product) => product.featureImages || []));
  const sources = [...new Set(sorted.map((product) => product.source).filter(Boolean))];

  return {
    ...primary,
    price: lowestPrice || Number(primary.price) || 0,
    originalPrice: highestOriginalPrice || Number(primary.originalPrice) || Number(primary.price) || 0,
    image: images[0] || primary.image || '',
    images,
    featureImages,
    source: sources[0] || primary.source,
  };
};

const removeDuplicateProducts = (products) => {
  const groupedProducts = products.reduce((groups, product) => {
    const key = [
      normalizeName(product.category),
      normalizeName(product.brand),
      normalizeName(product.name),
    ].join('|');

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(product);
    return groups;
  }, new Map());

  return [...groupedProducts.values()].map(mergeProductGroup);
};

const withEnhancedProductImages = (product) => {
  const images = uniqueImages([
    product.image,
    ...(Array.isArray(product.images) ? product.images : []),
  ]);
  const featureImages = uniqueImages([
    ...(Array.isArray(product.featureImages) ? product.featureImages : []),
  ]);

  return {
    ...product,
    image: images[0] || '',
    images,
    featureImages,
  };
};

const USD_TO_INR_RATE = 83;

const usesDirectInrPricing = (product = {}, category = '') => (
  category === 'Fashion'
  || product.measurements?.source === 'Flipkart'
  || typeof product.source === 'string'
);

const toInrAmount = (value, options = {}) => {
  const numericValue = Number(value) || 0;
  if (options.preserveInr) {
    return Math.round(numericValue);
  }
  if (numericValue >= 1000) {
    return Math.round(numericValue);
  }
  return Math.round(numericValue * USD_TO_INR_RATE);
};

const getReasonableOriginalPrice = (priceValue, originalValue, options = {}) => {
  const price = toInrAmount(priceValue, options);
  const candidateOriginal = toInrAmount(originalValue || 0, options);

  if (!price) {
    return 0;
  }

  const fallbackMultiplier =
    price >= 50000 ? 1.08 : price >= 20000 ? 1.12 : price >= 10000 ? 1.15 : price >= 3000 ? 1.18 : 1.22;
  const capMultiplier =
    price >= 50000 ? 1.14 : price >= 20000 ? 1.18 : price >= 10000 ? 1.22 : price >= 3000 ? 1.26 : 1.32;

  const fallbackOriginal = Math.round(price * fallbackMultiplier);
  const maxReasonableOriginal = Math.round(price * capMultiplier);

  if (candidateOriginal <= price) {
    return fallbackOriginal;
  }

  return Math.min(candidateOriginal, maxReasonableOriginal);
};

const normalizeProduct = (product, index, category, baseId) => {
  const preserveInr = usesDirectInrPricing(product, category);

  return {
    ...product,
    id: baseId + index + 1,
    category,
    price: toInrAmount(product.price, { preserveInr }),
    image: product.image || product.images?.[0] || '',
    images: Array.isArray(product.images) ? product.images : [],
    originalPrice: getReasonableOriginalPrice(product.price, product.originalPrice, { preserveInr }),
    reviewsCount: product.reviewsCount || product.stock || 0,
    isTrending: product.isTrending ?? false,
    isDeal: product.isDeal ?? false,
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    measurements: product.measurements || {},
  };
};

const loadJson = async (relativePath) => {
  const absolutePath = path.join(rootDir, relativePath);
  const raw = await readFile(absolutePath, 'utf8');
  return JSON.parse(raw);
};

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const main = async () => {
  const [electronicsProductsSource, fashionProductsSource, flipkartProductsSource] = await Promise.all([
    loadJson('src/data/electronics_products.json'),
    loadJson('src/data/fashion_products.json'),
    loadJson('src/data/flipkart_products.json'),
  ]);

  const electronicsProducts = electronicsProductsSource
    .map((product, index) => normalizeProduct(product, index, 'Electronics', 1000))
    .map(withEnhancedProductImages);

  const fashionProducts = fashionProductsSource
    .map((product, index) => normalizeProduct(product, index, 'Fashion', 5000))
    .map(withEnhancedProductImages);

  const flipkartProducts = flipkartProductsSource
    .map((product, index) => normalizeProduct(product, index, product.category || 'Electronics', 9000))
    .map(withEnhancedProductImages);

  const allProducts = removeDuplicateProducts(
    [...electronicsProducts, ...fashionProducts, ...flipkartProducts].filter(hasValidProductPrice),
  );

  const lastmod = new Date().toISOString().split('T')[0];
  const urls = [
    { loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${siteUrl}/products`, changefreq: 'daily', priority: '0.9' },
    { loc: `${siteUrl}/products?category=Electronics`, changefreq: 'daily', priority: '0.8' },
    { loc: `${siteUrl}/products?category=Fashion`, changefreq: 'daily', priority: '0.8' },
    { loc: `${siteUrl}/cart`, changefreq: 'weekly', priority: '0.5' },
    { loc: `${siteUrl}/checkout`, changefreq: 'weekly', priority: '0.5' },
    { loc: `${siteUrl}/account`, changefreq: 'weekly', priority: '0.4' },
    ...allProducts.map((product) => ({
      loc: `${siteUrl}/products/${product.id}`,
      changefreq: 'weekly',
      priority: '0.7',
    })),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  await writeFile(path.join(rootDir, 'public', 'sitemap.xml'), sitemapXml, 'utf8');
  console.log(`Generated sitemap with ${urls.length} URLs`);
};

main().catch((error) => {
  console.error('Failed to generate sitemap:', error);
  process.exitCode = 1;
});
