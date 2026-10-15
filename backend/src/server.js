
import 'dotenv/config';
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

const port = Number(process.env.PORT || 4000);
let server;

async function shutdown(signal) {
  console.log(`${signal} received; shutting down FoodLoop API.`);
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  await disconnectDatabase();
}

try {
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  ) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET ||= 'foodloop-local-development-secret-change-before-deploying';
    console.warn('Using a local-only development JWT secret. Configure JWT_SECRET before deployment.');
  }

  await connectDatabase();

  // Root route for checking whether the API is running
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'FoodLoop Campus API is running'
    });
  });

  server = app.listen(port, '0.0.0.0', () => {
    console.log(`FoodLoop API listening on port ${port}`);
  });

  process.once('SIGINT', () => shutdown('SIGINT').finally(() => process.exit()));
  process.once('SIGTERM', () => shutdown('SIGTERM').finally(() => process.exit()));
} catch (error) {
  console.error(`API startup failed: ${error.message}`);
  process.exitCode = 1;
}
