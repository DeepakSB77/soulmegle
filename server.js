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

// --------------------------
// Core API Endpoints
// --------------------------

/**
 * @api {post} /register User Registration
 * @apiBody {String} username
 * @apiBody {String} password 
 * @apiBody {String} interests
 */
app.post('/register', async (req, res) => {
  try {
    const { username, password, interests } = req.body;
    
    // Generate interest embedding
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: interests,
      encoding_format: "float"
    });
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Store user in DB
    const { rows } = await pool.query(
      `INSERT INTO users (username, password, interests_vector)
       VALUES ($1, $2, $3) RETURNING id`,
      [username, hashedPassword, embedding.data[0].embedding]
    );
    
    // Generate JWT
    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET);
    
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @api {post} /login User Login
 * @apiBody {String} username
 * @apiBody {String} password
 */
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (!rows.length) throw new Error('User not found');
    
    // Verify password
    const validPass = await bcrypt.compare(password, rows[0].password);
    if (!validPass) throw new Error('Invalid password');
    
    // Generate JWT
    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET);
    
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @api {post} /match Find Match
 * @apiHeader {String} Authorization JWT token
 */
app.post('/match', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's vector
    const { rows: [user] } = await pool.query(
      'SELECT interests_vector FROM users WHERE id = $1',
      [userId]
    );
    
    // Find closest match
    const { rows } = await pool.query(`
      SELECT id, username, 
       1 - (interests_vector <=> $1) AS similarity
      FROM users
      WHERE id != $2
      AND is_connected = false
      ORDER BY similarity DESC
      LIMIT 1
    `, [user.interests_vector, userId]);
    
    if (!rows.length) return res.status(404).json({ message: 'No matches found' });
    
    // Mark users as connected
    await pool.query(
      'UPDATE users SET is_connected = true WHERE id IN ($1, $2)',
      [userId, rows[0].id]
    );
    
    res.json({ match: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------
// WebSocket Handlers
// --------------------------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Store socket ID with user
  socket.on('register-socket', async (token) => {
    try {
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      await pool.query(
        'UPDATE users SET socket_id = $1 WHERE id = $2',
        [socket.id, id]
      );
    } catch (err) {
      console.error('Socket registration error:', err);
    }
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    io.to(data.to).emit('offer', data);
  });

  socket.on('answer', (data) => {
    io.to(data.to).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', data.candidate);
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    await pool.query(
      'UPDATE users SET is_connected = false WHERE socket_id = $1',
      [socket.id]
    );
  });
});

// --------------------------
// Server Startup
// --------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
