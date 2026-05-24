'use client'

import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/calculations'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CLASSES } from '@/lib/constants'
import Link from 'next/link'
import { Plus, Search, X, FileDown } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// PDF Styles
const pdfStyles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottom: '2px solid #7C3AED', paddingBottom: 10 },
  schoolName: { fontSize: 18, fontWeight: 'bold', color: '#7C3AED' },
  reportTitle: { fontSize: 14, marginTop: 4, color: '#4b5563' },
  metaInfo: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  table: { width: 'auto', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomColor: '#eeeeee', borderBottomWidth: 1, minHeight: 25, alignItems: 'center' },
  alternateRow: { backgroundColor: '#f9fafb' },
  tableHeader: { backgroundColor: '#f3f4f6' },
  tableColSr: { width: '4%' },
  tableColName: { width: '18%' },
  tableColGuardian: { width: '18%' },
  tableColClass: { width: '8%' },
  tableColMobile: { width: '10%' },
  tableColFee: { width: '10%', textAlign: 'right' },
  tableColPaid: { width: '10%', textAlign: 'right' },
  tableColRemaining: { width: '10%', textAlign: 'right' },
  tableColStatus: { width: '12%', textAlign: 'center' },
  tableCell: { fontSize: 9, padding: 4 },
  headerCell: { fontSize: 10, fontWeight: 'bold', color: '#374151' },
  statusPaid: { color: '#16a34a', fontWeight: 'bold' },
  statusPartial: { color: '#ca8a04', fontWeight: 'bold' },
  statusUnpaid: { color: '#dc2626', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTop: '1px solid #eeeeee', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#9ca3af' }
})

// PDF Component
const StudentsReportPDF = ({ students, schoolName, reportTitle, date, count }: any) => (
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
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColPaid]}>{s.total_paid.toLocaleString('en-IN')}</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableColRemaining]}>{s.remaining_fee.toLocaleString('en-IN')}</Text>
            <Text style={[
              pdfStyles.tableCell, 
              pdfStyles.tableColStatus,
              s.status === 'paid' ? pdfStyles.statusPaid : 
              s.status === 'partial' ? pdfStyles.statusPartial : 
              pdfStyles.statusUnpaid
            ]}>{s.status.toUpperCase()}</Text>
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

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [schoolName, setSchoolName] = useState('School Fee Report')

  // --- DEBUGGING START ---
  useEffect(() => {
    console.log('[DEBUG] StudentsPage MOUNTED')
    
    const logScrollContainers = () => {
      const main = document.querySelector('main')
      const body = document.body
      const html = document.documentElement
      
      console.log('[DEBUG] Current Scroll State:', {
        window: { scrollY: window.scrollY },
        main: main ? { 
          scrollTop: main.scrollTop, 
          scrollHeight: main.scrollHeight, 
          clientHeight: main.clientHeight,
          overflow: window.getComputedStyle(main).overflowY
        } : 'missing',
        body: { scrollTop: body.scrollTop, overflow: window.getComputedStyle(body).overflowY },
        html: { scrollTop: html.scrollTop, overflow: window.getComputedStyle(html).overflowY }
      })
    }

    const handleGlobalScroll = (e: any) => {
      const target = e.target === document ? (document.scrollingElement || document.documentElement) : e.target
      console.log('[DEBUG] SCROLL EVENT on:', target.tagName || 'document', {
        className: target.className,
        scrollTop: target.scrollTop
      })
    }

    logScrollContainers()
    window.addEventListener('scroll', handleGlobalScroll, true)
    
    return () => {
      console.log('[DEBUG] StudentsPage UNMOUNTED')
      window.removeEventListener('scroll', handleGlobalScroll, true)
    }
  }, [])

  useEffect(() => {
    console.log('[DEBUG] Data Loading State Changed:', { loading, studentsCount: students.length })
  }, [loading, students])
  // --- DEBUGGING END ---

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('school_settings').select('school_name').eq('user_id', user.id).maybeSingle().then(({ data }) => {
          if (data?.school_name) setSchoolName(data.school_name)
        })
      }
    })
  }, [])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from('student_fee_summary').select('*')

    if (selectedClass) query = query.eq('class', selectedClass)
    if (selectedStatus) query = query.eq('status', selectedStatus)
    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search}%,mobile.ilike.%${search}%,guardian_name.ilike.%${search}%,class.ilike.%${search}%,email.ilike.%${search}%,diary_page_number.ilike.%${search}%`
      )
    }

    const { data } = await query.order('name')
    setStudents(data || [])
    setLoading(false)
  }, [search, selectedClass, selectedStatus])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const downloadPDF = async () => {
    if (students.length === 0) return
    setPdfLoading(true)
    
    try {
      const reportTitle = selectedStatus === 'unpaid' ? "Unpaid Students Report" :
                         selectedStatus === 'partial' ? "Partial Payment Students Report" :
                         selectedStatus === 'paid' ? "Paid Students Report" :
                         "All Students Report"
      
      const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      
      const blob = await pdf(
        <StudentsReportPDF 
          students={students} 
          schoolName={schoolName}
          reportTitle={reportTitle}
          date={date}
          count={students.length}
        />
      ).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const filename = `${selectedStatus || 'all'}-students.pdf`
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF Error:", err)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Students</h1>
          <p className="text-sm text-zinc-500">{students.length} total students</p>
        </div>
        <Link
          href="/students/add"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">Add Student</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            placeholder="Search by name, mobile, class, diary number.."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-9 pr-10 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-3 flex-1">
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="flex-1 h-11 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Classes</option>
              {CLASSES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="flex-1 h-11 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {students.length > 0 && (
            <button
              onClick={downloadPDF}
              disabled={pdfLoading}
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11 px-4 transition whitespace-nowrap disabled:opacity-50"
            >
              {pdfLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      {!loading && (
        <div className="hidden md:block">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left p-4 text-zinc-500 font-medium">Name</th>
                    <th className="text-left p-4 text-zinc-500 font-medium">Class</th>
                    <th className="text-left p-4 text-zinc-500 font-medium">Mobile</th>
                    <th className="text-left p-4 text-zinc-500 font-medium">Total Fee</th>
                    <th className="text-left p-4 text-zinc-500 font-medium">Paid</th>
                    <th className="text-left p-4 text-zinc-500 font-medium">Remaining</th>
                    <th className="text-left p-4 text-zinc-500 font-medium">Status</th>
                    <th className="text-left p-4 text-zinc-500 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-400">
                        No students found
                      </td>
                    </tr>
                  )}
                  {students.map(s => (
                    <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition">
                      <td className="p-4">
                        <Link href={`/students/${s.id}`} className="font-medium text-zinc-900 hover:text-violet-600">
                          {s.name}
                        </Link>
                      </td>
                      <td className="p-4 text-zinc-600 whitespace-nowrap">{s.class}</td>
                      <td className="p-4 text-zinc-600 whitespace-nowrap">{s.mobile || '-'}</td>
                      <td className="p-4 text-zinc-600 whitespace-nowrap">{formatCurrency(s.total_fee)}</td>
                      <td className="p-4 text-green-600 font-medium whitespace-nowrap">{formatCurrency(s.total_paid)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={s.remaining_fee > 0 ? 'text-red-500 font-medium' : 'text-zinc-400'}>
                          {formatCurrency(s.remaining_fee)}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={s.status}>{s.status}</Badge>
                      </td>
                      <td className="p-4 min-w-24">
                        <Progress value={Math.round((s.total_paid / s.total_fee) * 100)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Mobile Cards */}
      {!loading && (
        <div className="md:hidden space-y-3">
          {students.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-zinc-400 text-sm">
                No students found
              </CardContent>
            </Card>
          )}
          {students.map(s => (
            <Link key={s.id} href={`/students/${s.id}`}>
              <Card className="hover:shadow-md transition">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-zinc-900">{s.name}</p>
                    <Badge variant={s.status}>{s.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-500">
                    <span>{s.class}</span>
                    <span>{s.mobile || '-'}</span>
                  </div>
                  <Progress value={Math.round((s.total_paid / s.total_fee) * 100)} />
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-green-600">Paid: {formatCurrency(s.total_paid)}</span>
                    <span className="text-red-500">Due: {formatCurrency(s.remaining_fee)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}