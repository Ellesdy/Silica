# Frontend Application

This is the frontend application for the Silica project.

## Recent Updates

### Dark Mode with Gold Accent

The application has been updated with a dark mode theme featuring gold accents. This is now the default theme for the application.

Key changes:
- Dark background colors with gold accent elements
- Updated styling for components to match the new theme
- Improved visual hierarchy and contrast for better readability
- Preparation for new logo implementation

## Adding a New Logo

To replace the placeholder with your new logo:

1. Prepare your logo files:
   - Main logo file (recommended size: at least 200x200px, SVG format preferred)
   - Favicon (16x16px, 32x32px, and 96x96px)

2. Place your logo files in the `/public` directory:
   - `/public/logo.svg` - Main logo
   - `/public/favicon.ico` - Favicon

3. Update the logo references in the following files:
   - `components/Header.js`
   - `components/MobileMenu.js`
   - `pages/_app.js`

In each file, replace the logo placeholder:

```jsx
<div className="logo-placeholder">
  {/* Logo placeholder for future update */}
  <div className="logo-placeholder-text">LOGO</div>
</div>
```

With the actual logo:

```jsx
<img src="/logo.svg" alt="Silica Logo" className="logo-img" />
```

4. Adjust the CSS styles as needed for your specific logo

## Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Technology Stack

- Next.js
- React
- wagmi for blockchain interactions
- CSS Modules for styling

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment (if needed):
```bash
# Create .env.local file with any environment variables
```

## Running the Frontend

### Using the run-dev script (recommended)

This script automatically kills any existing Next.js server on port 3000 before starting a new one:

```bash
run-dev.bat
```

### Manual method

1. First ensure no existing Next.js server is running:
```bash
# Find the process using port 3000
netstat -ano | findstr :3000
# Kill it using the PID (replace PID with the actual number)
taskkill /PID PID /F
```

2. Then start the development server:
```bash
npm run dev
```

## Troubleshooting

### Port issues
If you see "Port 3000 is in use", you may have an orphaned Node.js process. Use the manual method above to kill it.

### Wagmi/Ethers compatibility
This project uses:
- wagmi v1.4.13
- ethers v5.7.2 (important: do NOT upgrade to v6.x as it's incompatible with wagmi v1)

If you encounter wallet connection errors, check that these versions are correctly installed. 