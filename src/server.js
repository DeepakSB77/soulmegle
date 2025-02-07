require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const { OpenAI } = require('openai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

// Import routes
const audioRoutes = require('./routes/audio');
app.use('/api', audioRoutes);

// ... (rest of your API endpoints)

// Server Startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
