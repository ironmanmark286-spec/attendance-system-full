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
      
      // Tone down border radii inline styles
      content = content.replace(/borderRadius:\s*32/g, 'borderRadius: 4');
      content = content.replace(/borderRadius:\s*'32px'/g, "borderRadius: '4px'");
      content = content.replace(/borderRadius:\s*24/g, 'borderRadius: 4');
      content = content.replace(/borderRadius:\s*'24px'/g, "borderRadius: '4px'");
      content = content.replace(/borderRadius:\s*20/g, 'borderRadius: 4');
      content = content.replace(/borderRadius:\s*'20px'/g, "borderRadius: '4px'");
      content = content.replace(/borderRadius:\s*16/g, 'borderRadius: 4');
      content = content.replace(/borderRadius:\s*'16px'/g, "borderRadius: '4px'");
      content = content.replace(/borderRadius:\s*14/g, 'borderRadius: 4');
      content = content.replace(/borderRadius:\s*'14px'/g, "borderRadius: '4px'");
      content = content.replace(/borderRadius:\s*12/g, 'borderRadius: 4');
      content = content.replace(/borderRadius:\s*'12px'/g, "borderRadius: '4px'");
      content = content.replace(/borderRadius:\s*35/g, 'borderRadius: 4');
      content = content.replace(/borderRadius:\s*40/g, 'borderRadius: 4');
      
      // Remove extreme gradients, use primary
      content = content.replace(/background:\s*'linear-gradient\([^)]+\)'/g, "background: 'var(--primary)'");
      content = content.replace(/backgroundImage:\s*'linear-gradient\([^)]+\)'/g, "backgroundImage: 'none'");
      
      // Remove backdrop filters inline
      content = content.replace(/backdropFilter:\s*'blur\([^)]+\)'/g, "backdropFilter: 'none'");
      content = content.replace(/WebkitBackdropFilter:\s*'blur\([^)]+\)'/g, "WebkitBackdropFilter: 'none'");
      
      // Remove extreme box shadows inline
      content = content.replace(/boxShadow:\s*'0 [^']+'/g, "boxShadow: 'var(--shadow-sm)'");

      // Replace huge icons/avatars rounded borders
      content = content.replace(/borderRadius:\s*50%/g, "borderRadius: '4px'");
      
      fs.writeFileSync(fullPath, content);
    }
  });
}

processDir(dir);
console.log('UI files processed.');
