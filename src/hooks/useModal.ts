import { useState, useCallback } from 'react';
import type { PostType } from '../types';
import type { Pin } from '../types';

export type ModalType = 'compose' | 'advice' | 'movie' | PostType | 'cityFeed' | null;

export function useModal() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCity, setSelectedCity] = useState<Pin | null>(null);

  const openModal = useCallback((modal: ModalType) => setActiveModal(modal), []);
  const closeModal = useCallback(() => setActiveModal(null), []);
  const openCityFeed = useCallback((pin: Pin) => {
    setSelectedCity(pin);
    setActiveModal('cityFeed');
  }, []);

  return { activeModal, selectedCity, openModal, closeModal, openCityFeed };
}
