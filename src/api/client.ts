import { supabase, getSessionId } from '../lib/supabase';
import { moderateTextLocally, moderateFile, extractTextFromPost } from '../lib/moderation';
import type { Post, Pin, JournalEntry, PostType, Location } from '../types';
import { MOCK_POSTS, MOCK_PINS, MOCK_JOURNAL } from '../data/mock';

// ── Server-side moderation helpers ───────────────────────────────────────────
async function checkTextServer(text: string): Promise<void> {
  if (!text.trim()) return;
  try {
    const { data, error } = await supabase.functions.invoke('moderate-text', {
      body: { text },
    });
    if (error) return; // fail open if function errors
    if (data && !data.safe) throw new Error(data.reason ?? 'Content not allowed.');
  } catch (e) {
    if (e instanceof Error && e.message !== 'Content not allowed.') return; // network error → fail open
    throw e;
  }
}

async function checkImageServer(imageUrl: string, storagePath: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('moderate-image', {
      body: { imageUrl, storagePath },
    });
    if (error) return; // fail open
    if (data && !data.safe) {
      // Delete the already-uploaded file from storage before rejecting
      if (data.storagePath) {
        const filename = data.storagePath.replace(/^post-images\//, '');
        await supabase.storage.from('post-images').remove([filename]);
      }
      throw new Error(data.reason ?? 'Image not allowed.');
    }
  } catch (e) {
    if (e instanceof Error && e.message !== 'Image not allowed.') return;
    throw e;
  }
}

// Set VITE_USE_MOCK=true in .env.local to keep using mock data during development
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Row → type mapper ─────────────────────────────────────────────────────────
// Supabase returns snake_case flat rows; we convert to our typed TS models.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPost(r: any): Post {
  const location: Location | undefined =
    r.city ? { city: r.city, country: r.country ?? '', lat: r.lat ?? 0, lng: r.lng ?? 0 } : undefined;

  const base = {
    id:         r.id,
    type:       r.type as PostType,
    createdAt:  r.created_at,
    likesCount: r.likes_count ?? 0,
    location,
  };

  switch (r.type as PostType) {
    case 'letter':
      return { ...base, type: 'letter', content: r.content ?? '', attribution: r.attribution };
    case 'polaroid':
      return { ...base, type: 'polaroid', imageUrl: r.image_url ?? '', caption: r.caption };
    case 'typewriter':
      return { ...base, type: 'typewriter', content: r.content ?? '' };
    case 'cafe':
      return { ...base, type: 'cafe', name: r.name ?? '', description: r.description ?? '', tags: r.tags ?? [], imageUrl: r.image_url };
    case 'journal':
      return { ...base, type: 'journal', content: r.content ?? '', title: r.title };
    case 'activity':
      return { ...base, type: 'activity', name: r.name ?? '', description: r.description ?? '', tags: r.tags ?? [] };
    default:
      return base as Post;
  }
}

// ── getPosts ──────────────────────────────────────────────────────────────────
export async function getPosts(
  params?: { city?: string; type?: PostType; limit?: number }
): Promise<Post[]> {
  if (USE_MOCK) {
    let posts = [...MOCK_POSTS];
    if (params?.city)  posts = posts.filter(p => p.location?.city === params.city);
    if (params?.type)  posts = posts.filter(p => p.type === params.type);
    if (params?.limit) posts = posts.slice(0, params.limit);
    return posts;
  }

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (params?.city)  query = query.eq('city', params.city);
  if (params?.type)  query = query.eq('type', params.type);
  if (params?.limit) query = query.limit(params.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToPost);
}

// ── createPost ────────────────────────────────────────────────────────────────
export async function createPost(data: {
  type: PostType;
  content?: string;
  name?: string;
  description?: string;
  tags?: string[];
  location?: Location;
  imageFile?: File;
  title?: string;
  attribution?: string;
  imageUrl?: string;
  caption?: string;
}): Promise<Post> {
  if (USE_MOCK) {
    const newPost = {
      ...data,
      id:         Math.random().toString(36).slice(2),
      createdAt:  new Date().toISOString(),
      likesCount: 0,
    } as Post;
    MOCK_POSTS.unshift(newPost);
    return newPost;
  }

  // ── Client-side moderation (instant, before any network call) ──
  if (data.imageFile) {
    const fileCheck = moderateFile(data.imageFile);
    if (!fileCheck.safe) throw new Error(fileCheck.reason);
  }

  const allText = extractTextFromPost(data);
  const textCheck = moderateTextLocally(allText);
  if (!textCheck.safe) throw new Error(textCheck.reason);

  // ── Server-side text moderation (OpenAI) ──
  if (allText.trim()) await checkTextServer(allText);

  // ── Upload image + server-side image moderation (Google Vision) ──
  let imageUrl = data.imageUrl;
  if (data.imageFile) {
    const ext      = data.imageFile.name.split('.').pop() ?? 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filename, data.imageFile, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filename);
    imageUrl = urlData.publicUrl;

    // Check the uploaded image — deletes it from storage and throws if flagged
    await checkImageServer(imageUrl, `post-images/${filename}`);
  }

  const row = {
    type:        data.type,
    content:     data.content,
    title:       data.title,
    attribution: data.attribution,
    name:        data.name,
    description: data.description,
    tags:        data.tags,
    image_url:   imageUrl,
    caption:     data.caption,
    city:        data.location?.city,
    country:     data.location?.country,
    lat:         data.location?.lat,
    lng:         data.location?.lng,
  };

  const { data: inserted, error } = await supabase
    .from('posts')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToPost(inserted);
}

// ── likePost ──────────────────────────────────────────────────────────────────
// Calls the server-side RPC that atomically inserts the like + bumps the count.
// Duplicate likes from the same session are silently ignored (PK constraint).
export async function likePost(id: string): Promise<void> {
  if (USE_MOCK) return;
  const sessionId = getSessionId();
  const { error } = await supabase.rpc('increment_likes', {
    p_post_id:    id,
    p_session_id: sessionId,
  });
  if (error) throw error;
}

// ── getPins ───────────────────────────────────────────────────────────────────
export async function getPins(): Promise<Pin[]> {
  if (USE_MOCK) return MOCK_PINS;

  const { data, error } = await supabase.from('pins').select('*');
  if (error) throw error;
  return (data ?? []).map(r => ({
    city:    r.city,
    country: r.country,
    lat:     r.lat,
    lng:     r.lng,
    count:   r.count,
  }));
}

// ── getJournalEntries ─────────────────────────────────────────────────────────
export async function getJournalEntries(): Promise<JournalEntry[]> {
  if (USE_MOCK) return MOCK_JOURNAL;

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(r => ({
    id:        r.id,
    content:   r.content,
    city:      r.city,
    createdAt: r.created_at,
  }));
}

// ── addJournalEntry ───────────────────────────────────────────────────────────
export async function addJournalEntry(content: string, city?: string): Promise<JournalEntry> {
  if (USE_MOCK) {
    const entry: JournalEntry = {
      id:        Math.random().toString(36).slice(2),
      content,
      city,
      createdAt: new Date().toISOString(),
    };
    MOCK_JOURNAL.unshift(entry);
    return entry;
  }

  // Moderate journal text before insert
  const localCheck = moderateTextLocally(content);
  if (!localCheck.safe) throw new Error(localCheck.reason);
  await checkTextServer(content);

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ content, city })
    .select()
    .single();

  if (error) throw error;
  return { id: data.id, content: data.content, city: data.city, createdAt: data.created_at };
}
