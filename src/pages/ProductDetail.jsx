import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const API = import.meta.env.VITE_API_URL || '';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setProduct(d.product);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-20 text-center text-gray-500">Loading...</div>;
  if (error || !product) return <div className="p-20 text-center text-red-500">{error || 'Product not found'}</div>;

  function handleAdd() {
    add(product, qty);
  }

  function handleBuyNow() {
    add(product, qty);
    navigate('/cart');
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-brand-600 font-semibold">
            {product.category}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{product.name}</h1>
          <div className="mt-4 text-3xl font-bold text-gray-900">
            ₹{Number(product.price).toLocaleString('en-IN')}
          </div>
          <p className="mt-4 text-gray-600 leading-relaxed">{product.description}</p>

          <div className="mt-6">
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
              outOfStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {outOfStock ? 'Out of Stock' : `${product.stock} in stock`}
            </span>
          </div>

          {!outOfStock && (
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm text-gray-600">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-lg hover:bg-gray-100"
                >−</button>
                <span className="px-4 font-medium">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-1.5 text-lg hover:bg-gray-100"
                >+</button>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex-1 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-medium transition"
            >
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="flex-1 py-3 rounded-lg border-2 border-brand-600 text-brand-600 hover:bg-brand-50 disabled:border-gray-300 disabled:text-gray-400 font-medium transition"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
