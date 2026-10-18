import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Image, MapPin, Tag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiPost } from '@/services/apiService';
import { Button } from '@/components/ui/Button';
import type { EquipmentListing } from '@/types';
import { ALL_CATEGORIES } from '@/types';

type ItemCategory = Exclude<EquipmentListing['category'], never>;

interface FormFields {
  title: string;
  category: ItemCategory | '';
  pricePerDay: string;
  description: string;
  location: string;
  neighborhood: string;
  condition: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

function validateForm(fields: FormFields): FormErrors {
  const errors: FormErrors = {};
  if (!fields.title.trim()) errors.title = 'Item name is required.';
  if (!fields.category) errors.category = 'Please select a category.';
  const price = Number(fields.pricePerDay);
  if (!fields.pricePerDay || isNaN(price) || price < 1) {
    errors.pricePerDay = 'Please enter a valid price (minimum 1 ETB).';
  }
  if (!fields.location.trim()) errors.location = 'Location is required.';
  return errors;
}

const ITEM_CATEGORIES = ALL_CATEGORIES.filter(c => c !== 'All') as ItemCategory[];
const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair'];

const inputClass =
  'w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200';

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
  created_at: string;
}

export function ListItemPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fields, setFields] = useState<FormFields>({
    title: '',
    category: '',
    pricePerDay: '',
    description: '',
    location: '',
    neighborhood: '',
    condition: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormFields]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
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
      await apiPost<ApiEquipmentRow>('/api/equipment', {
        title:         fields.title.trim(),
        category:      fields.category,
        description:   fields.description.trim() || undefined,
        price_per_day: Number(fields.pricePerDay),
        city:          fields.location.trim(),
        neighborhood:  fields.neighborhood.trim() || undefined,
        condition:     fields.condition.toLowerCase() || 'good',
        available:     true,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard?tab=equipment');
      }, 1500);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to list item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center py-20 px-4">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your item has been listed!</h2>
            <p className="text-neutral-400 mt-1 text-sm">Redirecting to your dashboard…</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8 space-y-1">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Share Your Gear
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">List Your Item</h1>
          <p className="text-neutral-400 text-sm">
            Share your equipment with the community and start earning from unused gear.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Item Name */}
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                <Tag className="inline h-3 w-3 mr-1" />
                Item Name <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={fields.category}
                  onChange={handleChange}
                  className={`${inputClass} [color-scheme:dark]`}
                >
                  <option value="">Select a category…</option>
                  {ITEM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category}</p>}
              </div>
              <div>
                <label
                  htmlFor="pricePerDay"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  Price per Day (ETB) <span className="text-red-400">*</span>
                </label>
                <input
                  id="pricePerDay"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="location"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  <MapPin className="inline h-3 w-3 mr-1" />
                  Location / City <span className="text-red-400">*</span>
                </label>
                <input
                  id="location"
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
                <label
                  htmlFor="neighborhood"
                  className="block text-xs font-medium text-neutral-300 mb-1.5"
                >
                  Neighborhood <span className="text-neutral-500">(optional)</span>
                </label>
                <input
                  id="neighborhood"
                  name="neighborhood"
                  type="text"
                  value={fields.neighborhood}
                  onChange={handleChange}
                  placeholder="e.g. Bole, Tabor"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label
                htmlFor="condition"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                Condition <span className="text-neutral-500">(optional)</span>
              </label>
              <select
                id="condition"
                name="condition"
                value={fields.condition}
                onChange={handleChange}
                className={`${inputClass} [color-scheme:dark]`}
              >
                <option value="">Select condition…</option>
                {CONDITION_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                Description <span className="text-neutral-500">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={fields.description}
                onChange={handleChange}
                placeholder="Describe the item, its condition, and any important details…"
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                <Image className="inline h-3 w-3 mr-1" />
                Photo <span className="text-neutral-500">(optional)</span>
              </label>
              {imageDataUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imageDataUrl} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageDataUrl(undefined);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    aria-label="Remove image"
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-neutral-700 bg-neutral-800/50 py-8 text-sm text-neutral-500 hover:border-emerald-500/40 hover:text-emerald-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

            {/* Listed by (read-only) */}
            <div className="rounded-xl bg-neutral-800/60 border border-neutral-700/50 px-4 py-3 flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                {auth.user?.avatarInitials ?? '?'}
              </div>
              <div>
                <p className="text-xs text-neutral-500">Listing as</p>
                <p className="text-sm font-medium text-white">{auth.user?.name ?? 'Unknown'}</p>
              </div>
            </div>

            {/* Submit */}
            {apiError && (
              <p className="text-xs text-red-400 text-center" role="alert">{apiError}</p>
            )}
            <Button type="submit" variant="primary" className="w-full py-3 text-base mt-2" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'List Equipment →'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
