require('dotenv').config();
const app = require('./app');
const { startScheduler } = require('./scheduler');
const { connectRedis } = require('./redis');

const PORT = process.env.PORT || 3001;

connectRedis().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startScheduler();
  });
});
