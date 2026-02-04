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
    <div className="flex flex-col gap-3 text-[#a9b7d4]/85">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
        <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-white/10 bg-black/20">
          <ClearableInput
            className="w-full"
            inputClassName="bg-transparent outline-none text-sm w-full placeholder:text-[#a9b7d4]/55"
            placeholder="Merchant Email"
            value={filterMerchantEmail}
            onChange={(e) => onFilterMerchantEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-white/10 bg-black/20">
          <ClearableInput
            className="w-full"
            inputClassName="bg-transparent outline-none text-sm w-full placeholder:text-[#a9b7d4]/55"
            placeholder="Merchant Name"
            value={filterMerchantName}
            onChange={(e) => onFilterMerchantName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 h-10 rounded-xl border border-white/10 bg-black/20">
          <ClearableInput
            className="w-full"
            inputClassName="bg-transparent outline-none text-sm w-full placeholder:text-[#a9b7d4]/55"
            placeholder="Merchant ID"
            value={filterMerchantId}
            onChange={(e) => onFilterMerchantId(e.target.value)}
          />
        </div>
        <div className="relative flex items-center gap-2 px-3 h-10 rounded-xl border border-white/10 bg-black/20">
          <select
            id="filterStatus"
            name="filterStatus"
            className="bg-transparent outline-none text-sm text-[#a9b7d4]/80 w-full pr-12"
            value={filterStatus}
            onChange={(e) => onFilterStatus(e.target.value)}
            aria-label="Status filter"
          >
            <option value="" className="bg-[#0b1220] text-[#eaf1ff]">All Status</option>
            <option value="active" className="bg-[#0b1220] text-[#eaf1ff]">Active</option>
            <option value="blocked" className="bg-[#0b1220] text-[#eaf1ff]">Blocked</option>
          </select>
          {filterStatus && (
            <button
              type="button"
              aria-label="Clear status filter"
              className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
              onClick={() => onFilterStatus('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="relative flex items-center gap-2 px-3 h-10 rounded-xl border border-white/10 bg-black/20">
          <select
            id="filterSettlementMode"
            name="filterSettlementMode"
            className="bg-transparent outline-none text-sm text-[#a9b7d4]/80 w-full pr-12"
            value={filterSettlementMode}
            onChange={(e) => onFilterSettlementMode(e.target.value)}
            aria-label="Settlement mode filter"
          >
            <option value="" className="bg-[#0b1220] text-[#eaf1ff]">Settlement: All</option>
            <option value="AUTO" className="bg-[#0b1220] text-[#eaf1ff]">Auto</option>
            <option value="MANUAL" className="bg-[#0b1220] text-[#eaf1ff]">Manual</option>
          </select>
          {filterSettlementMode && (
            <button
              type="button"
              aria-label="Clear settlement mode filter"
              className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
              onClick={() => onFilterSettlementMode('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="h-10 px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-sm font-medium w-full sm:w-auto"
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
          <tr className="text-left text-[#a9b7d4]/80">
            <th className="py-2 pr-3">Business</th>
            <th className="py-2 pr-3">Merchant ID</th>
            <th className="py-2 pr-3">Legal</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Admin</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-[#eaf1ff]">{merchants.length === 0 ? (
          <tr className="border-t border-white/10">
            <td className="py-3" colSpan={8}>
              No merchants found. Update your filters or create a new merchant.
            </td>
          </tr>
        ) : (
          merchants.map((m) => (
            <tr key={m.id} className="border-t border-white/10">
              <td className="py-2 pr-3">{m.business_name}</td>
              <td className="py-2 pr-3">{m.mid}</td>
              <td className="py-2 pr-3">{m.legal_name}</td>
              <td className="py-2 pr-3">{m.business_email}</td>
              <td className="py-2 pr-3">{m.admin_name}</td>
              <td className="py-2 pr-3">
                <StatusBadge status={m.status} />
              </td>
              <td className="py-2 pr-3 text-right">
                <button
                  className="h-8 px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs inline-flex items-center gap-1"
                  type="button"
                  onClick={(e) => onToggleActionMenu(e, m)}
                  aria-haspopup="menu"
                  aria-expanded={actionMenuId === m.id}
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

export function ActionMenu({ actionMenu, onView, onEdit }) {
  if (!actionMenu) return null
  return (
    <div
      className="fixed z-50 w-[140px] rounded-xl border border-white/10 bg-[#0b1220] shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden"
      style={{ top: actionMenu.top, left: actionMenu.left }}
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
    </div>
  )
}
