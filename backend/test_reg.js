const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      email: 'test_node' + Date.now() + '@gmail.com',
      password: 'Password@123',
      companyName: 'test company',
      name: 'Test User',
      phone: '9999999999'
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.data : err.message);
  }
}

test();
