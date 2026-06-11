'use client'

import { useState, useRef, useEffect } from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import html2canvas from 'html2canvas'
import { Download, X, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.412.015 12.046c0 2.121.554 4.191 1.605 6.046L0 24l6.337-1.663a11.785 11.854 0 005.712 1.66h.005c6.637 0 12.032-5.412 12.035-12.047a11.805 11.805 0 00-3.576-8.497"/>
    </svg>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  receiptId: { fontSize: 9, color: '#71717A', textTransform: 'uppercase' },
  receiptIdValue: { fontSize: 11, fontWeight: 'bold', color: '#18181B', marginTop: 2 },
  badge: { backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 'bold', padding: '4px 10px', borderRadius: 12 },
  header: { textAlign: 'center', marginBottom: 32, borderBottom: '2px solid #7C3AED', paddingBottom: 20 },
  schoolName: { fontSize: 24, fontWeight: 'bold', color: '#7C3AED', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#71717A' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#7C3AED', textTransform: 'uppercase', marginBottom: 12, marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottom: '1px solid #F4F4F5' },
  label: { fontSize: 12, color: '#71717A' },
  value: { fontSize: 12, fontWeight: 'bold', color: '#18181B' },
  valueGreen: { fontSize: 12, fontWeight: 'bold', color: '#16A34A' },
  valueRed: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
  totalBox: { 
    backgroundColor: '#F5F3FF', 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 24, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    border: '1px solid #DDD6FE'
  },
  totalBoxLabel: { fontSize: 10, fontWeight: 'bold', color: '#7C3AED', textTransform: 'uppercase', marginBottom: 2 },
  totalBoxValue: { fontSize: 14, fontWeight: 'bold', color: '#7C3AED' },
  balanceLabel: { fontSize: 9, color: '#7C3AED', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase', marginBottom: 2 },
  balanceValue: { fontSize: 18, fontWeight: 'bold', color: '#DC2626', textAlign: 'right' },
  footer: { marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #E4E4E7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerText: { fontSize: 8, color: '#A1A1AA', maxWidth: 220, lineHeight: 1.4 },
  signatureLine: { borderTop: '1px solid #71717A', paddingTop: 4, fontSize: 9, fontWeight: 'bold', color: '#71717A', width: 110, textAlign: 'center' },
})

const translations = {
  en: {
    receiptId: 'Receipt ID',
    paid: 'PAID',
    feeReceipt: 'FEE PAYMENT RECEIPT',
    studentDetails: 'Student Details',
    studentName: 'Student Name',
    class: 'Class',
    paymentBreakdown: 'Payment Breakdown',
    totalFee: 'Total School Fee',
    installmentPaid: 'Installment Paid',
    totalAmountPaid: 'Total Amount Paid',
    outstandingBalance: 'Outstanding Balance',
    grandTotalPaid: 'Grand Total Paid',
    remainingBalance: 'Remaining Balance',
    authorizedSignatory: 'Authorized Signatory',
    fatherName: "Father's Name",
    footer: (date: string) => `Generated digitally on ${date}. This record shows all installments made towards the total school fee.`,
    viewReceipt: 'View Receipt',
    shareWhatsApp: 'Share on WhatsApp',
    generating: 'Generating...',
    processing: 'Processing...',
  },
  hi: {
    receiptId: 'रसीद संख्या',
    paid: 'जमा',
    feeReceipt: 'शुल्क भुगतान रसीद',
    studentDetails: 'छात्र का विवरण',
    studentName: 'छात्र का नाम',
    class: 'कक्षा',
    paymentBreakdown: 'भुगतान का विवरण',
    totalFee: 'कुल स्कूल फीस',
    installmentPaid: 'जमा किस्त',
    totalAmountPaid: 'कुल जमा राशि',
    outstandingBalance: 'शेष राशि',
    grandTotalPaid: 'कुल जमा राशि',
    remainingBalance: 'बकाया राशि',
    authorizedSignatory: 'अधिकृत हस्ताक्षर',
    fatherName: 'पिता का नाम',
    footer: (date: string) => `${date} को डिजिटल रूप से बनाया गया। यह रिकॉर्ड स्कूल फीस के लिए किए गए सभी भुगतानों को दर्शाता है।`,
    viewReceipt: 'रसीद देखें',
    shareWhatsApp: 'व्हाट्सएप पर भेजें',
    generating: 'बना रहे हैं...',
    processing: 'प्रगति पर है...',
  }
}

interface Props {
  studentName: string
  fatherName?: string
  className: string
  amountPaid: number
  totalFees: number
  previousDues?: number
  remainingFees: number
  schoolName: string
  schoolAddress?: string
  schoolMobile?: string
  parentMobile?: string
  payments?: {
    id: string
    amount: number
    paid_at: string
    mode: string
  }[]
  lang?: 'en' | 'hi'
  receiptId?: string
}

function ReceiptDocument({ studentName, fatherName, className, amountPaid, totalFees, previousDues = 0, remainingFees, schoolName, schoolAddress, schoolMobile, payments, lang = 'hi', receiptId }: Props) {
  const t = translations[lang]
  const date = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalPayable = totalFees + previousDues

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.receiptId}>{t.receiptId}</Text>
            <Text style={styles.receiptIdValue}>{receiptId}</Text>
          </View>
          <Text style={styles.badge}>✓ {t.paid.toUpperCase()}</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          {schoolAddress ? <Text style={styles.subtitle}>{schoolAddress}</Text> : null}
          {schoolMobile ? <Text style={styles.subtitle}>📞 {schoolMobile}</Text> : null}
          <Text style={[styles.subtitle, { marginTop: 8, fontWeight: 'bold' }]}>{t.feeReceipt.toUpperCase()}</Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{t.studentDetails}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t.studentName}</Text>
            <Text style={styles.value}>{studentName}</Text>
          </View>
          {fatherName && (
            <View style={styles.row}>
              <Text style={styles.label}>{t.fatherName}</Text>
              <Text style={styles.value}>{fatherName}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>{t.class}</Text>
            <Text style={styles.value}>{className}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t.paymentBreakdown}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t.totalFee} (Current)</Text>
            <Text style={styles.value}>₹{totalFees.toLocaleString('en-IN')}</Text>
          </View>
          
          {previousDues > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>{lang === 'hi' ? 'पिछला बकाया (Arrears)' : 'Previous Dues'}</Text>
              <Text style={styles.valueRed}>₹{previousDues.toLocaleString('en-IN')}</Text>
            </View>
          )}

          <View style={[styles.row, { backgroundColor: '#F9FAFB' }]}>
            <Text style={[styles.label, { fontWeight: 'bold' }]}>{lang === 'hi' ? 'कुल देय (Total Payable)' : 'Total Payable'}</Text>
            <Text style={[styles.value, { fontWeight: 'bold' }]}>₹{totalPayable.toLocaleString('en-IN')}</Text>
          </View>
          
          {payments?.slice(0, 5).map((p) => (
            <View key={p.id} style={styles.row}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#18181B' }}>{t.installmentPaid}</Text>
                <Text style={{ fontSize: 9, color: '#71717A', marginTop: 1 }}>
                  {new Date(p.paid_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {p.mode}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#16A34A' }}>- ₹{p.amount.toLocaleString('en-IN')}</Text>
            </View>
          ))}

          <View style={[styles.row, { borderBottom: 0, marginTop: 12 }]}>
            <Text style={[styles.label, { fontWeight: 'bold', color: '#18181B' }]}>{t.totalAmountPaid}</Text>
            <Text style={styles.valueGreen}>₹{amountPaid.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.row, { borderBottom: 0 }]}>
            <Text style={[styles.label, { fontWeight: 'bold', color: '#18181B' }]}>{t.outstandingBalance}</Text>
            <Text style={remainingFees > 0 ? styles.valueRed : styles.valueGreen}>
              ₹{Math.max(remainingFees, 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.totalBox}>
          <View>
            <Text style={styles.totalBoxLabel}>{t.grandTotalPaid}</Text>
            <Text style={styles.totalBoxValue}>₹{amountPaid.toLocaleString('en-IN')}</Text>
          </View>
          <View>
            <Text style={styles.balanceLabel}>{t.remainingBalance}</Text>
            <Text style={styles.balanceValue}>₹{Math.max(remainingFees, 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t.footer(date)}
          </Text>
          <View>
            <View style={{ width: 110, height: 1, backgroundColor: '#71717A', marginBottom: 4 }} />
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#71717A', textAlign: 'center' }}>{t.authorizedSignatory}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// Hidden receipt for image capture
function ReceiptHTML({ studentName, fatherName, className, amountPaid, totalFees, previousDues = 0, remainingFees, schoolName, schoolAddress, schoolMobile, payments, lang = 'hi', receiptId }: Props) {
  const t = translations[lang]
  const date = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalPayable = totalFees + previousDues

  return (
    <div style={{
      width: '500px',
      padding: '32px',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#18181b',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', margin: '0 0 4px' }}>{t.receiptId}</p>
          <p style={{ fontSize: '12px', fontWeight: '700', margin: 0 }}>{receiptId}</p>
        </div>
        <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '10px', fontWeight: '800', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase' }}>
          ✓ {t.paid}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#7c3aed', margin: '0 0 8px', letterSpacing: '-0.02em' }}>{schoolName}</h1>
        {schoolAddress && <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>{schoolAddress}</p>}
        {schoolMobile && <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>📞 {schoolMobile}</p>}
        <div style={{ margin: '20px auto 0', height: '2px', width: '40px', backgroundColor: '#7c3aed', borderRadius: '2px' }}></div>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#71717a', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.feeReceipt}</p>
      </div>

      {/* Details */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', fontWeight: '800', color: '#7c3aed', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.studentDetails}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f4f4f5' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>{t.studentName}</span>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>{studentName}</span>
        </div>
        {fatherName && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f4f4f5' }}>
            <span style={{ fontSize: '13px', color: '#71717a' }}>{t.fatherName}</span>
            <span style={{ fontSize: '13px', fontWeight: '700' }}>{fatherName}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f4f4f5' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>{t.class}</span>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>{className}</span>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', fontWeight: '800', color: '#7c3aed', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.paymentBreakdown}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f4f4f5' }}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>{t.totalFee} (Current)</span>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>₹{totalFees.toLocaleString('en-IN')}</span>
        </div>
        
        {previousDues > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f4f4f5' }}>
            <span style={{ fontSize: '13px', color: '#71717a' }}>{lang === 'hi' ? 'पिछला बकाया' : 'Previous Dues'}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>₹{previousDues.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', backgroundColor: '#f9fafb' }}>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>{lang === 'hi' ? 'कुल देय' : 'Total Payable'}</span>
          <span style={{ fontSize: '13px', fontWeight: '800' }}>₹{totalPayable.toLocaleString('en-IN')}</span>
        </div>

        {payments && payments.length > 0 ? (
          payments.slice(0, 5).map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f4f5' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '700', margin: 0 }}>{t.installmentPaid}</p>
                <p style={{ fontSize: '11px', color: '#71717a', margin: '2px 0 0' }}>{new Date(p.paid_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {p.mode}</p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a' }}>- ₹{p.amount.toLocaleString('en-IN')}</span>
            </div>
          ))
        ) : null}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>{t.totalAmountPaid}</span>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#16a34a' }}>₹{amountPaid.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0 12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>{t.outstandingBalance}</span>
          <span style={{ fontSize: '13px', fontWeight: '800', color: remainingFees > 0 ? '#dc2626' : '#16a34a' }}>
            ₹{Math.max(remainingFees, 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Total Box */}
      <div style={{ 
        backgroundColor: '#f5f3ff', 
        borderRadius: '12px', 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px',
        border: '1px solid #ddd6fe'
      }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.grandTotalPaid}</p>
          <p style={{ fontSize: '14px', fontWeight: '800', color: '#7c3aed', margin: 0 }}>₹{amountPaid.toLocaleString('en-IN')}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p style={{ fontSize: '10px', color: '#7c3aed', opacity: 0.8, margin: '0 0 2px', fontWeight: '700', textTransform: 'uppercase' }}>{t.remainingBalance}</p>
           <p style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626', margin: 0 }}>₹{Math.max(remainingFees, 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }}>
        <p style={{ fontSize: '9px', color: '#a1a1aa', maxWidth: '240px', lineHeight: '1.4' }}>
          {t.footer(date)}
        </p>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '110px', height: '1px', backgroundColor: '#71717a', marginBottom: '6px' }}></div>
          <p style={{ fontSize: '11px', color: '#71717a', fontWeight: '700' }}>{t.authorizedSignatory}</p>
        </div>
      </div>
    </div>
  )
}

export default function ReceiptPDF(props: Props) {
  const [loading, setLoading] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'hi'>('hi')
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string>('')
  const receiptRef = useRef<HTMLDivElement>(null)
  const t = translations[lang]

  useEffect(() => {
    // Generate stable ID on mount to avoid hydration mismatch
    setReceiptId(`REC-${Date.now()}`)
  }, [])

  async function handlePreview() {
    setLoading(true)
    try {
      const el = receiptRef.current
      if (!el) return

      el.style.display = 'block'
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#ffffff', logging: false, useCORS: true })
      el.style.display = 'none'

      const imgUrl = canvas.toDataURL('image/jpeg', 1.0)
      setPreviewUrl(imgUrl)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleWhatsApp() {
    // 1. Clean Mobile Number (Robust handling for Indian numbers)
    let cleanedMobile = props.parentMobile?.replace(/\D/g, '') || ''
    if (cleanedMobile.length === 10) {
      cleanedMobile = `91${cleanedMobile}`
    } else if (cleanedMobile.length === 11 && cleanedMobile.startsWith('0')) {
      cleanedMobile = `91${cleanedMobile.substring(1)}`
    } else if (cleanedMobile.length > 12 && cleanedMobile.startsWith('00')) {
      cleanedMobile = cleanedMobile.substring(2)
    }

    if (!props.parentMobile) {
      setWhatsappError(lang === 'hi' ? 'अभिभावक का मोबाइल नंबर नहीं मिला' : 'Parent mobile number not found')
      setTimeout(() => setWhatsappError(null), 3000)
    }

    setImgLoading(true)
    try {
      const supabase = createClient()
      const timestamp = Date.now()
      const baseFileName = `receipt-${props.studentName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`

      // 2. Generate Image (This is what people want to see directly)
      const el = receiptRef.current
      if (!el) return
      el.style.display = 'block'
      // Give a tiny bit of time for styles to apply if needed
      await new Promise(r => setTimeout(r, 50))
      
      const canvas = await html2canvas(el, { 
        scale: 2, 
        backgroundColor: '#ffffff', 
        logging: false, 
        useCORS: true 
      })
      el.style.display = 'none'
      
      const imgBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      
      let imageUrl = ''
      if (imgBlob) {
        // Upload JPEG for the fallback link
        const { error: imgErr } = await supabase.storage.from('receipts').upload(`${baseFileName}.jpg`, imgBlob, { contentType: 'image/jpeg', upsert: false })
        if (!imgErr) {
          const { data } = supabase.storage.from('receipts').getPublicUrl(`${baseFileName}.jpg`)
          imageUrl = data.publicUrl
        }
      }

      // 3. Prepare Message
      const message = lang === 'en'
        ? `Dear Parent, fee receipt for *${props.studentName}* (${props.className}).\n\nAmount Paid: *₹${props.amountPaid.toLocaleString('en-IN')}*\nRemaining: *₹${Math.max(props.remainingFees, 0).toLocaleString('en-IN')}*\n\n— ${props.schoolName}`
        : `प्रिय अभिभावक, *${props.studentName}* (${props.className}) की फीस रसीद।\n\nजमा राशि: *₹${props.amountPaid.toLocaleString('en-IN')}*\nशेष राशि: *₹${Math.max(props.remainingFees, 0).toLocaleString('en-IN')}*\n\n— ${props.schoolName}`

      const fullMessage = imageUrl ? `${message}\n\nView Full Receipt: ${imageUrl}` : message

      // 4. ATTEMPT NATIVE SHARE (PRIORITY FOR MOBILE - SENDS ACTUAL IMAGE)
      // This satisfies the "image must be attached" requirement.
      if (navigator.share && imgBlob) {
        try {
          const file = new File([imgBlob], `${baseFileName}.jpg`, { type: 'image/jpeg' })
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Receipt: ${props.studentName}`,
              text: fullMessage
            })
            setImgLoading(false)
            return // Successfully shared via native menu (user picks contact)
          }
        } catch (shareErr) {
          console.log('Native share skipped or failed, using WhatsApp link fallback')
        }
      }

      // 5. SEAMLESS FALLBACK: DIRECT WHATSAPP IF MOBILE NUMBER EXISTS
      // This opens the specific chat but only supports text (due to browser limitations)
      if (cleanedMobile) {
        const whatsappURL = `https://wa.me/${cleanedMobile}?text=${encodeURIComponent(fullMessage)}`
        window.open(whatsappURL, '_blank')
        setImgLoading(false)
        return
      }

      // 6. LAST RESORT: General wa.me (opens WhatsApp contact picker)
      const fallbackURL = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`
      window.open(fallbackURL, '_blank')

      // Background PDF Upload (Silent)
      pdf(<ReceiptDocument {...props} lang={lang} receiptId={receiptId} />).toBlob().then(async (pdfBlob) => {
        if (pdfBlob) {
          await supabase.storage.from('receipts').upload(`${baseFileName}.pdf`, pdfBlob, { contentType: 'application/pdf', upsert: false })
        }
      }).catch(err => console.error('Silent PDF upload failed:', err))

    } catch (err) {
      console.error('WhatsApp share error:', err)
      const fallbackMessage = `Fee receipt for ${props.studentName} - Amount: ₹${props.amountPaid}`
      const finalFallback = cleanedMobile 
        ? `https://wa.me/${cleanedMobile}?text=${encodeURIComponent(fallbackMessage)}`
        : `https://wa.me/?text=${encodeURIComponent(fallbackMessage)}`
      window.open(finalFallback, '_blank')
    }
    setImgLoading(false)
  }

  function handleDownloadImage() {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `${props.studentName}-receipt-${lang}.jpg`
    a.click()
  }

  function handleClose() {
    setPreviewUrl(null)
  }

  return (
    <div className="w-full space-y-4">

      {/* Language Toggle */}
      <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setLang('en')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-violet-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          English
        </button>
        <button
          onClick={() => setLang('hi')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${lang === 'hi' ? 'bg-white text-violet-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          हिंदी (Hindi)
        </button>
      </div>

      {/* Hidden receipt for image capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={receiptRef} style={{ display: 'none' }}>
          <ReceiptHTML {...props} lang={lang} receiptId={receiptId} />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePreview}
          disabled={loading}
          className="h-11 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.generating}</>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              {t.viewReceipt}
            </>
          )}
        </button>

        <button
          onClick={handleWhatsApp}
          disabled={imgLoading}
          className="h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 relative"
        >
          {imgLoading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.processing}</>
          ) : (
            <>
              <WhatsAppIcon className="w-5 h-5" />
              {t.shareWhatsApp}
            </>
          )}
          
          {whatsappError && (
            <div className="absolute -top-10 left-0 right-0 bg-red-50 text-red-600 text-[10px] py-1 px-2 rounded-lg border border-red-100 text-center animate-in fade-in slide-in-from-bottom-1 duration-300">
              {whatsappError}
            </div>
          )}
        </button>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">{lang === 'hi' ? 'रसीद पूर्वावलोकन' : 'Receipt Preview'}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  {lang === 'hi' ? 'डाउनलोड करें' : 'Download Image'}
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-zinc-100/50 p-6 sm:p-8 flex justify-center">
              <div className="relative">
                <img 
                  src={previewUrl} 
                  className="max-w-full h-auto shadow-2xl rounded-lg ring-1 ring-black/5" 
                  alt="Receipt Preview" 
                />
              </div>
            </div>
            
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-center">
               <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                 {lang === 'hi' ? 'पूर्वावलोकन मोड • उच्च गुणवत्ता वाली रसीद' : 'Preview Mode • High Quality Capture'}
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}