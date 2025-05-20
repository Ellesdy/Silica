/**
 * Simple web server to serve the image HTML files
 * 
 * To use:
 * 1. Run: node generate_images.js
 * 2. Open http://localhost:3030 in a browser
 * 3. Take screenshots of each image by clicking on the links
 * 4. Save the screenshots as PNG files in the docs/images directory
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3030;
const PUBLIC_PATH = path.join(__dirname);

// Map file extensions to MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

// Create an index page with links to all the image files
function createIndexPage() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Silica Whitepaper Images</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #4b0082;
        }
        .links {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }
        a {
          color: #4b0082;
          text-decoration: none;
          padding: 10px;
          background-color: #f0f0f0;
          border-radius: 5px;
        }
        a:hover {
          background-color: #e0e0e0;
        }
        .instructions {
          margin-top: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-left: 4px solid #4b0082;
        }
      </style>
    </head>
    <body>
      <h1>Silica Whitepaper Images</h1>
      <p>Click on each link below to open the image. Then take a screenshot and save it to the docs/images directory.</p>
      
      <div class="links">
        <a href="/silica_logo.html" target="_blank">Silica Logo</a>
        <a href="/silica_architecture.html" target="_blank">Silica Architecture Diagram</a>
        <a href="/token_distribution.html" target="_blank">Token Distribution Chart</a>
      </div>
      
      <div class="instructions">
        <h3>Instructions for capturing images:</h3>
        <ol>
          <li>Click on a link above to open the image in a new tab</li>
          <li>Take a screenshot of the entire image (browser screenshot tools work well)</li>
          <li>Save the screenshot with the corresponding filename in the docs/images directory:</li>
          <ul>
            <li>silica_logo.png</li>
            <li>silica_architecture.png</li>
            <li>token_distribution.png</li>
          </ul>
          <li>These files will be used as references in the whitepaper</li>
        </ol>
      </div>
    </body>
    </html>
  `;
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  // If requesting the root path, serve the index page
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(createIndexPage());
    return;
  }

  // Build the file path from the URL
  const filePath = path.join(PUBLIC_PATH, req.url);
  const extname = path.extname(filePath);
  
  // Get the MIME type for the file extension
  const contentType = MIME_TYPES[extname] || 'text/plain';
  
  // Read the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Send the file content
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Open this URL in your browser to access the image generation tool');
});