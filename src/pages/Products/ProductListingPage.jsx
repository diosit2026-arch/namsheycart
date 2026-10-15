import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter as FilterIcon, ChevronDown } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import ProductCard from '../../components/ui/ProductCard';
import Seo from '../../components/seo/Seo';
import { siteName, siteUrl } from '../../utils/siteContent';

const FOOTWEAR_KEYWORDS = ['shoe', 'shoes', 'sneaker', 'sneakers', 'slipper', 'slippers', 'loafer', 'loafers', 'heel', 'heels', 'sandal', 'sandals', 'clog', 'clogs'];
const FASHION_FILTER_OPTIONS = [
  { label: 'Shoes', terms: ['shoe', 'shoes'] },
  { label: 'Dresses', terms: ['dress', 'dresses'] },
  { label: 'Slippers', terms: ['slipper', 'slippers', 'slides'] },
  { label: 'Heels', terms: ['heel', 'heels'] },
  { label: 'Sandals', terms: ['sandal', 'sandals'] },
  { label: 'Clogs', terms: ['clog', 'clogs'] },
  { label: 'Sneakers', terms: ['sneaker', 'sneakers'] },
  { label: 'Loafers', terms: ['loafer', 'loafers'] },
];

const getAvailableFashionFilters = (products) => ['All', ...FASHION_FILTER_OPTIONS
  .filter((option) => products.some((product) => {
    const searchableFashionText = [
      product.name,
      product.description,
      product.measurements?.type,
      product.measurements?.scrapedTitle,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return option.terms.some((term) => searchableFashionText.includes(term));
  }))
  .map((option) => option.label)];

const ProductListingPage = () => {
  const [searchParams] = useSearchParams();
  const { 
    products: catalogProducts,
    isLoading, 
    fetchProducts, 
    getFilteredProducts, 
    setFilters,
    filters,
  } = useProductStore();
  
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');
  const isFootwearBrowse = categoryParam === 'Fashion'
    || FOOTWEAR_KEYWORDS.some((keyword) => (searchParam || '').toLowerCase().includes(keyword));
  const [sortBy, setSortBy] = useState(isFootwearBrowse ? 'price-low' : 'featured'); // featured, price-low, price-high, newest

  useEffect(() => {
    fetchProducts();

    // Keep store filters in sync with the URL so old searches/categories do not stick around.
    setFilters({
      category: categoryParam || 'All',
      fashionType: 'All',
      searchQuery: searchParam || '',
    });
    
    window.scrollTo(0, 0);
  }, [categoryParam, searchParam, fetchProducts, setFilters]);

  // Apply sorting to filtered products
  const products = getFilteredProducts();
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'newest': return b.id - a.id; // Mock logic, assuming higher ID is newer
      default: return 0; // featured/default
    }
  });

  const pageHeading = categoryParam
    ? `${categoryParam} Products`
    : searchParam
      ? `Search results for "${searchParam}"`
      : 'Shop All Products';
  const pageDescription = categoryParam
    ? `Browse ${categoryParam.toLowerCase()} products on ${siteName}, including curated deals, trending picks, and secure online shopping.`
    : searchParam
      ? `Find products matching ${searchParam} on ${siteName} across electronics, fashion, beauty, home, and more.`
      : `${siteName} brings together electronics, fashion, beauty, home essentials, toys, appliances, and daily deals in one online shopping destination.`;
  const showFashionFilters = categoryParam === 'Fashion' || products.some((product) => product.category === 'Fashion');
  const availableFashionFilters = showFashionFilters
    ? getAvailableFashionFilters(catalogProducts.filter((product) => product.category === 'Fashion'))
    : ['All'];

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <Seo
        title={pageHeading}
        description={pageDescription}
        keywords={`NamshyCart products, ${categoryParam || searchParam || 'online shopping'}, electronics, fashion, beauty, home decor, deals`}
        canonical={`${siteUrl}/products`}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Discover on {siteName}</p>
              <h1 className="mt-2 text-3xl font-bold text-white mb-2">{pageHeading}</h1>
              <p className="max-w-2xl text-sm leading-7 text-gray-400">
                {pageDescription}
              </p>
              <p className="mt-2 text-gray-400">Showing {sortedProducts.length} results</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative group">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 bg-surface text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {showFashionFilters && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Fashion Filter</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {availableFashionFilters.map((fashionType) => (
                  <button
                    key={fashionType}
                    type="button"
                    onClick={() => setFilters({ fashionType })}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      filters.fashionType === fashionType
                        ? 'border-cyan-300 bg-cyan-400/10 text-white'
                        : 'border-white/12 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:text-white'
                    }`}
                  >
                    {fashionType}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-8">
          {/* Product Grid */}
          <div className="flex-1 w-full">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse flex flex-col gap-4">
                    <div className="bg-surface lg:h-64 h-48 rounded-xl w-full"></div>
                    <div className="h-4 bg-surface rounded w-3/4"></div>
                    <div className="h-4 bg-surface rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-surface/30 rounded-2xl border border-gray-800 border-dashed">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FilterIcon size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  We couldn't find any products matching your current filters. Try adjusting your search criteria or resetting filters.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductListingPage;
