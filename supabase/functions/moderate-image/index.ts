// ── moderate-image Edge Function ──────────────────────────────────────────────
// Calls Google Cloud Vision Safe Search to detect explicit/violent images.
// Called AFTER upload to Supabase Storage; client deletes the object if flagged.
//
// Deploy:   supabase functions deploy moderate-image
// Secret:   supabase secrets set GOOGLE_VISION_API_KEY=AIza...
//
// Safe Search likelihood scale: UNKNOWN / VERY_UNLIKELY / UNLIKELY / POSSIBLE / LIKELY / VERY_LIKELY
// We reject LIKELY and VERY_LIKELY for adult/violence/racy categories.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Likelihood values that trigger rejection
const UNSAFE_LEVELS = new Set(['LIKELY', 'VERY_LIKELY']);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { imageUrl, storagePath } = await req.json() as {
      imageUrl:    string;
      storagePath: string; // e.g. "post-images/filename.jpg" — returned to client for cleanup
    };

    if (!imageUrl) {
      return new Response(JSON.stringify({ safe: false, reason: 'No image URL provided.' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY not set');

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image:    { source: { imageUri: imageUrl } },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          }],
        }),
      },
    );

    if (!visionRes.ok) {
      console.error('Google Vision unavailable:', visionRes.status);
      // Fail open — don't block legitimate uploads if the API is down
      return new Response(JSON.stringify({ safe: true, warning: 'vision_unavailable' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const visionData = await visionRes.json();
    const ss = visionData.responses?.[0]?.safeSearchAnnotation;

    if (!ss) {
      // No annotation returned — Vision couldn't parse the image
      return new Response(JSON.stringify({ safe: false, reason: 'Image could not be analysed. Please try a different photo.' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const violations: string[] = [];
    if (UNSAFE_LEVELS.has(ss.adult))    violations.push('explicit content');
    if (UNSAFE_LEVELS.has(ss.violence)) violations.push('violent content');
    if (UNSAFE_LEVELS.has(ss.racy))     violations.push('sexually suggestive content');
    if (UNSAFE_LEVELS.has(ss.medical))  violations.push('graphic medical content');

    if (violations.length > 0) {
      return new Response(
        JSON.stringify({
          safe:        false,
          reason:      `Image flagged for: ${violations.join(', ')}.`,
          storagePath, // returned so the client can delete it from storage
        }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ safe: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('moderate-image error:', err);
    return new Response(JSON.stringify({ safe: true, warning: 'moderation_error' }), {
      status:  200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
