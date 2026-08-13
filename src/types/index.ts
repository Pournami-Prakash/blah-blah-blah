export type PostType = 'letter' | 'polaroid' | 'typewriter' | 'cafe' | 'journal' | 'activity';
export type ContentKind = 'thought' | 'moment' | 'recommendation';

export const POST_KIND: Record<PostType, ContentKind> = {
  letter: 'thought',
  typewriter: 'thought',
  journal: 'thought',
  polaroid: 'moment',
  cafe: 'recommendation',
  activity: 'recommendation',
};

export interface Location {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface BasePost {
  id: string;
  type: PostType;
  location?: Location;
  createdAt: string;
  likesCount: number;
}

export interface LetterPost extends BasePost {
  type: 'letter';
  content: string;
  attribution?: string;
}

export interface PolaroidPost extends BasePost {
  type: 'polaroid';
  imageUrl: string;
  caption?: string;
}

export interface TypewriterPost extends BasePost {
  type: 'typewriter';
  content: string;
}

export interface CafePost extends BasePost {
  type: 'cafe';
  name: string;
  description: string;
  tags: string[];
  imageUrl?: string;
}

export interface JournalPost extends BasePost {
  type: 'journal';
  content: string;
  title?: string;
}

export interface ActivityPost extends BasePost {
  type: 'activity';
  name: string;
  description: string;
  tags: string[];
}

export type Post = LetterPost | PolaroidPost | TypewriterPost | CafePost | JournalPost | ActivityPost;

export interface Pin {
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
}

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  city?: string;
}

export interface CityFeedResponse {
  city: string;
  country: string;
  posts: Post[];
  total: number;
}

export interface PostReport {
  postId: string;
  reason: 'spam' | 'harmful' | 'private-info' | 'other';
}
