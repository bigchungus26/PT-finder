// Supabase Edge Function: AI Study Assistant chat
// OpenAI-compatible API: works with OpenAI, Groq, Together, OpenRouter, or local Ollama.
// Set OPENAI_API_KEY in Supabase Dashboard → Project Settings → Edge Functions → Secrets.
// Optional: OPENAI_BASE_URL (e.g. https://api.groq.com/openai/v1 or http://localhost:11434/v1 for Ollama)
// Optional: OPENAI_MODEL (e.g. gpt-4o-mini, llama-3.1-70b-versatile, llama3.2)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a friendly, knowledgeable AI study assistant for students. You help with:
- Creating study plans and schedules
- Explaining concepts clearly
- Generating practice questions and flashcards
- Study tips and learning strategies
Keep responses focused, educational, and encouraging. Use clear structure (bullets, headings) when helpful.`;

async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'AI not configured',
          message: 'Set OPENAI_API_KEY in Supabase Edge Function secrets to enable the assistant.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { messages }: { messages?: ChatMessage[] } = (body && typeof body === 'object') ? body as { messages?: ChatMessage[] } : {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid messages array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
    const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const payload = {
      model,
      messages: [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 1024,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('LLM API error', res.status, errText);
      return new Response(
        JSON.stringify({
          error: 'AI request failed',
          message: res.status === 401 ? 'Invalid API key' : 'The AI service returned an error.',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    const content = typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? raw.map((c: { text?: string }) => (c && typeof c === 'object' && typeof c.text === 'string' ? c.text : '')).join('')
        : '';
    return new Response(JSON.stringify({ content: content || '(No response from model.)' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-chat error', e);
    return new Response(
      JSON.stringify({ error: 'Server error', message: 'An internal error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(handler);
