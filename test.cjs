const https = require('https');
https.get('https://ais-pre-5cspifiraniwbguxphylug-720834037017.europe-west2.run.app/', (res) => {
  console.log('Status Code:', res.statusCode);
  let body='';
  res.on('data', c => body+=c);
  res.on('end', () => console.log('Body:', body.substring(0, 300)));
}).on('error', console.error);
