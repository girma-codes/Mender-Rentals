import { useCallback, useState } from 'react';

export interface UseModalReturn<T> {
  isOpen: boolean;
  data: T | null;
  open: (payload?: T) => void;
  close: () => void;
}

/**
 * Generic hook for managing modal open/close state with optional data payload.
 *
 * Usage:
 *   const listModal = useModal<void>();
 *   const rentalModal = useModal<EquipmentListing>();
 */
export function useModal<T = void>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((payload?: T) => {
    setData(payload ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return { isOpen, data, open, close };
}
