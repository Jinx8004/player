const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // Get the original stream URL from the query parameter
  const streamUrl = event.queryStringParameters.url;

  if (!streamUrl) {
    return {
      statusCode: 400,
      body: 'Error: Missing stream URL parameter',
    };
  }

  try {
    // Fetch the M3U8 content from the real server
    // NEW: We add headers to make the request look like a browser
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      }
    });

    const data = await response.text();

    // Return the content back to our video player
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*', // Allow our site to access this
      },
      body: data,
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};