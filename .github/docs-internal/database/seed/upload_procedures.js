const fs = require('fs');
const https = require('https');

// Configuration - A MODIFIER avec tes infos Supabase
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Service role key (pas anon key!)

// Lire le fichier SQL
const sqlContent = fs.readFileSync('seed_procedure_templates.sql', 'utf8');

console.log('Uploading procedures to Supabase...');
console.log(`File size: ${sqlContent.length} bytes`);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
  }
};

const data = JSON.stringify({ query: sqlContent });

const req = https.request(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, options, (res) => {
  let responseBody = '';
  
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', res.statusCode);
    console.log(responseBody);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
