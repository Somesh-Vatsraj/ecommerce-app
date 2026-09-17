<img width="1363" height="896" alt="Screenshot 2026-09-17 131742" src="https://github.com/user-attachments/assets/8322e0de-b749-4e97-ada7-30eb09cb536f" />
# 1. Install dependencies
npm install

# 2. Create D1 database (copy the database_id into wrangler.toml)
npx wrangler d1 create ecommerce-db

# 3. Generate the SHA-256 password hash for admin123
node -e "const c=require('crypto');console.log(c.createHash('sha256').update('admin123'+'change-this-to-super-secret-key').digest('hex'))"
# → Copy the output and replace REPLACE_WITH_HASH_BELOW in 1.sql

# 4. Initialize local DB
npx wrangler d1 execute ecommerce-db --file=./1.sql --local

# 5. Initialize production DB
npx wrangler d1 execute ecommerce-db --file=./1.sql --remote

# 6. Start the worker (Terminal 1)
npm run worker:dev   # http://localhost:8787

# 7. Start the frontend (Terminal 2)
npm run dev          # http://localhost:5173

# 8. Production deploy
npm run deploy
