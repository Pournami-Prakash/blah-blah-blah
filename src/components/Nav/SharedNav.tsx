import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getRandomPost } from '../../api/client';

interface SharedNavProps {
  onCompose?: () => void;
  postCount?: number;
  visible?: boolean;
}

export default function SharedNav({ onCompose, postCount, visible = true }: SharedNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [finding, setFinding] = useState(false);

  const surprise = async () => {
    if (finding) return;
    setFinding(true);
    try {
      const post = await getRandomPost();
      if (post) navigate(`/whisper/${post.id}`);
      else navigate('/wall');
    } catch {
      navigate('/wall');
    } finally {
      setFinding(false);
    }
  };

  return (
    <nav className="shared-nav" aria-label="Primary" style={{ opacity: visible ? 1 : 0 }}>
      <style>{`
        .shared-nav { position:fixed;top:0;left:0;right:0;z-index:80;display:flex;align-items:center;gap:18px;padding:16px clamp(18px,3vw,32px);background:linear-gradient(to bottom,rgba(244,239,232,.96),rgba(244,239,232,.72),transparent);transition:opacity .35s ease; }
        .shared-nav__brand { font-family:"Playfair Display",serif;font-style:italic;font-size:15px;color:#211914;text-decoration:none;white-space:nowrap; }
        .shared-nav__links { margin-left:auto;display:flex;align-items:center;gap:8px; }
        .shared-nav__link,.shared-nav__quiet { min-height:38px;display:inline-flex;align-items:center;justify-content:center;padding:7px 10px;border:0;background:transparent;color:#705D4D;font:italic 13px "Playfair Display",serif;text-decoration:none;cursor:pointer;white-space:nowrap; }
        .shared-nav__link[aria-current="page"] { color:#211914;text-decoration:underline;text-decoration-color:#E8543A;text-underline-offset:4px; }
        .shared-nav__quiet { font:10px "DM Mono",monospace;border:1px dashed rgba(42,36,32,.22);border-radius:999px; }
        .shared-nav__cta { min-height:38px;border:0;border-radius:999px;padding:8px 15px;background:#2A2420;color:#F7F3EE;font:600 11px "DM Sans",sans-serif;cursor:pointer;white-space:nowrap; }
        .shared-nav__count { color:#806D5D;font:9px "DM Mono",monospace;white-space:nowrap; }
        @media(max-width:560px){ .shared-nav{gap:5px;padding:13px 14px}.shared-nav__links{gap:0}.shared-nav__link{padding:7px 6px}.shared-nav__quiet{padding:6px 8px}.shared-nav__count{display:none}.shared-nav__cta{padding:8px 10px}.shared-nav__cta span{display:none} }
      `}</style>
      <Link to="/" className="shared-nav__brand" aria-label="blah blah blah home">b<span style={{ color: '#E8543A' }}>.</span>b<span style={{ color: '#EDB846' }}>.</span>b</Link>
      <div className="shared-nav__links">
        <Link to="/wall" className="shared-nav__link" aria-current={location.pathname === '/wall' ? 'page' : undefined}>wall</Link>
        <Link to="/journal" className="shared-nav__link" aria-current={location.pathname === '/journal' ? 'page' : undefined}>journal</Link>
        <button className="shared-nav__quiet" onClick={surprise} disabled={finding}>{finding ? 'finding…' : 'surprise me ✦'}</button>
        {typeof postCount === 'number' && <span className="shared-nav__count">{postCount} posts</span>}
        {onCompose && <button className="shared-nav__cta" onClick={onCompose}>+ <span>leave a </span>whisper</button>}
      </div>
    </nav>
  );
}
