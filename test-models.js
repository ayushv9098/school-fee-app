const https = require('https');
require('dotenv').config({ path: '.env.local' });

const key = process.env.GEMINI_API_KEY;
console.log('Using key:', key.substring(0, 5) + '...');
const models = ['gemini-3.5-flash'];

async function run() {
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] })
    });
    const data = await res.json();
    console.log(model, res.ok ? 'SUCCESS' : data.error?.message);
  }
}
run();
