
import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/admin/users', {
      headers: {
        // Need a valid token here. But for testing, if the backend returns 401, 
        // that's okay, I just want to see the SHAPE of the response if it succeeds.
        // Actually, I can't easily get a token without login.
      }
    });
    console.log('Response shape:', Object.keys(res.data));
  } catch (err: any) {
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }
}

test();
