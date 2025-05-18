# Silica Frontend

This is the frontend for the Silica AI Tools platform that enables users to create, share, and monetize AI models.

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