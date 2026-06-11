'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, Download, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function TeacherOnboardingBridge() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  const teacherId = searchParams.get('teacher_id') || ''
  
  // Custom deep link for the app
  const appSetupLink = `teacherapae://signup?email=${encodeURIComponent(emailParam)}&teacher_id=${teacherId}`
  const apkDownloadUrl = '/apps/teacher-portal.apk' // Update this with your real APK path

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 shadow-xl rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="pb-2 pt-8 px-8 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-violet-600 w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900">Finish Account Setup</CardTitle>
          <CardDescription className="text-zinc-500 font-medium">
            Setup your account in the official app to start marking attendance
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 pt-4 space-y-8">
          {/* Step 1: Download */}
          <div className="relative pl-10 border-l-2 border-violet-100 space-y-3 pb-4">
             <div className="absolute -left-[11px] top-0 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-4 ring-white shadow-sm">1</div>
             <div>
                <h3 className="font-bold text-zinc-900">Download Teacher App</h3>
                <p className="text-xs text-zinc-400 font-medium">Install our official Android app first</p>
             </div>
             <a 
               href={apkDownloadUrl}
               className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg active:scale-95"
             >
               <Download size={18} />
               Download APK Now
             </a>
          </div>

          {/* Step 2: Open & Setup */}
          <div className="relative pl-10 border-l-2 border-transparent space-y-3">
             <div className="absolute -left-[11px] top-0 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-4 ring-white shadow-sm">2</div>
             <div>
                <h3 className="font-bold text-zinc-900">Setup My Account</h3>
                <p className="text-xs text-zinc-400 font-medium">Once installed, click below to set your password in the app</p>
             </div>
             <a 
               href={appSetupLink}
               className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 active:scale-95"
             >
               <Plus size={18} />
               Open in App & Setup
             </a>
          </div>

          <div className="pt-4 text-center">
             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
               Your Email: <span className="text-zinc-600 underline">{emailParam}</span>
             </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center px-4">
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          The app provides real-time location tracking and instant selfie verification for your attendance. 🛡️
        </p>
      </div>
    </div>
  )
}

export default function TeacherSignupPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-xs font-black text-violet-600 uppercase tracking-[0.3em] mb-2">Teacher Portal</h1>
          <p className="text-lg font-bold text-zinc-900">Ayushman Educational Academy</p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-20 bg-white rounded-[32px] border border-zinc-100 shadow-xl">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          </div>
        }>
          <TeacherOnboardingBridge />
        </Suspense>

        <p className="text-center text-[10px] text-zinc-400 mt-12 font-bold uppercase tracking-widest opacity-60">
          © {new Date().getFullYear()} AV Infra Systems
        </p>
      </div>
    </div>
  )
}
