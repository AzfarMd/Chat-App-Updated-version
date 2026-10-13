const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error("Error: MONGO_URI is missing from environment variables!".red.bold);
      process.exit(1);
    }
    // Remove any accidental leading/trailing whitespace or quotes from paste
    mongoURI = mongoURI.trim().replace(/^["']|["']$/g, '');

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`.green.underline);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = connectDB;
