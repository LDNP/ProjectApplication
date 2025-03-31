const request = require('supertest');
const { app, server } = require('../server'); // Import app and server from server.js

describe('GET /', () => {
  it('should return a message', async () => {
    const response = await request(app).get('/'); // Make a GET request to the root route

    // Check the response status and body
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello from the backend!');
  });
});

// Close the server after all tests are completed
afterAll(() => {
  server.close(); // Stop the server after all tests are done
});