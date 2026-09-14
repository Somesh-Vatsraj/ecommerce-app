import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

export default function AdminUsers() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeRole(id, role) {
    const res = await fetch(`${API}/api/admin/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || 'Failed to update role');
    load();
  }

  async function handleDelete(u) {
    if (!confirm(`Delete user "${u.name}"? This will remove their orders too.`)) return;
    const res = await fetch(`${API}/api/admin/users/${u.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || 'Failed to delete');
    load();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Users</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No users.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Orders</th>
                  <th className="p-4 font-medium">Spent</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => {
                  const isSelf = u.id === me.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{u.name} {isSelf && <span className="text-xs text-gray-400">(you)</span>}</div>
                        <div className="text-gray-500 text-xs">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={e => changeRole(u.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium border ${isSelf ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300 cursor-pointer'}`}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="p-4">{u.order_count}</td>
                      <td className="p-4 font-medium">₹{Number(u.total_spent).toLocaleString('en-IN')}</td>
                      <td className="p-4 text-gray-600">
                        {new Date(u.created_at + 'Z').toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={isSelf}
                          className="text-red-600 hover:underline text-sm font-medium disabled:text-gray-400 disabled:no-underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
