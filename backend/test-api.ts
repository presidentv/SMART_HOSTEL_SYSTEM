import axios from 'axios';

async function testApi() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'staff1@hostel.com',
      password: 'staff123'
    });
    console.log("Login user:", res.data.user);
    
    const token = res.data.token;
    
    const reqRes = await axios.get('http://localhost:5000/api/requests', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Tasks found:", reqRes.data.length);
    console.log("Task details:", reqRes.data);
  } catch (err: any) {
    console.error("API error:", err.response?.data || err.message);
  }
}

testApi();
