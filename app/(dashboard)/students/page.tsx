'use client'

import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/calculations'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CLASSES } from '@/lib/constants'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

import { useSession } from '@/lib/session-context'

export default function StudentsPage() {
  const router = useRouter()
  const { academicYear: sessionYear } = useSession()
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedStudentStatus, setSelectedStudentStatus] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [schoolName, setSchoolName] = useState('School Fee Report')

  // Use session year as default if selectedYear is not manually set
  const currentYearFilter = selectedYear || sessionYear

  // Available academic years (we could fetch this dynamically, but for now let's list common ones)
  const ACADEMIC_YEARS = ['2024-25', '2025-26', '2026-27']

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
    const { data: { user } } = await supabase.auth.getUser()
    let query = supabase.from('student_fee_summary').select('*')
    if (user) query = query.eq('user_id', user.id)

    if (selectedClass) query = query.eq('class', selectedClass)
    if (selectedStatus) query = query.eq('payment_status', selectedStatus)
    if (selectedStudentStatus) query = query.eq('status', selectedStudentStatus)
    
    // Use the combined year filter
    if (currentYearFilter) query = query.eq('academic_year', currentYearFilter)
    
    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search}%,mobile.ilike.%${search}%,guardian_name.ilike.%${search}%,class.ilike.%${search}%,email.ilike.%${search}%,diary_page_number.ilike.%${search}%`
      )
    }

    const { data } = await query.order('remaining_fee', { ascending: false }).order('name')

    const sortedData = (data || []).sort((a, b) => {
      const getStatus = (student: any) => 
        student.remaining_fee <= 0 ? 'paid' : student.total_paid > 0 ? 'partial' : 'unpaid';
      
      const rank = { unpaid: 1, partial: 2, paid: 3 };
      
      const rankA = rank[getStatus(a)];
      const rankB = rank[getStatus(b)];
      
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      
      if (b.remaining_fee !== a.remaining_fee) {
        return b.remaining_fee - a.remaining_fee;
      }
      
      return (a.name || '').localeCompare(b.name || '');
    });

    setStudents(sortedData)
    setLoading(false)
  }, [search, selectedClass, selectedStatus, selectedStudentStatus, currentYearFilter])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Students</h1>
            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              {currentYearFilter}
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{students.length} total students</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/students/promote"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-xl transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Promote</span>
          </Link>
          <Link
            href="/students/add"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            placeholder="Search by name, mobile, class, diary number.."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-9 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Classes</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Years</option>
            {ACADEMIC_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={selectedStudentStatus}
            onChange={e => setSelectedStudentStatus(e.target.value)}
            className="h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Status</option>
            <option value="active">Active Students</option>
            <option value="inactive">Inactive</option>
            <option value="alumni">Alumni</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="h-11 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Payment: All</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>

          {students.length > 0 && (
            <button
              onClick={downloadPDF}
              disabled={pdfLoading}
              className="col-span-2 sm:col-span-1 lg:col-span-2 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11 px-4 transition whitespace-nowrap disabled:opacity-50"
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
                  <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium">Name</th>
                    <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium">Class</th>
                    <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium text-right">Current Fee</th>
                    <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium text-right">Old Dues</th>
                    <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium text-right">Paid</th>
                    <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium text-right">Remaining</th>
                    <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium text-center">Status</th>
                    <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium">Progress</th>
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
                  {students.map(s => {
                    const totalPayable = s.total_fee + s.previous_dues;
                    const progress = totalPayable > 0 ? Math.round((s.total_paid / totalPayable) * 100) : 0;
                    
                    const getProgressColor = (val: number) => {
                      if (val >= 100) return 'bg-emerald-500'
                      if (val <= 0) return 'bg-rose-500'
                      if (val < 50) return 'bg-amber-500'
                      return 'bg-indigo-500'
                    }

                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => router.push(`/students/${s.id}`)}
                        className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                      >
                        <td className="p-4">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-violet-600">
                            {s.name}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{s.class}</td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap text-right">{formatCurrency(s.total_fee)}</td>
                        <td className="p-4 text-amber-600 whitespace-nowrap text-right">{formatCurrency(s.previous_dues)}</td>
                        <td className="p-4 text-green-600 font-medium whitespace-nowrap text-right">{formatCurrency(s.total_paid)}</td>
                        <td className="p-4 whitespace-nowrap text-right">
                          <span className={s.remaining_fee > 0 ? 'text-red-500 font-medium' : 'text-zinc-400'}>
                            {formatCurrency(s.remaining_fee)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {(() => {
                            const status = s.remaining_fee <= 0 ? 'paid' : s.total_paid > 0 ? 'partial' : 'unpaid';
                            return (
                              <Badge variant={status}>
                                {status.toUpperCase()}
                              </Badge>
                            );
                          })()}
                        </td>
                        <td className="p-4 min-w-24">
                          <Progress value={progress} indicatorClassName={getProgressColor(progress)} />
                        </td>
                      </tr>
                    );
                  })}
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
          {students.map(s => {
            const totalPayable = s.total_fee + s.previous_dues;
            const progress = totalPayable > 0 ? Math.round((s.total_paid / totalPayable) * 100) : 0;
            const paymentStatus = s.remaining_fee <= 0 ? 'paid' : s.total_paid > 0 ? 'partial' : 'unpaid';

            const getProgressColor = (val: number) => {
              if (val >= 100) return 'bg-emerald-500'
              if (val <= 0) return 'bg-rose-500'
              if (val < 50) return 'bg-amber-500'
              return 'bg-indigo-500'
            }

            return (
              <Link key={s.id} href={`/students/${s.id}`}>
                <Card className="hover:shadow-md transition">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</p>
                      <Badge variant={paymentStatus}>{paymentStatus}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                      <span>{s.class} ({s.academic_year})</span>
                      <span>{s.mobile || '-'}</span>
                    </div>
                    <Progress value={progress} indicatorClassName={getProgressColor(progress)} />
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <div>
                        Fee: <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(s.total_fee)}</span>
                      </div>
                      <div className="text-right">
                        Old: <span className="text-amber-600">{formatCurrency(s.previous_dues)}</span>
                      </div>
                      <div className="text-green-600">
                        Paid: <span>{formatCurrency(s.total_paid)}</span>
                      </div>
                      <div className="text-red-500 text-right">
                        Due: <span>{formatCurrency(s.remaining_fee)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  )
}