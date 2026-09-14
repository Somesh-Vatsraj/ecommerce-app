import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped:   'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-20 text-center text-gray-500">Loading...</div>;

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold">No orders yet</h2>
        <p className="text-gray-500 mt-2">Start shopping to place your first order.</p>
        <Link to="/" className="inline-block mt-6 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Order #{order.id}</div>
                <div className="font-semibold">₹{Number(order.total).toLocaleString('en-IN')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(order.created_at + 'Z').toLocaleString('en-IN')}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-gray-100'}`}>
                {order.status}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {order.items.map(it => (
                <div key={it.id} className="flex items-center gap-3 text-sm">
                  <img src={it.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                  <span className="flex-1 truncate">{it.product_name}</span>
                  <span className="text-gray-500">x{it.quantity}</span>
                  <span className="font-medium">₹{(it.price * it.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
