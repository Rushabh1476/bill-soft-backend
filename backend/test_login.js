const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test_node' + process.argv[2] + '@gmail.com',
      password: 'Password@123'
    });
    console.log('LOGIN SUCCESS');
  } catch (err) {
    console.error('LOGIN ERROR:', err.response ? err.response.data : err.message);
  }
}

test();
