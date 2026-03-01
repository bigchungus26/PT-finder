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

const SYSTEM_PROMPT = `You are StudyHub Assistant, the built-in helper for the StudyHub app — a collaborative learning platform that connects students through study groups, course Q&A, and smart matching.

Your role is to help users navigate and get the most out of StudyHub. You can help with:
- **Finding & creating study groups** — how to browse groups, what match scores mean, creating a group, setting tags/level/rules
- **Course management** — enrolling in courses, browsing the course catalog, using course Q&A
- **Study sessions** — scheduling sessions within groups, RSVPing, setting agendas
- **Matching** — how the matching algorithm works (shared courses, availability overlap, study style, goals)
- **Profile & settings** — updating profile, availability, study preferences
- **Group chat** — how real-time messaging works within groups
- **Direct messages** — how to message other students
- **Resources** — sharing links and notes within groups
- **General app navigation** — where to find features, how things work

APP NAVIGATION GUIDE — use these exact directions when helping users:
- The sidebar has these tabs: **Dashboard**, **Courses**, **Groups**, **Messages**, **AI Assistant**.
- **To add/manage courses:** Go to **Courses** in the sidebar → click "Add Course" at the bottom of your course list, OR go to **Settings** (bottom of sidebar) → scroll to "Your Courses" section where you can add/remove courses.
- **To post a question:** On the **Dashboard**, click "Post Question" → pick a course → you'll be taken to the course Q&A page where you can ask your question. Alternatively, go to **Courses** in the sidebar → click a course → click "Ask Question" at the top.
- **To create a study group:** Go to **Groups** in the sidebar → click "Create Group" at the top right, OR use the "Create Group" quick action on the Dashboard.
- **To join a study group:** Go to **Groups** in the sidebar → browse available groups → click a group → click "Join Group".
- **To message someone:** Go to **Messages** in the sidebar → select a conversation, OR click "Message" on a study partner card on the Dashboard.
- **To schedule a study session:** Go to **Groups** → open your group → go to the "Sessions" tab → click "Create Session".
- **To update your profile:** Click **Settings** at the bottom of the sidebar.
- **To browse all courses:** Go to **Courses** in the sidebar → scroll down to "Browse All Courses".

IMPORTANT RULES:
- You are an APP assistant, NOT a tutor. Do NOT help with academic content, homework, or study material.
- If a user asks for help with a concept, practice questions, study plans, or any academic content, politely redirect them: "I'm here to help you navigate StudyHub! For academic questions, try posting in the Course Q&A section — your classmates and professors can help there."
- Keep responses concise and actionable.
- When giving navigation instructions, ALWAYS use the exact directions from the APP NAVIGATION GUIDE above. Never guess or make up navigation paths.
- If the user provides context about their profile/courses/groups, use it to give personalized guidance.`;

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
    const { messages, context }: { messages?: ChatMessage[]; context?: { courses?: string[]; groups?: string[]; name?: string } } = (body && typeof body === 'object') ? body as { messages?: ChatMessage[]; context?: { courses?: string[]; groups?: string[]; name?: string } } : {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid messages array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt with optional user context
    let systemContent = SYSTEM_PROMPT;
    if (context) {
      const parts: string[] = [];
      if (context.name) parts.push(`The user's name is ${context.name}.`);
      if (context.courses?.length) parts.push(`They are enrolled in: ${context.courses.join(', ')}.`);
      if (context.groups?.length) parts.push(`They are in these study groups: ${context.groups.join(', ')}.`);
      if (parts.length) {
        systemContent += `\n\nUser context:\n${parts.join('\n')}`;
      }
    }

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
