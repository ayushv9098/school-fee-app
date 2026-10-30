import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { context } = body
    
    let messagesArray = body.messages
    if (!messagesArray && body.message) {
      messagesArray = [{ role: 'user', content: body.message }]
    }
    if (!Array.isArray(messagesArray)) {
      messagesArray = []
    }

    if (messagesArray.length === 0) {
      return NextResponse.json({ reply: 'Kripya apna sawal likhein.' }, { status: 400 })
    }

    // Inspect user's query to detect if attendance data is needed
    const lastUserMsg = [...messagesArray].reverse().find((m: any) => m.role === 'user')?.content || ''
    const currentQuery = (typeof body.message === 'string' && body.message.trim()) ? body.message : lastUserMsg
    const isAttendanceQuery = /attendance|attend|haziri|hazri|haazri|haaziri|present|absent|aaya|aaye|aayi|chhutti|chutti|bunk|aaj/i.test(currentQuery)

    // Lazy Supabase helper to avoid duplicate client & auth calls
    let supabaseClient: any = null
    let authUser: any = null
    const getSupabaseUser = async () => {
      if (!supabaseClient) {
        const { createClient } = require('@/lib/supabase/server')
        supabaseClient = await createClient()
        const { data } = await supabaseClient.auth.getUser()
        authUser = data?.user || null
      }
      return { supabase: supabaseClient, user: authUser }
    }

    let finalContext = context
    if (!finalContext) {
      const { supabase, user } = await getSupabaseUser()
      if (user) {
        const { data: students } = await supabase.from('student_fee_summary').select('*').eq('user_id', user.id).eq('status', 'active')
        if (students) {
          finalContext = `Student List (Name|Class|Total|Paid|Due|Mobile|Guardian):\n` +
            students.map((s: any) => `${s.name}|${s.class}|${s.total_fee}|${s.total_paid}|${s.remaining_fee}|${s.mobile || 'N/A'}|${s.guardian_name || 'N/A'}`).join('\n')
        }
      }
    }

    // Fetch student attendance data for AI context ONLY if the query is attendance-related.
    // For fee, student, or general queries, skipping this saves 1-2+ seconds!
    let attendanceContext = ''
    if (isAttendanceQuery) {
      try {
        const { supabase, user } = await getSupabaseUser()
        
        if (user) {
          const oneMonthAgo = new Date()
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
          const fromDate = oneMonthAgo.toISOString().split('T')[0]

          let allData: any[] = []
          let from = 0
          const step = 1000
          while (from < 5000) {
            const { data: attendance } = await supabase
              .from('student_attendance')
              .select('date, status, student:students!inner(name, class, user_id)')
              .eq('students.user_id', user.id)
              .gte('date', fromDate)
              .order('date', { ascending: false })
              .range(from, from + step - 1)
            
            if (!attendance || attendance.length === 0) break
            allData.push(...attendance)
            if (attendance.length < step) break
            from += step
          }

          if (allData.length > 0) {
            const studentsMap: any = {}
            for (const row of allData) {
              const sName = row.student?.name || 'Unknown'
              const sClass = row.student?.class || 'Unknown'
              const key = sName + '|' + sClass
              if (!studentsMap[key]) {
                studentsMap[key] = { name: sName, class: sClass, presentDates: new Set(), absentDates: new Set() }
              }
              const dStr = row.date.substring(5) // MM-DD
              if (row.status === 'present') studentsMap[key].presentDates.add(dStr)
              else if (row.status === 'absent') studentsMap[key].absentDates.add(dStr)
            }

            const classMap: any = {}
            for (const key in studentsMap) {
              const s = studentsMap[key]
              if (!classMap[s.class]) classMap[s.class] = []
              classMap[s.class].push(s)
            }

            let summary = ''
            for (const cls in classMap) {
              const students = classMap[cls]
              let maxP = -1, maxA = -1
              let mostP: string[] = [], mostA: string[] = []
              
              for (const s of students) {
                const pCount = s.presentDates.size
                const aCount = s.absentDates.size
                if (pCount > maxP) { maxP = pCount; mostP = [s.name] }
                else if (pCount === maxP) mostP.push(s.name)
                if (aCount > maxA) { maxA = aCount; mostA = [s.name] }
                else if (aCount === maxA) mostA.push(s.name)
              }
              
              summary += '\nClass ' + cls + ':\n'
              summary += 'Top Present: ' + (mostP.slice(0,3).join(', ')) + ' (' + maxP + ' days)\n'
              summary += 'Top Absent: ' + (mostA.slice(0,3).join(', ')) + ' (' + maxA + ' days)\n'
              
              for (const s of students) {
                const pArr = Array.from(s.presentDates)
                const aArr = Array.from(s.absentDates)
                summary += s.name + ' | P:' + pArr.length + ' (' + pArr.slice(0, 5).join(',') + '...) | A:' + aArr.length + ' (' + aArr.slice(0, 5).join(',') + '...)\n'
              }
            }
            attendanceContext = summary
          }
        }
      } catch (err) {
        console.warn('[AI Chat] Attendance fetch failed:', err)
      }
    }

    const systemPrompt = `
You are the "Ayushman School Expert". Your job is to answer questions about the school's data using ONLY the provided DATA CONTEXT.

====================================
📊 DATA CONTEXT (Students List)
====================================
${finalContext || 'No student data available.'}

====================================
📅 ATTENDANCE DATA (Last 30 Days)
====================================
Today's Date: ${new Date().toISOString().split('T')[0]}
${attendanceContext || (isAttendanceQuery ? 'No attendance records found for this period.' : 'No attendance data requested.')}

====================================
🗣 STRICT RULES FOR ACCURACY
====================================
1. ALWAYS answer in SIMPLE HINDI (Hinglish). Example: "Ayush ki total fee 10,000 hai..."
2. NEVER guess or make up numbers. Only use the numbers from the DATA CONTEXT.
3. When asked about a student's FEES or DETAILS (e.g., "Ayush ki fees"):
   - Find ALL rows in DATA CONTEXT where the Name column partially matches the requested name (ignore upper/lower case).
   - Read their Total, Paid, and Due amounts carefully.
   - Tell the user their Total Fee, Paid Amount, and Remaining (Baki) Fee.
4. If there are multiple students with the same name, tell the user about all of them with their Class name to avoid confusion.
5. If asked about fees and the student is NOT in the list, simply say: "Mujhe ye student fee list mein nahi mila."
6. KEEP ANSWERS EXTREMELY SHORT AND FAST (1-2 lines maximum). Be direct. Do not write filler words.
7. ONLY if the user explicitly complains about a SOFTWARE BUG (e.g., "website nahi chal rahi", "error aa raha hai", "pdf nahi ban raha"), tell them: "Kripya apna internet check karein aur page refresh (Ctrl+R) karein. Agar phir bhi problem ho, toh menu mein 'How to Use' page par jaayein. Wahan technical support (AV Infratech) ka contact diya gaya hai." Do NOT use this response for anything else.
8. If the user asks for general advice, business strategies, or things outside the school data (e.g., "fees mangne ka tarika batao", "scheme batao", "parents se kaise baat karein"), act as a helpful expert consultant. Provide excellent, professional, and practical advice using your general knowledge.
9. ATTENDANCE QUERIES:
   - If user asks "X kitne din aaya?" or "X ki attendance" or "ayush aya hai":
     Look ONLY in ATTENDANCE DATA. Find all rows where Name PARTIALLY matches X (ignore case).
     Look at the 'P:' (present count) and 'A:' (absent count) for that student.
     Reply with the counts. If X is not in ATTENDANCE DATA at all, say "Attendance list mein X naam ka student nahi mila."
   - If user asks "X [date] ko aaya tha?":
     Look at the dates inside the parenthesis for P: (present) or A: (absent). The dates are in MM-DD format.
     If the date is in P:, say "Haan, [Full Name] us din present tha ✅"
     If the date is in A:, say "Nahi, [Full Name] us din absent tha ❌"
   - If user asks "aaj ki attendance" or "aaj kon aaya":
     Look at the Top Present/Absent, but mainly you can't list everyone if the list is too long. Just give a helpful summary of who is most present/absent.
   - If user asks for RANKINGS or AGGREGATION (e.g., "sabse jyada present kon hai", "sabse zyada absent kon hai", "highest attendance"):
     USE the "Top Present" and "Top Absent" fields in the ATTENDANCE DATA for the respective class! This data is pre-calculated for you. 
     Example: "Nursery class mein sabse jyada present Ayush hai (15 days), aur sabse jyada absent Vansh hai (4 days)."
   - NEVER make up attendance data. Only use ATTENDANCE DATA section.
`

    const geminiMessages = messagesArray.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || '' }]
    }))

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      console.error('[AI Chat] GEMINI_API_KEY is not configured')
      return NextResponse.json({ reply: 'AI service configure nahi hai. Kripya system admin se sampark karein.' }, { status: 500 })
    }

    const models = ['gemini-flash-lite-latest', 'gemini-3.5-flash']
    let response;
    let data;

    for (const model of models) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages
          })
        }
      )
      data = await response.json()
      if (response.ok) break;
      
      console.warn(`[AI Chat] ${model} failed:`, data?.error?.message)
    }

    if (!response || !response.ok) {
      console.error('Gemini API Error after retries:', data)
      return NextResponse.json({ reply: `Server abhi bohot busy hai. Kripya 1-2 minute baad koshish karein.` }, { status: response?.status || 500 })
    }
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Kripya apna sawal dobara poochein.'
    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('AI Chat Route Error:', error)
    return NextResponse.json({ reply: `Kripya thodi der baad dobara koshish karein. Technical samasya ke karan AI connect nahi ho pa raha hai.` }, { status: 500 })
  }
}
