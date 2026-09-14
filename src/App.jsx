import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';

import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import OrderDetail from './pages/admin/OrderDetail';
import AdminUsers from './pages/admin/AdminUsers';

function CustomerShell({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function AdminShell() {
  // Admin pages render inside AdminLayout (no customer Navbar/Footer)
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Admin sub-tree: uses AdminLayout */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Customer routes */}
          <Route path="/" element={<CustomerShell><Home /></CustomerShell>} />
          <Route path="/product/:id" element={<CustomerShell><ProductDetail /></CustomerShell>} />
          <Route path="/cart" element={<CustomerShell><Cart /></CustomerShell>} />
          <Route path="/login" element={<CustomerShell><Login /></CustomerShell>} />
          <Route path="/register" element={<CustomerShell><Register /></CustomerShell>} />
          <Route
            path="/orders"
            element={
              <CustomerShell>
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              </CustomerShell>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
