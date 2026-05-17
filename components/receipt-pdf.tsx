'use client'

import { useState, useRef } from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import html2canvas from 'html2canvas'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptId: { fontSize: 10, color: '#71717A' },
  receiptIdValue: { fontSize: 11, fontWeight: 'bold', color: '#18181B' },
  badge: { backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: 10, padding: '4px 10px', borderRadius: 20 },
  header: { textAlign: 'center', marginBottom: 30, borderBottom: '2px solid #7C3AED', paddingBottom: 20 },
  schoolName: { fontSize: 22, fontWeight: 'bold', color: '#7C3AED', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#71717A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottom: '1px solid #F4F4F5' },
  label: { fontSize: 12, color: '#71717A' },
  value: { fontSize: 12, fontWeight: 'bold', color: '#18181B' },
  valueGreen: { fontSize: 12, fontWeight: 'bold', color: '#16A34A' },
  valueRed: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
  totalBox: { backgroundColor: '#F5F3FF', borderRadius: 8, padding: 16, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#7C3AED' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#7C3AED' },
  footer: { marginTop: 40, paddingTop: 20, borderTop: '1px solid #E4E4E7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerText: { fontSize: 9, color: '#A1A1AA', maxWidth: 200 },
  signatureLine: { borderTop: '1px solid #71717A', paddingTop: 4, fontSize: 10, color: '#71717A', width: 120, textAlign: 'center' },
})

interface Props {
  studentName: string
  className: string
  amountPaid: number
  totalFees: number
  remainingFees: number
  schoolName: string
  schoolAddress?: string
  schoolMobile?: string
}

function ReceiptDocument({ studentName, className, amountPaid, totalFees, remainingFees, schoolName, schoolAddress, schoolMobile }: Props) {
  const receiptId = `REC-${Date.now()}`
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.receiptId}>Receipt ID</Text>
            <Text style={styles.receiptIdValue}>{receiptId}</Text>
          </View>
          <Text style={styles.badge}>✓ Paid</Text>
        </View>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          {schoolAddress ? <Text style={styles.subtitle}>{schoolAddress}</Text> : null}
          {schoolMobile ? <Text style={styles.subtitle}>📞 {schoolMobile}</Text> : null}
          <Text style={[styles.subtitle, { marginTop: 8 }]}>Fee Payment Receipt</Text>
        </View>
        <View>
          <View style={styles.row}>
            <Text style={styles.label}>Student Name</Text>
            <Text style={styles.value}>{studentName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Class</Text>
            <Text style={styles.value}>{className}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Fees</Text>
            <Text style={styles.value}>₹{totalFees.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.valueGreen}>₹{amountPaid.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Remaining Fees</Text>
            <Text style={remainingFees > 0 ? styles.valueRed : styles.valueGreen}>
              ₹{Math.max(remainingFees, 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Amount Paid</Text>
          <Text style={styles.totalValue}>₹{amountPaid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated digitally by school fee management system.</Text>
          <View>
            <Text style={styles.signatureLine}>Authorized Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// Hidden receipt for image capture
function ReceiptHTML({ studentName, className, amountPaid, totalFees, remainingFees, schoolName, schoolAddress, schoolMobile }: Props) {
  const receiptId = `REC-${Date.now()}`
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{
      width: '600px',
      padding: '40px',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#71717A', margin: 0 }}>Receipt ID</p>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#18181B', margin: 0 }}>{receiptId}</p>
        </div>
        <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontSize: '11px', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
          ✓ Paid
        </span>
      </div>

      {/* School */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #7C3AED', paddingBottom: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#7C3AED', margin: '0 0 4px' }}>{schoolName}</h1>
        {schoolAddress && <p style={{ fontSize: '12px', color: '#71717A', margin: '2px 0' }}>{schoolAddress}</p>}
        {schoolMobile && <p style={{ fontSize: '12px', color: '#71717A', margin: '2px 0' }}>📞 {schoolMobile}</p>}
        <p style={{ fontSize: '13px', color: '#71717A', marginTop: '8px' }}>Fee Payment Receipt</p>
      </div>

      {/* Details */}
      {[
        { label: 'Student Name', value: studentName, color: '#18181B' },
        { label: 'Class', value: className, color: '#18181B' },
        { label: 'Payment Date', value: date, color: '#18181B' },
        { label: 'Total Fees', value: `₹${totalFees.toLocaleString('en-IN')}`, color: '#18181B' },
        { label: 'Amount Paid', value: `₹${amountPaid.toLocaleString('en-IN')}`, color: '#16A34A' },
        { label: 'Remaining Fees', value: `₹${Math.max(remainingFees, 0).toLocaleString('en-IN')}`, color: remainingFees > 0 ? '#DC2626' : '#16A34A' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F4F4F5' }}>
          <span style={{ fontSize: '13px', color: '#71717A' }}>{item.label}</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: item.color }}>{item.value}</span>
        </div>
      ))}

      {/* Total Box */}
      <div style={{ backgroundColor: '#F5F3FF', borderRadius: '8px', padding: '16px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#7C3AED' }}>Amount Paid</span>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#7C3AED' }}>₹{amountPaid.toLocaleString('en-IN')}</span>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <p style={{ fontSize: '10px', color: '#A1A1AA', maxWidth: '200px' }}>Generated digitally by school fee management system.</p>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #71717A', paddingTop: '4px', fontSize: '11px', color: '#71717A', width: '120px' }}>
            Authorized Signature
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReceiptPDF(props: Props) {
  const [loading, setLoading] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  async function handlePreview() {
    setLoading(true)
    try {
      const blob = await pdf(<ReceiptDocument {...props} />).toBlob()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleWhatsApp() {
  setImgLoading(true)
  try {
    const el = receiptRef.current
    if (!el) return

    el.style.display = 'block'
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
    el.style.display = 'none'

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], `${props.studentName}-receipt.jpg`, { type: 'image/jpeg' })

      // Check if Web Share API supports files (mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Fee Receipt - ${props.studentName}`,
          text: `Dear Parent, fee receipt for ${props.studentName} (${props.className}). Amount Paid: ₹${props.amountPaid.toLocaleString('en-IN')}. Remaining: ₹${Math.max(props.remainingFees, 0).toLocaleString('en-IN')}. — ${props.schoolName}`,
        })
      } else {
        // Desktop fallback — download + open WhatsApp
        const imgUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = imgUrl
        a.download = `${props.studentName}-receipt.jpg`
        a.click()

        setTimeout(() => {
          const message = `Dear Parent, fee receipt for *${props.studentName}* (${props.className}). Amount Paid: *₹${props.amountPaid.toLocaleString('en-IN')}*. Remaining: *₹${Math.max(props.remainingFees, 0).toLocaleString('en-IN')}*. — ${props.schoolName}`
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        }, 1000)
      }
    }, 'image/jpeg', 0.95)

  } catch (err) {
    console.error(err)
  }
  setImgLoading(false)
}

  function handleDownloadPDF() {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `${props.studentName}-receipt.pdf`
    a.click()
  }

  function handleClose() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  return (
    <div className="w-full">

      {/* Hidden receipt for image capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={receiptRef} style={{ display: 'none' }}>
          <ReceiptHTML {...props} />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePreview}
          disabled={loading}
          className="h-11 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
          ) : '📄 View PDF Receipt'}
        </button>

        <button
          onClick={handleWhatsApp}
          disabled={imgLoading}
          className="h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
        >
          {imgLoading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
          ) : '💬 Share on WhatsApp'}
        </button>
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h2 className="text-base font-semibold text-zinc-900">Receipt Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition"
                >
                  ⬇️ Download PDF
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-zinc-100 transition text-zinc-500 text-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-2xl">
              <iframe src={previewUrl} className="w-full h-full" title="Receipt Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}