import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    DetailView,
    FilterBar,
    DateRangeFilter,
    StatusFilter,
    ShopFilter,
    SearchFilter,
    ExportButton,
} from '../components/merchant'
import { DataTable } from '../components/ui/DataTable'
import { Sidebar } from '../components/ui/Sidebar'
import { Topbar } from '../components/ui/Topbar'
import { ClearableSelect } from '../components/ui/ClearableSelect'
import { MERCHANT_NAVIGATION } from '../config/merchantConfig'
import { Search } from 'lucide-react'
import { ThemeMenu } from '../components/ui/ThemeMenu'
import { useHashRoute } from '../hooks/useHashRoute'
import { withinDate } from '../utils/helpers'
import { exportDataToCSV } from '../utils/csvExport'
import { getDetailContent } from '../utils/detailUtils'
import { getPageMeta } from '../config/pageConfig'
import { hasPermission } from '../utils/auth'
import { clearAuthToken } from '../utils/apiClient'
import { fetchMerchantPayments, fetchMerchantSubMerchants } from '../api/merchantApi'
import {
    COLLECTION_COLUMNS,
    COLLECTION_CSV_COLUMNS,
    REFUND_COLUMNS,
    REFUND_CSV_COLUMNS,
    SETTLEMENT_COLUMNS,
    SETTLEMENT_CSV_COLUMNS,
    SUB_MERCHANT_COLUMNS,
    USER_COLUMNS,
    USER_CSV_COLUMNS,
    REPORT_COLUMNS,
    REPORT_CSV_COLUMNS,
} from '../config/tableColumns'
import {
    refundsData,
    settlementsData,
    subMerchantsData,
    usersData,
    reportsData,
    SHOP_OPTIONS,
    COLLECTION_STATUS_OPTIONS,
    REFUND_STATUS_OPTIONS,
    SETTLEMENT_STATUS_OPTIONS,
    USER_ROLE_OPTIONS,
    USER_STATUS_OPTIONS,
    SUB_MERCHANT_STATUS_OPTIONS,
} from '../data/merchantMockData'

export function MerchantPortal() {
    const navigate = useNavigate()
    const [hash, setHash] = useHashRoute('dashboard')
    const canCreateUser = hasPermission('CREATE_USER')
    const [apiNotice, setApiNotice] = useState('')
    const [paymentsNotice, setPaymentsNotice] = useState('')

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Sub-Merchants filters
    const [subStatus, setSubStatus] = useState('')
    const [subSearch, setSubSearch] = useState('')

    // Collections filters
    const [colFrom, setColFrom] = useState('')
    const [colTo, setColTo] = useState('')
    const [colStatus, setColStatus] = useState('')
    const [colShop, setColShop] = useState('')
    const [colSearch, setColSearch] = useState('')

    // Refunds filters
    const [rfFrom, setRfFrom] = useState('')
    const [rfTo, setRfTo] = useState('')
    const [rfStatus, setRfStatus] = useState('')
    const [rfShop, setRfShop] = useState('')
    const [rfSearch, setRfSearch] = useState('')

    // Settlements filters
    const [stFrom, setStFrom] = useState('')
    const [stTo, setStTo] = useState('')
    const [stStatus, setStStatus] = useState('')
    const [stSearch, setStSearch] = useState('')

    // Users filters
    const [userRoleFilter, setUserRoleFilter] = useState('')
    const [userStatusFilter, setUserStatusFilter] = useState('')
    const [userSearch, setUserSearch] = useState('')

    // Reports controls
    const [repType, setRepType] = useState('Collections')
    const [repFrom, setRepFrom] = useState('')
    const [repTo, setRepTo] = useState('')

    // Detail state
    const [detailState, setDetailState] = useState({
        type: null,
        id: null,
        backHash: 'dashboard',
        record: null,
    })
    const [detailTab, setDetailTab] = useState('overview')

    // Page metadata
    const [pageMeta, setPageMeta] = useState({
        title: 'Dashboard',
        crumbs: 'Merchant / Overview',
        btnText: 'Create Sub-Merchant',
        btnHref: '#create-sub-merchant',
    })
    const showContextButton =
        pageMeta?.btnText &&
        pageMeta?.btnHref &&
        !(hash === 'users-roles' && !canCreateUser)

    // Filtered data
    const [merchantPayments, setMerchantPayments] = useState([])
    const latestCollections = useMemo(() => merchantPayments.slice(0, 8), [merchantPayments])

    const [subMerchants, setSubMerchants] = useState(subMerchantsData)

    useEffect(() => {
        let active = true

        const loadSubMerchants = async () => {
            try {
                const page = await fetchMerchantSubMerchants({ page: 0, size: 200 })
                const rows = Array.isArray(page?.content) ? page.content : []
                const mapped = rows.map((row) => ({
                    code: row.branchCode,
                    name: row.branchName,
                    status: row.blocked ? 'blocked' : 'active',
                    vol30: 0,
                    success: 0,
                    merchantName: row.merchantName,
                    createdAt: row.createdAt,
                }))
                if (active) {
                    setSubMerchants(mapped)
                }
            } catch {
                if (active) {
                    setApiNotice('API not reachable, showing demo data.')
                }
            }
        }

        loadSubMerchants()
        return () => {
            active = false
        }
    }, [])


    useEffect(() => {
        let active = true

        const loadPayments = async () => {
            try {
                const rawOrderId = colSearch.trim()
                const orderId = rawOrderId && /^\d+$/.test(rawOrderId) ? Number(rawOrderId) : undefined
                const page = await fetchMerchantPayments({
                    status: colStatus || undefined,
                    fromDate: colFrom || undefined,
                    toDate: colTo || undefined,
                    orderId,
                    page: 0,
                    size: 200,
                })
                const rows = Array.isArray(page?.content) ? page.content : []
                const mapped = rows.map((r) => {
                    const createdAt = r.createdAt ? new Date(r.createdAt) : null
                    return {
                        date: createdAt ? createdAt.toISOString().slice(0, 10) : '-',
                        time: createdAt ? createdAt.toLocaleTimeString() : '-',
                        orderId: r.orderId ?? '-',
                        shop:
                            r.subMerchantName ||
                            r.subMerchantBranchName ||
                            r.subMerchantBranchCode ||
                            r.branchCode ||
                            '-',
                        amount: r.amount ?? 0,
                        status: r.status || '-',
                        providerRef: r.providerRef || r.providerReference || '-',
                        _raw: r,
                    }
                })
                if (active) {
                    setMerchantPayments(mapped)
                    setPaymentsNotice('')
                }
            } catch {
                if (active) {
                    setMerchantPayments([])
                    setPaymentsNotice('Payments API not reachable, showing empty list.')
                }
            }
        }

        loadPayments()
        return () => {
            active = false
        }
    }, [colFrom, colTo, colStatus, colSearch])

    const filteredSubMerchants = useMemo(() => {
        const s = subSearch.toLowerCase()
        return subMerchants
            .filter((r) => !subStatus || r.status === subStatus)
            .filter((r) => !s || (r.code + ' ' + r.name).toLowerCase().includes(s))
    }, [subMerchants, subSearch, subStatus])

    const filteredCollections = useMemo(() => {
        const q = colSearch.toLowerCase()
        return merchantPayments
            .filter((r) => withinDate(r.date, colFrom, colTo))
            .filter((r) => !colStatus || r.status === colStatus)
            .filter((r) => !colShop || r.shop === colShop)
            .filter((r) => !q || (r.orderId + ' ' + r.providerRef).toLowerCase().includes(q))
    }, [merchantPayments, colFrom, colTo, colStatus, colShop, colSearch])

    const filteredRefunds = useMemo(() => {
        const q = rfSearch.toLowerCase()
        return refundsData
            .filter((r) => withinDate(r.date, rfFrom, rfTo))
            .filter((r) => !rfStatus || r.status === rfStatus)
            .filter((r) => !rfShop || r.shop === rfShop)
            .filter((r) => !q || (r.refundId + ' ' + r.orderId).toLowerCase().includes(q))
    }, [rfFrom, rfTo, rfStatus, rfShop, rfSearch])

    const filteredSettlements = useMemo(() => {
        const q = stSearch.toLowerCase()
        return settlementsData
            .filter((r) => withinDate(r.from, stFrom, stTo) || withinDate(r.to, stFrom, stTo))
            .filter((r) => !stStatus || r.status === stStatus)
            .filter((r) => !q || r.settlementId.toLowerCase().includes(q))
    }, [stFrom, stTo, stStatus, stSearch])

    const filteredUsers = useMemo(() => {
        const q = userSearch.toLowerCase()
        return usersData
            .filter((u) => !userRoleFilter || u.role === userRoleFilter)
            .filter((u) => !userStatusFilter || u.status === userStatusFilter)
            .filter((u) => !q || (u.name + ' ' + u.username).toLowerCase().includes(q))
    }, [userRoleFilter, userStatusFilter, userSearch])

    // Detail content
    const detailContent = useMemo(() => getDetailContent(detailState), [detailState])

    // Update page meta when hash changes
    useEffect(() => {
        setPageMeta(getPageMeta(hash, detailState.backHash))
    }, [hash, detailState.backHash])

    // Update active nav link
    useEffect(() => {
        const links = Array.from(document.querySelectorAll('.nav__link'))
        links.forEach((a) => a.classList.remove('is-active'))
        const active = document.querySelector(`.nav__link[href="#${hash}"]`)
        if (active) active.classList.add('is-active')
        setSidebarOpen(false)
    }, [hash])

    const handleOpenDetail = (type, id, backHash) => {
        const dataMap = {
            collection: merchantPayments,
            refund: refundsData,
            settlement: settlementsData,
            sub: subMerchants,
            report: reportsData,
            user: usersData,
        }
        const keyMap = {
            collection: 'orderId',
            refund: 'refundId',
            settlement: 'settlementId',
            sub: 'code',
            report: 'name',
            user: 'username',
        }

        const data = dataMap[type] || []
        const key = keyMap[type] || 'id'
        const record = data.find((x) => x[key] === id)

        setDetailState({ type, id, backHash: backHash || 'dashboard', record })
        setDetailTab('overview')
        setHash('detail')
    }

    const handleLogout = () => {
        clearAuthToken()
        navigate('/')
    }

    const handleGlobalSearchKey = (e) => {
        if (e.key === 'Enter') {
            // eslint-disable-next-line no-alert
            alert('Global search (UI demo). Connect API later.')
        }
    }

    return (
        <div className="flex min-h-screen bg-[#060b13] text-[#eaf1ff] font-sans">
            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <button
                    aria-label="Close navigation"
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden pointer-events-auto"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                activeMenu={hash}
                sections={MERCHANT_NAVIGATION}
                brand={{ name: 'Merchant Portal', sub: 'ABC Traders - Admin' }}
                onLogout={handleLogout}
                footer={
                    <div className="text-xs text-[#a9b7d4]/80 leading-relaxed">
                        <div><strong>Scoping Rule</strong></div>
                        <div className="mt-1">Merchant can only see their own data.</div>
                        <div className="mt-1">Shop operator can only see their shop.</div>
                    </div>
                }
            />

            <div className="flex-1 min-w-0 flex flex-col transition-all duration-300 lg:pl-[300px]">
                <main className="flex-1 flex flex-col">
                    <Topbar
                        title={pageMeta.title}
                        crumbs={pageMeta.crumbs}
                        onToggle={() => setSidebarOpen(true)}
                        actions={
                            <>
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a9b7d4]/50" size={14} aria-hidden="true" />
                                <input
                                    className="h-9 w-48 lg:w-64 rounded-xl border border-white/10 bg-black/20 pl-9 pr-4 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50 placeholder:text-[#a9b7d4]/40"
                                    id="globalSearch"
                                    placeholder="Search..."
                                    onKeyDown={handleGlobalSearchKey}
                                />
                            </div>
                            <ThemeMenu />
                            {showContextButton && (
                                <a
                                    className="flex h-9 items-center justify-center rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] px-3 sm:px-4 text-xs sm:text-[13px] font-bold text-[#eaf1ff] transition hover:bg-[rgba(90,167,255,0.25)]"
                                    href={pageMeta.btnHref}
                                    id="contextBtn"
                                >
                                    {pageMeta.btnText}
                                </a>
                            )}
                            </>
                        }
                    />

                    <section className="p-4 sm:p-6 lg:p-8 space-y-6">
                        {apiNotice && (
                            <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                                {apiNotice}
                            </div>
                        )}
                        {paymentsNotice && (
                            <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                                {paymentsNotice}
                            </div>
                        )}
                        {/* Dashboard Page */}
                        <div id="dashboard" className={hash === 'dashboard' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm transition hover:bg-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[13px] font-medium text-[#a9b7d4]/80 tracking-wide uppercase">Collections (Today)</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgba(47,208,122,0.12)] text-[#2fd07a] border-[rgba(47,208,122,0.25)]">
                                            <span className="w-1 h-1 rounded-full bg-[#2fd07a] mr-1.5" /> Live
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[#eaf1ff]">₨ 545,900</div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/5">Count: 684</span>
                                            <span className="text-[11px] font-medium text-[#2fd07a]">+6.2%</span>
                                        </div>
                                    </div>
                                </article>

                                <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm transition hover:bg-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[13px] font-medium text-[#a9b7d4]/80 tracking-wide uppercase">Success Rate</h3>
                                        <span className="text-[11px] text-[#a9b7d4]/60 px-2 py-0.5 rounded-lg border border-white/10 bg-white/[0.04]">30d</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[#eaf1ff]">96.4%</div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/5">Failed: 22</span>
                                            <span className="text-[11px] font-medium text-[#ffcc66]">Pending: 11</span>
                                        </div>
                                    </div>
                                </article>

                                <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm transition hover:bg-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[13px] font-medium text-[#a9b7d4]/80 tracking-wide uppercase">Refunds (Today)</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgba(255,204,102,0.12)] text-[#ffcc66] border-[rgba(255,204,102,0.25)]">
                                            <span className="w-1 h-1 rounded-full bg-[#ffcc66] mr-1.5" /> Review
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[#eaf1ff]">₨ 9,500</div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/5">Count: 4</span>
                                            <span className="text-[11px] font-medium text-[#ffcc66]">+0.4%</span>
                                        </div>
                                    </div>
                                </article>

                                <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm transition hover:bg-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[13px] font-medium text-[#a9b7d4]/80 tracking-wide uppercase">Pending Settlements</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgba(255,204,102,0.12)] text-[#ffcc66] border-[rgba(255,204,102,0.25)]">
                                            <span className="w-1 h-1 rounded-full bg-[#ffcc66] mr-1.5" /> Pending
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[#eaf1ff]">₨ 128,000</div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/5">Runs: 2</span>
                                            <span className="text-[11px] text-[#a9b7d4]/60">Weekly</span>
                                        </div>
                                    </div>
                                </article>
                            </div>

                            <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[#eaf1ff]">Recent Collections</h3>
                                    <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/10">Latest</span>
                                </div>
                                <div className="p-4">
                                    <DataTable
                                        columns={COLLECTION_COLUMNS}
                                        data={latestCollections}
                                        keyField="orderId"
                                        renderActions={(r) => (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff] font-medium"
                                                type="button"
                                                onClick={() => handleOpenDetail('collection', r.orderId, 'dashboard')}
                                            >
                                                View
                                            </button>
                                        )}
                                    />
                                </div>
                            </article>
                        </div>

                        {/* Sub-Merchants Page */}
                        <div
                            id="sub-merchants"
                            className={hash === 'sub-merchants' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}
                        >
                            <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[#eaf1ff]">Sub-Merchants (Shops / Collection Points)</h3>
                                    <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/10">Total: 3</span>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        <StatusFilter value={subStatus} onChange={setSubStatus} options={SUB_MERCHANT_STATUS_OPTIONS} />
                                        <SearchFilter
                                            value={subSearch}
                                            onChange={setSubSearch}
                                            placeholder="Search Branch Code / Name"
                                        />
                                        <a className="h-9 px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-xs font-medium text-[#eaf1ff]" href="#create-sub-merchant">
                                            + Create Sub-Merchant
                                        </a>
                                    </FilterBar>

                                    <DataTable
                                        columns={SUB_MERCHANT_COLUMNS}
                                        data={filteredSubMerchants}
                                        keyField="code"
                                        renderActions={(r) => (
                                            <>
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff] font-medium"
                                                    type="button"
                                                    onClick={() => handleOpenDetail('sub', r.code, 'sub-merchants')}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-[rgba(255,90,122,0.35)] bg-[rgba(255,90,122,0.18)] hover:bg-[rgba(255,90,122,0.25)] transition text-xs font-medium text-[#ff5a7a]"
                                                    type="button"
                                                    onClick={() => {
                                                        // eslint-disable-next-line no-alert
                                                        alert('UI demo: block shop')
                                                    }}
                                                >
                                                    Block
                                                </button>
                                            </>
                                        )}
                                    />
                                </div>
                            </article>
                        </div>

                        {/* Create Sub-Merchant Page */}
                        <div
                            id="create-sub-merchant"
                            className={hash === 'create-sub-merchant' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}
                        >
                            <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[#eaf1ff]">Create Sub-Merchant</h3>
                                    <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/10">Shop / Collection Point</span>
                                </div>
                                <form
                                    className="p-4"
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        // eslint-disable-next-line no-alert
                                        alert('Sub-Merchant created (UI demo).')
                                        setHash('sub-merchants')
                                    }}
                                >
                                    <div className="filters" style={{ justifyContent: 'flex-end' }}>
                                        <a className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff] font-medium" href="#sub-merchants">
                                            Cancel
                                        </a>
                                        <button className="h-9 px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-xs font-medium text-[#eaf1ff]" type="submit">
                                            Create Sub-Merchant
                                        </button>
                                    </div>
                                    <div style={{ marginTop: 14, color: 'var(--muted)', fontSize: 12 }}>
                                        UI demo form (connect API later).
                                    </div>
                                </form>
                            </article>
                        </div>

                        {/* Collections Page */}
                        <div id="collections" className={hash === 'collections' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[#eaf1ff]">Collections</h3>
                                    <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/10">Transactions</span>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        <DateRangeFilter
                                            fromValue={colFrom}
                                            toValue={colTo}
                                            onFromChange={setColFrom}
                                            onToChange={setColTo}
                                        />
                                        <StatusFilter value={colStatus} onChange={setColStatus} options={COLLECTION_STATUS_OPTIONS} />
                                        <ShopFilter value={colShop} onChange={setColShop} shops={SHOP_OPTIONS} />
                                        <SearchFilter
                                            value={colSearch}
                                            onChange={setColSearch}
                                            placeholder="Search Order ID / Provider Ref"
                                        />
                                        <ExportButton
                                            onClick={() =>
                                                exportDataToCSV(
                                                    filteredCollections.map((r) => ({ ...r, date: r.date })),
                                                    COLLECTION_CSV_COLUMNS,
                                                    'collections.csv'
                                                )
                                            }
                                        />
                                    </FilterBar>

                                    <DataTable
                                        columns={COLLECTION_COLUMNS}
                                        data={filteredCollections}
                                        keyField="orderId"
                                        renderActions={(r) => (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff] font-medium"
                                                type="button"
                                                onClick={() => handleOpenDetail('collection', r.orderId, 'collections')}
                                            >
                                                View
                                            </button>
                                        )}
                                    />
                                </div>
                            </article>
                        </div>

                        {/* Refunds Page */}
                        <div id="refunds" className={hash === 'refunds' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[#eaf1ff]">Refunds</h3>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgba(255,204,102,0.12)] text-[#ffcc66] border-[rgba(255,204,102,0.25)]">
                                        <span className="w-1 h-1 rounded-full bg-[#ffcc66] mr-1.5" /> Review
                                    </span>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        <DateRangeFilter fromValue={rfFrom} toValue={rfTo} onFromChange={setRfFrom} onToChange={setRfTo} />
                                        <StatusFilter value={rfStatus} onChange={setRfStatus} options={REFUND_STATUS_OPTIONS} />
                                        <ShopFilter value={rfShop} onChange={setRfShop} shops={SHOP_OPTIONS} />
                                        <SearchFilter
                                            value={rfSearch}
                                            onChange={setRfSearch}
                                            placeholder="Search Refund ID / Order ID"
                                        />
                                        <ExportButton
                                            onClick={() =>
                                                exportDataToCSV(
                                                    filteredRefunds.map((r) => ({ ...r })),
                                                    REFUND_CSV_COLUMNS,
                                                    'refunds.csv'
                                                )
                                            }
                                        />
                                    </FilterBar>

                                    <DataTable
                                        columns={REFUND_COLUMNS}
                                        data={filteredRefunds}
                                        keyField="refundId"
                                        renderActions={(r) => (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff] font-medium"
                                                type="button"
                                                onClick={() => handleOpenDetail('refund', r.refundId, 'refunds')}
                                            >
                                                View
                                            </button>
                                        )}
                                    />
                                </div>
                            </article>
                        </div>

                        {/* Settlements Page */}
                        <div
                            id="settlements"
                            className={hash === 'settlements' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}
                        >
                            <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[#eaf1ff]">Settlements</h3>
                                    <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/10">Finance</span>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        <DateRangeFilter fromValue={stFrom} toValue={stTo} onFromChange={setStFrom} onToChange={setStTo} />
                                        <StatusFilter value={stStatus} onChange={setStStatus} options={SETTLEMENT_STATUS_OPTIONS} />
                                        <SearchFilter value={stSearch} onChange={setStSearch} placeholder="Search Settlement ID" />
                                        <ExportButton
                                            onClick={() =>
                                                exportDataToCSV(
                                                    filteredSettlements.map((r) => ({ ...r })),
                                                    SETTLEMENT_CSV_COLUMNS,
                                                    'settlements.csv'
                                                )
                                            }
                                        />
                                    </FilterBar>

                                    <DataTable
                                        columns={SETTLEMENT_COLUMNS}
                                        data={filteredSettlements}
                                        keyField="settlementId"
                                        renderActions={(r) => (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff] font-medium"
                                                type="button"
                                                onClick={() => handleOpenDetail('settlement', r.settlementId, 'settlements')}
                                            >
                                                View
                                            </button>
                                        )}
                                    />
                                </div>
                            </article>
                        </div>

                        {/* Reports Page */}
                        <div id="reports" className={hash === 'reports' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[#eaf1ff]">Reports</h3>
                                    <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/10">Generate</span>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        <ClearableSelect
                                            value={repType}
                                            onChange={setRepType}
                                            className="min-w-[190px]"
                                            clearValue="Collections"
                                            showClear={repType !== 'Collections'}
                                        >
                                            <option value="Collections">Report Type: Collections</option>
                                            <option value="Settlements">Settlements</option>
                                            <option value="Refunds">Refunds</option>
                                            <option value="SubMerchants">Sub-Merchants</option>
                                            <option value="Users">Users</option>
                                        </ClearableSelect>
                                        <DateRangeFilter
                                            fromValue={repFrom}
                                            toValue={repTo}
                                            onFromChange={setRepFrom}
                                            onToChange={setRepTo}
                                        />
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-xs font-medium text-[#eaf1ff]"
                                            type="button"
                                            onClick={() => {
                                                const from = repFrom || 'N/A'
                                                const to = repTo || 'N/A'
                                                reportsData.unshift({
                                                    name: `${repType} Report`,
                                                    range: `${from} → ${to}`,
                                                    created: 'Just now',
                                                    status: 'READY',
                                                })
                                                // eslint-disable-next-line no-alert
                                                alert('Report generated (UI demo).')
                                            }}
                                        >
                                            Generate
                                        </button>
                                        <ExportButton
                                            onClick={() =>
                                                exportDataToCSV(
                                                    reportsData.map((r) => ({
                                                        report: r.name,
                                                        range: r.range,
                                                        created: r.created,
                                                        status: r.status,
                                                    })),
                                                    REPORT_CSV_COLUMNS,
                                                    'reports.csv'
                                                )
                                            }
                                        />
                                    </FilterBar>

                                    <DataTable
                                        columns={REPORT_COLUMNS}
                                        data={reportsData}
                                        keyField="name"
                                        renderActions={(r) => (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff] font-medium"
                                                type="button"
                                                onClick={() => handleOpenDetail('report', r.name, 'reports')}
                                            >
                                                View
                                            </button>
                                        )}
                                    />
                                </div>
                            </article>
                        </div>

                        {/* Users & Roles Page */}
                        <div id="users-roles" className={hash === 'users-roles' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[#eaf1ff]">Users & Roles</h3>
                                    <span className="text-[11px] text-[#a9b7d4]/60 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/10">RBAC</span>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        {canCreateUser && (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-xs font-medium text-[#eaf1ff]"
                                                type="button"
                                                onClick={() => {
                                                    // eslint-disable-next-line no-alert
                                                    alert('Add User (UI demo).')
                                                }}
                                            >
                                                + Add User
                                            </button>
                                        )}
                                        <ClearableSelect value={userRoleFilter} onChange={setUserRoleFilter} className="min-w-[160px]">
                                            <option value="">Role: All</option>
                                            {USER_ROLE_OPTIONS.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </ClearableSelect>
                                        <StatusFilter
                                            value={userStatusFilter}
                                            onChange={setUserStatusFilter}
                                            options={USER_STATUS_OPTIONS}
                                        />
                                        <SearchFilter value={userSearch} onChange={setUserSearch} placeholder="Search name / username" />
                                        <ExportButton
                                            onClick={() => exportDataToCSV(filteredUsers, USER_CSV_COLUMNS, 'users.csv')}
                                        />
                                    </FilterBar>

                                    <DataTable
                                        columns={USER_COLUMNS}
                                        data={filteredUsers}
                                        keyField="username"
                                        renderActions={(u) => (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs text-[#eaf1ff] font-medium"
                                                type="button"
                                                onClick={() => handleOpenDetail('user', u.username, 'users-roles')}
                                            >
                                                View
                                            </button>
                                        )}
                                    />
                                </div>
                            </article>
                        </div>

                        {/* Detail Page */}
                        <div id="detail" className={hash === 'detail' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <DetailView
                                detailContent={detailContent}
                                detailTab={detailTab}
                                setDetailTab={setDetailTab}
                                onBack={() => setHash(detailState.backHash || 'dashboard')}
                                onPrimaryAction={() => {
                                    // eslint-disable-next-line no-alert
                                    alert(`Primary action (UI demo) for ${detailState.type} / ${detailState.id}`)
                                }}
                                detailState={detailState}
                            />
                        </div>

                        <footer className="text-center py-6 text-xs text-[#a9b7d4]/40 border-t border-white/5">
                            © Merchant Portal • Standardized Tailwind UI
                        </footer>
                    </section>
                </main>
            </div>
        </div>
    )
}

export default MerchantPortal
