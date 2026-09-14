// Cloudflare Worker — Hono API for the e-commerce app
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// ---------- CORS ----------
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ---------- Helpers ----------
async function hashPassword(password, secret) {
  const data = new TextEncoder().encode(password + secret);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
  return crypto.randomUUID() + '-' + crypto.randomUUID();
}

// Get current user from Authorization: Bearer <token> header
async function getCurrentUser(c) {
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.created_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`
  ).bind(token).first();
  return row || null;
}

async function requireAuth(c) {
  const user = await getCurrentUser(c);
  if (!user) {
    return { error: c.json({ error: 'Unauthorized' }, 401) };
  }
  return { user };
}

async function requireAdmin(c) {
  const { user, error } = await requireAuth(c);
  if (error) return { error };
  if (user.role !== 'admin') {
    return { error: c.json({ error: 'Forbidden — admin only' }, 403) };
  }
  return { user };
}

// ==================================================
// PUBLIC AUTH ROUTES
// ==================================================

// Register
app.post('/api/auth/register', async (c) => {
  const { email, name, password } = await c.req.json().catch(() => ({}));
  if (!email || !name || !password) return c.json({ error: 'All fields required' }, 400);
  if (password.length < 6) return c.json({ error: 'Password must be at least 6 characters' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email already registered' }, 409);

  const hash = await hashPassword(password, c.env.JWT_SECRET);
  const result = await c.env.DB.prepare(
    'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)'
  ).bind(email, name, hash, 'user').run();

  const userId = result.meta.last_row_id;
  const token = generateToken();
  await c.env.DB.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').bind(token, userId).run();

  return c.json({
    token,
    user: { id: userId, email, name, role: 'user' },
  });
});

// Login
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  if (!email || !password) return c.json({ error: 'Email and password required' }, 400);

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const hash = await hashPassword(password, c.env.JWT_SECRET);
  if (hash !== user.password_hash) return c.json({ error: 'Invalid credentials' }, 401);

  const token = generateToken();
  await c.env.DB.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').bind(token, user.id).run();

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// Logout
app.post('/api/auth/logout', async (c) => {
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return c.json({ ok: true });
});

// Me
app.get('/api/auth/me', async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;
  return c.json({ user });
});

// ==================================================
// PUBLIC PRODUCT ROUTES
// ==================================================

app.get('/api/products', async (c) => {
  const search = c.req.query('search') || '';
  const category = c.req.query('category') || '';

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY created_at DESC';

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ products: results });
});

app.get('/api/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json({ product });
});

// ==================================================
// ORDER ROUTES (auth required)
// ==================================================

// Place order
app.post('/api/orders', async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  const body = await c.req.json().catch(() => ({}));
  const items = body.items || [];
  if (!items.length) return c.json({ error: 'Cart is empty' }, 400);

  // Load product rows and validate stock
  const productIds = items.map(i => i.product_id);
  const placeholders = productIds.map(() => '?').join(',');
  const { results: products } = await c.env.DB.prepare(
    `SELECT * FROM products WHERE id IN (${placeholders})`
  ).bind(...productIds).all();

  const productMap = new Map(products.map(p => [p.id, p]));

  let total = 0;
  const lineItems = [];
  for (const item of items) {
    const p = productMap.get(item.product_id);
    if (!p) return c.json({ error: `Product ${item.product_id} not found` }, 400);
    if (item.quantity < 1) return c.json({ error: 'Quantity must be >= 1' }, 400);
    if (p.stock < item.quantity) {
      return c.json({ error: `Insufficient stock for "${p.name}" (available: ${p.stock})` }, 400);
    }
    total += p.price * item.quantity;
    lineItems.push({ product_id: p.id, quantity: item.quantity, price: p.price });
  }

  // Create order
  const orderRes = await c.env.DB.prepare(
    `INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'pending')`
  ).bind(user.id, total).run();
  const orderId = orderRes.meta.last_row_id;

  // Insert items + decrement stock
  const stmts = [];
  for (const li of lineItems) {
    stmts.push(
      c.env.DB.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
      ).bind(orderId, li.product_id, li.quantity, li.price)
    );
    stmts.push(
      c.env.DB.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
        .bind(li.quantity, li.product_id)
    );
  }
  await c.env.DB.batch(stmts);

  return c.json({ order: { id: orderId, total, status: 'pending' } }, 201);
});

// User's own orders
app.get('/api/orders', async (c) => {
  const { user, error } = await requireAuth(c);
  if (error) return error;

  const { results: orders } = await c.env.DB.prepare(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  // Attach items
  for (const o of orders) {
    const { results: items } = await c.env.DB.prepare(
      `SELECT oi.*, p.name AS product_name, p.image_url
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`
    ).bind(o.id).all();
    o.items = items;
  }
  return c.json({ orders });
});

// ==================================================
// ADMIN ROUTES
// ==================================================

// Dashboard stats
app.get('/api/admin/stats', async (c) => {
  const { error } = await requireAdmin(c);
  if (error) return error;

  const revenueRow = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status != 'cancelled'`
  ).first();
  const ordersRow = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM orders').first();
  const productsRow = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM products').first();
  const customersRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM users WHERE role = 'user'`
  ).first();
  const pendingRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'`
  ).first();
  const lowStockRow = await c.env.DB.prepare(
    'SELECT COUNT(*) AS n FROM products WHERE stock < 10'
  ).first();

  return c.json({
    revenue: revenueRow.revenue,
    orders: ordersRow.n,
    products: productsRow.n,
    customers: customersRow.n,
    pending: pendingRow.n,
    lowStock: lowStockRow.n,
  });
});

// Create product
app.post('/api/admin/products', async (c) => {
  const { error } = await requireAdmin(c);
  if (error) return error;

  const { name, description, price, image_url, category, stock } = await c.req.json().catch(() => ({}));
  if (!name || !category || price == null || stock == null) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO products (name, description, price, image_url, category, stock)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(name, description || '', Number(price), image_url || '', category, Number(stock)).run();

  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?')
    .bind(result.meta.last_row_id).first();
  return c.json({ product }, 201);
});

// Update product
app.put('/api/admin/products/:id', async (c) => {
  const { error } = await requireAdmin(c);
  if (error) return error;

  const id = Number(c.req.param('id'));
  const { name, description, price, image_url, category, stock } = await c.req.json().catch(() => ({}));

  await c.env.DB.prepare(
    `UPDATE products SET name=?, description=?, price=?, image_url=?, category=?, stock=?
     WHERE id=?`
  ).bind(name, description || '', Number(price), image_url || '', category, Number(stock), id).run();

  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json({ product });
});

// Delete product
app.delete('/api/admin/products/:id', async (c) => {
  const { error } = await requireAdmin(c);
  if (error) return error;
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

// List all orders (with user info)
app.get('/api/admin/orders', async (c) => {
  const { error } = await requireAdmin(c);
  if (error) return error;

  const status = c.req.query('status') || '';
  let sql = `SELECT o.*, u.name AS user_name, u.email AS user_email
             FROM orders o JOIN users u ON u.id = o.user_id`;
  const params = [];
  if (status && status !== 'all') {
    sql += ' WHERE o.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY o.created_at DESC';

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ orders: results });
});

// Order detail
app.get('/api/admin/orders/:id', async (c) => {
  const { error } = await requireAdmin(c);
  if (error) return error;

  const id = Number(c.req.param('id'));
  const order = await c.env.DB.prepare(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`
  ).bind(id).first();
  if (!order) return c.json({ error: 'Order not found' }, 404);

  const { results: items } = await c.env.DB.prepare(
    `SELECT oi.*, p.name AS product_name, p.image_url
     FROM order_items oi JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`
  ).bind(id).all();
  order.items = items;
  return c.json({ order });
});

// Update order status
app.put('/api/admin/orders/:id/status', async (c) => {
  const { error } = await requireAdmin(c);
  if (error) return error;

  const id = Number(c.req.param('id'));
  const { status } = await c.req.json().catch(() => ({}));
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return c.json({ error: 'Invalid status' }, 400);

  await c.env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run();
  const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  return c.json({ order });
});

// List users with aggregated stats
app.get('/api/admin/users', async (c) => {
  const { error } = await requireAdmin(c);
  if (error) return error;

  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
            (SELECT COALESCE(SUM(total),0) FROM orders o
             WHERE o.user_id = u.id AND o.status != 'cancelled') AS total_spent
     FROM users u ORDER BY u.created_at DESC`
  ).all();
  return c.json({ users: results });
});

// Change user role
app.put('/api/admin/users/:id/role', async (c) => {
  const { user: admin, error } = await requireAdmin(c);
  if (error) return error;

  const id = Number(c.req.param('id'));
  const { role } = await c.req.json().catch(() => ({}));
  if (!['user', 'admin'].includes(role)) return c.json({ error: 'Invalid role' }, 400);
  if (id === admin.id) return c.json({ error: 'You cannot change your own role' }, 400);

  await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run();
  return c.json({ ok: true });
});

// Delete user (and cascade orders via FK)
app.delete('/api/admin/users/:id', async (c) => {
  const { user: admin, error } = await requireAdmin(c);
  if (error) return error;

  const id = Number(c.req.param('id'));
  if (id === admin.id) return c.json({ error: 'You cannot delete yourself' }, 400);

  await c.env.DB.prepare('DELETE FROM orders WHERE user_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

export default app;
