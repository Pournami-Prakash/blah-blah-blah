import ComposeModal from './ComposeModal';
import PolaroidModal from './PolaroidModal';
import ThoughtComposer from './ThoughtComposer';
import RecommendationComposer from './RecommendationComposer';
import type { ModalType } from '../../hooks/useModal';

interface ComposeStackProps {
  activeModal: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

export default function ComposeStack({ activeModal, openModal, closeModal }: ComposeStackProps) {
  return (
    <>
      <ComposeModal isOpen={activeModal === 'compose'} onClose={closeModal} onSelectType={openModal} />
      <PolaroidModal isOpen={activeModal === 'polaroid'} onClose={closeModal} />
      <ThoughtComposer isOpen={activeModal === 'letter'} onClose={closeModal} style="letter" />
      <ThoughtComposer isOpen={activeModal === 'typewriter'} onClose={closeModal} style="typewriter" />
      <ThoughtComposer isOpen={activeModal === 'advice'} onClose={closeModal} style="advice" />
      <ThoughtComposer isOpen={activeModal === 'journal'} onClose={closeModal} style="journal" />
      <RecommendationComposer isOpen={activeModal === 'cafe'} onClose={closeModal} style="cafe" />
      <RecommendationComposer isOpen={activeModal === 'movie'} onClose={closeModal} style="movie" />
      <RecommendationComposer isOpen={activeModal === 'activity'} onClose={closeModal} style="activity" />
    </>
  );
}
