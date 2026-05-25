import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }

  const { city, data, settings } = await req.json()

  if (!city || typeof city !== 'string' || !/^[a-z0-9-]+$/.test(city)) {
    return NextResponse.json({ error: 'Invalid city' }, { status: 400 })
  }

  const dataDir = path.join(process.cwd(), 'src', 'app', '(game)', city, 'data')

  if (!fs.existsSync(dataDir)) {
    return NextResponse.json({ error: 'City data directory not found' }, { status: 404 })
  }

  try {
    fs.writeFileSync(path.join(dataDir, 'routes.json'), JSON.stringify(data, null, 2))
    fs.writeFileSync(path.join(dataDir, 'routes-settings.json'), JSON.stringify(settings, null, 2))
  } catch (e) {
    return NextResponse.json({ error: 'Write failed', detail: String(e) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
