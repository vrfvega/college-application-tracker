import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Institution } from '@/payload-types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json({ institutions: [] })
    }

    const ids = idsParam
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id))

    if (ids.length === 0) {
      return NextResponse.json({ institutions: [] })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Fetch institutions by making individual queries for each ID
    // This is more efficient than fetching all and filtering
    const institutionsPromises = ids.map((id) =>
      payload.findByID({
        collection: 'institutions',
        id,
      }),
    )

    const institutionsResults = await Promise.allSettled(institutionsPromises)

    const institutions = institutionsResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => {
        const inst = (result as PromiseFulfilledResult<Institution>).value
        return {
          id: inst.id,
          name: inst.name,
          website: inst.website,
          timezone: inst.timezone,
          deadlines: inst.deadlines || [],
        }
      })

    return NextResponse.json({ institutions })
  } catch (error) {
    console.error('Error fetching institutions:', error)
    return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 })
  }
}

