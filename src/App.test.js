import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the title "Book List"', () => {
  render(<App />);  // Render the App component
  const titleElement = screen.getByText(/book list/i);  // Find the element that contains 'Book List'
  expect(titleElement).toBeInTheDocument();  // Assert that it's in the document
});