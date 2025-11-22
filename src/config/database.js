import mongoose from 'mongoose';

export const connectDatabase = async uri => {
  if (!uri) {
    throw new Error('Missing MongoDB connection string');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  return mongoose.connection;
};
