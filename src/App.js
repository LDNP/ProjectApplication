import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentBookId, setCurrentBookId] = useState(null);

  // Fetch books on mount
  useEffect(() => {
    axios.get('/books')
      .then(response => setBooks(response.data))
      .catch(error => console.error('Error fetching books:', error));
  }, []);

  // Handle form submission (add or update)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEditing) {
      axios.put(`/books/${currentBookId}`, { title, author })
        .then(response => {
          setBooks(books.map(book => (book.id === currentBookId ? response.data : book)));
          resetForm();
        })
        .catch(error => console.error('Error updating book:', error));
    } else {
      axios.post('/books', { title, author })
        .then(response => {
          setBooks([...books, response.data]);
          resetForm();
        })
        .catch(error => console.error('Error adding book:', error));
    }
  };

  // Edit a book
  const handleEdit = (book) => {
    setTitle(book.title);
    setAuthor(book.author);
    setIsEditing(true);
    setCurrentBookId(book.id);
  };

  // Delete a book
  const handleDelete = (id) => {
    axios.delete(`/books/${id}`)
      .then(() => {
        setBooks(books.filter(book => book.id !== id));
      })
      .catch(error => console.error('Error deleting book:', error));
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setIsEditing(false);
    setCurrentBookId(null);
  };

  return (
    <div>
      <h1>Book List</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <button type="submit">{isEditing ? 'Update' : 'Add'} Book</button>
      </form>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            {book.title} by {book.author}
            <button onClick={() => handleEdit(book)}>Edit</button>
            <button onClick={() => handleDelete(book.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;