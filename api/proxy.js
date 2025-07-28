const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://vps.allpassiveservices.com.au')) {
    res.status(400).send('Invalid or missing URL');
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'image/*' },
    });
    const buffer = await response.buffer();
    res.setHeader('Content-Type', response.headers.get('content-type'));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Failed to fetch image');
  }
};