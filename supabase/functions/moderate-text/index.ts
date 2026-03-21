// ── moderate-text Edge Function ───────────────────────────────────────────────
// Calls the OpenAI Moderation API (free, no quota concerns for this scale).
// Returns { safe: boolean, reason?: string, categories?: string[] }
//
// Deploy:   supabase functions deploy moderate-text
// Secret:   supabase secrets set OPENAI_API_KEY=sk-...

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORY_LABELS: Record<string, string> = {
  'hate':                  'hateful content',
  'hate/threatening':      'threatening hate speech',
  'harassment':            'harassment',
  'harassment/threatening':'threatening harassment',
  'self-harm':             'self-harm content',
  'self-harm/intent':      'self-harm intent',
  'self-harm/instructions':'self-harm instructions',
  'sexual':                'sexual content',
  'sexual/minors':         'content involving minors',
  'violence':              'violent content',
  'violence/graphic':      'graphic violence',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { text } = await req.json() as { text: string };

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ safe: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');

    const modRes = await fetch('https://api.openai.com/v1/moderations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body:    JSON.stringify({ input: text }),
    });

    if (!modRes.ok) {
      // If OpenAI is down, fail open (allow the post) to avoid blocking users
      console.error('OpenAI moderation unavailable:', modRes.status);
      return new Response(JSON.stringify({ safe: true, warning: 'moderation_unavailable' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const data = await modRes.json();
    const result = data.results?.[0];

    if (!result) throw new Error('Unexpected moderation response');

    if (result.flagged) {
      // Collect human-readable category names
      const flagged = Object.entries(result.categories as Record<string, boolean>)
        .filter(([, v]) => v)
        .map(([k]) => CATEGORY_LABELS[k] ?? k);

      return new Response(
        JSON.stringify({
          safe:       false,
          reason:     `This content was flagged for: ${flagged.join(', ')}.`,
          categories: flagged,
        }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('moderate-text error:', err);
    // Fail open — don't block users if the service errors
    return new Response(JSON.stringify({ safe: true, warning: 'moderation_error' }), {
      status:  200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
