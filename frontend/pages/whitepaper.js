import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Whitepaper() {
  const [content, setContent] = useState('Loading whitepaper...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchWhitepaper() {
      try {
        const response = await fetch('/api/whitepaper');
        if (response.ok) {
          const html = await response.text();
          // Create a temporary DOM to extract the body content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          
          // Extract content from body
          const bodyContent = tempDiv.querySelector('body').innerHTML;
          setContent(bodyContent);
        } else {
          setError('Failed to load whitepaper');
        }
      } catch (err) {
        console.error('Error fetching whitepaper:', err);
        setError('Error loading whitepaper: ' + err.message);
      }
    }
    
    fetchWhitepaper();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Silica Whitepaper</title>
        <meta name="description" content="Silica Whitepaper - AI-Powered Decentralized Finance Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        {error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="whitepaper-content" dangerouslySetInnerHTML={{ __html: content }}></div>
        )}
        
        <div className="actions">
          <Link href="/">
            <span className="back-button">Back to Home</span>
          </Link>
          
          <a href="/docs/whitepaper.md" download="Silica_Whitepaper.md" className="download-button">
            Download Whitepaper
          </a>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        
        .main {
          flex: 1;
          padding: 6rem 2rem 2rem;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }
        
        .error {
          color: red;
          padding: 1rem;
          background-color: rgba(255, 0, 0, 0.1);
          border-radius: 8px;
        }
        
        .whitepaper-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: var(--text-primary);
        }
        
        .whitepaper-content h1 {
          font-size: 2.5rem;
          text-align: center;
          margin-top: 1rem;
          color: var(--accent-color);
        }
        
        .whitepaper-content h2 {
          font-size: 1.8rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
          color: var(--accent-color);
        }
        
        .whitepaper-content h3 {
          font-size: 1.5rem;
          color: var(--accent-color);
        }
        
        .whitepaper-content p, 
        .whitepaper-content ul, 
        .whitepaper-content ol {
          margin-bottom: 1.5rem;
        }
        
        .whitepaper-content a {
          color: var(--accent-color);
          text-decoration: none;
        }
        
        .whitepaper-content a:hover {
          text-decoration: underline;
        }
        
        .whitepaper-content blockquote {
          border-left: 4px solid var(--border-color);
          padding-left: 1rem;
          margin-left: 0;
          color: var(--text-secondary);
        }
        
        .whitepaper-content pre {
          background-color: var(--bg-secondary);
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
        }
        
        .whitepaper-content code {
          background-color: var(--bg-secondary);
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: Consolas, Monaco, 'Andale Mono', monospace;
          font-size: 0.9rem;
        }
        
        .whitepaper-content pre code {
          background-color: transparent;
          padding: 0;
        }
        
        .whitepaper-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }
        
        .whitepaper-content table, 
        .whitepaper-content th, 
        .whitepaper-content td {
          border: 1px solid var(--border-color);
        }
        
        .whitepaper-content th {
          background-color: var(--bg-secondary);
          padding: 0.5rem;
          text-align: left;
        }
        
        .whitepaper-content td {
          padding: 0.5rem;
        }
        
        .whitepaper-content img {
          max-width: 100%;
          height: auto;
        }
        
        .whitepaper-content ul, 
        .whitepaper-content ol {
          padding-left: 2rem;
        }
        
        .whitepaper-content hr {
          border: none;
          border-top: 1px solid var(--border-color);
          margin: 2rem 0;
        }
        
        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        
        .back-button,
        .download-button {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .back-button {
          color: var(--text-primary);
          background-color: var(--bg-secondary);
        }
        
        .download-button {
          color: white;
          background-color: var(--accent-color);
          text-decoration: none;
        }
        
        .back-button:hover {
          opacity: 0.9;
        }
        
        .download-button:hover {
          opacity: 0.9;
        }
        
        @media (max-width: 768px) {
          .main {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .actions {
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
} 