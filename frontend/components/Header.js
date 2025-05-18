import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useDisconnect, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { ThemeContext } from '../pages/_app';
import dynamic from 'next/dynamic';
import MobileMenu from './MobileMenu';

// Dynamically import the WalletConnect component with SSR disabled
const WalletConnect = dynamic(
  () => import('./WalletConnect'),
  { ssr: false }
);

export default function Header() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({ name: '', contracts: {} });
  const [balance, setBalance] = useState('0');

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
  
  const silicaTokenABI = [
    "function balanceOf(address account) external view returns (uint256)"
  ];
  
  // Read token balance
  const { data: balanceData } = useReadContract({
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <Link href="/">
              <span className="logo-link">
                <img src="/silica-icon.svg" alt="Silica Logo" className="logo-img" />
                <span className="logo-text">Silica</span>
              </span>
            </Link>
          </div>
          
          <nav className="main-nav">
            <Link href="/ai-marketplace">
              <span className="nav-link">Marketplace</span>
            </Link>
            <Link href="/dashboard">
              <span className="nav-link">Dashboard</span>
            </Link>
            <Link href="/token-management">
              <span className="nav-link">Tokens</span>
            </Link>
            <Link href="/governance">
              <span className="nav-link">Governance</span>
            </Link>
            <Link href="/whitepaper">
              <span className="nav-link">Whitepaper</span>
            </Link>
          </nav>
          
          <div className="header-actions">
            <button 
              onClick={toggleDarkMode} 
              className="theme-toggle"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "🌞" : "🌙"}
            </button>
            
            {isConnected ? (
              <div className="wallet-info">
                {parseFloat(balance) > 0 && (
                  <span className="token-balance" title="Your SIL token balance">
                    {parseFloat(balance).toFixed(2)} SIL
                  </span>
                )}
                <span className="wallet-address" title={address}>
                  {formatAddress(address)}
                </span>
                <button onClick={() => disconnect()} className="disconnect-button">
                  Disconnect
                </button>
              </div>
            ) : (
              <WalletConnect />
            )}
          </div>
          
          <button 
            className="mobile-menu-button" 
            aria-label="Menu"
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        <style jsx>{`
          .header {
            position: sticky;
            top: 0;
            z-index: 100;
            width: 100%;
            background-color: var(--bg-primary);
            border-bottom: 1px solid var(--border-color);
            padding: 0.75rem 0;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .header-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .logo {
            display: flex;
            align-items: center;
          }
          
          .logo-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
          }
          
          .logo-img {
            width: 32px;
            height: 32px;
          }
          
          .logo-text {
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(90deg, var(--accent-color), #6d28d9);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          
          .main-nav {
            display: flex;
            gap: 1.5rem;
          }
          
          .nav-link {
            color: var(--text-primary);
            font-weight: 500;
            cursor: pointer;
            position: relative;
            padding: 0.5rem 0.25rem;
            transition: color 0.2s ease;
          }
          
          .nav-link:hover {
            color: var(--accent-color);
          }
          
          .nav-link:hover::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: var(--accent-color);
            border-radius: 1px;
          }
          
          .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          
          .theme-toggle {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: var(--bg-secondary);
          }
          
          .theme-toggle:hover {
            background-color: var(--border-color);
          }
          
          .wallet-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .token-balance {
            padding: 0.3rem 0.6rem;
            background-color: rgba(99, 102, 241, 0.1);
            color: var(--accent-color);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
          }
          
          .wallet-address {
            padding: 0.3rem 0.6rem;
            background-color: var(--bg-secondary);
            border-radius: 6px;
            font-size: 0.9rem;
          }
          
          .disconnect-button {
            background-color: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 0.3rem 0.6rem;
            border-radius: 6px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .disconnect-button:hover {
            background-color: rgba(239, 68, 68, 0.2);
          }
          
          .mobile-menu-button {
            display: none;
            flex-direction: column;
            justify-content: space-between;
            width: 28px;
            height: 20px;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
          }
          
          .mobile-menu-button span {
            width: 100%;
            height: 2px;
            background-color: var(--text-primary);
            border-radius: 10px;
            transition: all 0.3s linear;
          }
          
          @media (max-width: 968px) {
            .main-nav {
              display: none;
            }
            
            .mobile-menu-button {
              display: flex;
            }
          }
          
          @media (max-width: 768px) {
            .token-balance {
              display: none;
            }
          }
          
          @media (max-width: 640px) {
            .wallet-info {
              display: flex;
            }
            
            .wallet-address {
              font-size: 0.8rem;
              padding: 0.2rem 0.4rem;
            }
            
            .disconnect-button {
              font-size: 0.8rem;
              padding: 0.2rem 0.4rem;
            }
            
            .header-container {
              padding: 0 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .wallet-address {
              display: none;
            }
          }
        `}</style>
      </header>
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
} 