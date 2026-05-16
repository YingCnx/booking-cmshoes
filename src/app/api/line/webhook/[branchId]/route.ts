import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

function verifySignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('SHA256', secret).update(body).digest('base64')
  return hash === signature
}

type Props = { params: Promise<{ branchId: string }> }

export async function POST(req: Request, { params }: Props) {
  const { branchId } = await params
  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''

  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, line_channel_secret')
    .eq('id', parseInt(branchId))
    .maybeSingle()

  if (!branch || !branch.line_channel_secret) {
    return NextResponse.json({ error: 'branch/secret not found' }, { status: 404 })
  }

  if (!verifySignature(rawBody, signature, branch.line_channel_secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  for (const event of events) {
    console.log(`[webhook ${branch.name}]`, {
      type: event.type,
      source: event.source?.type,
      userId: event.source?.userId ?? '-',
      groupId: event.source?.groupId ?? '-',
    })
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
