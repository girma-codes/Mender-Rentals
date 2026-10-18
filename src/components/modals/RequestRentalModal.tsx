import { Calendar, CheckCircle, Phone, User, X } from 'lucide-react';
import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import { Button } from '@/components/ui/Button';
// Legacy localStorage fallback — kept for reference
// import { addRentalRequest } from '@/services/storageService';
import { apiPost } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import type { EquipmentListing } from '@/types';
// import type { RentalRequest } from '@/types';
// import { generateId } from '@/types';

interface RequestRentalModalProps {
  listing: EquipmentListing;
  equipmentId: string;
  onClose: () => void;
}

interface FormFields {
  startDate: string;
  endDate: string;
  renterName: string;
  renterPhone: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

function validateForm(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.startDate) errors.startDate = 'Start date is required.';
  if (!fields.endDate) {
    errors.endDate = 'End date is required.';
  } else if (fields.startDate && fields.endDate < fields.startDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }
  if (!fields.renterName.trim()) errors.renterName = 'Your name is required.';
  if (!fields.renterPhone.trim()) {
    errors.renterPhone = 'Your phone number is required.';
  } else if (fields.renterPhone.trim().length < 9) {
    errors.renterPhone = 'Phone number must be at least 9 characters.';
  }

  return errors;
}

export function RequestRentalModal({ listing, equipmentId, onClose }: RequestRentalModalProps) {
  const auth = useAuth();

  const [fields, setFields] = useState<FormFields>({
    startDate: '',
    endDate: '',
    renterName: auth.user?.name ?? '',
    renterPhone: auth.user?.phone ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<string | null>(null);

  // Guard: only render the modal content for authenticated users
  if (!auth.isAuthenticated) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field on change
    if (errors[name as keyof FormFields]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setApiError(null);
    setIsSubmitting(true);
    try {
      const result = await apiPost<{ id: string; total_price: string }>('/api/rentals', {
        equipment_id: equipmentId,
        start_date: fields.startDate,
        end_date: fields.endDate,
        renter_name: fields.renterName,
        renter_phone: fields.renterPhone,
      });
      setTotalPrice(result.total_price);
      setSubmitted(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Request Rental</h2>
            <p className="text-sm text-neutral-400 mt-0.5 line-clamp-1">
              {listing.title}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Request Sent!</p>
              <p className="text-sm text-neutral-400 mt-1 max-w-xs">
                Your rental request for <span className="text-emerald-400">{listing.title}</span> has
                been submitted.{totalPrice ? ` Total: ETB ${Number(totalPrice).toLocaleString()}.` : ''}{' '}
                The owner will contact you at {fields.renterPhone}.
              </p>
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="startDate">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={fields.startDate}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 [color-scheme:dark]"
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-400">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="endDate">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={fields.endDate}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 [color-scheme:dark]"
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-400">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Renter name */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="renterName">
                <User className="inline h-3 w-3 mr-1" />
                Your Full Name
              </label>
              <input
                id="renterName"
                name="renterName"
                type="text"
                value={fields.renterName}
                onChange={handleChange}
                placeholder="e.g. Abebe Girma"
                className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
              {errors.renterName && (
                <p className="mt-1 text-xs text-red-400">{errors.renterName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="renterPhone">
                <Phone className="inline h-3 w-3 mr-1" />
                Phone Number
              </label>
              <input
                id="renterPhone"
                name="renterPhone"
                type="tel"
                value={fields.renterPhone}
                onChange={handleChange}
                placeholder="e.g. +251 91 234 5678"
                className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
              {errors.renterPhone && (
                <p className="mt-1 text-xs text-red-400">{errors.renterPhone}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
            {apiError && (
              <p className="mt-2 text-xs text-red-400 text-center" role="alert">{apiError}</p>
            )}
          </form>
        )}
      </div>
    </ModalOverlay>
  );
}
