import { useMemo, useState } from 'react'
import { PhoneField } from './SuperAdminPhoneField'

export function CreateMerchantForm({
  editingMerchant,
  patterns,
  phoneCountryOpen,
  phoneCountryQuery,
  filteredPhoneCountries,
  phoneError,
  phoneNational,
  selectedPhoneCountry,
  onSubmit,
  onCancel,
  onToggleCountry,
  onSearchCountry,
  onSelectCountry,
  onPhoneChange,
  onPhoneBlur,
}) {
  const paymentMethods = useMemo(
    () => [
      { key: 'jazzcash', label: 'JazzCash' },
      { key: 'easypaisa', label: 'EasyPaisa' },
      { key: 'upaisa', label: 'UPaisa' },
      { key: 'card', label: 'Card' },
    ],
    []
  )
  const [commissionMode, setCommissionMode] = useState(
    editingMerchant?.commission_mode || 'Single'
  )
  const [commissionType, setCommissionType] = useState(
    editingMerchant?.commission_type || 'Percentage'
  )
  const [selectedMethods, setSelectedMethods] = useState(
    editingMerchant?.payment_methods || []
  )
  const [statusValue, setStatusValue] = useState(
    editingMerchant?.status || 'active'
  )

  const toggleMethod = (key) => {
    setSelectedMethods((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">{editingMerchant ? 'Edit Merchant' : 'Create Merchant'}</h1>
          <p className="text-sm text-[#a9b7d4]/80">
            {editingMerchant
              ? 'Update merchant details and access settings'
              : 'Register a new merchant and assign admin access'}
          </p>
        </div>
        <button
          className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm w-full sm:w-auto"
          type="button"
          onClick={onCancel}
        >
          Back
        </button>
      </div>

      <form
        key={editingMerchant ? editingMerchant.id : 'new'}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_10px_40px_rgba(0,0,0,0.35)] p-4 sm:p-6"
        onSubmit={onSubmit}
      >
        <div className="space-y-6">
          {/* Admin User */}
          <div>
            <h3 className="text-base font-semibold">Merchant Admin User</h3>
            <p className="text-sm text-[#a9b7d4]/80">This user will manage the merchant account</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Admin Name *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="admin_name"
                  type="text"
                  defaultValue={editingMerchant ? editingMerchant.admin_name : ''}
                  placeholder="Ali Khan"
                  minLength={2}
                  maxLength={60}
                  pattern={patterns.NAME_PATTERN}
                  title="2-60 chars, letters/numbers/space .'- only"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Username *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="username"
                  type="text"
                  defaultValue={editingMerchant ? editingMerchant.username : ''}
                  placeholder="abc_admin"
                  minLength={3}
                  maxLength={30}
                  pattern={patterns.USERNAME_PATTERN}
                  title="3-30 chars, letters/numbers/underscore; must start with a letter"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Email *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="admin_email"
                  type="email"
                  defaultValue={editingMerchant ? editingMerchant.admin_email : ''}
                  placeholder="admin@abc.com"
                  pattern={patterns.EMAIL_PATTERN}
                  title="Enter a valid email address"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Temporary Password *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="password"
                  type="password"
                  placeholder="Auto / Manual"
                  minLength={8}
                  maxLength={64}
                  pattern={patterns.PASSWORD_PATTERN}
                  title="Min 8 chars with at least 1 letter and 1 number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Merchant Details */}
          <div className="border-t border-white/10 pt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Merchant Details</h3>
                <p className="text-sm text-[#a9b7d4]/80">Basic business and legal information</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Business Name *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="business_name"
                  type="text"
                  defaultValue={editingMerchant ? editingMerchant.business_name : ''}
                  placeholder="ABC Traders"
                  minLength={2}
                  maxLength={60}
                  pattern={patterns.NAME_PATTERN}
                  title="2-60 chars, letters/numbers/space .'- only"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Legal Name *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="legal_name"
                  type="text"
                  defaultValue={editingMerchant ? editingMerchant.legal_name : ''}
                  placeholder="ABC Traders Pvt Ltd"
                  minLength={2}
                  maxLength={60}
                  pattern={patterns.NAME_PATTERN}
                  title="2-60 chars, letters/numbers/space .'- only"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Business Email *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="business_email"
                  type="email"
                  defaultValue={editingMerchant ? editingMerchant.business_email : ''}
                  placeholder="contact@abc.com"
                  pattern={patterns.EMAIL_PATTERN}
                  title="Enter a valid email address"
                  required
                />
              </div>
              <PhoneField
                selectedPhoneCountry={selectedPhoneCountry}
                phoneCountryOpen={phoneCountryOpen}
                phoneCountryQuery={phoneCountryQuery}
                filteredPhoneCountries={filteredPhoneCountries}
                phoneError={phoneError}
                phoneNational={phoneNational}
                onToggleCountry={onToggleCountry}
                onSearchCountry={onSearchCountry}
                onSelectCountry={onSelectCountry}
                onPhoneChange={onPhoneChange}
                onPhoneBlur={onPhoneBlur}
              />
            </div>
          </div>

          {/* Settlement & Commission */}
          <div className="border-t border-white/10 pt-5">
            <h3 className="text-base font-semibold">Settlement & Commission</h3>
            <p className="text-sm text-[#a9b7d4]/80">Define how payouts and fees work</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Settlement Type *</label>
                <select
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="settlement_type"
                  defaultValue={editingMerchant ? editingMerchant.settlement_type : 'Automatic'}
                  required
                >
                  <option value="Automatic" className="bg-[#0b1220] text-[#eaf1ff]">Automatic</option>
                  <option value="Manual" className="bg-[#0b1220] text-[#eaf1ff]">Manual</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Settlement Interval *</label>
                <select
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="settlement_interval"
                  defaultValue={editingMerchant ? editingMerchant.settlement_interval : 'Daily'}
                  required
                >
                  <option value="Daily" className="bg-[#0b1220] text-[#eaf1ff]">Daily</option>
                  <option value="Weekly" className="bg-[#0b1220] text-[#eaf1ff]">Weekly</option>
                  <option value="Monthly" className="bg-[#0b1220] text-[#eaf1ff]">Monthly</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Commission Mode *</label>
                <select
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="commission_mode"
                  value={commissionMode}
                  onChange={(e) => setCommissionMode(e.target.value)}
                  required
                >
                  <option value="Single" className="bg-[#0b1220] text-[#eaf1ff]">Single</option>
                  <option value="Double" className="bg-[#0b1220] text-[#eaf1ff]">Double</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Commission Type *</label>
                <select
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="commission_type"
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value)}
                  required
                >
                  <option value="Percentage" className="bg-[#0b1220] text-[#eaf1ff]">Percentage</option>
                  <option value="Flat" className="bg-[#0b1220] text-[#eaf1ff]">Flat</option>
                </select>
              </div>
              {commissionMode === 'Single' && (
                <div className="grid gap-1.5">
                  <label className="text-sm text-[#a9b7d4]/90">
                    Commission Value * {commissionType === 'Percentage' ? '(%)' : '(Amount)'}
                  </label>
                  <input
                    className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                    name="commission_value"
                    type="number"
                    step="0.01"
                    defaultValue={editingMerchant ? editingMerchant.commission_value : ''}
                    placeholder="2.5"
                    min="0"
                    max={commissionType === 'Percentage' ? '1.0' : undefined}
                    required
                  />
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Payment Methods *</label>
                <div className={`rounded-xl border border-white/10 bg-black/20 p-3 space-y-2 text-sm text-[#eaf1ff] ${commissionMode === 'Single' ? 'opacity-60' : ''}`}>
                  {paymentMethods.map((m) => (
                    <label key={m.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="payment_methods"
                        value={m.key}
                        checked={selectedMethods.includes(m.key)}
                        disabled={commissionMode === 'Single'}
                        onChange={() => toggleMethod(m.key)}
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-[#a9b7d4]/70">
                  {commissionMode === 'Single'
                    ? 'Providers are auto-applied in Single mode.'
                    : 'Select the providers you want to enable.'}
                </div>
              </div>

              {commissionMode === 'Double' && (
                <div className="grid gap-2">
                  <label className="text-sm text-[#a9b7d4]/90">Commission by Provider *</label>
                  {selectedMethods.length === 0 && (
                    <div className="text-xs text-[#a9b7d4]/70">Select at least one payment method.</div>
                  )}
                  {selectedMethods.map((key) => {
                    const method = paymentMethods.find((m) => m.key === key)
                    return (
                      <div key={key} className="grid gap-1.5">
                        <label className="text-xs text-[#a9b7d4]/80">{method ? method.label : key}</label>
                        <input
                          className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                          name={`commission_${key}`}
                          type="number"
                          step="0.01"
                          placeholder="2.5"
                          min="0"
                          max={commissionType === 'Percentage' ? '1.0' : undefined}
                          required
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="border-t border-white/10 pt-5">
            <h3 className="text-base font-semibold">Status</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Merchant Status</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={statusValue === 'active'}
                    className={`relative h-8 w-16 rounded-full border transition ${
                      statusValue === 'active'
                        ? 'border-green-400/60 bg-green-500/30'
                        : 'border-red-400/60 bg-red-500/30'
                    }`}
                    onClick={() => setStatusValue(statusValue === 'active' ? 'blocked' : 'active')}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full transition ${
                        statusValue === 'active'
                          ? 'left-9 bg-green-200'
                          : 'left-1 bg-red-200'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-semibold ${
                      statusValue === 'active' ? 'text-green-200' : 'text-red-200'
                    }`}
                  >
                    {statusValue === 'active' ? 'Active' : 'Blocked'}
                  </span>
                </div>
                <input type="hidden" name="status" value={statusValue} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              className="h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm w-full sm:w-auto"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-sm font-medium w-full sm:w-auto"
            >
              {editingMerchant ? 'Save Changes' : 'Create Merchant'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
