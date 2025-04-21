const mongoose = require('mongoose');

async function dropIndex() {
  try {
    console.log('Connecting to MongoDB...');
    // Use the connection string from your .env file or the default one
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/communityweb';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    console.log('Dropping index type_1...');
    await mongoose.connection.db.collection('forms').dropIndex('type_1');
    console.log('Index dropped successfully');
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (err) {
    console.error('Error:', err);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

dropIndex(); 