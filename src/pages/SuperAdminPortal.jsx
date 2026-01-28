import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import { Card, Pill } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { MerchantsFilters, MerchantsTable, ActionMenu } from '../components/superadmin/SuperAdminMerchants'
import { DashboardSection } from '../components/superadmin/SuperAdminDashboard'
import { CreateMerchantForm } from '../components/superadmin/SuperAdminCreateMerchantForm'
import { DateRangeFilter, FilterBar } from '../components/merchant'
import { Sidebar } from '../components/ui/Sidebar'
import { Topbar } from '../components/ui/Topbar'
import { useHashRoute } from '../hooks/useHashRoute'
import { usePhoneInput } from '../hooks/usePhoneInput'
import { useMerchantStorage } from '../hooks/useMerchantStorage'
import { getPageMeta, SUPER_ADMIN_NAVIGATION, VIEW_KEY } from '../config/superAdminConfig'
import {
    AUDIT_LOG_COLUMNS,
    AUDIT_LOG_CSV_COLUMNS,
    INQUIRIES_ADMIN_COLUMNS,
    LIMIT_POLICY_COLUMNS,
    PAYMENT_COLUMNS,
    PAYMENT_METHOD_COLUMNS,
    REFUND_ADMIN_COLUMNS,
    SETTLEMENT_REPORT_COLUMNS,
    SUB_MERCHANT_ADMIN_COLUMNS,
    USERS_ADMIN_COLUMNS,
} from '../config/tableColumns'
import {
    adminInquiriesData,
    adminRefundsData,
    adminSubMerchantsData,
    adminUsersData,
    auditLogsData,
    limitPoliciesData,
    paymentGateways,
    paymentMethodRows,
    paymentsData,
    settlementReportsData,
} from '../data/merchantMockData'
import { getFilteredPhoneCountries } from '../utils/phoneCountryUtils'
import { withinDate } from '../utils/helpers'
import { exportDataToCSV } from '../utils/csvExport'
import { LogOut, Settings, User, X } from 'lucide-react'
import { ClearableInput } from '../components/ui/ClearableInput'
import { ClearableSelect } from '../components/ui/ClearableSelect'
import { ThemeMenu } from '../components/ui/ThemeMenu'
import {
    normalizePhoneDigits,
    validateMerchantFormData,
    prepareMerchantData,
    EMAIL_PATTERN,
    NAME_PATTERN,
    USERNAME_PATTERN,
    PASSWORD_PATTERN,
} from '../utils/merchantValidation'

export function SuperAdminPortal() {
    const navigate = useNavigate()
    const [page] = useHashRoute('page-dashboard')

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [editingMerchantId, setEditingMerchantId] = useState(null)
    const [actionMenu, setActionMenu] = useState(null)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const userMenuRef = useRef(null)

    // Filter State
    const [filterBusiness, setFilterBusiness] = useState('')
    const [filterLegal, setFilterLegal] = useState('')
    const [filterMerchantId, setFilterMerchantId] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    // Payments Filters
    const [payDatePreset, setPayDatePreset] = useState('all')
    const [payFrom, setPayFrom] = useState('')
    const [payTo, setPayTo] = useState('')
    const [payCustomOpen, setPayCustomOpen] = useState(false)
    const [payCustomFrom, setPayCustomFrom] = useState('')
    const [payCustomTo, setPayCustomTo] = useState('')
    const [payMerchant, setPayMerchant] = useState('')
    const [payOrderId, setPayOrderId] = useState('')
    const [payMethod, setPayMethod] = useState('')

    // Refunds Filters
    const [rfSearchPayment, setRfSearchPayment] = useState('')
    const [rfMerchant, setRfMerchant] = useState('')
    const [rfStatus, setRfStatus] = useState('')

    // Settlements Filters
    const [stDatePreset, setStDatePreset] = useState('all')
    const [stFrom, setStFrom] = useState('')
    const [stTo, setStTo] = useState('')
    const [stCustomOpen, setStCustomOpen] = useState(false)
    const [stCustomFrom, setStCustomFrom] = useState('')
    const [stCustomTo, setStCustomTo] = useState('')
    const [stMerchant, setStMerchant] = useState('')
    const [stPage, setStPage] = useState(1)
    const [stPageSize, setStPageSize] = useState(10)

    // Audit Logs Filters
    const [alEntity, setAlEntity] = useState('')
    const [alAction, setAlAction] = useState('')
    const [alPerformedBy, setAlPerformedBy] = useState('')
    const [alFrom, setAlFrom] = useState('')
    const [alTo, setAlTo] = useState('')
    const [alDatePreset, setAlDatePreset] = useState('all')
    const [alCustomOpen, setAlCustomOpen] = useState(false)
    const [alCustomFrom, setAlCustomFrom] = useState('')
    const [alCustomTo, setAlCustomTo] = useState('')
    const [limitMerchant, setLimitMerchant] = useState('')
    const [gatewayKey, setGatewayKey] = useState('easypaisa')
    const [pmPage, setPmPage] = useState(1)
    const [pmPageSize, setPmPageSize] = useState(5)
    const [subMerchantSearch, setSubMerchantSearch] = useState('')
    const [subMerchantStatus, setSubMerchantStatus] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [userRoleFilter, setUserRoleFilter] = useState('')
    const [userStatusFilter, setUserStatusFilter] = useState('')
    const [inqSearch, setInqSearch] = useState('')
    const [inqStatus, setInqStatus] = useState('')
    const [inqPriority, setInqPriority] = useState('')

    // Roles & Permissions (UI only)
    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([''])
    const [savedRoles, setSavedRoles] = useState([])
    const [editRoleOpen, setEditRoleOpen] = useState(false)
    const [editRoleId, setEditRoleId] = useState(null)
    const [editRoleName, setEditRoleName] = useState('')
    const [editPermissions, setEditPermissions] = useState([''])
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [deleteRoleId, setDeleteRoleId] = useState(null)
    const [deleteRoleName, setDeleteRoleName] = useState('')
    const [settingsTab, setSettingsTab] = useState('profile')
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [notifyRefunds, setNotifyRefunds] = useState(true)
    const [notifyPayouts, setNotifyPayouts] = useState(true)
    const [notifyRisk, setNotifyRisk] = useState(true)
    const [notifyLogin, setNotifyLogin] = useState(true)

    // Merchant Storage
    const { merchants, saveMerchant, updateMerchantStatus } = useMerchantStorage()
    const payments = paymentsData || []
    const refunds = adminRefundsData || []
    const auditLogs = auditLogsData || []
    const limitPolicies = limitPoliciesData || []
    const gateways = paymentGateways || []

    // Get editing merchant
    const editingMerchant = useMemo(
        () => merchants.find((m) => m.id === editingMerchantId) || null,
        [editingMerchantId, merchants]
    )

    // Phone Input Hook
    const phoneInput = usePhoneInput(editingMerchant?.business_phone)

    // Phone Country Filtering
    const filteredPhoneCountries = useMemo(
        () => getFilteredPhoneCountries(phoneInput.phoneCountryQuery),
        [phoneInput.phoneCountryQuery]
    )

    // Merchant Filtering
    const filteredMerchants = useMemo(() => {
        const business = (filterBusiness || '').trim().toLowerCase()
        const legal = (filterLegal || '').trim().toLowerCase()
        const merchantId = (filterMerchantId || '').trim().toLowerCase()
        const status = (filterStatus || '').trim().toLowerCase()

        if (!business && !legal && !merchantId && !status) return merchants

        return merchants.filter((merchant) => {
            if (business && !(merchant.business_name || '').toLowerCase().includes(business)) return false
            if (legal && !(merchant.legal_name || '').toLowerCase().includes(legal)) return false
            if (merchantId && !(merchant.mid || '').toLowerCase().includes(merchantId)) return false
            if (status && (merchant.status || 'active').toLowerCase() !== status) return false
            return true
        })
    }, [merchants, filterBusiness, filterLegal, filterMerchantId, filterStatus])

    const filteredPayments = useMemo(() => {
        const merchant = payMerchant.trim().toLowerCase()
        const orderId = payOrderId.trim().toLowerCase()
        const method = payMethod.trim().toLowerCase()
        return payments
            .filter((r) => withinDate(r.date, payFrom, payTo))
            .filter((r) => !merchant || (r.merchantName || '').toLowerCase().includes(merchant))
            .filter((r) => !orderId || String(r.orderId || '').toLowerCase().includes(orderId))
            .filter((r) => !method || (r.paymentMethod || '').toLowerCase().includes(method))
    }, [payments, payFrom, payTo, payMerchant, payOrderId, payMethod])

    const filteredRefunds = useMemo(() => {
        const p = rfSearchPayment.trim().toLowerCase()
        return refunds
            .filter((r) => !p || String(r.paymentId || '').toLowerCase().includes(p))
            .filter((r) => !rfMerchant || r.merchantName === rfMerchant)
            .filter((r) => !rfStatus || r.status === rfStatus)
    }, [refunds, rfSearchPayment, rfMerchant, rfStatus])

    const settlementReports = settlementReportsData || []
    const subMerchants = adminSubMerchantsData || []
    const adminUsers = adminUsersData || []
    const inquiries = adminInquiriesData || []

    const filteredSettlementReports = useMemo(() => {
        return settlementReports
            .filter((r) => withinDate(r.settlementDate, stFrom, stTo))
            .filter((r) => !stMerchant || r.merchantName === stMerchant)
    }, [settlementReports, stFrom, stTo, stMerchant])

    const filteredSubMerchants = useMemo(() => {
        const q = subMerchantSearch.trim().toLowerCase()
        return subMerchants
            .filter((r) => !subMerchantStatus || r.status === subMerchantStatus)
            .filter((r) => !q || `${r.branchCode || ''} ${r.branchName || ''}`.toLowerCase().includes(q))
    }, [subMerchants, subMerchantSearch, subMerchantStatus])

    const filteredAdminUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase()
        return adminUsers
            .filter((r) => !userRoleFilter || r.role === userRoleFilter)
            .filter((r) => !userStatusFilter || r.status === userStatusFilter)
            .filter((r) => !q || `${r.name || ''} ${r.email || ''}`.toLowerCase().includes(q))
    }, [adminUsers, userSearch, userRoleFilter, userStatusFilter])

    const filteredInquiries = useMemo(() => {
        const q = inqSearch.trim().toLowerCase()
        return inquiries
            .filter((r) => !inqStatus || r.status === inqStatus)
            .filter((r) => !inqPriority || r.priority === inqPriority)
            .filter((r) => !q || `${r.ticketId || ''} ${r.subject || ''}`.toLowerCase().includes(q))
    }, [inquiries, inqSearch, inqStatus, inqPriority])

    const stTotal = filteredSettlementReports.length
    const stTotalPages = Math.max(1, Math.ceil(stTotal / stPageSize))
    const stSafePage = Math.min(stPage, stTotalPages)
    const stStart = (stSafePage - 1) * stPageSize
    const stEnd = Math.min(stStart + stPageSize, stTotal)
    const pagedSettlementReports = filteredSettlementReports.slice(stStart, stEnd)

    const filteredAuditLogs = useMemo(() => {
        const p = alPerformedBy.trim().toLowerCase()
        return auditLogs
            .filter((r) => withinDate(r.createdAt, alFrom, alTo))
            .filter((r) => !alEntity || r.entityType === alEntity)
            .filter((r) => !alAction || r.action === alAction)
            .filter((r) => !p || String(r.performedBy || '').toLowerCase().includes(p))
    }, [auditLogs, alEntity, alAction, alPerformedBy, alFrom, alTo])

    const filteredLimitPolicies = useMemo(() => {
        return limitPolicies.filter((r) => !limitMerchant || r.merchant === limitMerchant)
    }, [limitPolicies, limitMerchant])

    const gatewayRows = paymentMethodRows?.[gatewayKey] || []
    const pmTotal = gatewayRows.length
    const pmTotalPages = Math.max(1, Math.ceil(pmTotal / pmPageSize))
    const pmSafePage = Math.min(pmPage, pmTotalPages)
    const pmStart = (pmSafePage - 1) * pmPageSize
    const pmEnd = Math.min(pmStart + pmPageSize, pmTotal)
    const pagedGatewayRows = gatewayRows.slice(pmStart, pmEnd)

    const toDateInput = (d) => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const getPresetRange = (preset) => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        if (preset === 'today') return { from: toDateInput(today), to: toDateInput(today) }
        if (preset === 'yesterday') {
            const y = new Date(today)
            y.setDate(y.getDate() - 1)
            return { from: toDateInput(y), to: toDateInput(y) }
        }
        if (preset === 'last7') {
            const from = new Date(today)
            from.setDate(from.getDate() - 6)
            return { from: toDateInput(from), to: toDateInput(today) }
        }
        if (preset === 'last30') {
            const from = new Date(today)
            from.setDate(from.getDate() - 29)
            return { from: toDateInput(from), to: toDateInput(today) }
        }
        if (preset === 'thisMonth') {
            const from = new Date(today.getFullYear(), today.getMonth(), 1)
            return { from: toDateInput(from), to: toDateInput(today) }
        }
        if (preset === 'lastMonth') {
            const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const to = new Date(today.getFullYear(), today.getMonth(), 0)
            return { from: toDateInput(from), to: toDateInput(to) }
        }
        return { from: '', to: '' }
    }

    // Page Metadata
    const { pageTitle, crumbs } = useMemo(() => {
        const m = getPageMeta(page)
        return { pageTitle: m.title, crumbs: m.crumbs }
    }, [page])

    // Action Menu Handlers
    const handleToggleActionMenu = (event, merchant) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setActionMenu((prev) =>
            prev && prev.id === merchant.id
                ? null
                : {
                    id: merchant.id,
                    mid: merchant.mid,
                    top: rect.bottom + 6,
                    left: Math.max(12, rect.right - 140),
                }
        )
    }

    const handleActionView = (merchantId) => {
        setActionMenu(null)
        localStorage.setItem(VIEW_KEY, merchantId)
        navigate('/merchant')
    }

    const handleActionEdit = (merchantId) => {
        setActionMenu(null)
        setEditingMerchantId(merchantId)
        goTo('page-create-merchant')
    }

    // Form Submission
    const handleCreateMerchantSubmit = (e) => {
        e.preventDefault()
        const formData = Object.fromEntries(new FormData(e.currentTarget).entries())

        // Validate phone
        const national = normalizePhoneDigits(phoneInput.phoneNational)
        if (phoneInput.phoneError) {
            phoneInput.setPhoneTouched(true)
            return
        }

        // Validate form
        const errors = validateMerchantFormData(formData, phoneInput.phoneError)
        if (errors.length > 0) {
            alert(errors.join('\n'))
            return
        }

        // Get phone number
        const phoneNumber = parsePhoneNumberFromString(national, phoneInput.selectedPhoneCountry)
        if (!phoneNumber) {
            alert('Invalid phone number')
            return
        }

        // Prepare and save merchant data
        const merchantData = prepareMerchantData(formData, phoneNumber, editingMerchant)
        saveMerchant(merchantData, editingMerchant)

        // Reset form
        setEditingMerchantId(null)
        alert('Merchant saved (UI only). Next: connect API + store in DB.')
        goTo('page-merchants')
        e.currentTarget.reset()
    }

    // Navigation
    const goTo = (next) => {
        window.location.hash = `#${next}`
    }

    const handleLogout = () => navigate('/')

    // Close action menu on scroll/resize
    useEffect(() => {
        if (!actionMenu) return
        const close = () => setActionMenu(null)
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)
        return () => {
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [actionMenu])

    useEffect(() => {
        if (!userMenuOpen) return
        const handleClick = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [userMenuOpen])

    // Load saved roles from localStorage
    useEffect(() => {
        const raw = localStorage.getItem('assanpay-roles')
        if (!raw) return
        try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) setSavedRoles(parsed)
        } catch {
            // ignore malformed localStorage data
        }
    }, [])

    // Persist roles to localStorage
    useEffect(() => {
        localStorage.setItem('assanpay-roles', JSON.stringify(savedRoles))
    }, [savedRoles])

    const hasValidRole = roleName.trim().length > 0
    const cleanedPermissions = useMemo(
        () => permissions.map((p) => p.trim()).filter(Boolean),
        [permissions]
    )
    const hasValidPermissions = cleanedPermissions.length > 0
    const canSaveRole = hasValidRole && hasValidPermissions

    const hasValidEditRole = editRoleName.trim().length > 0
    const cleanedEditPermissions = useMemo(
        () => editPermissions.map((p) => p.trim()).filter(Boolean),
        [editPermissions]
    )
    const hasValidEditPermissions = cleanedEditPermissions.length > 0
    const canUpdateRole = hasValidEditRole && hasValidEditPermissions

    const activeMenu = page === 'page-create-merchant' ? 'page-merchants' : page
    const backupCodes = ['A1B2-C3D4', 'E5F6-G7H8', 'I9J0-K1L2', 'M3N4-O5P6', 'Q7R8-S9T0']
    const activeSessions = [
        { id: 'sess-1', device: 'Chrome on Windows', ip: '103.21.56.10', location: 'Karachi, PK', lastSeen: '2 mins ago' },
        { id: 'sess-2', device: 'Firefox on Mac', ip: '58.65.12.44', location: 'Lahore, PK', lastSeen: '1 day ago' },
    ]

    return (
        <div className="min-h-screen bg-[#0b1220] text-[#eaf1ff]">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <button
                    aria-label="Close navigation"
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                activeMenu={activeMenu}
                sections={SUPER_ADMIN_NAVIGATION}
                brand={{ name: 'AssanPay', sub: 'Super Admin Portal (MVP)' }}
                onLogout={null}
                footer={
                    <>
                        <div className="text-sm font-semibold">Quick Tips</div>
                        <div className="mt-2 text-xs text-[#a9b7d4]/80 leading-relaxed">
                            Use Search to find <span className="text-[#eaf1ff]">Order ID</span> or{' '}
                            <span className="text-[#eaf1ff]">Provider Ref</span>.
                        </div>
                        <div className="mt-2 text-xs text-[#a9b7d4]/80">Block merchants/users only with proper approval.</div>
                    </>
                }
            />

            {/* Main Content */}
            <div className="lg:pl-[300px]">
                <Topbar
                    title={pageTitle}
                    crumbs={crumbs}
                    onToggle={() => setSidebarOpen(true)}
                    height="xl"
                    actions={
                        <>
                            <ThemeMenu />
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    className="h-10 w-10 rounded-full border border-white/10 bg-white/[0.04] grid place-items-center"
                                    type="button"
                                    onClick={() => setUserMenuOpen((open) => !open)}
                                    aria-label="Open user menu"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#4c9ffe] to-[#1f3b8a] grid place-items-center text-xs font-semibold">
                                        SA
                                    </div>
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#1f2435] shadow-card overflow-hidden">
                                        <div className="px-4 py-3 border-b border-white/10">
                                            <div className="text-sm font-semibold text-[#eaf1ff]">AssanPay Admin</div>
                                            <div className="text-xs text-[#a9b7d4]/80">Super Admin</div>
                                        </div>
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#eaf1ff] hover:bg-white/[0.06] transition"
                                            type="button"
                                            onClick={() => {
                                                setSettingsTab('profile')
                                                setUserMenuOpen(false)
                                                goTo('page-settings')
                                            }}
                                        >
                                            <User size={14} />
                                            Profile
                                        </button>
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#eaf1ff] hover:bg-white/[0.06] transition"
                                            type="button"
                                            onClick={() => {
                                                setSettingsTab('security')
                                                setUserMenuOpen(false)
                                                goTo('page-settings')
                                            }}
                                        >
                                            <Settings size={14} />
                                            Settings
                                        </button>
                                        <div className="border-t border-white/10" />
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#eaf1ff] hover:bg-white/[0.06] transition"
                                            type="button"
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={14} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    }
                />

                <main className="px-4 sm:px-6 py-5 sm:py-6 w-full">
                    {/* Dashboard */}
                    {page === 'page-dashboard' && <DashboardSection />}

                    {/* Merchants */}
                    {page === 'page-merchants' && (
                        <div className="space-y-4 w-full">
                            <Card title="Merchants" right={<Pill>Manage</Pill>}>
                                <MerchantsFilters
                                    filterBusiness={filterBusiness}
                                    filterLegal={filterLegal}
                                    filterMerchantId={filterMerchantId}
                                    filterStatus={filterStatus}
                                    onFilterBusiness={setFilterBusiness}
                                    onFilterLegal={setFilterLegal}
                                    onFilterMerchantId={setFilterMerchantId}
                                    onFilterStatus={setFilterStatus}
                                    onCreate={() => {
                                        setEditingMerchantId(null)
                                        goTo('page-create-merchant')
                                    }}
                                />

                                <MerchantsTable
                                    merchants={filteredMerchants}
                                    actionMenuId={actionMenu?.id}
                                    onToggleActionMenu={handleToggleActionMenu}
                                />
                            </Card>
                            <ActionMenu actionMenu={actionMenu} onView={handleActionView} onEdit={handleActionEdit} />
                        </div>
                    )}

                    {/* Payments */}
                    {page === 'page-payments' && (
                        <div className="space-y-4 w-full">
                            <Card title="Payments" right={<Pill>API</Pill>}>
                                <FilterBar>
                                    <div className="relative min-w-[180px]">
                                            <select
                                                className="h-9 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-14 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                value={payDatePreset}
                                                onChange={(e) => {
                                                    const next = e.target.value
                                                    setPayDatePreset(next)
                                                    if (next === 'custom') {
                                                    setPayCustomFrom(payFrom)
                                                    setPayCustomTo(payTo)
                                                    setPayCustomOpen(true)
                                                    return
                                                }
                                                const range = getPresetRange(next)
                                                setPayFrom(range.from)
                                                setPayTo(range.to)
                                            }}
                                        >
                                            <option value="all" className="bg-[#0b1220]">All Time</option>
                                            <option value="today" className="bg-[#0b1220]">Today</option>
                                            <option value="yesterday" className="bg-[#0b1220]">Yesterday</option>
                                            <option value="last7" className="bg-[#0b1220]">Last 7 days</option>
                                            <option value="last30" className="bg-[#0b1220]">Last 30 days</option>
                                            <option value="thisMonth" className="bg-[#0b1220]">This month</option>
                                            <option value="lastMonth" className="bg-[#0b1220]">Last month</option>
                                            <option value="custom" className="bg-[#0b1220]">Custom Date</option>
                                        </select>
                                        {payDatePreset !== 'all' && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear date filter"
                                                    className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => {
                                                        setPayDatePreset('all')
                                                        setPayFrom('')
                                                        setPayTo('')
                                                    }}
                                                >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <ClearableInput
                                        className="min-w-[180px]"
                                        inputClassName="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                        placeholder="Merchant Name"
                                        value={payMerchant}
                                        onChange={(e) => setPayMerchant(e.target.value)}
                                    />
                                    <ClearableInput
                                        className="min-w-[160px]"
                                        inputClassName="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                        placeholder="Order ID"
                                        value={payOrderId}
                                        onChange={(e) => setPayOrderId(e.target.value)}
                                    />
                                    <ClearableInput
                                        className="min-w-[170px]"
                                        inputClassName="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                        placeholder="Payment Method"
                                        value={payMethod}
                                        onChange={(e) => setPayMethod(e.target.value)}
                                    />
                                </FilterBar>
                                <DataTable columns={PAYMENT_COLUMNS} data={filteredPayments} keyField="orderId" />
                                {filteredPayments.length === 0 && (
                                    <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                        Empty for now. Data will come from the payments API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Refunds */}
                    {page === 'page-refunds' && (
                        <div className="space-y-4 w-full">
                            <Card title="Refunds" right={<Pill>API</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                            placeholder="Search By Payment ID"
                                            value={rfSearchPayment}
                                            onChange={(e) => setRfSearchPayment(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableSelect value={rfMerchant} onChange={setRfMerchant} className="min-w-[180px]">
                                            <option value="" className="bg-[#0b1220]">Filter by Merchant</option>
                                            {Array.from(new Set(refunds.map((r) => r.merchantName))).map((m) => (
                                                <option key={m} value={m} className="bg-[#0b1220]">{m}</option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableSelect value={rfStatus} onChange={setRfStatus} className="min-w-[160px]">
                                            <option value="" className="bg-[#0b1220]">Filter by Status</option>
                                            {Array.from(new Set(refunds.map((r) => r.status))).map((s) => (
                                                <option key={s} value={s} className="bg-[#0b1220]">{s}</option>
                                            ))}
                                        </ClearableSelect>
                                        <button
                                            className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                            type="button"
                                            onClick={() => alert('Export (UI demo).')}
                                        >
                                            Export
                                        </button>
                                    </div>
                                </FilterBar>
                                <DataTable columns={REFUND_ADMIN_COLUMNS} data={filteredRefunds} keyField="paymentId" />
                                {filteredRefunds.length === 0 && (
                                    <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                        Empty for now. Data will come from the refunds API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Settlements */}
                    {page === 'page-settlements' && (
                        <div className="space-y-4 w-full">
                            <Card title="Settlement Reports" right={<Pill>API</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableSelect value={stMerchant} onChange={setStMerchant} className="min-w-[180px]">
                                            <option value="" className="bg-[#0b1220]">Filter by Merchant</option>
                                            {Array.from(new Set(merchants.map((m) => m.business_name || m.legal_name).filter(Boolean))).map((name) => (
                                                <option key={name} value={name} className="bg-[#0b1220]">
                                                    {name}
                                                </option>
                                            ))}
                                        </ClearableSelect>
                                        <div className="relative min-w-[180px]">
                                            <select
                                                className="h-9 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-14 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                value={stDatePreset}
                                                onChange={(e) => {
                                                    const next = e.target.value
                                                    setStDatePreset(next)
                                                    if (next === 'custom') {
                                                        setStCustomFrom(stFrom)
                                                        setStCustomTo(stTo)
                                                        setStCustomOpen(true)
                                                        return
                                                    }
                                                    const range = getPresetRange(next)
                                                    setStFrom(range.from)
                                                    setStTo(range.to)
                                                }}
                                            >
                                                <option value="all" className="bg-[#0b1220]">All Time</option>
                                                <option value="today" className="bg-[#0b1220]">Today</option>
                                                <option value="yesterday" className="bg-[#0b1220]">Yesterday</option>
                                                <option value="last7" className="bg-[#0b1220]">Last 7 days</option>
                                                <option value="last30" className="bg-[#0b1220]">Last 30 days</option>
                                                <option value="thisMonth" className="bg-[#0b1220]">This month</option>
                                                <option value="lastMonth" className="bg-[#0b1220]">Last month</option>
                                                <option value="custom" className="bg-[#0b1220]">Custom Date</option>
                                            </select>
                                            {stDatePreset !== 'all' && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear settlement date filter"
                                                    className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => {
                                                        setStDatePreset('all')
                                                        setStFrom('')
                                                        setStTo('')
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={() => exportDataToCSV(filteredSettlementReports, SETTLEMENT_REPORT_COLUMNS, 'settlement-reports.csv')}
                                    >
                                        Export
                                    </button>
                                </FilterBar>
                                <DataTable columns={SETTLEMENT_REPORT_COLUMNS} data={pagedSettlementReports} keyField="merchantName" />
                                {filteredSettlementReports.length === 0 && (
                                    <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                        Empty for now. Data will come from the settlements API.
                                    </div>
                                )}
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#a9b7d4]/80">
                                    <div className="flex items-center gap-2">
                                        <span>Items per page:</span>
                                        <select
                                            className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-[#eaf1ff] outline-none"
                                            value={stPageSize}
                                            onChange={(e) => {
                                                setStPageSize(Number(e.target.value))
                                                setStPage(1)
                                            }}
                                        >
                                            <option className="bg-[#0b1220]" value={10}>10</option>
                                            <option className="bg-[#0b1220]" value={20}>20</option>
                                            <option className="bg-[#0b1220]" value={30}>30</option>
                                        </select>
                                    </div>
                                    <div>
                                        {stTotal === 0 ? '0-0 of 0' : `${stStart + 1}-${stEnd} of ${stTotal}`}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                            type="button"
                                            onClick={() => setStPage(Math.max(1, stSafePage - 1))}
                                            disabled={stSafePage <= 1}
                                        >
                                            ‹
                                        </button>
                                        <button
                                            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                            type="button"
                                            onClick={() => setStPage(Math.min(stTotalPages, stSafePage + 1))}
                                            disabled={stSafePage >= stTotalPages}
                                        >
                                            ›
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Audit Logs */}
                    {page === 'page-audit-logs' && (
                        <div className="space-y-4 w-full">
                            <Card title="Audit Logs" right={<Pill>API</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="relative min-w-[180px]">
                                            <select
                                                className="h-9 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-14 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                value={alDatePreset}
                                                onChange={(e) => {
                                                    const next = e.target.value
                                                    setAlDatePreset(next)
                                                    if (next === 'custom') {
                                                        setAlCustomFrom(alFrom)
                                                        setAlCustomTo(alTo)
                                                        setAlCustomOpen(true)
                                                        return
                                                    }
                                                    const range = getPresetRange(next)
                                                    setAlFrom(range.from)
                                                    setAlTo(range.to)
                                                }}
                                            >
                                                <option value="all" className="bg-[#0b1220]">All Time</option>
                                                <option value="today" className="bg-[#0b1220]">Today</option>
                                                <option value="yesterday" className="bg-[#0b1220]">Yesterday</option>
                                                <option value="last7" className="bg-[#0b1220]">Last 7 days</option>
                                                <option value="last30" className="bg-[#0b1220]">Last 30 days</option>
                                                <option value="thisMonth" className="bg-[#0b1220]">This month</option>
                                                <option value="lastMonth" className="bg-[#0b1220]">Last month</option>
                                                <option value="custom" className="bg-[#0b1220]">Custom Date</option>
                                            </select>
                                            {alDatePreset !== 'all' && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear audit date filter"
                                                    className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => {
                                                        setAlDatePreset('all')
                                                        setAlFrom('')
                                                        setAlTo('')
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <ClearableSelect value={alEntity} onChange={setAlEntity} className="min-w-[180px]">
                                            <option value="" className="bg-[#0b1220]">Entity Type</option>
                                            {Array.from(new Set(auditLogs.map((r) => r.entityType))).map((v) => (
                                                <option key={v} value={v} className="bg-[#0b1220]">{v}</option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableSelect value={alAction} onChange={setAlAction} className="min-w-[160px]">
                                            <option value="" className="bg-[#0b1220]">Action</option>
                                            {Array.from(new Set(auditLogs.map((r) => r.action))).map((v) => (
                                                <option key={v} value={v} className="bg-[#0b1220]">{v}</option>
                                            ))}
                                        </ClearableSelect>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                            placeholder="Performed by"
                                            value={alPerformedBy}
                                            onChange={(e) => setAlPerformedBy(e.target.value)}
                                        />
                                        <button
                                            className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                            type="button"
                                            onClick={() =>
                                                exportDataToCSV(filteredAuditLogs, AUDIT_LOG_CSV_COLUMNS, 'audit-logs.csv')
                                            }
                                        >
                                            Export
                                        </button>
                                    </div>
                                </FilterBar>
                                <DataTable columns={AUDIT_LOG_COLUMNS} data={filteredAuditLogs} keyField="createdAt" />
                                {filteredAuditLogs.length === 0 && (
                                    <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                        Empty for now. Data will come from the audit logs API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Limit Policies */}
                    {page === 'page-limits' && (
                        <div className="space-y-4 w-full">
                            <Card title="Limit Policy" right={<Pill>API</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableSelect value={limitMerchant} onChange={setLimitMerchant} className="min-w-[180px]">
                                            <option value="" className="bg-[#0b1220]">All Merchants</option>
                                            {Array.from(new Set(limitPolicies.map((r) => r.merchant))).map((m) => (
                                                <option key={m} value={m} className="bg-[#0b1220]">{m}</option>
                                            ))}
                                        </ClearableSelect>
                                    </div>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={() => alert('Fetch Policies (UI demo).')}
                                    >
                                        Fetch Policies
                                    </button>
                                </FilterBar>
                                <DataTable columns={LIMIT_POLICY_COLUMNS} data={filteredLimitPolicies} keyField="merchant" />
                                {filteredLimitPolicies.length === 0 && (
                                    <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                        Empty for now. Data will come from the limits API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Payment Methods */}
                    {page === 'page-payment-methods' && (
                        <div className="space-y-4 w-full">
                            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
                                <Card title="Payment Gateway" right={<Pill>Providers</Pill>}>
                                    <div className="space-y-1">
                                        {gateways.map((g) => (
                                            <button
                                                key={g.key}
                                                type="button"
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition ${
                                                    gatewayKey === g.key
                                                        ? 'border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] text-[#eaf1ff]'
                                                        : 'border-white/10 bg-white/[0.02] text-[#a9b7d4]'
                                                }`}
                                                onClick={() => setGatewayKey(g.key)}
                                            >
                                                <span>{g.label}</span>
                                                <span className="text-xs text-[#a9b7d4]/70">›</span>
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                <Card
                                    title={`${gateways.find((g) => g.key === gatewayKey)?.label || 'Gateway'} Merchant`}
                                    right={
                                        <button
                                            className="h-8 px-3 rounded-lg border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-xs font-semibold text-[#eaf1ff]"
                                            type="button"
                                            onClick={() => alert('Add New Merchant API (UI demo).')}
                                        >
                                            Add New Merchant API
                                        </button>
                                    }
                                >
                                    <DataTable columns={PAYMENT_METHOD_COLUMNS} data={pagedGatewayRows} keyField="id" />
                                    {gatewayRows.length === 0 && (
                                        <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                            No records yet for this gateway.
                                        </div>
                                    )}
                                    {gatewayRows.length > 0 && (
                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#a9b7d4]/80">
                                            <div className="flex items-center gap-2">
                                                <span>Items per page:</span>
                                                <select
                                                    className="h-8 rounded-lg border border-white/10 bg-black/20 px-2 text-xs text-[#eaf1ff] outline-none"
                                                    value={pmPageSize}
                                                    onChange={(e) => {
                                                        setPmPageSize(Number(e.target.value))
                                                        setPmPage(1)
                                                    }}
                                                >
                                                    <option className="bg-[#0b1220]" value={5}>5</option>
                                                    <option className="bg-[#0b1220]" value={10}>10</option>
                                                    <option className="bg-[#0b1220]" value={15}>15</option>
                                                </select>
                                            </div>
                                            <div>
                                                {pmStart + 1}-{pmEnd} of {pmTotal}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                                    type="button"
                                                    onClick={() => setPmPage(Math.max(1, pmSafePage - 1))}
                                                    disabled={pmSafePage <= 1}
                                                >
                                                    ‹
                                                </button>
                                                <button
                                                    className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                                    type="button"
                                                    onClick={() => setPmPage(Math.min(pmTotalPages, pmSafePage + 1))}
                                                    disabled={pmSafePage >= pmTotalPages}
                                                >
                                                    ›
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Create Merchant */}
                    {page === 'page-create-merchant' && (
                        <CreateMerchantForm
                            editingMerchant={editingMerchant}
                            patterns={{
                                EMAIL_PATTERN,
                                NAME_PATTERN,
                                USERNAME_PATTERN,
                                PASSWORD_PATTERN,
                            }}
                            phoneCountryOpen={phoneInput.phoneCountryOpen}
                            phoneCountryQuery={phoneInput.phoneCountryQuery}
                            filteredPhoneCountries={filteredPhoneCountries}
                            phoneError={phoneInput.phoneError}
                            phoneNational={phoneInput.phoneNational}
                            selectedPhoneCountry={phoneInput.selectedPhoneCountry}
                            onSubmit={handleCreateMerchantSubmit}
                            onCancel={() => {
                                setEditingMerchantId(null)
                                goTo('page-merchants')
                            }}
                            onToggleCountry={() => phoneInput.setPhoneCountryOpen((open) => !open)}
                            onSearchCountry={phoneInput.setPhoneCountryQuery}
                            onSelectCountry={(code) => {
                                phoneInput.setPhoneCountry(code)
                                phoneInput.setPhoneCountryOpen(false)
                                phoneInput.setPhoneCountryQuery('')
                            }}
                            onPhoneChange={(value) => {
                                const next = normalizePhoneDigits(value).slice(0, 15)
                                phoneInput.setPhoneTouched(true)
                                phoneInput.setPhoneNational(next)
                            }}
                            onPhoneBlur={() => {
                                phoneInput.setPhoneTouched(true)
                            }}
                        />
                    )}

                    {/* Settings */}
                    {page === 'page-settings' && (
                        <div className="space-y-4 w-full">
                            <Card title="Settings" right={<Pill>Personal</Pill>}>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        className={`h-9 px-4 rounded-xl border transition text-xs font-semibold ${
                                            settingsTab === 'profile'
                                                ? 'border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.14)] text-[#eaf1ff]'
                                                : 'border-white/10 bg-white/[0.04] text-[#a9b7d4]'
                                        }`}
                                        type="button"
                                        onClick={() => setSettingsTab('profile')}
                                    >
                                        Profile
                                    </button>
                                    <button
                                        className={`h-9 px-4 rounded-xl border transition text-xs font-semibold ${
                                            settingsTab === 'security'
                                                ? 'border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.14)] text-[#eaf1ff]'
                                                : 'border-white/10 bg-white/[0.04] text-[#a9b7d4]'
                                        }`}
                                        type="button"
                                        onClick={() => setSettingsTab('security')}
                                    >
                                        Security
                                    </button>
                                    <button
                                        className={`h-9 px-4 rounded-xl border transition text-xs font-semibold ${
                                            settingsTab === 'notifications'
                                                ? 'border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.14)] text-[#eaf1ff]'
                                                : 'border-white/10 bg-white/[0.04] text-[#a9b7d4]'
                                        }`}
                                        type="button"
                                        onClick={() => setSettingsTab('notifications')}
                                    >
                                        Notifications
                                    </button>
                                </div>

                                {settingsTab === 'profile' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="md:col-span-2 flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#4c9ffe] to-[#1f3b8a] grid place-items-center text-sm font-semibold">
                                                SA
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="text-sm font-semibold">Profile Photo</div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff]"
                                                        type="button"
                                                        onClick={() => alert('Upload photo (UI demo).')}
                                                    >
                                                        Upload
                                                    </button>
                                                    <button
                                                        className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff]"
                                                        type="button"
                                                        onClick={() => alert('Remove photo (UI demo).')}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm text-[#a9b7d4]/90">Full Name</label>
                                            <input
                                                className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                                                defaultValue="AssanPay Admin"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm text-[#a9b7d4]/90">Email</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    className="h-11 flex-1 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                                                    defaultValue="admin@assanpay.com"
                                                    type="email"
                                                />
                                                <span className="px-2 py-1 rounded-lg text-[10px] bg-green-500/20 text-green-200 border border-green-500/30">
                                                    Verified
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm text-[#a9b7d4]/90">Phone</label>
                                            <input
                                                className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                                                placeholder="+92 300 000 0000"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm text-[#a9b7d4]/90">Department</label>
                                            <input
                                                className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                                                placeholder="Compliance / Ops"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm text-[#a9b7d4]/90">Role</label>
                                            <input
                                                className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 text-[#a9b7d4]/80"
                                                defaultValue="Super Admin"
                                                readOnly
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm text-[#a9b7d4]/90">Timezone</label>
                                            <select className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff]">
                                                <option className="bg-[#0b1220]">Asia/Karachi</option>
                                                <option className="bg-[#0b1220]">UTC</option>
                                                <option className="bg-[#0b1220]">Asia/Dubai</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm text-[#a9b7d4]/90">Language</label>
                                            <select className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff]">
                                                <option className="bg-[#0b1220]">English</option>
                                                <option className="bg-[#0b1220]">Urdu</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm text-[#a9b7d4]/90">Country</label>
                                            <select className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 text-[#eaf1ff] outline-none focus:ring-2 focus:ring-[#5aa7ff]">
                                                <option className="bg-[#0b1220]">Pakistan</option>
                                                <option className="bg-[#0b1220]">UAE</option>
                                                <option className="bg-[#0b1220]">USA</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 flex justify-end">
                                            <button
                                                className="h-10 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                                type="button"
                                                onClick={() => alert('Profile saved (UI demo).')}
                                            >
                                                Save Profile
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'security' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                                            <div>
                                                <div className="text-sm font-semibold">Two-Factor Authentication</div>
                                                <div className="text-xs text-[#a9b7d4]/70">Add extra protection to your account.</div>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={twoFactorEnabled}
                                                className={`relative h-8 w-16 rounded-full border transition ${
                                                    twoFactorEnabled
                                                        ? 'border-green-400/60 bg-green-500/30'
                                                        : 'border-white/10 bg-white/[0.04]'
                                                }`}
                                                onClick={() => setTwoFactorEnabled((v) => !v)}
                                            >
                                                <span
                                                    className={`absolute top-1 h-6 w-6 rounded-full transition ${
                                                        twoFactorEnabled ? 'left-9 bg-green-200' : 'left-1 bg-white/80'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[#a9b7d4]/90">Current Password</label>
                                                <input
                                                    className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                                                    type="password"
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[#a9b7d4]/90">New Password</label>
                                                <input
                                                    className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                                                    type="password"
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[#a9b7d4]/90">Confirm New Password</label>
                                                <input
                                                    className="h-11 px-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:ring-2 focus:ring-[#5aa7ff]"
                                                    type="password"
                                                />
                                            </div>
                                            <div className="md:col-span-2 flex justify-between items-center">
                                                <button
                                                    className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff]"
                                                    type="button"
                                                    onClick={() => alert('Signed out other sessions (UI demo).')}
                                                >
                                                    Sign out other sessions
                                                </button>
                                                <button
                                                    className="h-10 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                                    type="button"
                                                    onClick={() => alert('Password updated (UI demo).')}
                                                >
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                            <div className="text-sm font-semibold mb-2">Backup Codes</div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-[#eaf1ff]">
                                                {backupCodes.map((code) => (
                                                    <div key={code} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                                                        {code}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff]"
                                                    type="button"
                                                    onClick={() => alert('New backup codes generated (UI demo).')}
                                                >
                                                    Regenerate Codes
                                                </button>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                            <div className="text-sm font-semibold mb-2">Active Sessions</div>
                                            <div className="space-y-2">
                                                {activeSessions.map((s) => (
                                                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                                        <div className="text-xs text-[#eaf1ff]">
                                                            <div className="font-semibold">{s.device}</div>
                                                            <div className="text-[#a9b7d4]/80">{s.ip} · {s.location} · {s.lastSeen}</div>
                                                        </div>
                                                        <button
                                                            className="h-8 px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff]"
                                                            type="button"
                                                            onClick={() => alert('Session signed out (UI demo).')}
                                                        >
                                                            Sign out
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'notifications' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { label: 'Refund Alerts', state: notifyRefunds, set: setNotifyRefunds },
                                            { label: 'Payout Alerts', state: notifyPayouts, set: setNotifyPayouts },
                                            { label: 'High-Risk Alerts', state: notifyRisk, set: setNotifyRisk },
                                            { label: 'Login Alerts', state: notifyLogin, set: setNotifyLogin },
                                        ].map((n) => (
                                            <div key={n.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                                                <div className="text-sm font-semibold">{n.label}</div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={n.state}
                                                    className={`relative h-7 w-14 rounded-full border transition ${
                                                        n.state ? 'border-green-400/60 bg-green-500/30' : 'border-white/10 bg-white/[0.04]'
                                                    }`}
                                                    onClick={() => n.set((v) => !v)}
                                                >
                                                    <span
                                                        className={`absolute top-1 h-5 w-5 rounded-full transition ${
                                                            n.state ? 'left-8 bg-green-200' : 'left-1 bg-white/80'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="md:col-span-2 flex justify-end">
                                            <button
                                                className="h-10 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                                type="button"
                                                onClick={() => alert('Notification settings saved (UI demo).')}
                                            >
                                                Save Preferences
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Roles & Permissions */}
                    {page === 'page-rbac' && (
                        <div className="space-y-4 w-full">
                            <Card title="Roles & Permissions" right={<Pill>RBAC</Pill>}>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-[#a9b7d4]/70 mb-2">Role</div>
                                        <input
                                            className="h-10 w-full max-w-[420px] rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                            placeholder="e.g. Super Admin"
                                            value={roleName}
                                            onChange={(e) => setRoleName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                    <div className="text-xs uppercase tracking-wider text-[#a9b7d4]/70 mb-2">Permissions</div>
                                    <div className="space-y-3">
                                        {permissions.map((perm, idx) => (
                                                <div key={`perm-${idx}`} className="flex flex-wrap items-center gap-2">
                                                    <input
                                                        className="h-10 flex-1 min-w-[220px] rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                        placeholder={`Permission ${idx + 1}`}
                                                        value={perm}
                                                        onChange={(e) => {
                                                            const next = [...permissions]
                                                            next[idx] = e.target.value
                                                            setPermissions(next)
                                                        }}
                                                    />
                                                    <button
                                                        className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm text-[#eaf1ff]"
                                                        type="button"
                                                        title="Add permission"
                                                        disabled={permissions.length >= 5}
                                                        onClick={() => {
                                                            if (permissions.length >= 5) return
                                                            setPermissions([...permissions, ''])
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm text-[#eaf1ff]"
                                                        type="button"
                                                        title="Remove permission"
                                                        disabled={permissions.length <= 1}
                                                        onClick={() => {
                                                            if (permissions.length <= 1) return
                                                            const next = permissions.filter((_, i) => i !== idx)
                                                            setPermissions(next)
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-xs text-[#a9b7d4]/70">Max 5 permissions</div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs font-medium text-[#eaf1ff]"
                                            type="button"
                                            onClick={() => {
                                                setRoleName('')
                                                setPermissions([''])
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className={`h-9 px-4 rounded-xl text-xs font-semibold text-white transition ${canSaveRole ? 'bg-[#3b82f6] hover:bg-[#2f6fd6]' : 'bg-white/10 cursor-not-allowed'}`}
                                            type="button"
                                            onClick={() => {
                                                if (!canSaveRole) return
                                                const nextRole = {
                                                    id: Date.now(),
                                                    role: roleName.trim(),
                                                    permissions: cleanedPermissions,
                                                }
                                                setSavedRoles((prev) => [...prev, nextRole])
                                                setRoleName('')
                                                setPermissions([''])
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {savedRoles.length > 0 && (
                                        <div className="pt-3 border-t border-white/10">
                                            <div className="text-xs uppercase tracking-wider text-[#a9b7d4]/70 mb-2">
                                                Saved Roles (Local)
                                            </div>
                                            <div className="space-y-2 text-sm text-[#eaf1ff]">
                                                {savedRoles.map((r) => (
                                                    <div key={r.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                                        <div>
                                                            <div className="font-semibold">{r.role}</div>
                                                            <div className="text-xs text-[#a9b7d4]/80">{r.permissions.join(', ')}</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                className="h-8 px-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff]"
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditRoleId(r.id)
                                                                    setEditRoleName(r.role)
                                                                    setEditPermissions(r.permissions.length ? r.permissions : [''])
                                                                    setEditRoleOpen(true)
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="h-8 px-3 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 transition text-xs text-red-200"
                                                                type="button"
                                                                onClick={() => {
                                                                    setDeleteRoleId(r.id)
                                                                    setDeleteRoleName(r.role)
                                                                    setDeleteConfirmOpen(true)
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Sub-Merchants */}
                    {page === 'page-submerchants' && (
                        <div className="space-y-4 w-full">
                            <Card title="Sub-Merchants" right={<Pill>API</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                            placeholder="Search Branch Code / Name"
                                            value={subMerchantSearch}
                                            onChange={(e) => setSubMerchantSearch(e.target.value)}
                                        />
                                        <ClearableSelect value={subMerchantStatus} onChange={setSubMerchantStatus} className="min-w-[160px]">
                                            <option value="" className="bg-[#0b1220]">Status: All</option>
                                        </ClearableSelect>
                                    </div>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={() => exportDataToCSV(filteredSubMerchants, SUB_MERCHANT_ADMIN_COLUMNS, 'sub-merchants.csv')}
                                    >
                                        Export
                                    </button>
                                </FilterBar>
                                <DataTable columns={SUB_MERCHANT_ADMIN_COLUMNS} data={filteredSubMerchants} keyField="branchCode" />
                                {filteredSubMerchants.length === 0 && (
                                    <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                        Empty for now. Data will come from the sub-merchants API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Users */}
                    {page === 'page-users' && (
                        <div className="space-y-4 w-full">
                            <Card title="Users" right={<Pill>API</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                            placeholder="Search name / email"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                        <ClearableSelect value={userRoleFilter} onChange={setUserRoleFilter} className="min-w-[160px]">
                                            <option value="" className="bg-[#0b1220]">Role: All</option>
                                        </ClearableSelect>
                                        <ClearableSelect value={userStatusFilter} onChange={setUserStatusFilter} className="min-w-[160px]">
                                            <option value="" className="bg-[#0b1220]">Status: All</option>
                                        </ClearableSelect>
                                    </div>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={() => exportDataToCSV(filteredAdminUsers, USERS_ADMIN_COLUMNS, 'users.csv')}
                                    >
                                        Export
                                    </button>
                                </FilterBar>
                                <DataTable columns={USERS_ADMIN_COLUMNS} data={filteredAdminUsers} keyField="email" />
                                {filteredAdminUsers.length === 0 && (
                                    <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                        Empty for now. Data will come from the users API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Inquiries */}
                    {page === 'page-inquiries' && (
                        <div className="space-y-4 w-full">
                            <Card title="Inquiries" right={<Pill>API</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                            placeholder="Search Ticket ID / Subject"
                                            value={inqSearch}
                                            onChange={(e) => setInqSearch(e.target.value)}
                                        />
                                        <ClearableSelect value={inqStatus} onChange={setInqStatus} className="min-w-[160px]">
                                            <option value="" className="bg-[#0b1220]">Status: All</option>
                                        </ClearableSelect>
                                        <ClearableSelect value={inqPriority} onChange={setInqPriority} className="min-w-[160px]">
                                            <option value="" className="bg-[#0b1220]">Priority: All</option>
                                        </ClearableSelect>
                                    </div>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={() => exportDataToCSV(filteredInquiries, INQUIRIES_ADMIN_COLUMNS, 'inquiries.csv')}
                                    >
                                        Export
                                    </button>
                                </FilterBar>
                                <DataTable columns={INQUIRIES_ADMIN_COLUMNS} data={filteredInquiries} keyField="ticketId" />
                                {filteredInquiries.length === 0 && (
                                    <div className="mt-3 text-sm text-[#a9b7d4]/80">
                                        Empty for now. Data will come from the inquiries API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {payCustomOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#2b2f45] p-6 text-[#eaf1ff] shadow-card">
                                <div className="text-lg font-semibold">Custom Date</div>
                                <div className="mt-5 space-y-4 text-sm text-[#a9b7d4]/85">
                                    <div>
                                        <div className="mb-2">Date Start</div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-16 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                type="date"
                                                value={payCustomFrom}
                                                onChange={(e) => setPayCustomFrom(e.target.value)}
                                            />
                                            {payCustomFrom && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear start date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => setPayCustomFrom('')}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-2">Date End</div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-16 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                type="date"
                                                value={payCustomTo}
                                                onChange={(e) => setPayCustomTo(e.target.value)}
                                            />
                                            {payCustomTo && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear end date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => setPayCustomTo('')}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                        type="button"
                                        onClick={() => {
                                            setPayCustomOpen(false)
                                            setPayDatePreset('all')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-white font-semibold"
                                        type="button"
                                        onClick={() => {
                                            setPayFrom(payCustomFrom)
                                            setPayTo(payCustomTo)
                                            setPayDatePreset('custom')
                                            setPayCustomOpen(false)
                                        }}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {stCustomOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#2b2f45] p-6 text-[#eaf1ff] shadow-card">
                                <div className="text-lg font-semibold">Custom Date</div>
                                <div className="mt-5 space-y-4 text-sm text-[#a9b7d4]/85">
                                    <div>
                                        <div className="mb-2">Date Start</div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-16 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                type="date"
                                                value={stCustomFrom}
                                                onChange={(e) => setStCustomFrom(e.target.value)}
                                            />
                                            {stCustomFrom && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear start date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => setStCustomFrom('')}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-2">Date End</div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-16 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                type="date"
                                                value={stCustomTo}
                                                onChange={(e) => setStCustomTo(e.target.value)}
                                            />
                                            {stCustomTo && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear end date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => setStCustomTo('')}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                        type="button"
                                        onClick={() => {
                                            setStCustomOpen(false)
                                            setStDatePreset('all')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-white font-semibold"
                                        type="button"
                                        onClick={() => {
                                            setStFrom(stCustomFrom)
                                            setStTo(stCustomTo)
                                            setStDatePreset('custom')
                                            setStCustomOpen(false)
                                        }}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {alCustomOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#2b2f45] p-6 text-[#eaf1ff] shadow-card">
                                <div className="text-lg font-semibold">Custom Date</div>
                                <div className="mt-5 space-y-4 text-sm text-[#a9b7d4]/85">
                                    <div>
                                        <div className="mb-2">Date Start</div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-12 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                type="date"
                                                value={alCustomFrom}
                                                onChange={(e) => setAlCustomFrom(e.target.value)}
                                            />
                                            {alCustomFrom && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear start date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => setAlCustomFrom('')}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-2">Date End</div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-12 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                type="date"
                                                value={alCustomTo}
                                                onChange={(e) => setAlCustomTo(e.target.value)}
                                            />
                                            {alCustomTo && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear end date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                                                    onClick={() => setAlCustomTo('')}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                        type="button"
                                        onClick={() => {
                                            setAlCustomOpen(false)
                                            setAlDatePreset('all')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2f6fd6] transition text-white font-semibold"
                                        type="button"
                                        onClick={() => {
                                            setAlFrom(alCustomFrom)
                                            setAlTo(alCustomTo)
                                            setAlDatePreset('custom')
                                            setAlCustomOpen(false)
                                        }}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {editRoleOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[560px] rounded-2xl border border-white/10 bg-[#2b2f45] p-6 text-[#eaf1ff] shadow-card">
                                <div className="text-lg font-semibold">Edit Role</div>
                                <div className="mt-5 space-y-4">
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-[#a9b7d4]/70 mb-2">Role</div>
                                        <input
                                            className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                            value={editRoleName}
                                            onChange={(e) => setEditRoleName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-[#a9b7d4]/70 mb-2">Permissions</div>
                                        <div className="space-y-3">
                                            {editPermissions.map((perm, idx) => (
                                                <div key={`edit-perm-${idx}`} className="flex flex-wrap items-center gap-2">
                                                    <input
                                                        className="h-10 flex-1 min-w-[220px] rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                                                        placeholder={`Permission ${idx + 1}`}
                                                        value={perm}
                                                        onChange={(e) => {
                                                            const next = [...editPermissions]
                                                            next[idx] = e.target.value
                                                            setEditPermissions(next)
                                                        }}
                                                    />
                                                    <button
                                                        className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm text-[#eaf1ff]"
                                                        type="button"
                                                        title="Add permission"
                                                        disabled={editPermissions.length >= 5}
                                                        onClick={() => {
                                                            if (editPermissions.length >= 5) return
                                                            setEditPermissions([...editPermissions, ''])
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-sm text-[#eaf1ff]"
                                                        type="button"
                                                        title="Remove permission"
                                                        disabled={editPermissions.length <= 1}
                                                        onClick={() => {
                                                            if (editPermissions.length <= 1) return
                                                            const next = editPermissions.filter((_, i) => i !== idx)
                                                            setEditPermissions(next)
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-xs text-[#a9b7d4]/70">Max 5 permissions</div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                        type="button"
                                        onClick={() => {
                                            setEditRoleOpen(false)
                                            setEditRoleId(null)
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={`h-9 px-4 rounded-xl text-white font-semibold transition ${canUpdateRole ? 'bg-[#3b82f6] hover:bg-[#2f6fd6]' : 'bg-white/10 cursor-not-allowed'}`}
                                        type="button"
                                        onClick={() => {
                                            if (!canUpdateRole || !editRoleId) return
                                            const nextRole = {
                                                id: editRoleId,
                                                role: editRoleName.trim(),
                                                permissions: cleanedEditPermissions,
                                            }
                                            setSavedRoles((prev) => prev.map((r) => (r.id === editRoleId ? nextRole : r)))
                                            setEditRoleOpen(false)
                                            setEditRoleId(null)
                                        }}
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {deleteConfirmOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[480px] rounded-2xl border border-red-500/20 bg-[#2b2f45] p-6 text-[#eaf1ff] shadow-card">
                                <div className="text-lg font-semibold">Delete Role</div>
                                <div className="mt-3 text-sm text-[#a9b7d4]/85">
                                    Are you sure you want to delete <span className="text-[#eaf1ff] font-semibold">{deleteRoleName}</span>?
                                    This action cannot be undone.
                                </div>
                                <div className="mt-6 flex justify-end gap-3 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                                        type="button"
                                        onClick={() => {
                                            setDeleteConfirmOpen(false)
                                            setDeleteRoleId(null)
                                            setDeleteRoleName('')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-red-500 hover:bg-red-600 transition text-white font-semibold"
                                        type="button"
                                        onClick={() => {
                                            if (!deleteRoleId) return
                                            setSavedRoles((prev) => prev.filter((r) => r.id !== deleteRoleId))
                                            setDeleteConfirmOpen(false)
                                            setDeleteRoleId(null)
                                            setDeleteRoleName('')
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default SuperAdminPortal
