/**
 * Silica Whitepaper Image Generator
 * 
 * This script generates the PNG files needed for the Silica whitepaper:
 * 1. silica_logo.png
 * 2. silica_architecture.png
 * 3. token_distribution.png
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create the images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'docs', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// ------------------- Silica Logo Generation -------------------

function generateLogo() {
  console.log('Generating Silica logo...');
  
  const canvas = createCanvas(800, 200);
  const ctx = canvas.getContext('2d');
  
  // Set white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Center position
  const centerX = 200;
  const centerY = 100;
  
  // Draw hexagon
  drawHexagon(ctx, centerX, centerY, 70, '#4b0082', '#8a2be2');
  
  // Draw inner hexagon
  drawHexagon(ctx, centerX, centerY, 40, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)', false);
  
  // Draw center circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();
  
  // Draw neural connections
  drawNeuralConnections(ctx, centerX, centerY, 40);
  
  // Draw text
  ctx.font = 'bold 72px Arial';
  ctx.fillStyle = '#4b0082';
  ctx.fillText('SILICA', centerX + 70, centerY + 25);
  
  // Draw tagline
  ctx.font = '18px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText('AI-Powered Decentralized Platform', centerX + 70, centerY + 55);
  
  // Save the logo
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'silica_logo.png'), buffer);
  console.log('Logo saved to docs/images/silica_logo.png');
}

function drawHexagon(ctx, centerX, centerY, size, fillColor, strokeColor, withGradient = true) {
  ctx.beginPath();
  
  // Calculate hexagon points
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = centerX + size * Math.cos(angle);
    const y = centerY + size * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.closePath();
  
  // Fill with gradient or solid color
  if (withGradient) {
    const gradient = ctx.createLinearGradient(
      centerX - size, centerY - size, 
      centerX + size, centerY + size
    );
    gradient.addColorStop(0, '#4b0082');
    gradient.addColorStop(1, '#8a2be2');
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = fillColor;
  }
  
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawNeuralConnections(ctx, centerX, centerY, size) {
  const points = [];
  
  // Calculate node positions
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i + (Math.PI / 4);
    const x = centerX + (size * 0.7) * Math.cos(angle);
    const y = centerY + (size * 0.7) * Math.sin(angle);
    points.push({ x, y });
  }
  
  // Add center point
  points.push({ x: centerX, y: centerY });
  
  // Draw connections
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[4].x, points[4].y);
    ctx.stroke();
  }
  
  // Draw nodes
  ctx.fillStyle = 'white';
  
  for (let point of points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ------------------- Architecture Diagram Generation -------------------

function generateArchitectureDiagram() {
  console.log('Generating architecture diagram...');
  
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');
  
  // Set white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw title
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#4b0082';
  ctx.textAlign = 'center';
  ctx.fillText('Silica Platform Architecture', 400, 30);
  
  // Layer labels
  drawLayerLabel(ctx, 'FRONTEND', 20, 80);
  drawLayerLabel(ctx, 'BLOCKCHAIN', 20, 180);
  drawLayerLabel(ctx, 'INFRASTRUCTURE', 20, 280);
  
  // Frontend Layer Boxes
  drawBox(ctx, 100, 60, 120, 50, '#6a0dad', '🖥️', 'User Interface');
  drawBox(ctx, 340, 60, 120, 50, '#6a0dad', '🎨', 'Creator Dashboard');
  drawBox(ctx, 580, 60, 120, 50, '#6a0dad', '💼', 'Admin Portal');
  
  // Blockchain Layer Boxes
  drawBox(ctx, 80, 160, 100, 50, '#9370db', '💰', 'SilicaToken');
  drawBox(ctx, 200, 160, 100, 50, '#9370db', '📊', 'ModelRegistry');
  drawBox(ctx, 320, 160, 100, 50, '#9370db', '⚙️', 'ExecutionEngine');
  drawBox(ctx, 440, 160, 100, 50, '#9370db', '🧠', 'AIController');
  drawBox(ctx, 560, 160, 100, 50, '#9370db', '🗳️', 'Governance');
  drawBox(ctx, 680, 160, 100, 50, '#9370db', '💎', 'Treasury');
  
  // Infrastructure Layer Boxes
  drawBox(ctx, 140, 260, 140, 50, '#800080', '🔗', 'Ethereum Blockchain');
  drawBox(ctx, 340, 260, 140, 50, '#800080', '📡', 'Compute Network');
  drawBox(ctx, 540, 260, 140, 50, '#800080', '📂', 'Decentralized Storage');
  
  // Draw connections between layers
  // Frontend to Blockchain
  drawConnection(ctx, 120, 115, 'vertical');
  drawArrow(ctx, 120, 125, 'down');
  
  drawConnection(ctx, 360, 115, 'vertical');
  drawArrow(ctx, 360, 125, 'down');
  
  drawConnection(ctx, 600, 115, 'vertical');
  drawArrow(ctx, 600, 125, 'down');
  
  // Blockchain to Infrastructure
  drawConnection(ctx, 160, 215, 'vertical');
  drawArrow(ctx, 160, 225, 'down');
  
  drawConnection(ctx, 360, 215, 'vertical');
  drawArrow(ctx, 360, 225, 'down');
  
  drawConnection(ctx, 560, 215, 'vertical');
  drawArrow(ctx, 560, 225, 'down');
  
  // Horizontal connections in blockchain layer
  drawConnection(ctx, 180, 185, 'horizontal');
  drawArrow(ctx, 192, 185, 'right');
  
  drawConnection(ctx, 300, 185, 'horizontal');
  drawArrow(ctx, 312, 185, 'right');
  
  drawConnection(ctx, 420, 185, 'horizontal');
  drawArrow(ctx, 432, 185, 'right');
  
  drawConnection(ctx, 540, 185, 'horizontal');
  drawArrow(ctx, 552, 185, 'right');
  
  drawConnection(ctx, 660, 185, 'horizontal');
  drawArrow(ctx, 672, 185, 'right');
  
  // Draw legend
  drawLegend(ctx);
  
  // Save the architecture diagram
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'silica_architecture.png'), buffer);
  console.log('Architecture diagram saved to docs/images/silica_architecture.png');
}

function drawLayerLabel(ctx, text, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawBox(ctx, x, y, width, height, color, emoji, title) {
  // Draw box
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, height, 8, true);
  
  // Add shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  
  // Reset shadow for text
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Draw emoji
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(emoji, x + width / 2, y + height / 2 - 5);
  
  // Draw title
  ctx.font = 'bold 14px Arial';
  ctx.fillText(title, x + width / 2, y + height / 2 + 15);
}

function drawConnection(ctx, x, y, direction) {
  const length = 20;
  
  ctx.beginPath();
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  
  if (direction === 'vertical') {
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + length);
  } else { // horizontal
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y);
  }
  
  ctx.stroke();
}

function drawArrow(ctx, x, y, direction) {
  ctx.beginPath();
  ctx.fillStyle = '#ddd';
  
  if (direction === 'down') {
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x + 5, y - 5);
    ctx.lineTo(x, y + 5);
  } else { // right
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x - 5, y + 5);
    ctx.lineTo(x + 5, y);
  }
  
  ctx.fill();
}

function drawLegend(ctx) {
  // Legend background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  roundRect(ctx, 670, 320, 120, 70, 5, true, true);
  
  // Legend items
  const items = [
    { color: '#6a0dad', label: 'User Interfaces' },
    { color: '#9370db', label: 'Smart Contracts' },
    { color: '#800080', label: 'Infrastructure' }
  ];
  
  for (let i = 0; i < items.length; i++) {
    // Color box
    ctx.fillStyle = items[i].color;
    roundRect(ctx, 680, 330 + i * 20, 12, 12, 3, true);
    
    // Label
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText(items[i].label, 700, 340 + i * 20);
  }
}

// ------------------- Token Distribution Chart Generation -------------------

function generateTokenDistributionChart() {
  console.log('Generating token distribution chart...');
  
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');
  
  // Set white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw chart title
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#4b0082';
  ctx.textAlign = 'center';
  ctx.fillText('Silica Token Distribution', 400, 30);
  
  // Draw subtitle
  ctx.font = '16px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText('Total Supply: 1,000,000,000 SIL', 400, 55);
  
  // Define allocation data
  const allocations = [
    { name: 'Community & Ecosystem', percentage: 40, amount: '400,000,000', vesting: '5-year gradual release', color: '#4b0082' },
    { name: 'Treasury', percentage: 20, amount: '200,000,000', vesting: 'Controlled by DAO', color: '#8a2be2' },
    { name: 'Team & Advisors', percentage: 15, amount: '150,000,000', vesting: '3-year vesting, 1-year cliff', color: '#9370db' },
    { name: 'Investors', percentage: 15, amount: '150,000,000', vesting: '2-year vesting', color: '#ba55d3' },
    { name: 'Initial Liquidity', percentage: 10, amount: '100,000,000', vesting: 'Immediately available', color: '#d8bfd8' }
  ];
  
  // Draw pie chart
  drawPieChart(ctx, allocations);
  
  // Draw table
  drawTable(ctx, allocations);
  
  // Save the token distribution chart
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'token_distribution.png'), buffer);
  console.log('Token distribution chart saved to docs/images/token_distribution.png');
}

function drawPieChart(ctx, allocations) {
  // Chart dimensions
  const centerX = 250;
  const centerY = 160;
  const radius = 100;
  
  // Draw pie slices
  let startAngle = -Math.PI / 2; // Start at top
  
  allocations.forEach(allocation => {
    const sliceAngle = (allocation.percentage / 100) * Math.PI * 2;
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    
    // Fill slice
    ctx.fillStyle = allocation.color;
    ctx.fill();
    
    // Stroke slice
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    startAngle += sliceAngle;
  });
  
  // Draw chart legend
  drawChartLegend(ctx, allocations, 400, 120);
}

function drawChartLegend(ctx, allocations, x, y) {
  const lineHeight = 30;
  const dotSize = 12;
  
  ctx.textAlign = 'left';
  
  allocations.forEach((allocation, index) => {
    const yPos = y + index * lineHeight;
    
    // Draw color dot
    ctx.fillStyle = allocation.color;
    ctx.beginPath();
    ctx.arc(x, yPos, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw label
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(allocation.name + ': ' + allocation.percentage + '%', x + 15, yPos + 5);
  });
}

function drawTable(ctx, allocations) {
  // Table position and dimensions
  const tableX = 80;
  const tableY = 275;
  const tableWidth = 640;
  const rowHeight = 30;
  const colWidths = [200, 100, 140, 200];
  
  // Draw table headers
  const headers = ['Allocation', 'Percentage', 'Amount (SIL)', 'Vesting'];
  
  // Draw header background
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(tableX, tableY, tableWidth, rowHeight);
  
  // Draw header border
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, tableY, tableWidth, rowHeight);
  
  // Draw header text
  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  
  let xOffset = tableX + 10;
  headers.forEach((header, index) => {
    ctx.fillText(header, xOffset, tableY + 20);
    xOffset += colWidths[index];
  });
  
  // Draw rows
  allocations.forEach((allocation, rowIndex) => {
    const rowY = tableY + (rowIndex + 1) * rowHeight;
    
    // Draw row border
    ctx.strokeRect(tableX, rowY, tableWidth, rowHeight);
    
    // Draw allocation name with color dot
    ctx.fillStyle = allocation.color;
    ctx.beginPath();
    ctx.arc(tableX + 15, rowY + 15, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText(allocation.name, tableX + 30, rowY + 20);
    
    // Draw percentage
    ctx.fillText(allocation.percentage + '%', tableX + colWidths[0] + 10, rowY + 20);
    
    // Draw amount
    ctx.fillText(allocation.amount, tableX + colWidths[0] + colWidths[1] + 10, rowY + 20);
    
    // Draw vesting
    ctx.fillText(allocation.vesting, tableX + colWidths[0] + colWidths[1] + colWidths[2] + 10, rowY + 20);
  });
}

// Utility function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (fill) {
    ctx.fill();
  }
  
  if (stroke) {
    ctx.stroke();
  }
}

// Generate all the PNG files
console.log('Generating PNG files for Silica whitepaper...');
generateLogo();
generateArchitectureDiagram();
generateTokenDistributionChart();
console.log('All PNG files generated successfully!');
console.log('Files available in: ' + imagesDir);