import { useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ListItemModal } from '@/components/modals/ListItemModal';
import { RequestRentalModal } from '@/components/modals/RequestRentalModal';
import { useListings } from '@/hooks/useListings';
import { useModal } from '@/hooks/useModal';
import { useAuth } from '@/context/AuthContext';
import type { EquipmentListing } from '@/types';

export function Layout() {
  const { listings, isLoading, isError, errorMessage, refetch, addNewListing } = useListings();
  const listItemModal = useModal<void>();
  const rentalModal = useModal<EquipmentListing>();
  const auth = useAuth();
  const navigate = useNavigate();

  const handleOpenRequestRentalModal = useCallback((listing: EquipmentListing) => {
    if (!auth.isAuthenticated) {
      auth.setPendingItemId(listing.id);
      auth.setIntendedPath(`/item/${listing.id}`);
      navigate('/signup');
      return;
    }
    rentalModal.open(listing);
  }, [auth, navigate, rentalModal]);

  const handleOpenListItemModal = useCallback(() => {
    if (!auth.isAuthenticated) {
      auth.setIntendedPath('/list-item');
      navigate('/signup');
      return;
    }
    listItemModal.open();
  }, [auth, navigate, listItemModal]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Navbar onOpenListItemModal={handleOpenListItemModal} />
      <main id="main-content" className="flex-1">
        <Outlet context={{ listings, isLoading, isError, errorMessage, refetch, onOpenRequestRentalModal: handleOpenRequestRentalModal, onOpenListItemModal: handleOpenListItemModal }} />
      </main>
      <Footer />

      {listItemModal.isOpen && (
        <ListItemModal
          onClose={listItemModal.close}
          onSubmit={addNewListing}
        />
      )}
      {rentalModal.isOpen && rentalModal.data && (
        <RequestRentalModal
          listing={rentalModal.data}
          equipmentId={rentalModal.data.id}
          onClose={rentalModal.close}
        />
      )}
    </div>
  );
}
