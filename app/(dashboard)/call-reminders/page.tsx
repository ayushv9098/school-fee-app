'use client'
import { CustomSelect } from '@/components/ui/custom-select'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/calculations'
import { Card, CardContent } from '@/components/ui/card'
import { PhoneCall, Phone, Loader2, Users, IndianRupee, Search, Filter } from 'lucide-react'
import { useSession } from '@/lib/session-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function CallRemindersPage() {
  const { academicYear } = useSession()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [callStatus, setCallStatus] = useState<Record<string, 'idle' | 'calling' | 'success' | 'failed'>>({})
  const [isCallingAll, setIsCallingAll] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: studentsRes } = await supabase
          .from('student_fee_summary')
          .select('*')
          .eq('academic_year', academicYear)
          .eq('status', 'active')
          .eq('user_id', user.id)
          .gt('remaining_fee', 0)
          .order('remaining_fee', { ascending: false })

        setData(studentsRes || [])
      }
      setLoading(false)
    }

    fetchData()
  }, [academicYear])

  const classes = ['all', ...new Set(data.map((s) => s.class))]

  const filteredStudents = data.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = selectedClass === 'all' || s.class === selectedClass
    return matchesSearch && matchesClass
  })

  const totalDefaulters = data.length
  const totalPendingAmount = data.reduce((acc, curr) => acc + curr.remaining_fee, 0)

  const handleCallSingle = async (student: any) => {
    setCallStatus(prev => ({ ...prev, [student.id]: 'calling' }))
    try {
      const res = await fetch('/api/call-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [student] })
      })
      const result = await res.json()
      if (result.results?.[0]) {
        setCallStatus(prev => ({ ...prev, [student.id]: result.results[0].status }))
      } else {
        setCallStatus(prev => ({ ...prev, [student.id]: 'failed' }))
      }
    } catch (error) {
      setCallStatus(prev => ({ ...prev, [student.id]: 'failed' }))
    }
  }

  const handleCallAllFiltered = async () => {
    if (filteredStudents.length === 0) return

    setIsCallingAll(true)
    const newStatuses = { ...callStatus }
    filteredStudents.forEach(s => {
      newStatuses[s.id] = 'calling'
    })
    setCallStatus(newStatuses)

    try {
      const res = await fetch('/api/call-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: filteredStudents })
      })
      const result = await res.json()
      if (result.results) {
        const finalStatuses = { ...callStatus }
        result.results.forEach((r: any) => {
          finalStatuses[r.id] = r.status
        })
        setCallStatus(finalStatuses)
      }
    } catch (error) {
      const failedStatuses = { ...callStatus }
      filteredStudents.forEach(s => {
        failedStatuses[s.id] = 'failed'
      })
      setCallStatus(failedStatuses)
    } finally {
      setIsCallingAll(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-violet-600" />
            AI Voice Reminders
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Intelligent conversational agent to remind parents about fee dues for {academicYear}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-violet-700 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-300 px-3 py-1.5 rounded-full text-xs font-semibold border border-violet-100 dark:border-violet-800">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          ElevenLabs Powered
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-violet-100 dark:border-violet-900/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Defaulters</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalDefaulters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 dark:border-red-900/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Pending</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(totalPendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative w-full sm:w-40">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <CustomSelect
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-900 dark:text-zinc-100"
                >
                  {classes.map((c) => (
                    <option key={c} value={c}>{c === 'all' ? 'All Classes' : `Class ${c}`}</option>
                  ))}
                </CustomSelect>
              </div>
            </div>

            <Button 
              onClick={handleCallAllFiltered}
              disabled={isCallingAll || filteredStudents.length === 0}
              className="w-full md:w-auto bg-violet-600 hover:bg-violet-700 text-white shadow-md"
            >
              {isCallingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calling ({filteredStudents.length})
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Call Filtered ({filteredStudents.length})
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <p className="text-zinc-500 dark:text-zinc-400">No students found with pending fees.</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const status = callStatus[student.id] || 'idle'
                
                return (
                  <div 
                    key={student.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1 w-full sm:w-auto mb-3 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 uppercase tracking-wider">
                          Class {student.class}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {student.guardian_name || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {student.mobile || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <div className="text-right">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">Due Amount</p>
                        <p className="text-base font-bold text-red-500">{formatCurrency(student.remaining_fee)}</p>
                      </div>

                      <Button
                        size="sm"
                        variant={status === 'success' ? 'outline' : 'default'}
                        onClick={() => handleCallSingle(student)}
                        disabled={status === 'calling' || status === 'success' || !student.mobile}
                        className={`min-w-[100px] h-9 ${
                          status === 'success' 
                            ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-50 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400' 
                            : status === 'failed'
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400'
                            : 'bg-violet-600 hover:bg-violet-700 text-white'
                        }`}
                      >
                        {status === 'calling' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {status === 'success' && <Phone className="w-4 h-4 mr-2" />}
                        {status === 'failed' && <Phone className="w-4 h-4 mr-2" />}
                        {status === 'idle' && <PhoneCall className="w-4 h-4 mr-2" />}
                        
                        {status === 'calling' ? 'Calling...' : 
                         status === 'success' ? 'Called' : 
                         status === 'failed' ? 'Failed' : 
                         'Call'}
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


