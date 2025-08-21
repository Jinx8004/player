const fetch = require('node-fetch');

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
        'Referer': 'https://centra.ink/' // Referer should match the stream's domain
      }
    });

    const playlistText = await response.text();

    // Rewrite the playlist to proxy all segment URLs back through this function
    const rewrittenPlaylist = playlistText
      .split('\n')
      .map(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && !line.startsWith('http')) {
          // Construct the full URL for the segment
          const absoluteSegmentUrl = baseUrl + line;
          // Rewrite the line to point back to our proxy
          return `/.netlify/functions/stream?url=${encodeURIComponent(absoluteSegmentUrl)}`;
        }
        return line;
      })
      .join('\n');

    // Determine the correct Content-Type. Playlists are mpegurl, video segments are different.
    const contentType = streamUrl.includes('.m3u8') 
      ? 'application/vnd.apple.mpegurl' 
      : 'video/MP2T';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
      body: rewrittenPlaylist,
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};