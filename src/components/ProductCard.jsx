import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { add } = useCart();

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square bg-gray-100 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs uppercase tracking-wide text-brand-600 font-semibold">
          {product.category}
        </span>
        <Link to={`/product/${product.id}`} className="mt-1 font-semibold text-gray-900 line-clamp-2 hover:text-brand-600">
          {product.name}
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ₹{Number(product.price).toLocaleString('en-IN')}
          </span>
          <span className={`text-xs font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
        <button
          disabled={product.stock <= 0}
          onClick={() => add(product, 1)}
          className="mt-4 w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
