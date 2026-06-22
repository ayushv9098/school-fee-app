'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createClient } from '@/lib/supabase/client'

// Helper to update map center
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

const teacherIcon = (isInside: boolean) => L.divIcon({
  className: 'custom-teacher-icon',
  html: `<div style="background-color: ${isInside ? '#22c55e' : '#ef4444'}; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); position: relative;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${isInside ? '#22c55e' : '#ef4444'}; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
})

const schoolIcon = L.divIcon({
  className: 'custom-school-icon',
  html: `<div style="background-color: #7c3aed; width: 28px; height: 28px; border-radius: 8px; border: 2.5px solid white; box-shadow: 0 0 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
})

interface TeacherLocation {
  id: string
  name: string
  last_lat: number | null
  last_lng: number | null
  updated_at: string
}

interface AttendanceRecord {
  last_lat: number | null
  last_lng: number | null
  updated_at: string
  teachers: {
    id: string
    name: string
  } | null
}

export default function LiveMap({ 
  schoolLat, 
  schoolLng, 
  radius 
}: { 
  schoolLat: number, 
  schoolLng: number, 
  radius: number 
}) {
  const [teachers, setTeachers] = useState<TeacherLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchTeacherLocations() {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          last_lat,
          last_lng,
          updated_at:created_at,
          teachers:teacher_id (
            id,
            name
          )
        `)
        .eq('date', today) as { data: AttendanceRecord[] | null, error: Error | null }

      if (error) {
        console.error('Error fetching teacher locations:', error)
        return
      }

      if (data) {
        const locations = data
          .filter(a => a.last_lat && a.last_lng && a.teachers)
          .map(a => ({
            id: a.teachers!.id,
            name: a.teachers!.name,
            last_lat: a.last_lat,
            last_lng: a.last_lng,
            updated_at: a.updated_at
          }))
        setTeachers(locations)
      }
      setLoading(false)
    }

    fetchTeacherLocations()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('attendance_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance',
        filter: `date=eq.${new Date().toISOString().split('T')[0]}`
      }, () => {
        fetchTeacherLocations() // Refresh all to be safe and simple
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // metres
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  return (
    <div className="h-full w-full relative">
      <style jsx global>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
      <MapContainer 
        center={[schoolLat, schoolLng]} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <ChangeView center={[schoolLat, schoolLng]} zoom={17} />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite View">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Road View">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* School Building Marker */}
        <Marker position={[schoolLat, schoolLng]} icon={schoolIcon}>
          <Popup>
            <div className="text-xs font-bold">School Building</div>
          </Popup>
        </Marker>

        {/* Geofence Circle */}
        <Circle
          center={[schoolLat, schoolLng]}
          radius={radius}
          pathOptions={{
            color: '#7c3aed',
            fillColor: '#7c3aed',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10'
          }}
        />

        {/* Teacher Markers */}
        {teachers.map(teacher => {
          if (!teacher.last_lat || !teacher.last_lng) return null
          const distance = calculateDistance(schoolLat, schoolLng, teacher.last_lat, teacher.last_lng)
          const isInside = distance <= radius

          return (
            <Marker 
              key={teacher.id} 
              position={[teacher.last_lat, teacher.last_lng]} 
              icon={teacherIcon(isInside)}
            >
              <Popup>
                <div className="p-1">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{teacher.name}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {isInside ? '🟢 Inside School' : '🔴 Outside Range'}
                  </p>
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Last update: {new Date(teacher.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-zinc-900/50 backdrop-blur-[2px] z-[1000] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-violet-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white dark:bg-zinc-900/90 backdrop-blur p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm z-[1000] space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] border border-white" />
          <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-400">In School</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] border border-white" />
          <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-400">Outside</span>
        </div>
      </div>
    </div>
  )
}
