const mongoose = require ("mongoose")
const  dotenv = require("dotenv")
dotenv.config();
// mongodb+srv://Arun:arunrana123@cluster0.8ker3.mongodb.net/SUpplychainmanagement?retryWrites=true&w=majority&appName=Cluster0

const MONGO_URI = process.env.MONGO_URI;
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌--> MongoDB Connection Error:", error);
    process.exit(1);
  }
};

connectDB();


