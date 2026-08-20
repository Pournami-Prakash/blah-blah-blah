import { Link } from 'react-router-dom';
import BottomSheet from '../modals/BottomSheet';
import CityPosts from './CityPosts';
import type { Pin } from '../../types';

interface CityFeedProps { isOpen: boolean; onClose: () => void; pin: Pin | null; onOpenCompose: () => void }

export default function CityFeed({ isOpen, onClose, pin, onOpenCompose }: CityFeedProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="600px">
      <div style={{ padding: '20px 28px 34px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div><h2 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '24px', color: '#2A2420', margin: 0 }}>{pin?.city}</h2><p style={{ font: '10px "DM Mono", monospace', color: '#806D5D' }}>{pin?.count ?? 0} from here</p></div>
          <button onClick={() => { onClose(); onOpenCompose(); }} style={{ marginLeft: 'auto', background: '#2A2420', color: '#F7F3EE', border: 0, borderRadius: '999px', padding: '9px 14px', cursor: 'pointer' }}>+ add one</button>
        </div>
        {pin && <Link to={`/city/${encodeURIComponent(pin.city)}`} onClick={onClose} style={{ display: 'inline-block', marginBottom: '18px', color: '#C4563B', font: '10px "DM Mono", monospace' }}>open the full {pin.city} page →</Link>}
        {pin && <CityPosts city={pin.city} compact onCompose={() => { onClose(); onOpenCompose(); }} />}
      </div>
    </BottomSheet>
  );
}
