import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';

const API = import.meta.env.VITE_API_URL || '';
const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category && category !== 'All') params.set('category', category);

      fetch(`${API}/api/products?${params.toString()}`)
        .then(r => r.json())
        .then(d => setProducts(d.products || []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 250); // debounce

    return () => clearTimeout(t);
  }, [search, category]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-brand-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <h1 className="text-3xl sm:text-5xl font-bold">Shop the Future.</h1>
          <p className="mt-4 text-brand-100 max-w-xl text-lg">
            Discover premium electronics, fashion, and home essentials — delivered fast.
          </p>
          <div className="mt-8 max-w-xl">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full px-5 py-3 rounded-xl text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                category === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-brand-600 hover:text-brand-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <div className="text-5xl mb-3">🔍</div>
            <p>No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
