import mongoose from 'mongoose';

let memoryServer;

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (uri) {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production. Configure backend/.env before starting the API.');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create({ instance: { dbName: 'foodloop_dev' } });
  await mongoose.connect(memoryServer.getUri());
  console.warn('MONGODB_URI is not set. Using temporary development MongoDB; data is lost when this process stops.');
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}
