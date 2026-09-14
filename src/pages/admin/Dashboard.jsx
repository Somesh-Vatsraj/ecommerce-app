import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setStats);
  }, [token]);

  if (!stats) return <div className="text-gray-500">Loading...</div>;

  const cards = [
    { label: 'Revenue', value: `₹${Number(stats.revenue).toLocaleString('en-IN')}`, icon: '💰', color: 'bg-green-50 text-green-700' },
    { label: 'Total Orders', value: stats.orders, icon: '🧾', color: 'bg-blue-50 text-blue-700' },
    { label: 'Products', value: stats.products, icon: '📦', color: 'bg-purple-50 text-purple-700' },
    { label: 'Customers', value: stats.customers, icon: '👥', color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Pending Orders', value: stats.pending, icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Low Stock', value: stats.lowStock, icon: '⚠️', color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{c.label}</div>
                <div className="text-2xl font-bold mt-1">{c.value}</div>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${c.color}`}>
                {c.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-10 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/products/new" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-2">➕</div>
          <div className="font-semibold">Add Product</div>
          <div className="text-sm text-gray-500">Create a new listing</div>
        </Link>
        <Link to="/admin/orders" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-2">🧾</div>
          <div className="font-semibold">Manage Orders</div>
          <div className="text-sm text-gray-500">Update order statuses</div>
        </Link>
        <Link to="/admin/users" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="text-3xl mb-2">👥</div>
          <div className="font-semibold">Users</div>
          <div className="text-sm text-gray-500">Manage roles & access</div>
        </Link>
      </div>
    </div>
  );
}
