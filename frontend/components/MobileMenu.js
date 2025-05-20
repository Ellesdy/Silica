import Link from 'next/link';
import { useContext } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { ThemeContext } from '../pages/_app';

export default function MobileMenu({ isOpen, onClose }) {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  if (!isOpen) return null;
  
  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  return (
    <div className="mobile-menu-overlay">
      <div className="mobile-menu">
        <div className="menu-header">
          <div className="logo">
            <div className="logo-placeholder">
              {/* Logo placeholder for future update */}
              <div className="logo-placeholder-text">LOGO</div>
            </div>
            <span className="logo-text">Silica</span>
          </div>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <nav className="menu-nav">
          <Link href="/" onClick={onClose}>
            <span className="menu-link">Home</span>
          </Link>
          <Link href="/ai-marketplace" onClick={onClose}>
            <span className="menu-link">Marketplace</span>
          </Link>
          <Link href="/dashboard" onClick={onClose}>
            <span className="menu-link">Dashboard</span>
          </Link>
          <Link href="/token-management" onClick={onClose}>
            <span className="menu-link">Tokens</span>
          </Link>
          <Link href="/governance" onClick={onClose}>
            <span className="menu-link">Governance</span>
          </Link>
          <Link href="/whitepaper" onClick={onClose}>
            <span className="menu-link">Whitepaper</span>
          </Link>
        </nav>
        
        <div className="menu-actions">
          {isConnected && (
            <div className="mobile-wallet-info">
              <span className="mobile-wallet-address">{formatAddress(address)}</span>
              <button onClick={() => {
                disconnect();
                onClose();
              }} className="mobile-disconnect">
                Disconnect Wallet
              </button>
            </div>
          )}
          
          <button 
            onClick={toggleDarkMode} 
            className="theme-toggle-mobile"
          >
            {darkMode ? "Switch to Light Mode 🌞" : "Switch to Dark Mode 🌙"}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
        }
        
        .mobile-menu {
          width: 80%;
          max-width: 350px;
          height: 100%;
          background-color: var(--bg-primary);
          box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .logo-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 35px;
          height: 35px;
          background-color: var(--accent-color);
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .logo-placeholder-text {
          color: #121212;
          font-size: 0.7rem;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        
        .logo-text {
          font-size: 1.3rem;
          font-weight: 700;
          background: linear-gradient(90deg, var(--accent-color), #F5C518);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }
        
        .menu-nav {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex: 1;
        }
        
        .menu-link {
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--text-primary);
          display: block;
          padding: 0.5rem 0;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        
        .menu-link:hover {
          color: var(--accent-color);
        }
        
        .menu-actions {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .mobile-wallet-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .mobile-wallet-address {
          background-color: rgba(255, 215, 0, 0.15);
          color: var(--accent-color);
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          font-size: 0.9rem;
          text-align: center;
        }
        
        .mobile-disconnect {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .mobile-disconnect:hover {
          background-color: rgba(239, 68, 68, 0.2);
        }
        
        .theme-toggle-mobile {
          width: 100%;
          padding: 0.8rem;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background-color 0.2s ease;
        }
        
        .theme-toggle-mobile:hover {
          background-color: var(--border-color);
        }
      `}</style>
    </div>
  );
} 