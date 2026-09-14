-- ============================================
-- E-Commerce Database Schema (Cloudflare D1)
-- ============================================

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Products table
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Orders table
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sessions table (token-based auth)
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ============================================
-- Seed: Products
-- ============================================
INSERT INTO products (name, description, price, image_url, category, stock) VALUES
('Wireless Noise-Cancelling Headphones', 'Premium over-ear headphones with 40-hour battery life and active noise cancellation.', 8999, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'Electronics', 25),
('Smart Watch Pro', 'Fitness tracking, heart-rate monitor, AMOLED display, 7-day battery.', 12999, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 'Electronics', 18),
('Bluetooth Speaker Mini', 'Portable waterproof speaker with deep bass and 12-hour playtime.', 2499, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800', 'Electronics', 40),
('Classic Denim Jacket', 'Timeless blue denim jacket with a comfortable regular fit.', 3499, 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800', 'Fashion', 30),
('Running Sneakers', 'Lightweight breathable sneakers engineered for daily runs.', 4299, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 'Fashion', 22),
('Leather Wallet', 'Handcrafted genuine leather wallet with RFID protection.', 1299, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', 'Fashion', 50),
('Ceramic Coffee Mug Set', 'Set of 4 handcrafted ceramic mugs — microwave & dishwasher safe.', 899, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800', 'Home', 60),
('Aroma Diffuser', 'Ultrasonic essential oil diffuser with 7-color LED mood lighting.', 1799, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', 'Home', 35);

-- ============================================
-- Seed: Admin user (password: admin123)
-- REPLACE_WITH_HASH_BELOW must be substituted with the SHA-256 output
-- (see README setup step 3)
-- ============================================
INSERT INTO users (email, name, password_hash, role) VALUES
('admin@shophub.com', 'Admin', 'REPLACE_WITH_HASH_BELOW', 'admin');
