const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Enable CORS to allow communication with frontend (React)
app.use(cors());
app.use(bodyParser.json()); // Parse JSON request bodies

// Initialize SQLite database
const db = new sqlite3.Database('./books.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create 'books' table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL
  )
`);

// Routes

// Test Route to ensure server is running
app.get('/', (_, res) => {
  res.send('Hello from the backend!');
});

// Get all books from the database
app.get('/books', (_, res) => {
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching books' });
    } else {
      res.json(rows);
    }
  });
});

// Add a new book to the database
app.post('/books', (req, res) => {
  const { title, author } = req.body;
  const query = 'INSERT INTO books (title, author) VALUES (?, ?)';
  
  db.run(query, [title, author], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error adding book' });
    } else {
      res.status(200).json({ id: this.lastID, title, author });
    }
  });
});

// Update a book in the database
app.put('/books/:id', (req, res) => {
  const { title, author } = req.body;
  const { id } = req.params;
  const query = 'UPDATE books SET title = ?, author = ? WHERE id = ?';

  db.run(query, [title, author, id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating book' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Book not found' });
    } else {
      res.status(200).json({ id, title, author });
    }
  });
});

// Delete a book from the database
app.delete('/books/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM books WHERE id = ?';

  db.run(query, [id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting book' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Book not found' });
    } else {
      res.status(204).send();
    }
  });
});
const port = process.env.PORT || 5000;
// Server startup
const server = app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

module.exports = { app, server }; // Export both app and server