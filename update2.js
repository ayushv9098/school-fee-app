const fs = require('fs');
const file = 'app/(dashboard)/staff/[id]/staff-detail-client.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
// We want to remove lines 111-157 (0-indexed 110-156)
lines.splice(110, 47);
fs.writeFileSync(file, lines.join('\n'));
console.log("Successfully removed old functions.");
