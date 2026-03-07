import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Home, Building2, Truck, DoorOpen, Info } from 'lucide-react';
import { useShippingStore } from '../../store/shippingStore.js';
import { useRates } from '../../hooks/useRates.js';

const BASE_WEIGHT = { RTA: 65, ASSEMBLED: 110 };
const SPECIAL_WEIGHTS = { lazySusan: 25, ventHood: 45, drawer: 20 };

const schema = z.object({
  cabinetCount: z.number({ coerce: true }).int().min(1, 'At least 1 cabinet').max(999, 'Maximum 999'),
  cabinetType: z.enum(['RTA', 'ASSEMBLED'], { required_error: 'Select cabinet type' }),
  hasLazySusan: z.boolean().default(false),
  lazySusanQty: z.number({ coerce: true }).int().min(0).default(0),
  hasVentHood: z.boolean().default(false),
  ventHoodQty: z.number({ coerce: true }).int().min(0).default(0),
  hasDrawers: z.boolean().default(false),
  drawerQty: z.number({ coerce: true }).int().min(0).default(0),
  deliveryLocationType: z.enum(['RESIDENTIAL', 'COMMERCIAL'], { required_error: 'Select delivery location' }),
  deliveryMethod: z.enum(['CURBSIDE', 'INSIDE_DELIVERY'], { required_error: 'Select delivery method' }),
  appointmentRequired: z.boolean().default(false),
  destinationZip: z.string().regex(/^\d{5}$/, 'Enter a valid 5-digit ZIP code'),
}).refine((data) => !data.hasLazySusan || data.lazySusanQty > 0, {
  message: 'Enter lazy susan quantity', path: ['lazySusanQty'],
}).refine((data) => !data.hasVentHood || data.ventHoodQty > 0, {
  message: 'Enter vent hood quantity', path: ['ventHoodQty'],
}).refine((data) => !data.hasDrawers || data.drawerQty > 0, {
  message: 'Enter drawer quantity', path: ['drawerQty'],
});

/**
 * Estimator form component — Step 1 of the checkout widget
 * Collects cabinet shipment details with validation and real-time weight estimate
 */
export default function EstimatorForm() {
  const { setFormData } = useShippingStore();
  const { fetchRates, loading, error } = useRates();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      cabinetCount: 1,
      cabinetType: 'RTA',
      hasLazySusan: false,
      lazySusanQty: 0,
      hasVentHood: false,
      ventHoodQty: 0,
      hasDrawers: false,
      drawerQty: 0,
      deliveryLocationType: 'RESIDENTIAL',
      deliveryMethod: 'CURBSIDE',
      appointmentRequired: false,
      destinationZip: '',
    },
  });

  const watchAll = watch();
  const estimatedWeight =
    (watchAll.cabinetCount || 0) * (BASE_WEIGHT[watchAll.cabinetType] || 65) +
    (watchAll.hasLazySusan ? (watchAll.lazySusanQty || 0) * SPECIAL_WEIGHTS.lazySusan : 0) +
    (watchAll.hasVentHood ? (watchAll.ventHoodQty || 0) * SPECIAL_WEIGHTS.ventHood : 0) +
    (watchAll.hasDrawers ? (watchAll.drawerQty || 0) * SPECIAL_WEIGHTS.drawer : 0);

  const onSubmit = (data) => {
    const payload = {
      ...data,
      originZip: '30301',
      sourceWebsite: window.__SHIPPING_PORTAL_SOURCE || 'CABINETS_DEALS',
    };
    setFormData(payload);
    fetchRates(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="estimator-form">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Shipping Rate Estimator</h2>
        <p className="text-sm text-gray-500 mt-1">Get instant LTL freight quotes for your cabinet order</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-input text-sm" data-testid="form-error">
          {error}
        </div>
      )}

      {/* Cabinet Count */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Cabinets</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-10 h-10 rounded-input border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
            onClick={() => setValue('cabinetCount', Math.max(1, (watchAll.cabinetCount || 1) - 1))}
            data-testid="cabinet-count-minus"
          >-</button>
          <input
            type="number"
            {...register('cabinetCount', { valueAsNumber: true })}
            className="w-20 h-10 text-center border border-gray-300 rounded-input focus:ring-2 focus:ring-primary focus:border-primary"
            data-testid="cabinet-count"
          />
          <button
            type="button"
            className="w-10 h-10 rounded-input border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
            onClick={() => setValue('cabinetCount', Math.min(999, (watchAll.cabinetCount || 1) + 1))}
            data-testid="cabinet-count-plus"
          >+</button>
        </div>
        {errors.cabinetCount && <p className="text-danger text-xs mt-1">{errors.cabinetCount.message}</p>}
        <p className="text-xs text-gray-500 mt-1" data-testid="weight-estimate">
          Estimated weight: <span className="font-medium">{estimatedWeight} lbs</span>
        </p>
      </div>

      {/* Cabinet Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cabinet Type</label>
        <div className="grid grid-cols-2 gap-3">
          {['RTA', 'ASSEMBLED'].map((type) => (
            <label
              key={type}
              className={`flex items-center justify-center gap-2 p-3 border-2 rounded-card cursor-pointer transition ${
                watchAll.cabinetType === type ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 hover:border-gray-300'
              }`}
              data-testid={`type-${type.toLowerCase()}`}
            >
              <input type="radio" value={type} {...register('cabinetType')} className="sr-only" />
              <Package size={18} />
              <span className="text-sm font-medium">{type === 'RTA' ? 'Ready to Assemble' : 'Pre-Assembled'}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          <Info size={12} />
          <span>RTA ships flat-packed (lighter). Assembled ships pre-built (heavier).</span>
        </div>
      </div>

      {/* Special Items */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Special Items</label>

        {[
          { key: 'lazySusan', label: 'Lazy Susan', field: 'hasLazySusan', qty: 'lazySusanQty' },
          { key: 'ventHood', label: 'Vent Hood', field: 'hasVentHood', qty: 'ventHoodQty' },
          { key: 'drawers', label: 'Extra Drawers', field: 'hasDrawers', qty: 'drawerQty' },
        ].map(({ key, label, field, qty }) => (
          <div key={key} className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register(field)}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                data-testid={`check-${key}`}
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
            {watchAll[field] && (
              <input
                type="number"
                {...register(qty, { valueAsNumber: true })}
                min={1}
                placeholder="Qty"
                className="w-20 h-8 text-center text-sm border border-gray-300 rounded-input focus:ring-2 focus:ring-primary"
                data-testid={`qty-${key}`}
              />
            )}
            {errors[qty] && <p className="text-danger text-xs">{errors[qty].message}</p>}
          </div>
        ))}
      </div>

      {/* Delivery Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location</label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex items-center justify-center gap-2 p-3 border-2 rounded-card cursor-pointer transition ${
              watchAll.deliveryLocationType === 'RESIDENTIAL' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 hover:border-gray-300'
            }`}
            data-testid="delivery-residential"
          >
            <input type="radio" value="RESIDENTIAL" {...register('deliveryLocationType')} className="sr-only" />
            <Home size={18} />
            <span className="text-sm font-medium">Residential</span>
          </label>
          <label
            className={`flex items-center justify-center gap-2 p-3 border-2 rounded-card cursor-pointer transition ${
              watchAll.deliveryLocationType === 'COMMERCIAL' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 hover:border-gray-300'
            }`}
            data-testid="delivery-commercial"
          >
            <input type="radio" value="COMMERCIAL" {...register('deliveryLocationType')} className="sr-only" />
            <Building2 size={18} />
            <span className="text-sm font-medium">Commercial</span>
          </label>
        </div>
      </div>

      {/* Delivery Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method</label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex items-center justify-center gap-2 p-3 border-2 rounded-card cursor-pointer transition ${
              watchAll.deliveryMethod === 'CURBSIDE' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 hover:border-gray-300'
            }`}
            data-testid="method-curbside"
          >
            <input type="radio" value="CURBSIDE" {...register('deliveryMethod')} className="sr-only" />
            <Truck size={18} />
            <span className="text-sm font-medium">Curbside</span>
          </label>
          <label
            className={`flex items-center justify-center gap-2 p-3 border-2 rounded-card cursor-pointer transition ${
              watchAll.deliveryMethod === 'INSIDE_DELIVERY' ? 'border-primary bg-blue-50 text-primary' : 'border-gray-200 hover:border-gray-300'
            }`}
            data-testid="method-inside"
          >
            <input type="radio" value="INSIDE_DELIVERY" {...register('deliveryMethod')} className="sr-only" />
            <DoorOpen size={18} />
            <span className="text-sm font-medium">Inside Delivery</span>
          </label>
        </div>
        {watchAll.deliveryMethod === 'INSIDE_DELIVERY' && (
          <p className="text-warning text-xs mt-1 flex items-center gap-1">
            <Info size={12} /> Inside delivery may incur additional surcharges
          </p>
        )}
      </div>

      {/* Appointment Required */}
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-card">
        <div>
          <span className="text-sm font-medium text-gray-700">Appointment Required?</span>
          {watchAll.appointmentRequired && (
            <p className="text-warning text-xs mt-0.5">Additional surcharge may apply</p>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" {...register('appointmentRequired')} className="sr-only peer" data-testid="appointment-toggle" />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/25 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-full"></div>
        </label>
      </div>

      {/* Destination ZIP */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destination ZIP Code</label>
        <input
          type="text"
          {...register('destinationZip')}
          maxLength={5}
          placeholder="e.g. 90210"
          className="w-full h-10 px-3 border border-gray-300 rounded-input focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          data-testid="destination-zip"
        />
        {errors.destinationZip && <p className="text-danger text-xs mt-1">{errors.destinationZip.message}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-primary text-white font-semibold rounded-input hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        data-testid="get-rates-btn"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Getting Rates...
          </>
        ) : (
          'Get Shipping Rates'
        )}
      </button>
    </form>
  );
}
