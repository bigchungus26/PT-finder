// Supabase Edge Function: StudyHub in-app assistant (navigation & app help, not course tutoring)
// OpenAI-compatible API. Set OPENAI_API_KEY in Edge Function secrets.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT_BASE = `You are StudyHub's in-app assistant. Your job is to help users navigate the app and answer questions about their account and how to use features. You do NOT teach course content, explain subjects, or create study plans—that's for tools like ChatGPT or Gemini. Stay focused on:

- **Navigation**: Where to find things (Dashboard, Courses, Groups, AI Assistant, Settings, Admin).
- **Features**: How to join a group (request to join, then get approved), create sessions, add resources, RSVP, use the chat, enroll in courses, etc.
- **Their data**: When they ask about their sessions, groups, or courses, use the context below to give a short, accurate summary. If no context is provided, tell them to check the Dashboard or the relevant page.

If someone asks for course tutoring, explanations, quizzes, or study plans, politely say you're here to help with the app only and suggest they use their course materials or a general-purpose AI for learning. Keep replies concise and helpful.`;

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
    const { messages, context }: { messages?: ChatMessage[]; context?: string } = (body && typeof body === 'object') ? body as { messages?: ChatMessage[]; context?: string } : {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid messages array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemContent = typeof context === 'string' && context.trim()
      ? `${SYSTEM_PROMPT_BASE}\n\n**Current user context (use this to answer questions about their sessions, groups, courses):**\n${context.trim()}`
      : SYSTEM_PROMPT_BASE;

    const baseUrl = Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
    const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const payload = {
      model,
      messages: [
        { role: 'system' as const, content: systemContent },
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
      JSON.stringify({ error: 'Server error', message: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(handler);
