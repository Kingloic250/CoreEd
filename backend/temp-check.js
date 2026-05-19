require('dotenv').config();
const p = require('./src/db');
p.user.findMany().then(r => { r.forEach(u => console.log(u.role, u.email)); p.$disconnect(); });
