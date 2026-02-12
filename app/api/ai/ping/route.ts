import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createXai } from '@ai-sdk/xai'

export const dynamic = 'force-dynamic'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
const xai = createXai({ apiKey: process.env.XAI_API_KEY })

const PROVIDER_MODELS = {
  groq: { model: groq('llama-3.3-70b-versatile'), label: 'LLaMA 3.3 70B' },
  grok: { model: xai('grok-3-mini-fast'), label: 'Grok 3 Mini Fast' },
} as const

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const provider = (body.provider === 'grok' ? 'grok' : 'groq') as keyof typeof PROVIDER_MODELS

  const { model, label } = PROVIDER_MODELS[provider]
  const startTime = Date.now()

  try {
    const { text } = await generateText({
      model,
      prompt: 'Respond with exactly: OK followed by your model name. Nothing else.',
      maxTokens: 50,
      temperature: 0,
    })

    const latencyMs = Date.now() - startTime

    return Response.json({
      status: 'ok',
      provider,
      model: label,
      latencyMs,
      response: text.trim().substring(0, 200),
    })
  } catch (error) {
    const latencyMs = Date.now() - startTime

    return Response.json(
      {
        status: 'error',
        provider,
        model: label,
        latencyMs,
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
