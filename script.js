const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let modifiedFiles = [];

walkDir(path.join(process.cwd(), 'app'), function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('<select') || content.includes('</select>')) {
      content = content.replace(/<select([\s>])/g, '<CustomSelect$1');
      content = content.replace(/<\/select>/g, '</CustomSelect>');
      
      if (!content.includes("import { CustomSelect } from '@/components/ui/custom-select'")) {
        if (content.includes("'use client'")) {
          content = content.replace(/'use client'(;?)\r?\n/, "'use client'$1\nimport { CustomSelect } from '@/components/ui/custom-select'\n");
        } else {
          content = "import { CustomSelect } from '@/components/ui/custom-select'\n" + content;
        }
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles.push(filePath);
    }
  }
});

console.log('Modified files:\n' + modifiedFiles.join('\n'));
