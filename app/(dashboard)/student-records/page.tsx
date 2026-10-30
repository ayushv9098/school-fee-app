import dayjs from 'dayjs'
import StudentRecordsClient from './student-records-client'

export default async function StudentRecordsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams
  const selectedDate = params.date || dayjs().format('YYYY-MM-DD')

  return (
    <StudentRecordsClient 
      selectedDate={selectedDate}
    />
  )
}
