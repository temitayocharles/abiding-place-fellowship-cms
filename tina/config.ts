import { defineConfig } from 'tinacms'

const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main'

const singleDocumentActions = {
  allowedActions: {
    create: false,
    delete: false,
  },
}

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || '',
  token: process.env.TINA_TOKEN || '',
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'images',
      publicFolder: '.',
    },
  },
  schema: {
    collections: [
      {
        name: 'announcements',
        label: 'Church Updates',
        path: 'content/site',
        format: 'yaml',
        match: { include: 'announcements' },
        ui: singleDocumentActions,
        fields: [
          {
            name: 'announcements',
            label: 'Announcements',
            type: 'object',
            list: true,
            fields: [
              { name: 'title', label: 'Title', type: 'string', required: true },
              { name: 'date', label: 'Date', type: 'string' },
              { name: 'time', label: 'Time', type: 'string' },
              { name: 'location', label: 'Location', type: 'string' },
              {
                name: 'description',
                label: 'Description',
                type: 'string',
                ui: { component: 'textarea' },
              },
              { name: 'published', label: 'Published', type: 'boolean' },
            ],
          },
        ],
      },
      {
        name: 'weeklyGatherings',
        label: 'Weekly Gatherings',
        path: 'content/site',
        format: 'yaml',
        match: { include: 'weekly-gatherings' },
        ui: singleDocumentActions,
        fields: [
          {
            name: 'gatherings',
            label: 'Gatherings',
            type: 'object',
            list: true,
            fields: [
              { name: 'name', label: 'Name', type: 'string', required: true },
              { name: 'day', label: 'Day', type: 'string', required: true },
              { name: 'time', label: 'Time', type: 'string', required: true },
              { name: 'venue', label: 'Venue', type: 'string' },
              { name: 'entrance', label: 'Entrance', type: 'string' },
              { name: 'status', label: 'Publishing Status', type: 'string' },
              { name: 'current_topic', label: 'Current Topic', type: 'string' },
            ],
          },
          {
            name: 'editor_note',
            label: 'Editor Note',
            type: 'string',
            ui: { component: 'textarea' },
          },
        ],
      },
      {
        name: 'leadership',
        label: 'Leadership',
        path: 'content/site',
        format: 'yaml',
        match: { include: 'leadership' },
        ui: singleDocumentActions,
        fields: [
          {
            name: 'leadership',
            label: 'Leaders',
            type: 'object',
            list: true,
            fields: [
              { name: 'name', label: 'Name', type: 'string', required: true },
              { name: 'role', label: 'Role', type: 'string', required: true },
              { name: 'verified', label: 'Approved for Publication', type: 'boolean' },
              {
                name: 'bio',
                label: 'Biography',
                type: 'string',
                ui: { component: 'textarea' },
              },
              { name: 'photo', label: 'Photo URL', type: 'string' },
            ],
          },
          {
            name: 'prohibited_without_confirmation',
            label: 'Do Not Publish Without Confirmation',
            type: 'string',
            list: true,
          },
        ],
      },
      {
        name: 'ministries',
        label: 'Ministries',
        path: 'content/site',
        format: 'yaml',
        match: { include: 'ministries' },
        ui: singleDocumentActions,
        fields: [
          { name: 'source', label: 'Reference Source', type: 'string' },
          {
            name: 'ministries',
            label: 'Ministries',
            type: 'object',
            list: true,
            fields: [
              { name: 'name', label: 'Name', type: 'string', required: true },
              {
                name: 'summary',
                label: 'Summary',
                type: 'string',
                ui: { component: 'textarea' },
              },
              { name: 'photo', label: 'Photo URL', type: 'string' },
              { name: 'current_schedule', label: 'Current Schedule', type: 'string' },
            ],
          },
          {
            name: 'unsupported_claims_removed',
            label: 'Claims Removed Until Confirmed',
            type: 'string',
            list: true,
          },
        ],
      },
      {
        name: 'contact',
        label: 'Contact and Service Details',
        path: 'config',
        format: 'yaml',
        match: { include: 'contact' },
        ui: singleDocumentActions,
        fields: [
          { name: 'phone', label: 'Telephone', type: 'string', required: true },
          { name: 'cell', label: 'Mobile', type: 'string' },
          { name: 'email', label: 'Email', type: 'string', required: true },
          { name: 'venue', label: 'Venue', type: 'string', required: true },
          { name: 'address', label: 'Address', type: 'string', required: true },
          { name: 'entrance', label: 'Entrance', type: 'string' },
          {
            name: 'service_times',
            label: 'Service Times',
            type: 'object',
            list: true,
            fields: [
              { name: 'day', label: 'Day', type: 'string', required: true },
              { name: 'time', label: 'Time', type: 'string', required: true },
              { name: 'name', label: 'Name', type: 'string', required: true },
            ],
          },
          {
            name: 'editor_notes',
            label: 'Editor Notes',
            type: 'string',
            ui: { component: 'textarea' },
          },
        ],
      },
      {
        name: 'siteSettings',
        label: 'Site Settings',
        path: 'config',
        format: 'yaml',
        match: { include: 'site' },
        ui: singleDocumentActions,
        fields: [
          { name: 'name', label: 'Church Name', type: 'string', required: true },
          {
            name: 'description',
            label: 'Description',
            type: 'string',
            ui: { component: 'textarea' },
          },
          { name: 'founded', label: 'Founded', type: 'number' },
          { name: 'official_legacy_site', label: 'Legacy Site URL', type: 'string' },
          { name: 'email', label: 'Email', type: 'string' },
        ],
      },
    ],
  },
})
