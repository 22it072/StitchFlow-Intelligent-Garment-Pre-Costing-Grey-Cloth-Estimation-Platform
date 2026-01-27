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

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/yarns', require('./routes/yarnRoutes'));
app.use('/api/estimates', require('./routes/estimateRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'StitchFlow API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 StitchFlow Server running on port ${PORT}`);
});