import fs from "fs"
import path from "path"
import type { NextConfig } from "next"

const projectRoot = path.join(__dirname)

function loadEnvFile(filename: string) {
  const filePath = path.join(projectRoot, filename)
  if (!fs.existsSync(filePath)) return {}

  const content = fs.readFileSync(filePath, "utf8")
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce<Record<string, string>>((acc, line) => {
      const index = line.indexOf("=")
      if (index === -1) return acc
      const key = line.slice(0, index).trim()
      let value = line.slice(index + 1).trim()
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      acc[key] = value
      return acc
    }, {})
}

const envFile = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),
  ...process.env,
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: envFile.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envFile.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_URL: envFile.SUPABASE_URL ?? envFile.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: envFile.SUPABASE_ANON_KEY ?? envFile.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
