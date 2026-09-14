import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';
const STATUSES = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped:   'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/api/admin/orders?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function changeStatus(id, status) {
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition ${
              filter === s
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-brand-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No orders in this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="p-4 font-medium">Order</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">#{o.id}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{o.user_name}</div>
                      <div className="text-gray-500 text-xs">{o.user_email}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(o.created_at + 'Z').toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 font-medium">₹{Number(o.total).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <select
                        value={o.status}
                        onChange={e => changeStatus(o.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${STATUS_STYLES[o.status]}`}
                      >
                        {STATUSES.filter(s => s !== 'all').map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <Link to={`/admin/orders/${o.id}`} className="text-brand-600 hover:underline text-sm font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
