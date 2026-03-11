require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  allowedOrigins: [
    "https://ihospitaljobs.com",
    "https://localhost:3001",
  ],
};
