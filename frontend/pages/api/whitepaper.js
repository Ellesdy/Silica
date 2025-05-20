import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export default function handler(req, res) {
  try {
    // Get the whitepaper markdown content
    const whitepaperPath = path.join(process.cwd(), '..', 'docs', 'whitepaper.md');
    const markdown = fs.readFileSync(whitepaperPath, 'utf8');
    
    // Convert markdown to HTML
    const html = marked(markdown);
    
    // Send HTML response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Silica Whitepaper</title>
        <style>
          :root {
            --bg-color: #ffffff;
            --text-color: #333333;
            --heading-color: #0070f3;
            --link-color: #0070f3;
            --code-bg: #f5f5f5;
            --blockquote-border: #e5e7eb;
            --table-border: #e5e7eb;
            --table-header-bg: #f9fafb;
          }
          
          @media (prefers-color-scheme: dark) {
            :root {
              --bg-color: #121212;
              --text-color: #f0f0f0;
              --heading-color: #3b82f6;
              --link-color: #60a5fa;
              --code-bg: #1e1e1e;
              --blockquote-border: #374151;
              --table-border: #374151;
              --table-header-bg: #1f2937;
            }
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: var(--heading-color);
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          
          h1 {
            font-size: 2.5rem;
            text-align: center;
            margin-top: 1rem;
          }
          
          h2 {
            font-size: 1.8rem;
            border-bottom: 1px solid var(--blockquote-border);
            padding-bottom: 0.5rem;
          }
          
          h3 {
            font-size: 1.5rem;
          }
          
          p, ul, ol {
            margin-bottom: 1.5rem;
          }
          
          a {
            color: var(--link-color);
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
          
          blockquote {
            border-left: 4px solid var(--blockquote-border);
            padding-left: 1rem;
            margin-left: 0;
            color: gray;
          }
          
          pre {
            background-color: var(--code-bg);
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
          }
          
          code {
            background-color: var(--code-bg);
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: Consolas, Monaco, 'Andale Mono', monospace;
            font-size: 0.9rem;
          }
          
          pre code {
            background-color: transparent;
            padding: 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
          }
          
          table, th, td {
            border: 1px solid var(--table-border);
          }
          
          th {
            background-color: var(--table-header-bg);
            padding: 0.5rem;
            text-align: left;
          }
          
          td {
            padding: 0.5rem;
          }
          
          img {
            max-width: 100%;
            height: auto;
          }
          
          ul, ol {
            padding-left: 2rem;
          }
          
          hr {
            border: none;
            border-top: 1px solid var(--blockquote-border);
            margin: 2rem 0;
          }
          
          .back-to-home {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.5rem 1rem;
            background-color: var(--link-color);
            color: white;
            border-radius: 4px;
            text-decoration: none;
          }
          
          .back-to-home:hover {
            opacity: 0.9;
            text-decoration: none;
          }
          
          @media (max-width: 768px) {
            body {
              padding: 1rem;
            }
            
            h1 {
              font-size: 2rem;
            }
            
            h2 {
              font-size: 1.5rem;
            }
            
            h3 {
              font-size: 1.25rem;
            }
          }
        </style>
      </head>
      <body>
        ${html}
        <p>
          <a href="/" class="back-to-home">Back to Home</a>
        </p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error rendering whitepaper:', error);
    res.status(500).json({ error: 'Failed to render whitepaper' });
  }
} 