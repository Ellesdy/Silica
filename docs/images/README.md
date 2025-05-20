# Silica Whitepaper Images

This directory contains the images used in the Silica whitepaper:

1. `silica_logo.png` - The Silica project logo
2. `silica_architecture.png` - Diagram of the Silica platform architecture
3. `token_distribution.png` - Chart showing the SIL token distribution

## How to Generate the Images

We've provided HTML templates for each image. To generate the images:

1. Run the image generation script from the project root:
   ```
   ./generate_whitepaper_images.sh
   ```

2. Open a web browser and navigate to:
   ```
   http://localhost:3030
   ```

3. You'll see links to each image template. Click on each link and take a screenshot of the displayed image.

4. Save the screenshots with the following filenames in this directory:
   - `silica_logo.png`
   - `silica_architecture.png`
   - `token_distribution.png`

5. When you're done, press `Ctrl+C` in the terminal to stop the server.

## About the Images

### Silica Logo
A hexagonal logo representing the Silica platform, with a neural network visualization inside the hexagon, symbolizing the AI capabilities of the platform.

### Architecture Diagram
A high-level view of the Silica platform architecture, showing the three main layers:
- Frontend: User interfaces for different user types
- Blockchain: Smart contracts that power the platform
- Infrastructure: The underlying technologies supporting the platform

### Token Distribution
A pie chart showing the distribution of the 1 billion SIL tokens:
- 40% - Community & Ecosystem (400,000,000 SIL)
- 20% - Treasury (200,000,000 SIL)
- 15% - Team & Advisors (150,000,000 SIL)
- 15% - Investors (150,000,000 SIL)
- 10% - Initial Liquidity (100,000,000 SIL)