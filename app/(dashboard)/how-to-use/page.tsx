'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  GraduationCap, Users, CreditCard, BookOpen, Bot,
  User, Plus, Search, Download, Bell, ChevronRight,
  ChevronDown, MessageCircle, Phone, Mail, ExternalLink,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// Custom Instagram Icon
function Instagram({ className = '', size = 20 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

const steps = [
  {
    icon: User,
    color: 'bg-violet-100 text-violet-600',
    title: '1. Setup Your Account',
    description: 'Fill in your school information on the profile page.',
    link: '/profile',
    linkText: 'View profile ->'
  },
  {
    icon: Plus,
    color: 'bg-blue-100 text-blue-600',
    title: '2. Add New Students',
    description: 'Add new students using the "Add Student" button.',
    link: '/students/add',
    linkText: 'Add students ->'
  },
  {
    icon: CreditCard,
    color: 'bg-green-100 text-green-600',
    title: '3. Record Student Payments',
    description: 'Record payments on the student detail page.',
    link: '/students',
    linkText: 'View students ->'
  },
  {
    icon: Search,
    color: 'bg-yellow-100 text-yellow-600',
    title: '4. Track Fee Collection',
    description: 'View fee collection overview on the dashboard.',
    link: '/dashboard',
    linkText: 'View dashboard ->'
  },
  {
    icon: BookOpen,
    color: 'bg-orange-100 text-orange-600',
    title: '5. Monitor Fee Collection Status',
    description: 'Check fee collection status on the classes page.',
    link: '/classes',
    linkText: 'View classes ->'
  },
  {
    icon: Bot,
    color: 'bg-pink-100 text-pink-600',
    title: '6. Use AI Assistant',
    description: 'Use AI Insights for analysis.',
    link: '/ai',
    linkText: 'Use AI Insights ->'
  },
  {
    icon: Download,
    color: 'bg-teal-100 text-teal-600',
    title: '7. Download Receipt',
    description: 'Download PDF receipts from the student detail page.',
    link: '/students',
    linkText: 'View students ->'
  },
  {
    icon: Bell,
    color: 'bg-red-100 text-red-600',
    title: '8. Send Reminders',
    description: 'Send reminder messages to parents via WhatsApp.',
    link: '/ai',
    linkText: 'Send Reminders ->'
  }
]

const faqs = [
  { q: 'Is data safe?', a: 'Yes! Each user"s data is stored encrypted.' },
  { q: 'How to unlock AI chat?', a: 'AI chat is unlocked by paying Rs.5/month.' },
  { q: 'How to save school name in PDF receipt?', a: 'School name is saved on the profile page.' },
  { q: 'Can multiple users use it?', a: 'Yes! Each staff/admin can create their own account.' },
  { q: 'Is it mobile-friendly?', a: 'Yes! The app is mobile responsive.' }
]

export default function HowToUsePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-3xl mx-auto">

      {/* ==================== HEADER ==================== */}
<div className="text-center pt-4 md:pt-6 pb-2 md:pb-4 space-y-4">
  {/* Animated Icon */}
  <div className="flex justify-center">
    <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl shadow-sm animate-bounce">
      <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-violet-600" />
    </div>
  </div>

  {/* School Name */}
  <div className="space-y-1">
    <p className="text-sm font-medium text-violet-600 tracking-wide">
      Ayushman Educational Academy
    </p>

    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
      How to Use
    </h1>

    <p className="text-sm md:text-base text-zinc-500">
      Step by step guide
    </p>
  </div>
</div>

{/* ==================== QUICK LINKS ==================== */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 md:mt-8 mb-8 md:mb-10">
  {[
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: GraduationCap,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Students',
      href: '/students',
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Payments',
      href: '/payments',
      icon: CreditCard,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'AI Insights',
      href: '/ai',
      icon: Bot,
      color: 'text-pink-600 bg-pink-50',
    },
  ].map((item) => (
    <Link key={item.href} href={item.href}>
      <Card className="hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-2xl">
        <CardContent className="p-5 text-center space-y-3">
          <div
            className={`w-11 h-11 rounded-2xl ${item.color} flex items-center justify-center mx-auto`}
          >
            <item.icon className="w-5 h-5" />
          </div>

          <p className="text-sm font-semibold text-zinc-700">
            {item.label}
          </p>
        </CardContent>
      </Card>
    </Link>
  ))}
</div>

      {/* ==================== STEPS ==================== */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900 mb-4">How to Use</h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <Card key={i} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900 text-sm">{step.title}</p>
                    <p className="text-sm text-zinc-500 mt-1">{step.description}</p>
                    <Link href={step.link} className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium mt-2">
                      {step.linkText}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

     {/* ==================== FAQ ACCORDION ==================== */}
<div className="pt-2 md:pt-4">
  {/* Heading with proper top spacing */}
  <h2 className="text-base font-semibold text-zinc-900 mb-4 md:mb-5">
    Frequently Asked Questions
  </h2>

  {/* FAQ Cards */}
  <div className="space-y-3">
    {faqs.map((faq, i) => (
      <Card
        key={i}
        className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm"
      >
        <button
          onClick={() => setOpenFaq(openFaq === i ? null : i)}
          className="w-full px-4 py-4 text-left hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-sm text-zinc-900">
              Q: {faq.q}
            </p>

            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform duration-200 flex-shrink-0 ${
                openFaq === i ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {openFaq === i && (
          <div className="px-4 pb-4 pt-3 border-t border-zinc-100 animate-in slide-in-from-top-2 duration-200">
            <p className="text-sm text-zinc-600 leading-relaxed">
              A: {faq.a}
            </p>
          </div>
        )}
      </Card>
    ))}
  </div>
</div>

      {/* SPACING */}
      <div className="h-2"></div>

   {/* ==================== SUPPORT CARD ==================== */}
<Card className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 shadow-sm overflow-hidden rounded-2xl">
  <CardContent className="p-5 sm:p-6 space-y-5">

    {/* Header */}
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
        <MessageCircle className="w-5 h-5 text-violet-600" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-zinc-900 text-sm sm:text-base">
          Need Help?
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Contact us for any assistance or support.
        </p>
      </div>
    </div>

   {/* Support Buttons */}
<div className="grid grid-cols-3 gap-3 sm:gap-4">

{/* Instagram */}
<a
  href="https://instagram.com/ayushman_educational_"
  target="_blank"
  rel="noopener noreferrer"
  className="group h-9 sm:h-10 px-2 sm:px-3 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-sm transition-all duration-200"
>
  <Instagram className="w-3.5 h-3.5 text-pink-600 flex-shrink-0" />
  <span className="text-[11px] sm:text-sm font-semibold text-pink-700 whitespace-nowrap">
    Instagram
  </span>
  <ExternalLink className="w-3 h-3 text-pink-500 flex-shrink-0 hidden sm:block" />
</a>

{/* Call */}
<a
  href="tel:9098293521"
  className="group h-9 sm:h-10 px-2 sm:px-3 flex items-center justify-center gap-1.5 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 hover:shadow-sm transition-all duration-200"
>
  <Phone className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
  <span className="text-[11px] sm:text-sm font-semibold text-green-700 whitespace-nowrap">
    Call
  </span>
</a>

{/* Email */}
<a
  href="mailto:support@ayushmanacademy.com?subject=Help"
  className="group h-9 sm:h-10 px-2 sm:px-3 flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border--300 hover:shadow-sm transition-all duration-200"
>
  <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
  <span className="text-[11px] sm:text-sm font-semibold text-blue-700 whitespace-nowrap">
    Email
  </span>
</a>
</div>

{/* Bottom Info (No Top Border Line) */}
<div className="text-center pt-1">
<p className="text-xs text-zinc-400">
  Typical response time: within 2 hours
</p>
</div>

</CardContent>
</Card>

      {/* SPACING */}
      <div className="h-6"></div>

      {/* ==================== FOOTER ==================== */}
      <div className="text-center pt-4 border-t border-zinc-200">
        <p className="text-xs text-zinc-400 mt-2">
          &copy; {new Date().getFullYear()} Designed & Developed by AV Infra
        </p>
      </div>

    </div>
  )
}