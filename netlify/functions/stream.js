const fetch = require('node-fetch');

// Helper function to get the base URL from a full URL
// e.g., "https://example.com/live/stream.m3u8" -> "https://example.com/live/"
function getBaseUrl(url) {
  const lastSlash = url.lastIndexOf('/');
  return url.substring(0, lastSlash + 1);
}

exports.handler = async function (event, context) {
  const streamUrl = event.queryStringParameters.url;

  if (!streamUrl) {
    return {
      statusCode: 400,
      body: 'Error: Missing stream URL parameter',
    };
  }

  try {
    const baseUrl = getBaseUrl(streamUrl);
    const response = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Referer': 'https://dai.google.com/' // Keeping a plausible referer
      }
    });

    const playlistText = await response.text();

    // Rewrite the playlist to use absolute URLs
    const rewrittenPlaylist = playlistText
      .split('\n')
      .map(line => {
        line = line.trim();
        // If the line is a URL (not a tag) and is relative, make it absolute
        if (line && !line.startsWith('#') && !line.startsWith('http')) {
          return baseUrl + line;
        }
        return line;
      })
      .join('\n');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
      },
      body: rewrittenPlaylist,
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};