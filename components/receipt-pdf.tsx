'use client'

import { useState } from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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

export default function ReceiptPDF(props: Props) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

  async function handleDownload() {
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
      <button
        onClick={handlePreview}
        disabled={loading}
        className="w-full sm:w-auto h-11 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? 'Generating...' : '📄 View Receipt'}
      </button>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h2 className="text-base font-semibold text-zinc-900">Receipt Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
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

            {/* PDF Preview */}
            <div className="flex-1 overflow-hidden rounded-b-2xl">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Receipt Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}