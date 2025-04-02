const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve React frontend from build folder
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.error('Build folder not found:', buildPath);
} else {
  console.log('Serving static files from:', buildPath);
  app.use(express.static(buildPath));
}

// SQLite database setup
const db = new sqlite3.Database('./books.db', (err) => {
  if (err) console.error('DB error:', err.message);
  else console.log('Connected to SQLite');
});

db.run(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL
  )
`);

// API routes
app.get('/api', (_, res) => {
  res.send('Hello from the backend!');
});

app.get('/books', (_, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) res.status(500).json({ message: 'Error fetching books' });
    else res.json(rows);
  });
});

app.post('/books', (req, res) => {
  const { title, author } = req.body;
  db.run('INSERT INTO books (title, author) VALUES (?, ?)', [title, author], function (err) {
    if (err) res.status(500).json({ message: 'Error adding book' });
    else res.status(201).json({ id: this.lastID, title, author });
  });
});

app.put('/books/:id', (req, res) => {
  const { title, author } = req.body;
  const { id } = req.params;
  db.run('UPDATE books SET title = ?, author = ? WHERE id = ?', [title, author, id], function (err) {
    if (err) res.status(500).json({ message: 'Error updating book' });
    else if (this.changes === 0) res.status(404).json({ message: 'Book not found' });
    else res.status(200).json({ id, title, author });
  });
});

app.delete('/books/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM books WHERE id = ?', [id], function (err) {
    if (err) res.status(500).json({ message: 'Error deleting book' });
    else if (this.changes === 0) res.status(404).json({ message: 'Book not found' });
    else res.status(204).send();
  });
});

// Catch-all for React frontend
app.get('*', (_, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// HTTPS server setup
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'privatekey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt')),
};

const PORT = process.env.HTTPS_PORT || 8443;
https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS server running on https://localhost:${PORT}`);
});