const fs = require('fs');
const file = 'app/(dashboard)/staff/[id]/staff-detail-client.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\{\/\* View Receipt Modal \*\/\}[\s\S]*?document\.body\s*\)\}/, '');
fs.writeFileSync(file, content);
console.log("Successfully removed viewReceiptData modal.");
