const axios = require('axios');
require('dotenv').config();

axios.post('https://api.jdoodle.com/v1/execute', {
  script: 'print("Hello, World!")',
  language: 'python3',
  versionIndex: '3',
  stdin: '',
  clientId: process.env.JDOODLE_CLIENT_ID,
  clientSecret: process.env.JDOODLE_CLIENT_SECRET,
}).then(res => {
  console.log('JDoodle API response:', res.data);
}).catch(err => {
  console.error('JDoodle API error:', err.response ? err.response.data : err.message);
}); 