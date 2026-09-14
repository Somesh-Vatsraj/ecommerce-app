import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped:   'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrderDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/api/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrder(data.order || null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function changeStatus(status) {
    await fetch(`${API}/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!order) return <div className="text-red-500">Order not found.</div>;

  return (
    <div>
      <Link to="/admin/orders" className="text-sm text-brand-600 hover:underline">← Back to Orders</Link>
      <h1 className="text-3xl font-bold mt-2 mb-6">Order #{order.id}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500">Customer</div>
          <div className="font-semibold mt-1">{order.user_name}</div>
          <div className="text-sm text-gray-600">{order.user_email}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold mt-1">₹{Number(order.total).toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-500">Placed on</div>
          <div className="font-semibold mt-1">
            {new Date(order.created_at + 'Z').toLocaleString('en-IN')}
          </div>
          <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status]}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-bold mb-3">Update Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={s === order.status}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                s === order.status
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-white border border-gray-300 hover:border-brand-600 hover:text-brand-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="p-4 font-medium">Product</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Qty</th>
              <th className="p-4 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map(it => (
              <tr key={it.id}>
                <td className="p-4 flex items-center gap-3">
                  <img src={it.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                  <span className="font-medium">{it.product_name}</span>
                </td>
                <td className="p-4">₹{Number(it.price).toLocaleString('en-IN')}</td>
                <td className="p-4">{it.quantity}</td>
                <td className="p-4 text-right font-medium">
                  ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
