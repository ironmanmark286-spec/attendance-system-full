const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/hp/OneDrive/Desktop/ak/Ak/attendance-system-full/web-admin/src';

function processDir(d) {
  fs.readdirSync(d).forEach(file => {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // More aggressive gradient replacement
      content = content.replace(/background:\s*['"`]linear-gradient\([^)]+\)['"`]/g, "background: 'var(--primary)'");
      content = content.replace(/backgroundImage:\s*['"`]linear-gradient\([^)]+\)['"`]/g, "backgroundImage: 'none'");
      
      // Some other borders
      content = content.replace(/borderRadius:\s*['"]?10['"]?/g, "borderRadius: 4");
      
      fs.writeFileSync(fullPath, content);
    }
  });
}

processDir(dir);
console.log('Second pass UI files processed.');
