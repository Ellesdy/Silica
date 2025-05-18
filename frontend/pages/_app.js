import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, mainnet, hardhat } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { useState, useEffect, createContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import '../styles/globals.css';
import Link from 'next/link';

// Create ThemeContext for dark mode
export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

// Dynamically import the WalletConnect component with SSR disabled
const WalletConnect = dynamic(
  () => import('../components/WalletConnect'),
  { ssr: false }
);

// Create a client for React Query
const queryClient = new QueryClient();

// Get the Infura API key from environment
const infuraApiKey = process.env.NEXT_PUBLIC_INFURA_API_KEY || '';
console.log("Infura API Key:", infuraApiKey ? "Set (hidden)" : "Not set");

// Determine which network to use based on environment variable
let chains = [hardhat];
let transports = {
  [hardhat.id]: http('http://127.0.0.1:8545')
};

if (process.env.NEXT_PUBLIC_NETWORK === 'sepolia') {
  chains = [sepolia];
  transports = {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${infuraApiKey}`)
  };
  console.log("Using Sepolia network with Infura");
} else if (process.env.NEXT_PUBLIC_NETWORK === 'mainnet') {
  chains = [mainnet];
  transports = {
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${infuraApiKey}`)
  };
  console.log("Using Mainnet with Infura");
} else {
  console.log("Using local Hardhat network");
}

// Configure provider
console.log("Configuring chains:", chains.map(c => c.name));

// Create the wagmi config with connectors and enable autoConnect
const config = createConfig({
  chains,
  transports,
  connectors: [
    injected()
  ],
  // This will make the app try to reconnect to previously connected wallet
  autoConnect: true,
});

// Safe localStorage access helper
const safeStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item !== null ? item : defaultValue;
      }
    } catch (error) {
      console.warn(`Failed to access localStorage for key '${key}':`, error);
    }
    return defaultValue;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to write to localStorage for key '${key}':`, error);
    }
    return false;
  }
};

function MyApp({ Component, pageProps }) {
  // State for dark mode
  const [darkMode, setDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
    safeStorage.setItem('darkMode', !darkMode);
  };

  // Initialize dark mode from localStorage on client side
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      setIsClient(true);
      try {
        const savedMode = safeStorage.getItem('darkMode');
        if (savedMode !== null) {
          setDarkMode(savedMode === 'true');
        } else {
          // Check for user's system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setDarkMode(prefersDark);
          safeStorage.setItem('darkMode', prefersDark);
        }
      } catch (error) {
        console.error("Error initializing dark mode:", error);
        // Default to light mode on error
        setDarkMode(false);
      }
    }
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <div className={darkMode ? 'dark-theme' : ''}>
            <header className="header">
              <div className="header-container">
                <Link href="/" className="logo-link">
                  <div className="logo">
                    <img src="/silica-icon.svg" alt="Silica" width="32" height="32" />
                    <span>Silica</span>
                  </div>
                </Link>
                
                <nav className={`main-nav ${mobileMenuOpen ? 'show' : ''}`}>
                  <ul className="nav-links">
                    <li>
                      <Link href="/ai-marketplace">Marketplace</Link>
                    </li>
                    <li>
                      <Link href="/create-ai-tool">Create AI Tool</Link>
                    </li>
                    <li>
                      <Link href="/dashboard">Dashboard</Link>
                    </li>
                    <li>
                      <Link href="/whitepaper">Whitepaper</Link>
                    </li>
                  </ul>
                </nav>
                
                <div className="header-actions">
                  {isClient && <WalletConnect />}
                  <button 
                    className="dark-mode-toggle" 
                    onClick={toggleDarkMode}
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                  <button 
                    className="mobile-menu-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle mobile menu"
                  >
                    {mobileMenuOpen ? '✕' : '☰'}
                  </button>
                </div>
              </div>
            </header>
            <Component {...pageProps} />
          </div>
        </WagmiProvider>
      </QueryClientProvider>
      
      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background-color: var(--header-bg);
          backdrop-filter: blur(10px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 0 1rem;
        }
        
        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
        }
        
        .logo-link {
          text-decoration: none;
          color: var(--text-primary);
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          font-size: 1.2rem;
        }
        
        .main-nav {
          margin-left: 2rem;
        }
        
        .nav-links {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0;
          gap: 2rem;
        }
        
        .nav-links li a {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 0;
          transition: color 0.2s ease;
          position: relative;
        }
        
        .nav-links li a:hover {
          color: var(--accent-color);
        }
        
        .nav-links li a::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--accent-color);
          transition: width 0.3s ease;
        }
        
        .nav-links li a:hover::after {
          width: 100%;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .dark-mode-toggle {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s ease;
        }
        
        .dark-mode-toggle:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .dark-theme .dark-mode-toggle:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .mobile-menu-toggle {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .main-nav {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background-color: var(--card-bg);
            padding: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            margin-left: 0;
            z-index: 99;
          }
          
          .main-nav.show {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }
          
          .nav-links {
            flex-direction: column;
            gap: 1rem;
            width: 100%;
          }
          
          .nav-links li {
            width: 100%;
            text-align: center;
          }
          
          .nav-links li a {
            display: block;
            padding: 0.75rem;
          }
          
          .mobile-menu-toggle {
            display: block;
          }
        }
      `}</style>
    </ThemeContext.Provider>
  );
}

export default MyApp; 