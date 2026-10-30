import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: { paddingHorizontal: 25, paddingVertical: 20, backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottom: '2px solid #7C3AED', paddingBottom: 10 },
  schoolName: { fontSize: 18, fontWeight: 'bold', color: '#7C3AED' },
  reportTitle: { fontSize: 14, marginTop: 4, color: '#4b5563' },
  metaInfo: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  table: { width: '100%', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomColor: '#eeeeee', borderBottomWidth: 1, minHeight: 25, alignItems: 'center' },
  alternateRow: { backgroundColor: '#f9fafb' },
  tableHeader: { backgroundColor: '#f3f4f6' },
  tableColSr: { width: '4%' },
  tableColName: { width: '15%' },
  tableColGuardian: { width: '15%' },
  tableColClass: { width: '5%' },
  tableColMobile: { width: '10%' },
  tableColFee: { width: '10%', textAlign: 'right' },
  tableColOldDues: { width: '10%', textAlign: 'right' },
  tableColPaid: { width: '10%', textAlign: 'right' },
  tableColRemaining: { width: '10%', textAlign: 'right' },
  tableColStatus: { width: '11%', textAlign: 'center' },
  tableCell: { fontSize: 9, padding: 4 },
  headerCell: { fontSize: 10, fontWeight: 'bold', color: '#374151' },
  statusPaid: { color: '#16a34a', fontWeight: 'bold' },
  statusPartial: { color: '#ca8a04', fontWeight: 'bold' },
  statusUnpaid: { color: '#dc2626', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 20, left: 25, right: 25, borderTop: '1px solid #eeeeee', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#9ca3af' }
})

// PDF Component
export const StudentsReportPDF = ({ students, schoolName, reportTitle, date, count }: any) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.schoolName}>{schoolName}</Text>
        <Text style={pdfStyles.reportTitle}>{reportTitle}</Text>
        <Text style={pdfStyles.metaInfo}>Date: {date}  |  Total Students: {count}</Text>
      </View>

      <View style={pdfStyles.table}>
        {/* Header */}
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColSr]}>Sr No</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColName]}>Student Name</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColGuardian]}>Father/Guardian</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColClass]}>Class</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColMobile]}>Mobile</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColFee]}>Total Fee</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColOldDues]}>Old Dues</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColPaid]}>Paid</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColRemaining]}>Remaining</Text>
          <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, pdfStyles.tableColStatus]}>Status</Text>
        </View>

        {/* Rows */}
        {students.map((s: any, i: number) => (
          <View key={s.id} style={[pdfStyles.tableRow, i % 2 === 1 ? pdfStyles.alternateRow : {}]}>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColSr]}>{i + 1}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColName]}>{s.name}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColGuardian]}>{s.guardian_name || '-'}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColClass]}>{s.class}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColMobile]}>{s.mobile || '-'}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColFee]}>{s.total_fee.toLocaleString('en-IN')}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColOldDues]}>{(s.previous_dues || 0).toLocaleString('en-IN')}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColPaid]}>{s.total_paid.toLocaleString('en-IN')}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColRemaining]}>{s.remaining_fee.toLocaleString('en-IN')}</Text>
            <Text style={[
              pdfStyles.tableCell, 
              pdfStyles.tableColStatus,
              s.payment_status === 'paid' ? pdfStyles.statusPaid : 
              s.payment_status === 'partial' ? pdfStyles.statusPartial : 
              pdfStyles.statusUnpaid
            ]}>{s.payment_status ? s.payment_status.toUpperCase() : 'UNPAID'}</Text>
          </View>
        ))}
      </View>

      <View style={pdfStyles.footer}>
        <Text>Generated by School Fee Manager</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </View>
    </Page>
  </Document>
)

export async function generateStudentsPDFBlob({
  students,
  schoolName,
  reportTitle,
  date,
}: {
  students: any[]
  schoolName: string
  reportTitle: string
  date: string
}) {
  const blob = await pdf(
    <StudentsReportPDF
      students={students}
      schoolName={schoolName}
      reportTitle={reportTitle}
      date={date}
      count={students.length}
    />
  ).toBlob()
  return blob
}
