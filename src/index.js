const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const { connectDB } = require('./config/db');
const { seedSchemes } = require('./seed/seed-schemes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: env.FRONTEND_ORIGIN,
  credentials: true
}));

// Routes
const eligibilityRoutes = require('./routes/eligibility.routes');
const authRoutes = require('./routes/auth.routes');
const citizenRoutes = require('./routes/citizen.routes');
const handoutRoutes = require('./routes/handout.routes');
const operatorRoutes = require('./routes/operator.routes');
const { startPdfWorker } = require('./workers/pdf.worker');
const { startTelemetryWorker } = require('./workers/telemetry.worker');

const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/handout', handoutRoutes);
app.use('/api/operator', operatorRoutes);
app.get('/health', (req, res) => res.send('OK'));

// Serve PDFs statically for demo purposes
app.use('/handouts', express.static('public/handouts'));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const start = async () => {
  try {
    await connectDB();
    await seedSchemes();
    startPdfWorker();
    await startTelemetryWorker();
    
    app.listen(env.PORT, () => {
      console.log(`🚀 Server listening on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};

start();
