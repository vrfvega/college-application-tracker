import type { CollectionConfig, PayloadRequest } from 'payload'

const SUPPORTED_TIMEZONES: string[] = Intl.supportedValuesOf('timeZone') as string[]
const TIMEZONE_OPTIONS = SUPPORTED_TIMEZONES.map((tz) => ({ label: tz, value: tz }))

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

export const Institution: CollectionConfig = {
  slug: 'institutions',
  labels: {
    singular: "Institution",
    plural: "Institutions",
  },
  admin: {
    useAsTitle: "name"
  },
  timestamps: true,
  hooks: {
    beforeValidate: [
      async ({
        data,
        req,
        originalDoc,
      }: {
        data?: { name?: string; slug?: string }
        req: PayloadRequest
        originalDoc?: { id?: string; name?: string; slug?: string }
      }) => {
        if (!data) return data

        const name = data.name ?? originalDoc?.name
        if (!name) return data

        // Only generate when slug is missing/empty so we don't overwrite existing slugs
        if (data.slug && data.slug.trim().length > 0) return data

        const base = toSlug(name)
        let candidate = base
        let suffix = 1

        // Ensure uniqueness by checking existing docs with same slug
        // Avoid clashing with the same document on update
        // Note: keep loop bounded in practice; collisions are unlikely
        while (true) {
          const result = await req.payload.find({
            collection: 'institutions',
            where: { slug: { equals: candidate } },
            depth: 0,
            limit: 1,
          })
          const existing = result?.docs?.[0]
          if (
            !existing ||
            (originalDoc && String(existing.id) === String(originalDoc.id))
          ) {
            break
          }
          suffix += 1
          candidate = `${base}-${suffix}`
        }

        data.slug = candidate
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: "slug",
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        condition: () => false,
      },
    },
    {
      name: 'website',
      type: 'text',
      required: true,
      admin: {
        description: 'Public website URL, e.g. https://example.edu',
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Website is required'
        }
        try {
          const url = new URL(value)
          if (!['http:', 'https:'].includes(url.protocol)) {
            return 'Website must start with http or https'
          }
          return true
        } catch {
          return 'Invalid URL'
        }
      },
    },
    {
      name: "timezone",
      type: "select",
      required: true,
      defaultValue: "America/New_York",
      options: TIMEZONE_OPTIONS,
      admin: {
        description: "Select the institution's timezone",
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Timezone is required'
        }
        return SUPPORTED_TIMEZONES.includes(value) ? true : 'Invalid timezone'
      },
    },
    {
      name: 'deadlines',
      label: 'Deadlines',
      labels: {
        singular: 'Deadline',
        plural: 'Deadlines',
      },
      type: 'array',
      admin: {
        description: 'Application deadlines for this institution',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'date',
          type: 'date',
          required: true,
        },
      ],
    },
  ],
}
