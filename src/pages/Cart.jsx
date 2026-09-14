import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

export default function Cart() {
  const { items, updateQty, remove, subtotal, clear } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const shipping = 0; // free shipping
  const total = subtotal + shipping;

  async function placeOrder() {
    if (!user) { navigate('/login'); return; }
    setError('');
    setPlacing(true);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');
      clear();
      navigate('/orders');
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Looks like you haven't added anything yet.</p>
        <Link to="/" className="inline-block mt-6 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm flex gap-4">
              <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.id}`} className="font-semibold text-gray-900 hover:text-brand-600 line-clamp-2">
                  {item.name}
                </Link>
                <div className="mt-1 text-gray-600 text-sm">
                  ₹{Number(item.price).toLocaleString('en-IN')}
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100">−</button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100">+</button>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right font-semibold">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm h-fit sticky top-20">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between text-base font-bold">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <button
            onClick={placeOrder}
            disabled={placing}
            className="mt-6 w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-medium transition"
          >
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
