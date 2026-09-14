import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

export default function Products() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/api/products`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`${API}/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  }

  function stockBadge(stock) {
    if (stock <= 0) return 'bg-red-100 text-red-700';
    if (stock < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-700';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link
          to="/admin/products/new"
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm"
        >
          + Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No products yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="p-4 font-medium">Image</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <img src={p.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                    </td>
                    <td className="p-4 font-medium text-gray-900">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.category}</td>
                    <td className="p-4 font-medium">₹{Number(p.price).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${stockBadge(p.stock)}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="text-brand-600 hover:underline mr-3 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-red-600 hover:underline text-sm font-medium"
                      >
                        Delete
                      </button>
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
