import { useEffect, useMemo, useState } from 'react'
export function CreateMerchantForm({
  editingMerchant,
  paymentMethods,
  patterns,
  onSubmit,
  onCancel,
}) {
  const fallbackMethods = useMemo(
    () => [
      { id: 1, key: 'jazzcash', label: 'JazzCash' },
      { id: 2, key: 'easypaisa', label: 'EasyPaisa' },
      { id: 3, key: 'upaisa', label: 'UPaisa' },
      { id: 4, key: 'card', label: 'Card' },
    ],
    []
  )
  const methods = Array.isArray(paymentMethods) && paymentMethods.length > 0
    ? paymentMethods
    : fallbackMethods
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
  const [refundCommission, setRefundCommission] = useState(
    Boolean(editingMerchant?.refund_commission)
  )
  const [autoSettlementPaused, setAutoSettlementPaused] = useState(
    Boolean(editingMerchant?.auto_settlement_paused)
  )

  useEffect(() => {
    if (!editingMerchant) return
    setCommissionMode(editingMerchant.commission_mode || 'Single')
    setCommissionType(editingMerchant.commission_type || 'Percentage')
    setSelectedMethods(editingMerchant.payment_methods || [])
    setStatusValue(editingMerchant.status || 'active')
    setRefundCommission(Boolean(editingMerchant.refund_commission))
    setAutoSettlementPaused(Boolean(editingMerchant.auto_settlement_paused))
  }, [editingMerchant])

  useEffect(() => {
    if (commissionMode !== 'Single') return
    const allKeys = methods.map((m) => String(m.id ?? m.key ?? m.label))
    if (allKeys.length === 0) return
    setSelectedMethods(allKeys)
  }, [commissionMode, methods])

  const toggleMethod = (key) => {
    setSelectedMethods((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  const commissionDefaults = editingMerchant?.payment_method_commissions || {}

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
        autoComplete="off"
      >
        <div className="space-y-6">
          {/* Admin User (Create only) */}
          {!editingMerchant && (
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
                    placeholder="Merchant Admin Name"
                    minLength={2}
                    maxLength={79}
                    pattern={patterns.NAME_PATTERN}
                    title="2-79 chars, letters/numbers/space .,'-&()/ only"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm text-[#a9b7d4]/90">Username *</label>
                  <input
                    className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                    name="username"
                    type="text"
                    defaultValue={editingMerchant ? editingMerchant.username : ''}
                    placeholder="merchant_admin"
                    minLength={3}
                    maxLength={60}
                    pattern={patterns.USERNAME_PATTERN}
                    title="3-60 chars, letters/numbers and . _ @ -"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm text-[#a9b7d4]/90">Email *</label>
                  <input
                    className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                    name="admin_email"
                    type="email"
                    defaultValue={editingMerchant ? editingMerchant.admin_email : ''}
                    placeholder="admin@merchant.com"
                    pattern={patterns.EMAIL_PATTERN}
                    title="Enter a valid email address"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm text-[#a9b7d4]/90">Temporary Password *</label>
                  <input
                    className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                    name="password"
                    type="password"
                    placeholder="Temporary password"
                    minLength={8}
                    maxLength={64}
                    pattern={patterns.PASSWORD_PATTERN}
                    title="Min 8 chars with at least 1 letter and 1 number"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          )}

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
                  maxLength={79}
                  pattern={patterns.NAME_PATTERN}
                  title="2-79 chars, letters/numbers/space .,'-&()/ only"
                  required
                  autoComplete="off"
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
                  maxLength={79}
                  pattern={patterns.NAME_PATTERN}
                  title="2-79 chars, letters/numbers/space .,'-&()/ only"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Business Email *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                  name="business_email"
                  type="email"
                  defaultValue={editingMerchant ? editingMerchant.business_email : ''}
                  placeholder="business@merchant.com"
                  pattern={patterns.EMAIL_PATTERN}
                  title="Enter a valid email address"
                  required
                  autoComplete="email"
                  disabled={Boolean(editingMerchant)}
                />
              </div>
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
                  <option value="T+1" className="bg-[#0b1220] text-[#eaf1ff]">T+1</option>
                  <option value="T+2" className="bg-[#0b1220] text-[#eaf1ff]">T+2</option>
                  <option value="5M" className="bg-[#0b1220] text-[#eaf1ff]">5 Min</option>
                  <option value="10M" className="bg-[#0b1220] text-[#eaf1ff]">10 Min</option>
                  <option value="30M" className="bg-[#0b1220] text-[#eaf1ff]">30 Min</option>
                  <option value="60M" className="bg-[#0b1220] text-[#eaf1ff]">60 Min</option>
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
                    max={commissionType === 'Percentage' ? '100' : undefined}
                    pattern={commissionType === 'Percentage' ? patterns.COMMISSION_PERCENT_PATTERN : patterns.COMMISSION_AMOUNT_PATTERN}
                    title={commissionType === 'Percentage'
                      ? 'Enter 0 to 100 with up to 2 decimals'
                      : 'Enter amount with up to 2 decimals'}
                    required
                  />
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Refund Commission</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={refundCommission}
                    className={`relative h-8 w-16 rounded-full border transition ${
                      refundCommission
                        ? 'border-green-400/60 bg-green-500/30'
                        : 'border-red-400/60 bg-red-500/30'
                    }`}
                    onClick={() => setRefundCommission((v) => !v)}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full transition ${
                        refundCommission ? 'left-9 bg-green-200' : 'left-1 bg-red-200'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-semibold ${
                      refundCommission ? 'text-green-200' : 'text-red-200'
                    }`}
                  >
                    {refundCommission ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <input type="hidden" name="refund_commission" value={refundCommission ? 'true' : 'false'} />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Auto Settlement Paused</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoSettlementPaused}
                    className={`relative h-8 w-16 rounded-full border transition ${
                      autoSettlementPaused
                        ? 'border-red-400/60 bg-red-500/30'
                        : 'border-green-400/60 bg-green-500/30'
                    }`}
                    onClick={() => setAutoSettlementPaused((v) => !v)}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full transition ${
                        autoSettlementPaused ? 'left-9 bg-red-200' : 'left-1 bg-green-200'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-semibold ${
                      autoSettlementPaused ? 'text-red-200' : 'text-green-200'
                    }`}
                  >
                    {autoSettlementPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
                <input type="hidden" name="auto_settlement_paused" value={autoSettlementPaused ? 'true' : 'false'} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm text-[#a9b7d4]/90">Payment Methods *</label>
                <div className={`rounded-xl border border-white/10 bg-black/20 p-3 space-y-2 text-sm text-[#eaf1ff] ${commissionMode === 'Single' ? 'opacity-60' : ''}`}>
                  {methods.map((m) => {
                    const methodKey = String(m.id ?? m.key ?? m.label)
                    return (
                      <label key={methodKey} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="payment_methods"
                          value={methodKey}
                          checked={selectedMethods.includes(methodKey)}
                          disabled={commissionMode === 'Single'}
                          onChange={() => toggleMethod(methodKey)}
                        />
                        <span>{m.label}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="text-xs text-[#a9b7d4]/70">
                  {commissionMode === 'Single'
                    ? 'Providers are auto-applied in Single mode.'
                    : 'Select the providers you want to enable.'}
                </div>
              </div>

              {selectedMethods.length > 0 && (
                <div className="grid gap-2">
                  <label className="text-sm text-[#a9b7d4]/90">Commission by Provider *</label>
                  {selectedMethods.map((key) => {
                    const method = methods.find((m) => String(m.id ?? m.key ?? m.label) === key)
                    return (
                      <div key={key} className="grid gap-1.5">
                        <label className="text-xs text-[#a9b7d4]/80">{method ? method.label : key}</label>
                        <input
                          className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                          name={`commission_${key}`}
                          type="number"
                          step="0.01"
                          placeholder="2.5"
                          defaultValue={commissionDefaults[key] ?? ''}
                          min="0"
                          max={commissionType === 'Percentage' ? '100' : undefined}
                          pattern={commissionType === 'Percentage' ? patterns.COMMISSION_PERCENT_PATTERN : patterns.COMMISSION_AMOUNT_PATTERN}
                          title={commissionType === 'Percentage'
                            ? 'Enter 0 to 100 with up to 2 decimals'
                            : 'Enter amount with up to 2 decimals'}
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="h-10 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                            name={`limit_daily_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="Daily limit"
                            min="0"
                            pattern={patterns.LIMIT_AMOUNT_PATTERN}
                            title="Enter amount with up to 2 decimals"
                            required
                          />
                          <input
                            className="h-10 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                            name={`limit_monthly_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="Monthly limit"
                            min="0"
                            pattern={patterns.LIMIT_AMOUNT_PATTERN}
                            title="Enter amount with up to 2 decimals"
                            required
                          />
                          <input
                            className="h-10 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                            name={`limit_per_tx_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="Per transaction"
                            min="0"
                            pattern={patterns.LIMIT_AMOUNT_PATTERN}
                            title="Enter amount with up to 2 decimals"
                            required
                          />
                          <input
                            className="h-10 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                            name={`limit_min_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="Min amount"
                            min="0"
                            pattern={patterns.LIMIT_AMOUNT_PATTERN}
                            title="Enter amount with up to 2 decimals"
                            required
                          />
                        </div>
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
