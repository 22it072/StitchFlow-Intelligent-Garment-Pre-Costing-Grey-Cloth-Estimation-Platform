// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============ EXISTING ROUTES ============
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/companies', require('./routes/userManagementRoutes'));
app.use('/api/yarns', require('./routes/yarnRoutes'));
app.use('/api/estimates', require('./routes/estimateRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/productions', require('./routes/productionRoutes'));

// ============ NEW WEAVING MODULE ROUTES ============
app.use('/api/looms', require('./routes/loomRoutes'));
app.use('/api/production-logs', require('./routes/productionLogRoutes'));
app.use('/api/yarn-stocks', require('./routes/yarnStockRoutes'));
app.use('/api/warp-beams', require('./routes/warpBeamRoutes'));
app.use('/api/fabric-rolls', require('./routes/fabricRollRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'StitchFlow API is running',
    modules: [
      'auth', 'companies', 'yarns', 'estimates', 'analytics', 
      'settings', 'productions', 'looms', 'production-logs',
      'yarn-stocks', 'warp-beams', 'fabric-rolls'
    ]
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 StitchFlow Server running on port ${PORT}`);
  console.log(`📦 Weaving Modules: Looms, Production Logs, Yarn Stock, Warp Beams, Fabric Rolls`);
});