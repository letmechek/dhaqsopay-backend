import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function bootstrap() {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await connectDatabase(MONGO_URI);
      logger.info('Connected to MongoDB');
    }

    const app = createApp();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error.message);
    process.exit(1);
  }
}

bootstrap();
