import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brand-600">
          🛒 ShopHub
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
          <NavLink to="/" className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-brand-600' : 'text-gray-700 hover:text-brand-600'}`}>
            Home
          </NavLink>

          {user && (
            <NavLink to="/orders" className={({ isActive }) =>
              `hidden sm:inline-block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'text-brand-600' : 'text-gray-700 hover:text-brand-600'}`}>
              Orders
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <NavLink to="/admin" className="px-3 py-2 rounded-md text-sm font-semibold text-purple-600 hover:text-purple-700">
              Admin
            </NavLink>
          )}

          <NavLink to="/cart" className="relative px-3 py-2 text-gray-700 hover:text-brand-600">
            <span className="text-lg">🛍️</span>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </NavLink>

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <span className="hidden sm:inline text-sm text-gray-600">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/login" className="px-3 py-1.5 text-sm text-gray-700 hover:text-brand-600">Login</Link>
              <Link to="/register" className="px-3 py-1.5 text-sm rounded-md bg-brand-600 hover:bg-brand-700 text-white">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
