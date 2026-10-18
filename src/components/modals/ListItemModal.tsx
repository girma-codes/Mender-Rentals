import { CheckCircle, Image, MapPin, Tag, User, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { ModalOverlay } from '@/components/ui/ModalOverlay';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import type { EquipmentListing } from '@/types';
import { ALL_CATEGORIES } from '@/types';

interface ListItemModalProps {
  onClose: () => void;
  /** Called after successful API save so the parent can optimistically update its list. */
  onSubmit: (listing: EquipmentListing) => void;
}

type Category = EquipmentListing['category'];

interface FormFields {
  title: string;
  category: Category | '';
  pricePerDay: string;
  description: string;
  location: string;
  neighborhood: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

function validateForm(fields: FormFields): FormErrors {
  const errors: FormErrors = {};
  if (!fields.title.trim()) errors.title = 'Item title is required.';
  if (!fields.category) errors.category = 'Please select a category.';
  const price = Number(fields.pricePerDay);
  if (!fields.pricePerDay || isNaN(price) || price <= 0) {
    errors.pricePerDay = 'Please enter a valid price greater than 0.';
  }
  if (!fields.location.trim()) errors.location = 'Location is required.';
  return errors;
}

// Shape returned by POST /api/equipment
interface ApiEquipmentRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  price_per_day: string;
  city: string;
  neighborhood: string | null;
  available: boolean;
  owner_name?: string;
  created_at: string;
}

export function ListItemModal({ onClose, onSubmit }: ListItemModalProps) {
  const auth = useAuth();

  const [fields, setFields] = useState<FormFields>({
    title: '',
    category: '',
    pricePerDay: '',
    description: '',
    location: '',
    neighborhood: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormFields]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
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
      const row = await apiPost<ApiEquipmentRow>('/api/equipment', {
        title:         fields.title.trim(),
        category:      fields.category,
        description:   fields.description.trim() || undefined,
        price_per_day: Number(fields.pricePerDay),
        city:          fields.location.trim(),
        neighborhood:  fields.neighborhood.trim() || undefined,
        available:     true,
      });

      // Map DB row → EquipmentListing so the parent can update its list optimistically
      const listing: EquipmentListing = {
        id:          row.id,
        title:       row.title,
        category:    row.category as Exclude<Category, never>,
        pricePerDay: Number(row.price_per_day),
        description: row.description ?? undefined,
        ownerName:   auth.user?.name ?? '',
        location:    row.city,
        neighborhood: row.neighborhood ?? undefined,
        imageDataUrl,
        createdAt:   row.created_at,
      };

      onSubmit(listing);
      setSubmitted(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to list item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200';

  const ITEM_CATEGORIES = ALL_CATEGORIES.filter(c => c !== 'All') as Category[];

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">List Your Item</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Share your equipment with the community
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
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Item Listed!</p>
              <p className="text-sm text-neutral-400 mt-1 max-w-xs">
                Your equipment has been saved to the marketplace.
              </p>
            </div>
            <Button variant="secondary" onClick={onClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="li-title">
                <Tag className="inline h-3 w-3 mr-1" />
                Item Title <span className="text-red-400">*</span>
              </label>
              <input
                id="li-title"
                name="title"
                type="text"
                value={fields.title}
                onChange={handleChange}
                placeholder="e.g. Large Wedding Tent (10m × 20m)"
                className={inputClass}
              />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
            </div>

            {/* Category + Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="li-category">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="li-category"
                  name="category"
                  value={fields.category}
                  onChange={handleChange}
                  className={`${inputClass} [color-scheme:dark]`}
                >
                  <option value="">Select…</option>
                  {ITEM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="li-price">
                  Price / Day (ETB) <span className="text-red-400">*</span>
                </label>
                <input
                  id="li-price"
                  name="pricePerDay"
                  type="number"
                  min="1"
                  value={fields.pricePerDay}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className={inputClass}
                />
                {errors.pricePerDay && <p className="mt-1 text-xs text-red-400">{errors.pricePerDay}</p>}
              </div>
            </div>

            {/* Location + Neighborhood */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="li-location">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  Location / City <span className="text-red-400">*</span>
                </label>
                <input
                  id="li-location"
                  name="location"
                  type="text"
                  value={fields.location}
                  onChange={handleChange}
                  placeholder="e.g. Addis Ababa"
                  className={inputClass}
                />
                {errors.location && <p className="mt-1 text-xs text-red-400">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="li-neighborhood">
                  Neighborhood <span className="text-neutral-500">(optional)</span>
                </label>
                <input
                  id="li-neighborhood"
                  name="neighborhood"
                  type="text"
                  value={fields.neighborhood}
                  onChange={handleChange}
                  placeholder="e.g. Bole, Tabor"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Owner (read-only, from auth) */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                <User className="inline h-3 w-3 mr-1" />
                Listing as
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-neutral-800/60 border border-neutral-700/50 px-3 py-2.5">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {auth.user?.avatarInitials ?? '?'}
                </div>
                <span className="text-sm text-white">{auth.user?.name ?? 'Unknown'}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5" htmlFor="li-description">
                Description <span className="text-neutral-500">(optional)</span>
              </label>
              <textarea
                id="li-description"
                name="description"
                value={fields.description}
                onChange={handleChange}
                placeholder="Describe the item, condition, and any important details…"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                <Image className="inline h-3 w-3 mr-1" />
                Photo <span className="text-neutral-500">(optional)</span>
              </label>
              {imageDataUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imageDataUrl} alt="Preview" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageDataUrl(undefined);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    aria-label="Remove image"
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors duration-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-neutral-700 bg-neutral-800/50 py-6 text-sm text-neutral-500 hover:border-emerald-500/40 hover:text-emerald-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <Image className="mx-auto h-6 w-6 mb-2 opacity-50" />
                  Click to upload a photo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                aria-label="Upload equipment photo"
              />
            </div>

            {/* API error */}
            {apiError && (
              <p className="text-xs text-red-400 text-center" role="alert">{apiError}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'List Equipment'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ModalOverlay>
  );
}
