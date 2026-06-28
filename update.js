const fs = require('fs');

const file = 'app/(dashboard)/staff/[id]/staff-detail-client.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('import StaffReceiptPDF')) {
    content = content.replace(
        "import { useSession } from '@/lib/session-context'",
        "import { useSession } from '@/lib/session-context'\nimport StaffReceiptPDF from '@/components/staff-receipt-pdf'"
    );
}

// 2. Remove PDF styles and component
content = content.replace(/import \{ pdf, Document, Page, Text, View, StyleSheet \} from '@react-pdf\/renderer'[\s\S]*?<\/Document>\n\)/, '');

// 3. Remove viewReceiptData state
content = content.replace(/const \[viewReceiptData, setViewReceiptData\] = useState<any>\(null\)\n?/, '');

// 4-8. Remove helper functions
content = content.replace(/const getReceiptData = [\s\S]*?const shareWhatsAppFromData =/g, 'const shareWhatsAppFromData =');
content = content.replace(/const getMonthReceiptData = [\s\S]*?const shareWhatsAppFromData =/g, 'const shareWhatsAppFromData =');
// Just use a simpler regex for the functions block
content = content.replace(/const getReceiptData = \(payment: any\) => \{[\s\S]*?\}\n\s*const getMonthReceiptData = \(\) => \{[\s\S]*?\}\n\s*const shareWhatsApp = \(payment: any\) => \{[\s\S]*?\}\n\s*const shareWhatsAppFromData = \(data: any\) => \{[\s\S]*?\}\n\s*const downloadReceiptFromData = async \(data: any\) => \{[\s\S]*?\}\n/g, '');

// 9. Replace the buttons block
const buttonsBlockRegex = /\{selectedMonthView\.totalPaid > 0 && \(\s*<div className="flex flex-wrap gap-3">[\s\S]*?<\/div>\s*\)\}/;
const newComponent = `{selectedMonthView.totalPaid > 0 && (
          <StaffReceiptPDF
            teacherName={teacher.name}
            subject={teacher.subject}
            monthName={selectedMonthView.monthName || MONTHS[selectedMonthView.monthValue - 1]}
            year={selectedMonthView.year}
            amountPaidNow={selectedMonthView.totalPaid}
            totalSalary={teacher.monthly_salary}
            totalPaidThisMonth={selectedMonthView.totalPaid}
            balance={selectedMonthView.balance}
            note="Monthly Salary Payment"
            schoolName={schoolName}
            teacherMobile={teacher.email}
            payments={selectedMonthView.payments}
          />
        )}`;
content = content.replace(buttonsBlockRegex, newComponent);

// 10. Remove View Receipt Modal
const viewReceiptModalRegex = /\{\/\* View Receipt Modal \*\/\}\s*\{viewReceiptData && mounted && createPortal\([\s\S]*?document\.body\s*\)\}/;
content = content.replace(viewReceiptModalRegex, '');

fs.writeFileSync(file, content);
console.log("Successfully updated staff-detail-client.tsx");
