// Simple script to clear all data
// Run with: node clear-data.js

import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/clear-all-data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    if (res.statusCode === 200) {
      console.log('✅ All data cleared successfully!');
    } else {
      console.log('❌ Error clearing data');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  console.log('Make sure the server is running on port 5000');
});

req.end();

