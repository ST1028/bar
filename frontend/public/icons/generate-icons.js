// Simple script to generate basic PWA icons
// This creates simple colored square icons with text
// In production, you would use proper app icons

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#1976d2';
  ctx.fillRect(0, 0, size, size);
  
  // Icon (simple cocktail glass)
  ctx.fillStyle = '#ffffff';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍸', size / 2, size / 2);
  
  // Download
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icon-${size}x${size}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Run this in browser console to generate icons
sizes.forEach(size => generateIcon(size));