import dayjs from 'dayjs'

export interface HolidayItem {
  id?: string
  date: string // YYYY-MM-DD
  title: string
  description?: string | null
  academic_year?: string
}

// Pre-defined Indian national, state & festival holidays (2024 - 2027)
export const STANDARD_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-01-26': 'Republic Day',
  '2024-03-08': 'Maha Shivratri',
  '2024-03-25': 'Holi',
  '2024-03-29': 'Good Friday',
  '2024-04-11': 'Eid-ul-Fitr',
  '2024-04-17': 'Ram Navami',
  '2024-04-21': 'Mahavir Jayanti',
  '2024-05-23': 'Buddha Purnima',
  '2024-06-17': 'Bakrid / Eid-ul-Adha',
  '2024-07-17': 'Muharram',
  '2024-08-15': 'Independence Day',
  '2024-08-19': 'Raksha Bandhan',
  '2024-08-26': 'Janmashtami',
  '2024-09-07': 'Ganesh Chaturthi',
  '2024-09-16': 'Milad-un-Nabi (Eid-e-Milad)',
  '2024-10-02': 'Mahatma Gandhi Jayanti',
  '2024-10-12': 'Dussehra / Vijayadashami',
  '2024-10-31': 'Diwali / Naraka Chaturdashi',
  '2024-11-01': 'Diwali / Deepawali',
  '2024-11-02': 'Govardhan Puja',
  '2024-11-03': 'Bhai Dooj',
  '2024-11-15': 'Guru Nanak Jayanti',
  '2024-12-25': 'Christmas',

  // 2025
  '2025-01-14': 'Makar Sankranti / Pongal',
  '2025-01-26': 'Republic Day',
  '2025-02-26': 'Maha Shivratri',
  '2025-03-14': 'Holi',
  '2025-03-31': 'Eid-ul-Fitr',
  '2025-04-06': 'Ram Navami',
  '2025-04-10': 'Mahavir Jayanti',
  '2025-04-14': 'Dr. Ambedkar Jayanti',
  '2025-04-18': 'Good Friday',
  '2025-05-12': 'Buddha Purnima',
  '2025-06-07': 'Bakrid / Eid-ul-Adha',
  '2025-07-06': 'Muharram',
  '2025-08-09': 'Raksha Bandhan',
  '2025-08-15': 'Independence Day',
  '2025-08-16': 'Janmashtami',
  '2025-08-27': 'Ganesh Chaturthi',
  '2025-09-05': 'Milad-un-Nabi',
  '2025-10-02': 'Mahatma Gandhi Jayanti & Dussehra',
  '2025-10-20': 'Diwali / Deepawali',
  '2025-10-21': 'Govardhan Puja',
  '2025-10-22': 'Bhai Dooj',
  '2025-11-05': 'Guru Nanak Jayanti',
  '2025-12-25': 'Christmas',

  // 2026
  '2026-01-14': 'Makar Sankranti',
  '2026-01-26': 'Republic Day',
  '2026-02-15': 'Maha Shivratri',
  '2026-03-03': 'Holi',
  '2026-03-20': 'Eid-ul-Fitr',
  '2026-03-27': 'Ram Navami',
  '2026-03-31': 'Mahavir Jayanti',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Ambedkar Jayanti',
  '2026-05-01': 'Buddha Purnima',
  '2026-05-27': 'Bakrid / Eid-ul-Adha',
  '2026-06-25': 'Muharram',
  '2026-08-15': 'Independence Day',
  '2026-08-28': 'Raksha Bandhan',
  '2026-09-04': 'Janmashtami',
  '2026-09-14': 'Ganesh Chaturthi',
  '2026-09-25': 'Milad-un-Nabi',
  '2026-10-02': 'Mahatma Gandhi Jayanti',
  '2026-10-20': 'Dussehra',
  '2026-11-08': 'Diwali / Deepawali',
  '2026-11-09': 'Govardhan Puja',
  '2026-11-10': 'Bhai Dooj',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-25': 'Christmas',

  // 2027
  '2027-01-26': 'Republic Day',
  '2027-03-10': 'Eid-ul-Fitr',
  '2027-03-22': 'Holi',
  '2027-04-14': 'Dr. Ambedkar Jayanti',
  '2027-05-17': 'Bakrid / Eid-ul-Adha',
  '2027-06-15': 'Muharram',
  '2027-08-15': 'Independence Day',
  '2027-08-17': 'Raksha Bandhan',
  '2027-08-25': 'Janmashtami',
  '2027-10-02': 'Gandhi Jayanti',
  '2027-10-09': 'Dussehra',
  '2027-10-29': 'Diwali',
  '2027-12-25': 'Christmas',
}

// Annual fixed recurring holidays (MM-DD)
export const FIXED_ANNUAL_HOLIDAYS: Record<string, string> = {
  '01-01': 'New Year Day',
  '01-26': 'Republic Day',
  '08-15': 'Independence Day',
  '10-02': 'Gandhi Jayanti',
  '12-25': 'Christmas',
}

/**
 * Checks if a given date is Sunday
 */
export function isSunday(dateStr: string): boolean {
  return dayjs(dateStr).day() === 0
}

/**
 * Returns holiday title if the date is a holiday (checks custom list + standard calendar)
 */
export function getHolidayForDate(dateStr: string, customHolidays: HolidayItem[] = []): string | null {
  // 1. Check custom holidays added by school admin first
  const custom = customHolidays.find(h => h.date === dateStr)
  if (custom) return custom.title

  // 2. Check full date standard holidays
  if (STANDARD_HOLIDAYS[dateStr]) {
    return STANDARD_HOLIDAYS[dateStr]
  }

  // 3. Check fixed annual MM-DD
  const mmdd = dayjs(dateStr).format('MM-DD')
  if (FIXED_ANNUAL_HOLIDAYS[mmdd]) {
    return FIXED_ANNUAL_HOLIDAYS[mmdd]
  }

  return null
}

/**
 * Returns day status: 'holiday' | 'sunday' | 'working'
 */
export function getDayType(dateStr: string, customHolidays: HolidayItem[] = []): {
  type: 'holiday' | 'sunday' | 'working'
  title?: string
} {
  const holiday = getHolidayForDate(dateStr, customHolidays)
  if (holiday) {
    return { type: 'holiday', title: holiday }
  }
  if (isSunday(dateStr)) {
    return { type: 'sunday', title: 'Sunday' }
  }
  return { type: 'working' }
}

/**
 * Calculates working days in a month (excluding Sundays & Holidays)
 */
export function getMonthWorkingDays(year: number, month: number, customHolidays: HolidayItem[] = []): number {
  const start = dayjs().year(year).month(month - 1).startOf('month')
  const daysInMonth = start.daysInMonth()
  let workingDays = 0

  for (let i = 1; i <= daysInMonth; i++) {
    const d = start.date(i).format('YYYY-MM-DD')
    const dayType = getDayType(d, customHolidays)
    if (dayType.type === 'working') {
      workingDays++
    }
  }

  return workingDays
}

/**
 * Generates an array of all dates in a month with their metadata (isSunday, isHoliday, holidayTitle)
 */
export function getMonthDatesMeta(year: number, month: number, customHolidays: HolidayItem[] = []) {
  const start = dayjs().year(year).month(month - 1).startOf('month')
  const daysInMonth = start.daysInMonth()
  const dates = []

  for (let i = 1; i <= daysInMonth; i++) {
    const dateObj = start.date(i)
    const dateStr = dateObj.format('YYYY-MM-DD')
    const dayType = getDayType(dateStr, customHolidays)

    dates.push({
      date: dateStr,
      day: dateObj.date(),
      dayName: dateObj.format('ddd'),
      isSunday: dayType.type === 'sunday',
      isHoliday: dayType.type === 'holiday',
      holidayTitle: dayType.title,
      isWorkingDay: dayType.type === 'working',
    })
  }

  return dates
}
