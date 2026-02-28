import { ChevronDown, X } from 'lucide-react'
import { ClearableInput } from '../ui/ClearableInput'
import { StatusBadge } from '../ui/StatusBadge'

export function MerchantsFilters({
  filterMerchantEmail,
  filterMerchantName,
  filterMerchantId,
  filterStatus,
  filterSettlementMode,
  onFilterMerchantEmail,
  onFilterMerchantName,
  onFilterMerchantId,
  onFilterStatus,
  onFilterSettlementMode,
  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 text-[var(--color-text-secondary)]/85">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
        <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
          <ClearableInput
            className="w-full"
            inputClassName="bg-transparent outline-none text-sm w-full placeholder:text-[var(--color-text-secondary)]/55"
            placeholder="Legal Email"
            value={filterMerchantEmail}
            onChange={(e) => onFilterMerchantEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
          <ClearableInput
            className="w-full"
            inputClassName="bg-transparent outline-none text-sm w-full placeholder:text-[var(--color-text-secondary)]/55"
            placeholder="Merchant Name"
            value={filterMerchantName}
            onChange={(e) => onFilterMerchantName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
          <ClearableInput
            className="w-full"
            inputClassName="bg-transparent outline-none text-sm w-full placeholder:text-[var(--color-text-secondary)]/55"
            placeholder="Merchant ID"
            value={filterMerchantId}
            onChange={(e) => onFilterMerchantId(e.target.value)}
          />
        </div>
        <div className="relative flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
          <select
            id="filterStatus"
            name="filterStatus"
            className="bg-transparent outline-none text-sm text-[var(--color-text-secondary)]/80 w-full pr-12"
            value={filterStatus}
            onChange={(e) => onFilterStatus(e.target.value)}
            aria-label="Status filter"
          >
            <option value="" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">All Status</option>
            <option value="active" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Active</option>
            <option value="blocked" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Blocked</option>
          </select>
          {filterStatus && (
            <button
              type="button"
              aria-label="Clear status filter"
              className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
              onClick={() => onFilterStatus('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="relative flex items-center gap-2 px-3 h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
          <select
            id="filterSettlementMode"
            name="filterSettlementMode"
            className="bg-transparent outline-none text-sm text-[var(--color-text-secondary)]/80 w-full pr-12"
            value={filterSettlementMode}
            onChange={(e) => onFilterSettlementMode(e.target.value)}
            aria-label="Settlement mode filter"
          >
            <option value="" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Settlement: All</option>
            <option value="AUTO" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Auto</option>
            <option value="MANUAL" className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">Manual</option>
          </select>
          {filterSettlementMode && (
            <button
              type="button"
              aria-label="Clear settlement mode filter"
              className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
              onClick={() => onFilterSettlementMode('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="h-10 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-sm font-medium w-full sm:w-auto"
          type="button"
          onClick={onCreate}
        >
          + Create Merchant
        </button>
      </div>
    </div>
  )
}

export function MerchantsTable({ merchants, actionMenuId, onToggleActionMenu }) {
  return (
    <div className="mt-4 overflow-x-auto overflow-y-visible">
      <table className="min-w-[720px] w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--color-text-secondary)]/80">
            <th className="py-2 pr-3">Business</th>
            <th className="py-2 pr-3">Merchant ID</th>
            <th className="py-2 pr-3">Legal</th>
            <th className="py-2 pr-3">Legal Email</th>
            <th className="py-2 pr-3">Environment</th>
            <th className="py-2 pr-3">Admin</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-[var(--color-text-primary)]">{merchants.length === 0 ? (
          <tr className="border-t border-[var(--color-border-soft)]">
            <td className="py-3" colSpan={9}>
              No merchants found. Update your filters or create a new merchant.
            </td>
          </tr>
        ) : (
          merchants.map((m) => (
            <tr key={m.id} className="border-t border-[var(--color-border-soft)]">
              <td className="py-2 pr-3">{m.business_name}</td>
              <td className="py-2 pr-3">{m.mid}</td>
              <td className="py-2 pr-3">{m.legal_name}</td>
              <td className="py-2 pr-3">{m.legal_email}</td>
              <td className="py-2 pr-3">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] border ${
                  String(m.environment || 'TEST').toUpperCase() === 'PROD'
                    ? 'border-[color-mix(in_srgb,var(--color-success)_35%,transparent)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
                    : 'border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]'
                }`}>
                  {String(m.environment || 'TEST').toUpperCase()}
                </span>
              </td>
              <td className="py-2 pr-3">{m.admin_name}</td>
              <td className="py-2 pr-3">
                <StatusBadge status={m.status} />
              </td>
              <td className="py-2 pr-3 text-right">
                <button
                  className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs inline-flex items-center gap-1"
                  type="button"
                  onClick={(e) => onToggleActionMenu(e, m)}
                  aria-haspopup="menu"
                  aria-expanded={actionMenuId === m.id}
                  data-merchant-actions-root
                >
                  Actions
                  <ChevronDown size={14} />
                </button>
              </td>
            </tr>
          ))
        )}</tbody>
      </table>
    </div>
  )
}

export function ActionMenu({ actionMenu, onView, onEdit, onRotate, onResetPreview, onResetExecute, onGoLive }) {
  if (!actionMenu) return null
  return (
    <div
      className="fixed z-50 w-[220px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-bg-primary)] shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden"
      style={{ top: actionMenu.top, left: actionMenu.left }}
      data-merchant-actions-root
    >
      <button
        className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition"
        type="button"
        onClick={() => onView(actionMenu.mid)}
      >
        View
      </button>
      <button
        className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition"
        type="button"
        onClick={() => onEdit(actionMenu.id)}
      >
        Edit
      </button>
      {onRotate && (
        <button
          className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition"
          type="button"
          onClick={() => onRotate(actionMenu.id)}
        >
          Rotate API Keys
        </button>
      )}
      {onResetPreview && (
        <button
          className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition"
          type="button"
          onClick={() => onResetPreview(actionMenu.id)}
        >
          Reset Test Data (Preview)
        </button>
      )}
      {onResetExecute && (
        <button
          className="w-full text-left px-3 py-2 text-xs text-[var(--color-warning)] hover:bg-white/[0.06] transition"
          type="button"
          onClick={() => onResetExecute(actionMenu.id)}
        >
          Reset Test Data (Execute)
        </button>
      )}
      {onGoLive && (
        <button
          className="w-full text-left px-3 py-2 text-xs text-[var(--color-success)] hover:bg-white/[0.06] transition"
          type="button"
          onClick={() => onGoLive(actionMenu.id)}
        >
          Go Live
        </button>
      )}
    </div>
  )
}
