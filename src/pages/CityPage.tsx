import { useParams } from 'react-router-dom';
import SharedNav from '../components/Nav/SharedNav';
import CityPosts from '../components/feed/CityPosts';
import ComposeStack from '../components/modals/ComposeStack';
import { useModal } from '../hooks/useModal';

export default function CityPage() {
  const { cityName = '' } = useParams();
  const city = decodeURIComponent(cityName);
  const { activeModal, openModal, closeModal } = useModal();

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <SharedNav onCompose={() => openModal('compose')} />
      <div style={{ padding: '108px clamp(20px,4vw,44px) 70px', maxWidth: '1180px', margin: '0 auto' }}>
        <header style={{ marginBottom: '28px' }}>
          <p style={{ font: '10px "DM Mono", monospace', color: '#8B725E', letterSpacing: '.13em', marginBottom: '6px' }}>whispers gathered around</p>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(30px,5vw,52px)', color: '#2A2420', margin: 0 }}>{city}.</h1>
        </header>
        <CityPosts city={city} onCompose={() => openModal('compose')} />
      </div>
      <ComposeStack activeModal={activeModal} openModal={openModal} closeModal={closeModal} />
    </main>
  );
}
