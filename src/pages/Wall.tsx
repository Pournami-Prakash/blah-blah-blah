import { useRef } from 'react';
import { Link } from 'react-router-dom';
import WhisperWall from '../components/feed/WhisperWall';
import ComposeModal from '../components/modals/ComposeModal';
import LetterModal from '../components/modals/LetterModal';
import PolaroidModal from '../components/modals/PolaroidModal';
import TypewriterModal from '../components/modals/TypewriterModal';
import CafeModal from '../components/modals/CafeModal';
import JournalModal from '../components/modals/JournalModal';
import ActivityModal from '../components/modals/ActivityModal';
import AdviceModal from '../components/modals/AdviceModal';
import { useModal } from '../hooks/useModal';

function burstConfetti(originEl: HTMLElement) {
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const COLORS = ['#E8543A','#EDB846','#5D9A70','#7090C8','#F5A08A','#F5D080','#90C4A0'];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    const sq = Math.random() > 0.5, sz = 5 + Math.random() * 7;
    el.style.cssText = ['position:fixed','pointer-events:none','z-index:9998',`left:${cx}px`,`top:${cy}px`,`width:${sz}px`,`height:${sq?sz:sz*0.45}px`,`background:${COLORS[Math.floor(Math.random()*COLORS.length)]}`,`border-radius:${sq?'2px':'50%'}`,'transform-origin:center'].join(';');
    document.body.appendChild(el);
    const angle = (Math.PI*2*i/22)+(Math.random()-0.5)*0.5, spd = 4+Math.random()*7;
    let vx=Math.cos(angle)*spd, vy=Math.sin(angle)*spd-4, x=cx, y=cy, rot=Math.random()*360, life=1;
    const rs=(Math.random()-0.5)*20;
    const tick=()=>{ life-=0.024; if(life<=0){el.remove();return;} vy+=0.3;vx*=0.97;x+=vx;y+=vy;rot+=rs; el.style.left=`${x-sz/2}px`;el.style.top=`${y-sz/2}px`;el.style.opacity=String(life);el.style.transform=`rotate(${rot}deg) scale(${life})`;requestAnimationFrame(tick); };
    setTimeout(()=>requestAnimationFrame(tick), i*12);
  }
}

export default function Wall() {
  const { activeModal, openModal, closeModal } = useModal();
  const navBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ background: 'var(--bg-wall)', minHeight: '100vh' }}>
      <style>{`
        @keyframes ctaBreathe {
          0%,100% { box-shadow: 0 4px 20px rgba(42,36,32,0.15); }
          50%      { box-shadow: 0 10px 36px rgba(42,36,32,0.28); }
        }
        .wall-nav-link {
          font-family: "Playfair Display", serif;
          font-style: italic;
          font-size: 13px;
          color: #9A8A7A; text-decoration: none;
          padding: 4px 2px;
          border: none; background: transparent;
          transition: color 0.18s;
          position: relative;
          display: inline-block;
        }
        .wall-nav-link::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 0; height: 1px; background: #E8543A;
          transition: width 0.24s cubic-bezier(.34,1.56,.64,1);
        }
        .wall-nav-link:hover { color: #E8543A; }
        .wall-nav-link:hover::after { width: 100%; }
        .wall-nav-link.active { color: #2A2420; opacity: 0.6; }
        .wall-cta {
          position: relative; overflow: hidden;
          background: #2A2420; color: #F7F3EE; border: none;
          border-radius: 20px; padding: 7px 18px; font-size: 11px; font-weight: 600;
          cursor: pointer; font-family: "DM Sans", sans-serif; letter-spacing: 0.05em;
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease;
          animation: ctaBreathe 3.5s ease-in-out infinite; z-index: 0; margin-left: 8px;
        }
        .wall-cta .liq { position:absolute;inset:0;background:#E8543A;transform-origin:bottom center;transform:scaleY(0);transition:transform 0.38s cubic-bezier(.4,1.4,.6,1);border-radius:inherit;z-index:-1; }
        .wall-cta:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(232,84,58,0.28); }
        .wall-cta:hover .liq { transform:scaleY(1); }
        .wall-grain { position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.040'/%3E%3C/svg%3E");pointer-events:none;z-index:0; }
      `}</style>

      <div className="wall-grain" />
      <svg style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:4}} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M 22 22 L 22 46 M 22 22 L 46 22" fill="none" stroke="rgba(200,84,58,0.14)" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M 1418 22 L 1394 22 M 1418 22 L 1418 46" fill="none" stroke="rgba(200,84,58,0.14)" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M 22 878 L 22 854 M 22 878 L 46 878" fill="none" stroke="rgba(200,84,58,0.14)" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M 1418 878 L 1394 878 M 1418 878 L 1418 854" fill="none" stroke="rgba(200,84,58,0.14)" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>

      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:30,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 32px'}}>
        <Link to="/" style={{fontFamily:'"Playfair Display",serif',fontStyle:'italic',fontSize:'14px',color:'#0F0D0B',letterSpacing:'-0.01em',opacity:0.45,textDecoration:'none'}}>
          b<span style={{color:'#E8543A'}}>.</span>b<span style={{color:'#EDB846'}}>.</span>b
        </Link>
        <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
          <Link to="/wall"    className="wall-nav-link active">wall</Link>
          <Link to="/journal" className="wall-nav-link">journal</Link>
          <button ref={navBtnRef} className="wall-cta" onClick={e=>{burstConfetti(e.currentTarget);openModal('compose');}}>
            <span className="liq"/>
            <span style={{position:'relative',zIndex:1}}>+ leave a whisper</span>
          </button>
        </div>
      </nav>

      <div style={{paddingTop:'64px',position:'relative',zIndex:1}}>
        <WhisperWall />
      </div>

      <ComposeModal isOpen={activeModal==='compose'} onClose={closeModal} onSelectType={openModal}/>
      <LetterModal  isOpen={activeModal==='letter'}  onClose={closeModal}/>
      <PolaroidModal  isOpen={activeModal==='polaroid'}   onClose={closeModal}/>
      <TypewriterModal isOpen={activeModal==='typewriter'} onClose={closeModal}/>
      <CafeModal    isOpen={activeModal==='cafe'}    onClose={closeModal}/>
      <JournalModal isOpen={activeModal==='journal'} onClose={closeModal}/>
      <ActivityModal  isOpen={activeModal==='activity'}   onClose={closeModal} lockedMode="doing" />
      <ActivityModal  isOpen={activeModal==='movie'}      onClose={closeModal} lockedMode="movie" />
      <AdviceModal    isOpen={activeModal==='advice'}     onClose={closeModal} />
    </div>
  );
}