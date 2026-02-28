import { useEffect, useMemo, useRef, useState } from 'react'
import { checkAdminUsernameAvailability } from '../../api/adminApi'
import { getPaymentMethodLogo } from '../../utils/paymentLogos'
export function CreateMerchantForm({
  editingMerchant,
  paymentMethods,
  patterns,
  merchantPermissions,
  permissionsError,
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
  const [adminUsername, setAdminUsername] = useState(
    editingMerchant?.username || ''
  )
  const [selectedMethods, setSelectedMethods] = useState(
    (editingMerchant?.payment_methods || []).map((m) => String(m))
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
  const [authMode, setAuthMode] = useState('HMAC_ONLY')
  const [ipWhitelistRows, setIpWhitelistRows] = useState([''])
  const [restrictedEnabled, setRestrictedEnabled] = useState(false)
  const [restrictedRoleName, setRestrictedRoleName] = useState('')
  const [restrictedPermissions, setRestrictedPermissions] = useState([])
  const [restrictedSearch, setRestrictedSearch] = useState('')
  const [usernameStatus, setUsernameStatus] = useState('idle')
  const [usernameSuggestions, setUsernameSuggestions] = useState([])
  const usernameRef = useRef(null)

  useEffect(() => {
    if (!editingMerchant) return
    setCommissionMode(editingMerchant.commission_mode || 'Single')
    setCommissionType(editingMerchant.commission_type || 'Percentage')
    setSelectedMethods((editingMerchant.payment_methods || []).map((m) => String(m)))
    setStatusValue(editingMerchant.status || 'active')
    setRefundCommission(Boolean(editingMerchant.refund_commission))
    setAutoSettlementPaused(Boolean(editingMerchant.auto_settlement_paused))
  }, [editingMerchant])

  useEffect(() => {
    if (editingMerchant) {
      setAuthMode('HMAC_ONLY')
      setIpWhitelistRows([''])
      setRestrictedEnabled(false)
      setRestrictedRoleName('')
      setRestrictedPermissions([])
      setRestrictedSearch('')
    }
  }, [editingMerchant])

  useEffect(() => {
    if (!restrictedEnabled) return
    const clean = String(adminUsername || '').trim()
    if (!clean) {
      setRestrictedRoleName('')
      return
    }
    setRestrictedRoleName(`MERCHANT_${clean}`)
  }, [restrictedEnabled, adminUsername])

  useEffect(() => {
    if (editingMerchant) return
    const clean = String(adminUsername || '').trim()
    if (!clean) {
      setUsernameStatus('idle')
      setUsernameSuggestions([])
      if (usernameRef.current) {
        usernameRef.current.setCustomValidity('')
      }
      return
    }
    setUsernameStatus('checking')
    const handle = setTimeout(async () => {
      try {
        const res = await checkAdminUsernameAvailability(clean)
        const available = Boolean(res?.available)
        const suggestions = Array.isArray(res?.suggestions) ? res.suggestions : []
        setUsernameStatus(available ? 'available' : 'taken')
        setUsernameSuggestions(available ? [] : suggestions)
        if (usernameRef.current) {
          usernameRef.current.setCustomValidity(available ? '' : 'Username already exists')
        }
      } catch {
        setUsernameStatus('idle')
        setUsernameSuggestions([])
        if (usernameRef.current) {
          usernameRef.current.setCustomValidity('')
        }
      }
    }, 450)
    return () => clearTimeout(handle)
  }, [adminUsername, editingMerchant])

  const toggleMethod = (key) => {
    setSelectedMethods((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  const updateWhitelistRow = (idx, value) => {
    setIpWhitelistRows((prev) => prev.map((row, i) => (i === idx ? value : row)))
  }

  const addWhitelistRow = () => {
    setIpWhitelistRows((prev) => [...prev, ''])
  }

  const removeWhitelistRow = (idx) => {
    setIpWhitelistRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const toggleRestrictedPermission = (perm) => {
    setRestrictedPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(perm)) {
        next.delete(perm)
      } else {
        next.add(perm)
      }
      return Array.from(next)
    })
  }

  const filteredMerchantPerms = Array.isArray(merchantPermissions)
    ? merchantPermissions.filter((perm) =>
      perm.toLowerCase().includes(restrictedSearch.trim().toLowerCase())
    )
    : []

  const commissionDefaults = editingMerchant?.payment_method_commissions || {}
  const limitDefaults = editingMerchant?.payment_method_limits || {}

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 bg-[var(--color-bg-primary)]/80 backdrop-blur-sm py-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">{editingMerchant ? 'Edit Merchant' : 'Create Merchant'}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]/80">
            {editingMerchant
              ? 'Update merchant details and access settings'
              : 'Register a new merchant and assign admin access'}
          </p>
        </div>
      </div>

      <form
        key={editingMerchant ? editingMerchant.id : 'new'}
        className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] shadow-[0_10px_40px_rgba(0,0,0,0.35)] p-4 sm:p-6"
        onSubmit={onSubmit}
        autoComplete="off"
      >
        <input type="hidden" name="auth_mode" value={authMode} />
        <input type="hidden" name="ip_whitelist_json" value={JSON.stringify(ipWhitelistRows)} />
        <div className="space-y-6">
          {/* Admin User (Create only) */}
          {!editingMerchant && (
            <div>
              <h3 className="text-base font-semibold">Merchant Admin User</h3>
              <p className="text-sm text-[var(--color-text-secondary)]/80">This user will manage the merchant account</p>

              <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-sm text-[var(--color-text-secondary)]/90">Admin Name *</label>
                  <input
                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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
                  <label className="text-sm text-[var(--color-text-secondary)]/90">Username *</label>
                  <input
                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    name="username"
                    type="text"
                    value={adminUsername}
                    placeholder="merchant_admin"
                    minLength={3}
                    maxLength={60}
                    pattern={patterns.USERNAME_PATTERN}
                    title="3-60 chars, letters/numbers and . _ @ -"
                    required
                    autoComplete="off"
                    onChange={(e) => setAdminUsername(e.target.value)}
                    ref={usernameRef}
                  />
                  {!editingMerchant && (
                    <div className="text-xs text-[var(--color-text-secondary)]/70 min-h-[16px]">
                      {usernameStatus === 'checking' && 'Checking username availability...'}
                      {usernameStatus === 'available' && 'Username is available.'}
                      {usernameStatus === 'taken' && 'Username already exists.'}
                    </div>
                  )}
                  {!editingMerchant && usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {usernameSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="rounded-full border border-[var(--color-border-soft)] bg-white/[0.06] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-white/[0.1]"
                          onClick={() => setAdminUsername(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm text-[var(--color-text-secondary)]/90">Email *</label>
                  <input
                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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
                  <label className="text-sm text-[var(--color-text-secondary)]/90">Temporary Password *</label>
                  <input
                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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

          {!editingMerchant && (
            <div className="border-t border-[var(--color-border-soft)] pt-5">
              <h3 className="text-base font-semibold">Restricted Permissions</h3>
              <p className="text-sm text-[var(--color-text-secondary)]/80">Assign a custom role to the merchant admin user</p>

              <div className="mt-4 grid gap-3 text-sm">
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]/90">
                  <input
                    type="checkbox"
                    checked={restrictedEnabled}
                    onChange={(e) => {
                      const next = e.target.checked
                      setRestrictedEnabled(next)
                      if (!next) {
                        setRestrictedRoleName('')
                        setRestrictedPermissions([''])
                      }
                    }}
                  />
                  Enable restricted role for this user
                </label>
                <input type="hidden" name="restricted_enabled" value={restrictedEnabled ? 'true' : 'false'} />

                {restrictedEnabled && (
                  <div className="grid gap-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                    <div className="grid gap-1.5">
                      <label className="text-sm text-[var(--color-text-secondary)]/90">Role Name *</label>
                      <input
                        className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                        name="restricted_role_name"
                        type="text"
                        value={restrictedRoleName}
                        placeholder="MERCHANT_CUSTOM"
                        minLength={2}
                        maxLength={64}
                        required={restrictedEnabled}
                        autoComplete="off"
                        disabled={restrictedEnabled}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-[var(--color-text-secondary)]/90">Permissions *</label>
                      <input
                        className="h-10 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                        type="text"
                        placeholder="Search permissions..."
                        value={restrictedSearch}
                        onChange={(e) => setRestrictedSearch(e.target.value)}
                        autoComplete="off"
                      />
                      {permissionsError && (
                        <div className="text-xs text-red-300">{permissionsError}</div>
                      )}
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-2">
                        {filteredMerchantPerms.length === 0 ? (
                          <div className="text-xs text-[var(--color-text-secondary)]/70 px-2 py-3">No permissions found.</div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {filteredMerchantPerms.map((perm) => (
                              <label key={perm} className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
                                <input
                                  type="checkbox"
                                  checked={restrictedPermissions.includes(perm)}
                                  onChange={() => toggleRestrictedPermission(perm)}
                                />
                                <span>{perm}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {restrictedPermissions.map((perm) => (
                        <input key={`perm-hidden-${perm}`} type="hidden" name="restricted_permissions" value={perm} />
                      ))}
                      <div className="text-xs text-[var(--color-text-secondary)]/70">Select at least one permission.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Merchant Details */}
          <div className="border-t border-[var(--color-border-soft)] pt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Merchant Details</h3>
                <p className="text-sm text-[var(--color-text-secondary)]/80">Basic business and legal information</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-1.5">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Business Name *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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
                <label className="text-sm text-[var(--color-text-secondary)]/90">Legal Name *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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
                <label className="text-sm text-[var(--color-text-secondary)]/90">Legal Email *</label>
                <input
                  className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  name="legal_email"
                  type="email"
                  defaultValue={editingMerchant ? editingMerchant.legal_email : ''}
                  placeholder="legal@merchant.com"
                  pattern={patterns.EMAIL_PATTERN}
                  title="Enter a valid email address"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          {/* Settlement & Commission */}
          <div className="border-t border-[var(--color-border-soft)] pt-5">
            <h3 className="text-base font-semibold">Settlement & Commission</h3>
            <p className="text-sm text-[var(--color-text-secondary)]/80">Define how payouts and fees work</p>

            <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-1.5">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Settlement Type *</label>
                <select
                  className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  name="settlement_type"
                  defaultValue={editingMerchant ? editingMerchant.settlement_type : 'Automatic'}
                  required
                >
                  <option value="Automatic" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Automatic</option>
                  <option value="Manual" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Manual</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Settlement Interval *</label>
                <select
                  className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  name="settlement_interval"
                  defaultValue={editingMerchant ? editingMerchant.settlement_interval : 'Daily'}
                  required
                >
                  <option value="T+1" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">T+1</option>
                  <option value="T+2" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">T+2</option>
                  <option value="5M" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">5 Min</option>
                  <option value="10M" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">10 Min</option>
                  <option value="30M" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">30 Min</option>
                  <option value="60M" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">60 Min</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Commission Mode *</label>
                <select
                  className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  name="commission_mode"
                  value={commissionMode}
                  onChange={(e) => setCommissionMode(e.target.value)}
                  required
                >
                  <option value="Single" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Single</option>
                  <option value="Double" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Double</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Commission Type *</label>
                <select
                  className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  name="commission_type"
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value)}
                  required
                >
                  <option value="Percentage" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Percentage</option>
                  <option value="Flat" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Flat</option>
                </select>
              </div>
              {commissionMode === 'Single' && (
                <div className="grid gap-1.5 md:col-span-2">
                  <label className="text-sm text-[var(--color-text-secondary)]/90">
                    Commission Value * {commissionType === 'Percentage' ? '(%)' : '(Amount)'}
                  </label>
                  <input
                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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


            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Payment Methods *</label>
                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-primary)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {methods.map((m) => {
                      const methodId = m.id ?? null
                      const methodKey = methodId != null ? String(methodId) : String(m.key ?? m.label)
                      const logo = getPaymentMethodLogo(m.label || m.key)
                      const initials = String(m.label || m.key || '?')
                        .trim()
                        .slice(0, 2)
                        .toUpperCase()
                      return (
                        <label key={methodKey} className="flex items-center gap-2 rounded-lg border border-[var(--color-border-soft)] bg-white/[0.02] px-3 py-2">
                          <input
                            type="checkbox"
                            name="payment_methods"
                            value={methodKey}
                            checked={selectedMethods.includes(methodKey)}
                            onChange={() => toggleMethod(methodKey)}
                            disabled={methodId == null}
                          />
                          {logo ? (
                            <img
                              src={logo}
                              alt={m.label || 'Payment logo'}
                              className="h-6 w-6 rounded-full bg-white object-contain p-1"
                              loading="lazy"
                            />
                          ) : (
                            <span className="h-6 w-6 rounded-full bg-white/10 text-[10px] text-[var(--color-text-primary)] grid place-items-center">
                              {initials}
                            </span>
                          )}
                          <span>{m.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]/70">
                  Select the providers you want to enable.
                </div>
              </div>

              {selectedMethods.length > 0 && (
                <div className="grid gap-2">
                  <label className="text-sm text-[var(--color-text-secondary)]/90">
                    {commissionMode === 'Double' ? 'Commission by Provider *' : 'Limits by Provider *'}
                  </label>
                  {selectedMethods.map((key) => {
                    const method = methods.find((m) => String(m.id ?? m.key ?? m.label) === key)
                    return (
                      <div key={key} className="grid gap-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]/80">{method ? method.label : key}</label>
                        {commissionMode === 'Double' && (
                          <input
                            className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
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
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="h-10 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                            name={`limit_daily_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="Daily limit"
                            defaultValue={limitDefaults[key]?.dailyLimit ?? ''}
                            min="0"
                            pattern={patterns.LIMIT_AMOUNT_PATTERN}
                            title="Enter amount with up to 2 decimals"
                            required
                          />
                          <input
                            className="h-10 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                            name={`limit_monthly_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="Monthly limit"
                            defaultValue={limitDefaults[key]?.monthlyLimit ?? ''}
                            min="0"
                            pattern={patterns.LIMIT_AMOUNT_PATTERN}
                            title="Enter amount with up to 2 decimals"
                            required
                          />
                          <input
                            className="h-10 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                            name={`limit_per_tx_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="Per transaction"
                            defaultValue={limitDefaults[key]?.perTransactionLimit ?? ''}
                            min="0"
                            pattern={patterns.LIMIT_AMOUNT_PATTERN}
                            title="Enter amount with up to 2 decimals"
                            required
                          />
                          <input
                            className="h-10 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                            name={`limit_min_${key}`}
                            type="number"
                            step="0.01"
                            placeholder="Min amount"
                            defaultValue={limitDefaults[key]?.minSingleAmount ?? ''}
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

          {/* Actions */}
          <div className="border-t border-[var(--color-border-soft)] pt-5">
            <h3 className="text-base font-semibold">Status & Controls</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="grid gap-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Refund Commission</label>
                <div className="flex items-center justify-between gap-3">
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

              <div className="grid gap-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Auto Settlement</label>
                <div className="flex items-center justify-between gap-3">
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

              <div className="grid gap-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                <label className="text-sm text-[var(--color-text-secondary)]/90">Merchant Status</label>
                <div className="flex items-center justify-between gap-3">
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

          {!editingMerchant && (
            <div className="border-t border-[var(--color-border-soft)] pt-5">
              <h3 className="text-base font-semibold">Authentication</h3>
              <p className="text-sm text-[var(--color-text-secondary)]/80">Choose how this merchant authenticates payment requests.</p>
              <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-sm text-[var(--color-text-secondary)]/90">Auth Mode *</label>
                  <select
                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    value={authMode}
                    onChange={(e) => setAuthMode(e.target.value)}
                    required
                  >
                    <option value="HMAC_ONLY" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">API Key + Secret</option>
                    <option value="IP_ONLY" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">IP Whitelist Only</option>
                    <option value="HMAC_PLUS_IP" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">API Key + Secret + IP</option>
                  </select>
                </div>
              </div>

              {(authMode === 'IP_ONLY' || authMode === 'HMAC_PLUS_IP') && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-[var(--color-text-secondary)]/90">IP Whitelist</div>
                      <div className="text-xs text-[var(--color-text-secondary)]/70">Add CIDR or single IP (e.g. 203.0.113.5/32).</div>
                    </div>
                    <button
                      type="button"
                      className="h-9 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs"
                      onClick={addWhitelistRow}
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ipWhitelistRows.map((row, idx) => (
                      <div key={`ip-whitelist-${idx}`} className="flex items-center gap-2">
                        <input
                          className="h-10 flex-1 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                          value={row}
                          onChange={(e) => updateWhitelistRow(idx, e.target.value)}
                          placeholder="127.0.0.1/32"
                          autoComplete="off"
                        />
                        {ipWhitelistRows.length > 1 && (
                          <button
                            type="button"
                            className="h-10 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs"
                            onClick={() => removeWhitelistRow(idx)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="border-t border-[var(--color-border-soft)] pt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              className="h-11 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-sm w-full sm:w-auto"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-sm font-medium w-full sm:w-auto"
            >
              {editingMerchant ? 'Save Changes' : 'Create Merchant'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
