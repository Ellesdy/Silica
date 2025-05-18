import { useState, useEffect, useContext } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import Head from 'next/head';
import Link from 'next/link';
import { parseEther, formatEther } from 'viem';
import { ThemeContext } from './_app';
import dynamic from 'next/dynamic';
import Header from '../components/Header';

// Dynamically import the WalletConnect component with SSR disabled
const WalletConnect = dynamic(
  () => import('../components/WalletConnect'),
  { ssr: false }
);

// Dynamically import the FallbackWalletConnect component
const FallbackWalletConnect = dynamic(
  () => import('../components/FallbackWalletConnect'),
  { ssr: false }
);

export default function Home() {
  const { address, isConnected } = useAccount();
  const { darkMode } = useContext(ThemeContext);
  const [networkInfo, setNetworkInfo] = useState({ name: 'Loading...', contracts: {} });
  const [balance, setBalance] = useState('0');
  const [isRequesting, setIsRequesting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [connectionIssue, setConnectionIssue] = useState(false);

  const silicaTokenABI = [
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) external view returns (uint256)"
  ];

  const { writeContract } = useWriteContract();
  
  // Read token balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: networkInfo.contracts?.SilicaToken,
    abi: silicaTokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!networkInfo.contracts?.SilicaToken && !!address,
  });

  // Update balance when data changes
  useEffect(() => {
    if (balanceData) {
      setBalance(formatEther(balanceData));
    }
  }, [balanceData]);

  // Fetch deployment info on component mount
  useEffect(() => {
    async function fetchDeployment() {
      try {
        const response = await fetch('/api/deployment');
        if (response.ok) {
          const data = await response.json();
          setNetworkInfo(data);
        }
      } catch (err) {
        console.error("Error fetching deployment data:", err);
      }
    }
    
    fetchDeployment();
  }, []);

  // Check for connection issues after a delay
  useEffect(() => {
    if (!isConnected && typeof window !== 'undefined' && window.ethereum) {
      // Wait a bit to see if connection happens automatically
      const timer = setTimeout(() => {
        setConnectionIssue(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else if (isConnected) {
      // Reset if we get connected
      setConnectionIssue(false);
    }
  }, [isConnected]);

  // Request demo tokens
  const requestTokens = async () => {
    if (!isConnected || !networkInfo.contracts?.SilicaToken) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }

    setIsRequesting(true);
    setMessage({ text: '', type: '' });

    try {
      const amount = parseEther('100');
      
      const hash = await writeContract({
        address: networkInfo.contracts.SilicaToken,
        abi: silicaTokenABI,
        functionName: 'mint',
        args: [address, amount]
      });
      
      setTxHash(hash);
      setMessage({ 
        text: '100 SIL tokens have been sent to your wallet!', 
        type: 'success' 
      });
      
      // Refresh balance
      setTimeout(() => refetchBalance(), 3000);
    } catch (error) {
      console.error("Error requesting tokens:", error);
      setMessage({ 
        text: error.message || 'Failed to request tokens. Try again later.', 
        type: 'error' 
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Silica | AI-Powered Decentralized Finance Platform</title>
        <meta name="description" content="Silica is a decentralized AI-powered platform for autonomous financial operations with transparent governance" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="main">
        <section className="hero-section">
          <div className="hero-content">
            <div className="logo-container">
              <img src="/silica-logo.svg" alt="Silica Logo" className="hero-logo" />
              <h1 className="title">
                <span className="highlight">Silica</span>
              </h1>
            </div>
            <p className="tagline">AI-Powered Decentralized Finance</p>
            <p className="description">
              A transparent, autonomous financial ecosystem where AI makes data-driven decisions on the blockchain
            </p>
            
            <div className="cta-buttons">
              {isConnected ? (
                <div className="wallet-info">
                  <p>Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}</p>
                  <p className="balance">{balance} SIL Tokens</p>
                </div>
              ) : (
                <div className="wallet-connection-options">
                  <WalletConnect />
                  
                  {connectionIssue && (
                    <div className="connection-fallback">
                      <p className="connection-issue">Having trouble connecting?</p>
                      <FallbackWalletConnect />
                      <Link href="/diagnostics">
                        <span className="diagnostic-link">Run Connection Diagnostics</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
              
              <div className="action-buttons">
                <Link href="/ai-marketplace">
                  <span className="button button-primary">Explore AI Marketplace</span>
                </Link>
                
                <Link href="/whitepaper">
                  <span className="button button-secondary">Read Whitepaper</span>
                </Link>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-graphics">
              <div className="orb orb-1"></div>
              <div className="orb orb-2"></div>
              <div className="hero-image">
                <svg viewBox="0 0 200 200" width="300" height="300">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={darkMode ? "#3b82f6" : "#0070f3"} stopOpacity="0.7" />
                      <stop offset="100%" stopColor={darkMode ? "#8b5cf6" : "#6d28d9"} stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="80" fill="url(#grad1)" />
                  <path 
                    d="M100,20 L120,60 L160,70 L130,100 L140,140 L100,120 L60,140 L70,100 L40,70 L80,60 Z" 
                    fill="rgba(255,255,255,0.15)" 
                    stroke="rgba(255,255,255,0.5)" 
                    strokeWidth="1" 
                  />
                  <circle cx="100" cy="100" r="30" fill="rgba(255,255,255,0.1)" />
                  <circle cx="100" cy="100" r="20" fill="rgba(255,255,255,0.2)" />
                  <circle cx="100" cy="100" r="10" fill="rgba(255,255,255,0.3)" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {isConnected && (
          <section className="faucet-section">
            <h2>Get Test SIL Tokens</h2>
            <p>To interact with Silica, you'll need test tokens:</p>
            <ul>
              <li>
                <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer">
                  Get Sepolia ETH
                </a> - For gas fees
              </li>
              <li>
                <button 
                  className="button button-secondary" 
                  onClick={requestTokens}
                  disabled={isRequesting}
                >
                  {isRequesting ? 'Requesting...' : 'Request 100 SIL Tokens'}
                </button>
              </li>
            </ul>
            
            {message.text && (
              <div className={`message ${message.type}`}>
                <p>{message.text}</p>
                {txHash && (
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    View transaction
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        <section className="key-features">
          <h2 className="section-title">Why Choose <span className="highlight">Silica</span></h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI-Driven Decision Making</h3>
              <p>Automated asset management and trading strategies powered by advanced AI models</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⛓️</div>
              <h3>Blockchain Transparency</h3>
              <p>All AI decisions and operations are recorded on-chain for full transparency</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Decentralized Governance</h3>
              <p>Community-owned protocol with token voting on key decisions and parameters</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Treasury Management</h3>
              <p>AI-controlled assets growing through data-driven investment strategies</p>
            </div>
          </div>
        </section>

        <section className="ecosystem-section">
          <h2 className="section-title">The Silica <span className="highlight">Ecosystem</span></h2>
          
          <div className="ecosystem-diagram">
            <div className="ecosystem-node central-node">
              <div className="node-icon">🧠</div>
              <div className="node-title">AI Controller</div>
            </div>
            <div className="ecosystem-connections">
              <div className="ecosystem-node">
                <div className="node-icon">💎</div>
                <div className="node-title">SIL Token</div>
              </div>
              <div className="ecosystem-node">
                <div className="node-icon">📊</div>
                <div className="node-title">Model Registry</div>
              </div>
              <div className="ecosystem-node">
                <div className="node-icon">📡</div>
                <div className="node-title">AI Oracle</div>
              </div>
              <div className="ecosystem-node">
                <div className="node-icon">💰</div>
                <div className="node-title">Treasury</div>
              </div>
              <div className="ecosystem-node">
                <div className="node-icon">🗳️</div>
                <div className="node-title">Governance</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Get Started</h2>
          <div className="cards-grid">
            <Link href="/ai-marketplace" className="nav-card">
              <div className="card-icon">🛒</div>
              <h3>AI Marketplace</h3>
              <p>Discover and use AI models created by developers around the world.</p>
            </Link>

            <Link href="/create-ai-tool" className="nav-card">
              <div className="card-icon">🛠️</div>
              <h3>Create AI Tool</h3>
              <p>Register your AI model on the platform and start earning.</p>
            </Link>

            <Link href="/add-token" className="nav-card">
              <div className="card-icon">➕</div>
              <h3>Add Silica Token</h3>
              <p>Add the SIL token to your MetaMask wallet for easy access.</p>
            </Link>

            <Link href="/dashboard" className="nav-card">
              <div className="card-icon">📊</div>
              <h3>Dashboard</h3>
              <p>View your AI models, requests, and earnings in one place.</p>
            </Link>

            <a
              href={`https://${networkInfo.network === 'mainnet' ? '' : networkInfo.network + '.'}etherscan.io/address/${networkInfo.contracts.SilicaToken || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-card"
            >
              <div className="card-icon">🔍</div>
              <h3>View on Etherscan</h3>
              <p>View Silica contracts on Etherscan for transparency.</p>
            </a>

            <Link href="/diagnostics" className="nav-card">
              <div className="card-icon">🔧</div>
              <h3>Connection Diagnostics</h3>
              <p>Troubleshoot wallet connection issues and view debugging information.</p>
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/silica-icon.svg" alt="Silica" width="32" height="32" />
            <span>Silica</span>
          </div>
          <div className="footer-links">
            <Link href="/about">About</Link>
            <Link href="/whitepaper">Whitepaper</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/ai-marketplace">Marketplace</Link>
          </div>
          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer">Discord</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2023 Silica DAO. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-top: 0;
        }

        .hero-section {
          min-height: 80vh;
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 4rem 2rem;
          background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
          position: relative;
          overflow: hidden;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .hero-logo {
          width: 60px;
          height: 60px;
          margin-right: 1rem;
        }

        .hero-content {
          flex: 1;
          z-index: 10;
          max-width: 600px;
        }

        .hero-visual {
          flex: 1;
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 5;
        }
        
        .hero-graphics {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
        }
        
        .orb-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.3));
          top: -50px;
          right: 0;
          z-index: 1;
        }
        
        .orb-2 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(249, 168, 212, 0.4), rgba(216, 180, 254, 0.2));
          bottom: -50px;
          left: 100px;
          z-index: 1;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          background: linear-gradient(90deg, var(--accent-color), #6d28d9);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 800;
        }
        
        .tagline {
          font-size: 1.5rem;
          margin: 0.5rem 0 1rem;
          font-weight: 500;
          color: var(--accent-color);
        }

        .description {
          line-height: 1.5;
          font-size: 1.25rem;
          margin-bottom: 2rem;
        }

        .cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 2rem;
        }
        
        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .button {
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .button-primary {
          background-color: var(--accent-color);
          color: white;
          border: none;
        }

        .button-primary:hover {
          background-color: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 112, 243, 0.2);
        }

        .button-secondary {
          background-color: transparent;
          color: var(--accent-color);
          border: 1px solid var(--accent-color);
        }

        .button-secondary:hover {
          background-color: rgba(0, 112, 243, 0.1);
          transform: translateY(-2px);
        }

        .highlight {
          color: var(--accent-color);
        }

        .wallet-info {
          background-color: var(--bg-secondary);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .wallet-info p {
          margin: 0.5rem 0;
        }
        
        .wallet-info .balance {
          font-weight: bold;
          font-size: 1.2rem;
          color: var(--accent-color);
        }

        .section {
          padding: 5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        
        .key-features, .ecosystem-section {
          padding: 5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          text-align: center;
        }

        .section-title {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 3rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .feature-card {
          background-color: var(--card-bg);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: var(--card-shadow);
          transition: all 0.3s ease;
          text-align: center;
        }

        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          display: inline-block;
          background: linear-gradient(135deg, var(--accent-color), #6d28d9);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .feature-card h3 {
          font-size: 1.3rem;
          margin-bottom: 1rem;
        }

        .feature-card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }
        
        .ecosystem-diagram {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 3rem;
          position: relative;
        }
        
        .ecosystem-connections {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 2rem;
          margin-top: 4rem;
          position: relative;
          max-width: 800px;
        }
        
        .ecosystem-connections::before {
          content: '';
          position: absolute;
          top: -3rem;
          left: 50%;
          width: 2px;
          height: 3rem;
          background: linear-gradient(to bottom, var(--accent-color), transparent);
          transform: translateX(-50%);
        }
        
        .ecosystem-node {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--card-shadow);
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 140px;
          transition: all 0.3s ease;
        }
        
        .ecosystem-node:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
        }
        
        .central-node {
          background: linear-gradient(45deg, var(--accent-color), #6d28d9);
          color: white;
          margin-bottom: 1rem;
        }
        
        .node-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .node-title {
          font-weight: 500;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .nav-card {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 2rem;
          text-decoration: none;
          color: var(--text-primary);
          transition: all 0.3s ease;
          border: 1px solid var(--border-color);
          box-shadow: var(--card-shadow);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .nav-card:hover {
          transform: translateY(-5px);
          border-color: var(--accent-color);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
        }

        .card-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .nav-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
        }

        .nav-card p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 1rem;
          line-height: 1.5;
        }

        .faucet-section {
          background-color: var(--bg-secondary);
          padding: 2rem;
          border-radius: 12px;
          margin: 2rem auto;
          max-width: 800px;
          width: calc(100% - 4rem);
        }

        .faucet-section h2 {
          margin-top: 0;
          color: var(--accent-color);
        }

        .faucet-section ul {
          list-style-type: none;
          padding: 0;
        }

        .faucet-section ul li {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .connection-fallback {
          margin-top: 15px;
          padding: 15px;
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          background-color: var(--bg-secondary);
        }
        
        .connection-issue {
          font-size: 0.9rem;
          margin-bottom: 10px;
          color: var(--text-secondary);
        }
        
        .diagnostic-link {
          display: inline-block;
          margin-top: 10px;
          font-size: 0.8rem;
          color: var(--accent-color);
          cursor: pointer;
        }
        
        .diagnostic-link:hover {
          text-decoration: underline;
        }
        
        .message {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 8px;
        }
        
        .message.success {
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        
        .message.error {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .message a {
          color: var(--accent-color);
          margin-top: 0.5rem;
          display: inline-block;
        }
        
        .footer {
          width: 100%;
          background-color: var(--bg-secondary);
          padding: 0;
          border-top: 1px solid var(--border-color);
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2rem;
        }
        
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          font-size: 1.2rem;
        }
        
        .footer-links, .footer-social {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .footer-links a, .footer-social a {
          color: var(--text-secondary);
          transition: color 0.2s ease;
        }
        
        .footer-links a:hover, .footer-social a:hover {
          color: var(--accent-color);
          text-decoration: none;
        }
        
        .footer-bottom {
          padding: 1.5rem 2rem;
          text-align: center;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        @media (max-width: 968px) {
          .hero-section {
            flex-direction: column;
            gap: 3rem;
            padding-top: 6rem;
          }
          
          .hero-content {
            text-align: center;
            align-items: center;
          }
          
          .action-buttons {
            justify-content: center;
          }
          
          .title {
            font-size: 3rem;
          }
          
          .hero-visual {
            order: -1;
          }
          
          .footer-content {
            grid-template-columns: 1fr;
            text-align: center;
          }
          
          .footer-logo {
            justify-content: center;
          }
          
          .footer-links, .footer-social {
            align-items: center;
          }
        }

        @media (max-width: 600px) {
          .section-title {
            font-size: 2rem;
          }
          
          .cards-grid {
            grid-template-columns: 1fr;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .ecosystem-connections {
            gap: 1rem;
          }
          
          .ecosystem-node {
            min-width: 120px;
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
} 