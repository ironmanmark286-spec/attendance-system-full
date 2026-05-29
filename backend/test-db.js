require('dotenv').config();
const pool = require('./src/db.js');
pool.query('SELECT 1').then(() => {
  console.log('Connected to DB successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Error connecting to DB:', err);
  process.exit(1);
});
