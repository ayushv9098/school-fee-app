import type { Metadata } from 'next'
import Link from 'next/link'
import { Wallet, Users, BarChart3, CalendarCheck, Sparkles, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ayushman Educational Academy | School Fee Management System - Semli Bari',
  description:
    'Ayushman Educational Academy, Semli Bari - Smart School Fee Management & Student Attendance System. Track fees, manage students, AI insights, and teacher attendance digitally.',
  keywords: [
    'Ayushman Educational Academy',
    'Ayushman Educational Academy Semli Bari',
    'Semli Bari school',
    'school fee management',
    'school fee software',
    'student fee tracker',
    'school management system',
    'teacher attendance system',
    'school ERP India',
    'fee collection software',
    'school fees online',
    'Ayushman Academy',
  ],
  openGraph: {
    title: 'Ayushman Educational Academy | School Fee Management System',
    description:
      'Smart School Fee Management & Attendance System for Ayushman Educational Academy, Semli Bari.',
    url: 'https://school-fee-app.vercel.app',
    siteName: 'Ayushman Educational Academy',
    type: 'website',
  },
}

const features = [
  {
    icon: <Wallet className="w-7 h-7 text-violet-600" />,
    title: 'Fee Management',
    description:
      'Keep track of student fees and view collection reports easily.',
  },
  {
    icon: <Users className="w-7 h-7 text-violet-600" />,
    title: 'Student Records',
    description:
      'Manage all student details in one place, organized by class.',
  },
  {
    icon: <BarChart3 className="w-7 h-7 text-violet-600" />,
    title: 'AI Insights',
    description:
      'Get helpful insights and reports to see how the school is doing.',
  },
  {
    icon: <CalendarCheck className="w-7 h-7 text-violet-600" />,
    title: 'Teacher Attendance',
    description:
      'Easily mark daily attendance for teachers and staff.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">
      {/* ── Hero Section ── */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-violet-100"
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:py-24 lg:py-28">
          <div className="relative mb-8 group">
            {/* Elegant Glow Effect */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 opacity-30 blur-xl transition duration-700 group-hover:opacity-60"></div>
            
            {/* Logo Image */}
            <img
              src="/logo.jpg?v=7"
              alt="Ayushman Educational Academy Logo"
              className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full object-cover shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)] ring-4 ring-white border-2 border-violet-50"
            />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
            Ayushman Educational Academy
          </h1>

          <h2 className="mt-2 text-base font-semibold text-violet-600 sm:text-xl">
            Semli Bari
          </h2>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-xl">
            Manage School Fees &amp; Attendance Easily
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex w-full flex-row justify-center gap-2 sm:w-auto sm:gap-4">
            <Link
              href="/login"
              className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-xl bg-violet-600 px-2 py-3 text-xs sm:text-sm md:text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-1 sm:px-8 sm:py-3.5 text-center"
            >
              Portal Login
            </Link>
            <Link
              href="/teacher-login"
              className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-xl border-2 border-violet-600 bg-white/50 backdrop-blur-sm px-2 py-3 text-xs sm:text-sm md:text-base font-semibold text-violet-600 transition-all duration-300 hover:bg-violet-50 hover:-translate-y-1 sm:px-8 sm:py-3.5 text-center"
            >
              Teacher Login
            </Link>
          </div>

          {/* Quick Highlights */}
          <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-2 sm:gap-5 text-[10px] sm:text-sm font-medium text-zinc-600">
            <span className="flex items-center gap-1 transition-transform hover:scale-105"><CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500 sm:h-4 sm:w-4" /> 100% Secure</span>
            <span className="flex items-center gap-1 transition-transform hover:scale-105"><CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500 sm:h-4 sm:w-4" /> Smart Attendance</span>
            <span className="flex items-center gap-1 transition-transform hover:scale-105"><CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500 sm:h-4 sm:w-4" /> Instant Reports</span>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold text-zinc-900 sm:text-4xl">
            Everything you need to manage your school
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
            Simple and easy tools to help you manage student fees, records, and daily attendance without the hassle.
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-7 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-100/60 hover:border-violet-200 hover:-translate-y-2 cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/0 to-violet-50/0 transition-colors duration-500 group-hover:from-violet-50/40 group-hover:to-violet-100/40"></div>
              <span
                className="relative flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-violet-100 transition-all duration-500 group-hover:scale-110 group-hover:bg-violet-200"
                aria-hidden="true"
              >
                {/* Ensure icon scales down on mobile too if it has fixed classes inside */}
                <div className="scale-75 sm:scale-100 flex items-center justify-center">{feature.icon}</div>
              </span>
              <h3 className="relative mt-4 sm:mt-5 text-sm sm:text-lg font-bold text-zinc-900 transition-colors duration-300 group-hover:text-violet-900">
                {feature.title}
              </h3>
              <p className="relative mt-1 sm:mt-2 text-[10px] sm:text-sm leading-relaxed text-zinc-500 transition-colors duration-300 group-hover:text-zinc-700">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── About Section ── */}
      <section className="bg-violet-50/60">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            About Ayushman Academy
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
            Ayushman Educational Academy is dedicated to providing good education in Semli Bari. We use simple digital tools to manage school fees, student records, and daily attendance, making things easier for both parents and teachers.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 bg-white mt-auto">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-xs text-zinc-500 sm:flex-row sm:text-sm">
          <div>
            © {new Date().getFullYear()} Designed & Developed by AV Infra
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Mail className="h-4 w-4 text-violet-500" />
            <a href="mailto:ayushvishvakarma956@gmail.com" className="transition-colors hover:text-violet-600">
              ayushvishvakarma956@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}