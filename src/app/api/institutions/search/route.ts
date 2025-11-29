import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const institutionsResult = await payload.find({
      collection: 'institutions',
      limit: 50,
      where: {
        name: {
          contains: query,
        },
      },
    })

    const institutions = (institutionsResult.docs || []).map((inst) => ({
      id: inst.id,
      name: inst.name,
      website: inst.website,
      timezone: inst.timezone,
      deadlines: inst.deadlines || [],
    }))

    return NextResponse.json({ institutions })
  } catch (error) {
    console.error('Error searching institutions:', error)
    return NextResponse.json({ error: 'Failed to search institutions' }, { status: 500 })
  }
}

