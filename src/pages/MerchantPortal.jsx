import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    DetailView,
    FilterBar,
    DateRangeFilter,
    StatusFilter,
    ShopFilter,
    SearchFilter,
    ExportMenu,
} from '../components/merchant'
import { DataTable } from '../components/ui/DataTable'
import { Sidebar } from '../components/ui/Sidebar'
import { Topbar } from '../components/ui/Topbar'
import { ClearableInput } from '../components/ui/ClearableInput'
import { ClearableSelect } from '../components/ui/ClearableSelect'
import { MERCHANT_NAVIGATION } from '../config/merchantConfig'
import { Eye, EyeOff, Info, LogOut, Search, Settings } from 'lucide-react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import { ThemeMenu } from '../components/ui/ThemeMenu'
import { useHashRoute } from '../hooks/useHashRoute'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { fmtPKR, withinDate } from '../utils/helpers'
import { passwordRules } from '../utils/passwordValidator'
import { exportDataToCSV } from '../utils/csvExport'
import { exportDataToPDF } from '../utils/pdfExport'
import { buildExportPayload } from '../utils/exportHelpers'
import { getDetailContent } from '../utils/detailUtils'
import { getPageMeta } from '../config/pageConfig'
import { MERCHANT_PAGE_PERMISSIONS } from '../config/permissionMap'
import { getAuthClaims, hasPermission } from '../utils/auth'
import { canAny } from '../utils/permissions'
import { useAuthStore } from '../hooks/useAuthStore'
import { clearAuthToken } from '../utils/apiClient'
import {
    fetchMerchantPayments,
    fetchMerchantSubMerchants,
    fetchMerchantSubMerchant,
    fetchMerchantRefunds,
    fetchMerchantSettlements,
    fetchMerchantSettlementLedger,
    fetchMerchantSettlementPayments,
    fetchMerchantBalance,
    initiateMerchantRefund,
    initiateMerchantRefundBulk,
    createMerchantSubMerchant,
    updateMerchantSubMerchant,
    createMerchantSubMerchantUser,
    createMerchantUser,
    fetchMerchantUnsettledSummary,
    fetchMerchantUsers,
    rotateMerchantApiKeys,
    changeMerchantPassword,
} from '../api/merchantApi'
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
} from '../config/tableColumns.jsx'
import {
    refundsData,
    subMerchantsData,
    usersData,
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
    const claims = getAuthClaims()
    const permissionsVersion = useAuthStore((state) => state.permissionsList)
    const hasAccess = permissionsVersion.length > 0 || canAny(MERCHANT_PAGE_PERMISSIONS.dashboard || [])
    const isSubMerchant = (claims?.userType || '').toUpperCase() === 'SUB_MERCHANT'
    const merchantScope = useMemo(() => {
        const id =
            claims?.merchantId ??
            claims?.merchant_id ??
            claims?.mid ??
            claims?.merchant?.id ??
            null
        const name =
            claims?.merchantName ??
            claims?.merchant_name ??
            claims?.businessName ??
            claims?.merchant?.name ??
            claims?.merchant ??
            null
        return { id, name }
    }, [claims])
    const isRowInMerchantScope = (row) => {
        if (!merchantScope.id && !merchantScope.name) return true
        const rowId =
            row?.merchantId ??
            row?.merchant_id ??
            row?.mid ??
            row?.merchant?.id ??
            row?._merchantId ??
            null
        const rowName =
            row?.merchantName ??
            row?.merchant_name ??
            row?.businessName ??
            row?.merchant?.name ??
            row?.merchant ??
            null
        if (rowId !== null && rowId !== undefined && merchantScope.id !== null && merchantScope.id !== undefined) {
            return String(rowId) === String(merchantScope.id)
        }
        if (rowName && merchantScope.name) {
            return String(rowName).toLowerCase() === String(merchantScope.name).toLowerCase()
        }
        return true
    }
    const canCreateUser = !isSubMerchant && (hasPermission('CREATE_USER', claims) || hasPermission('MERCHANT_CREATE_USER', claims))
    const canCreateSubMerchant =
        !isSubMerchant && (hasPermission('CREATE_SUB_MERCHANT', claims) || hasPermission('MERCHANT_CREATE_SUB_MERCHANT', claims))
    const canViewSubMerchants =
        hasPermission('VIEW_SUB_MERCHANT', claims) ||
        hasPermission('MERCHANT_VIEW_SUB_MERCHANT', claims) ||
        canCreateSubMerchant
    const canViewCollections =
        hasPermission('VIEW_PAYMENT', claims) || hasPermission('MERCHANT_VIEW_PAYMENT', claims)
    const canViewRefunds =
        hasPermission('VIEW_REFUND', claims) ||
        hasPermission('MERCHANT_VIEW_REFUND', claims) ||
        hasPermission('CREATE_REFUND', claims) ||
        hasPermission('MERCHANT_CREATE_REFUND', claims)
    const canViewUsers =
        hasPermission('VIEW_USERS', claims) ||
        hasPermission('MERCHANT_VIEW_USERS', claims) ||
        canCreateUser
    const canViewLedger = hasPermission('MERCHANT_VIEW_LEDGER', claims)
    const canViewSettlements =
        hasPermission('VIEW_SETTLEMENT', claims) || hasPermission('MERCHANT_VIEW_SETTLEMENT', claims)
    const canViewBalance =
        hasPermission('VIEW_BALANCE', claims) || hasPermission('MERCHANT_VIEW_BALANCE', claims) || canViewSettlements
    const canViewReports =
        hasPermission('VIEW_REPORTS', claims) || hasPermission('MERCHANT_VIEW_REPORTS', claims)
    const canExportReports =
        hasPermission('EXPORT_REPORTS', claims) || hasPermission('MERCHANT_EXPORT_REPORTS', claims)
    const canCreateRefund =
        hasPermission('CREATE_REFUND', claims) || hasPermission('MERCHANT_CREATE_REFUND', claims)
    const canRotateApiKeys =
        hasPermission('MERCHANT_ROTATE_API_KEY', claims) || hasPermission('ROTATE_API_KEY', claims)
    const canViewApiKeys = canRotateApiKeys
    const canViewRefundPayments = canViewCollections || canCreateRefund
    const merchantPermissions = useMemo(() => {
        const perms = claims?.permissions || []
        return perms
            .filter((perm) => typeof perm === 'string' && perm.trim().length > 0)
            .map((perm) => perm.trim())
            .sort()
    }, [claims])

    const merchantLabel = isSubMerchant ? 'Sub-Merchant' : 'Merchant'
    const merchantName = merchantScope?.name || claims?.name || claims?.username || 'AssanPay User'
    const merchantInitials = String(merchantName)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || 'MP'
    const [apiNotice, setApiNotice] = useState('')
    const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
    const [apiKeyModalData, setApiKeyModalData] = useState([])
    const [apiKeyBusy, setApiKeyBusy] = useState(false)
    const [apiKeyError, setApiKeyError] = useState('')
    const [passwordForm, setPasswordForm] = useState({
        current: '',
        next: '',
        confirm: '',
    })
    const [passwordBusy, setPasswordBusy] = useState(false)
    const [passwordError, setPasswordError] = useState('')
    const [passwordNotice, setPasswordNotice] = useState('')
    const [showPasswordCurrent, setShowPasswordCurrent] = useState(false)
    const [showPasswordNext, setShowPasswordNext] = useState(false)
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
    const passwordRuleState = useMemo(() => passwordRules(passwordForm.next), [passwordForm.next])
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const userMenuRef = useRef(null)
    const [paymentsNotice, setPaymentsNotice] = useState('')
    const [refundsNotice, setRefundsNotice] = useState('')
    const [settlementsNotice, setSettlementsNotice] = useState('')
    const COLLECTIONS_DEBOUNCE_MS = 1200
    const COLLECTIONS_REFRESH_MS = 30000

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
    const [colPaymentMethod, setColPaymentMethod] = useState('')
    const [colRefreshTick, setColRefreshTick] = useState(0)
    const [colPage, setColPage] = useState(1)
    const [colPageSize, setColPageSize] = useState(20)
    const [colTotalPages, setColTotalPages] = useState(1)
    const [colTotalElements, setColTotalElements] = useState(0)

    const debouncedColFrom = useDebouncedValue(colFrom, COLLECTIONS_DEBOUNCE_MS)
    const debouncedColTo = useDebouncedValue(colTo, COLLECTIONS_DEBOUNCE_MS)
    const debouncedColStatus = useDebouncedValue(colStatus, COLLECTIONS_DEBOUNCE_MS)
    const debouncedColSearch = useDebouncedValue(colSearch, COLLECTIONS_DEBOUNCE_MS)
    const debouncedColPaymentMethod = useDebouncedValue(colPaymentMethod, COLLECTIONS_DEBOUNCE_MS)

    // Refunds filters
    const [rfFrom, setRfFrom] = useState('')
    const [rfTo, setRfTo] = useState('')
    const [rfStatus, setRfStatus] = useState('')
    const [rfShop, setRfShop] = useState('')
    const [rfSearch, setRfSearch] = useState('')
    const [rfPage, setRfPage] = useState(1)
    const [rfPageSize, setRfPageSize] = useState(20)
    const [rfTotalPages, setRfTotalPages] = useState(1)
    const [rfTotalElements, setRfTotalElements] = useState(0)
    const [rfRefreshTick, setRfRefreshTick] = useState(0)
    const [refunds, setRefunds] = useState(refundsData)
    const [selectedRefunds, setSelectedRefunds] = useState(new Set())
    const [selectedPayments, setSelectedPayments] = useState(new Set())
    const [bulkRefundReason, setBulkRefundReason] = useState('')
    const [bulkRefundAmount, setBulkRefundAmount] = useState('')
    const [bulkRefundPassword, setBulkRefundPassword] = useState('')
    const [manualOrderId, setManualOrderId] = useState('')
    const [manualRefundAmount, setManualRefundAmount] = useState('')
    const [manualRefundReason, setManualRefundReason] = useState('')
    const [manualRefundPassword, setManualRefundPassword] = useState('')
    const [showRefundInitiate, setShowRefundInitiate] = useState(false)

    // Settlements filters
    const [stFrom, setStFrom] = useState('')
    const [stTo, setStTo] = useState('')
    const [stStatus, setStStatus] = useState('')
    const [stSearch, setStSearch] = useState('')
    const [ledgerFrom, setLedgerFrom] = useState('')
    const [ledgerTo, setLedgerTo] = useState('')
    const [ledgerRows, setLedgerRows] = useState([])
    const [ledgerNotice, setLedgerNotice] = useState('')
    const [ledgerPage, setLedgerPage] = useState(1)
    const [ledgerPageSize, setLedgerPageSize] = useState(20)
    const [settlementPayments, setSettlementPayments] = useState([])
    const [settlementPaymentsNotice, setSettlementPaymentsNotice] = useState('')

    // Users filters
    const [userRoleFilter, setUserRoleFilter] = useState('')
    const [userStatusFilter, setUserStatusFilter] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [userEmailSearch, setUserEmailSearch] = useState('')
    const [userBranchFilter, setUserBranchFilter] = useState('')
    const [userHasAccount, setUserHasAccount] = useState('')
    const [userPage, setUserPage] = useState(1)
    const [userPageSize, setUserPageSize] = useState(20)
    const [userTotalPages, setUserTotalPages] = useState(1)
    const [userTotalElements, setUserTotalElements] = useState(0)
    const [userRefreshTick, setUserRefreshTick] = useState(0)
    const [showAddUserPanel, setShowAddUserPanel] = useState(false)
    const [addUserForm, setAddUserForm] = useState({
        userType: 'merchant',
        subMerchantId: '',
        name: '',
        email: '',
        username: '',
        password: '',
        roleName: '',
        permissions: [],
        permissionSearch: '',
    })
    const debouncedUserSearch = useDebouncedValue(userSearch, 600)
    const debouncedUserEmailSearch = useDebouncedValue(userEmailSearch, 600)

    // Reports controls
    const [repType, setRepType] = useState('Collections')
    const [repFrom, setRepFrom] = useState('')
    const [repTo, setRepTo] = useState('')
    const [repStatus, setRepStatus] = useState('')
    const [reportRuns, setReportRuns] = useState([])
    const [reportPreview, setReportPreview] = useState(null)
    const [reportBusy, setReportBusy] = useState(false)
    const [reportError, setReportError] = useState('')

    useEffect(() => {
        if (repType === 'Ledger' || repType === 'SubMerchants' || repType === 'Users') {
            setRepStatus('')
        }
    }, [repType])

    const allowedReportTypes = useMemo(() => {
        const types = []
        if (canViewCollections) types.push('Collections')
        if (canViewSettlements) types.push('Settlements')
        if (canViewRefunds) types.push('Refunds')
        if (canViewLedger) types.push('Ledger')
        if (canViewSubMerchants) types.push('SubMerchants')
        if (canViewUsers) types.push('Users')
        return types
    }, [canViewCollections, canViewSettlements, canViewRefunds, canViewLedger, canViewSubMerchants, canViewUsers])

    useEffect(() => {
        if (allowedReportTypes.length === 0) return
        if (!allowedReportTypes.includes(repType)) {
            setRepType(allowedReportTypes[0])
        }
    }, [allowedReportTypes, repType])

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


    useEffect(() => {
        if (hash === 'security') return
        setPasswordForm({ current: '', next: '', confirm: '' })
        setPasswordError('')
        setPasswordNotice('')
        setShowPasswordCurrent(false)
        setShowPasswordNext(false)
        setShowPasswordConfirm(false)
    }, [hash])

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
        !(hash === 'users-roles' && !canViewUsers) &&
        !(pageMeta.btnHref === '#create-sub-merchant' && !canCreateSubMerchant) &&
        !(pageMeta.btnHref === '#reports' && !canViewReports)

    // Filtered data
    const [merchantPayments, setMerchantPayments] = useState([])
    const [dashPage, setDashPage] = useState(1)
    const [dashPageSize, setDashPageSize] = useState(8)
    const [refundPayPage, setRefundPayPage] = useState(1)
    const [refundPayPageSize, setRefundPayPageSize] = useState(10)

    const refundsByOrderId = useMemo(() => {
        const map = new Map()
        refunds.forEach((r) => {
            const orderId =
                r.orderId ??
                r.paymentOrderId ??
                r.payment?.orderId ??
                r.order_id ??
                null
            if (orderId === null || orderId === undefined) return
            const amount = Number(r.amount ?? r.refundAmount ?? r.refundedAmount ?? 0)
            if (Number.isNaN(amount)) return
            const key = String(orderId)
            map.set(key, (map.get(key) || 0) + amount)
        })
        return map
    }, [refunds])

    const getRefundableRemaining = (row) => {
        const orderId = row?.orderId ?? row?.order_id ?? null
        const total = Number(row?.amount ?? 0)
        const refunded = orderId != null ? refundsByOrderId.get(String(orderId)) || 0 : 0
        const remaining = total - refunded
        return Number.isNaN(remaining) ? 0 : Math.max(remaining, 0)
    }

    const isRefundBlocked = (row) => {
        const status = String(row?.status || '').toUpperCase()
        if (status === 'DISPUTED' || status === 'CHARGEBACK') return true
        if (status !== 'SUCCESS') return true
        return getRefundableRemaining(row) <= 0
    }

    const [subMerchants, setSubMerchants] = useState(subMerchantsData)
    const [users, setUsers] = useState(usersData)
    const [usersNotice, setUsersNotice] = useState('')
    const shopOptions = useMemo(() => {
        const values = new Set()
        subMerchants.forEach((sm) => {
            const name = sm?.name ? String(sm.name).trim() : ''
            const code = sm?.code ? String(sm.code).trim() : ''
            const label = name && code ? `${name} (${code})` : name || code
            if (label) values.add(label)
        })
        return Array.from(values).sort((a, b) => a.localeCompare(b))
    }, [subMerchants])
    const reportStatusOptions = useMemo(() => {
        if (repType === 'Collections') return COLLECTION_STATUS_OPTIONS
        if (repType === 'Refunds') return REFUND_STATUS_OPTIONS
        if (repType === 'Settlements') return SETTLEMENT_STATUS_OPTIONS
        return []
    }, [repType])
    const ledgerReportColumns = useMemo(() => ([
        { key: 'time', label: 'Time' },
        { key: 'entryType', label: 'Type' },
        { key: 'reason', label: 'Reason' },
        { key: 'amount', label: 'Amount', render: (row) => fmtPKR(row.amount || 0) },
        { key: 'settlementId', label: 'Settlement ID' },
        { key: 'note', label: 'Note' },
    ]), [])
    const settlementPaymentColumns = useMemo(() => ([
        { key: 'orderId', label: 'Order ID' },
        { key: 'paymentMethod', label: 'Method' },
        { key: 'status', label: 'Status' },
        { key: 'amount', label: 'Amount', render: (row) => fmtPKR(row.amount || 0) },
        { key: 'commissionAmount', label: 'Fees', render: (row) => fmtPKR(row.commissionAmount || 0) },
        { key: 'netAmount', label: 'Net', render: (row) => fmtPKR(row.netAmount || 0) },
        { key: 'settledAmount', label: 'Settled', render: (row) => fmtPKR(row.settledAmount || 0) },
        { key: 'providerRef', label: 'Provider Ref' },
        { key: 'successAt', label: 'Success At' },
    ]), [])
    const ledgerReportCsvColumns = useMemo(() => ([
        { key: 'time', label: 'Time' },
        { key: 'entryType', label: 'Type' },
        { key: 'reason', label: 'Reason' },
        { key: 'amount', label: 'Amount' },
        { key: 'settlementId', label: 'Settlement ID' },
        { key: 'note', label: 'Note' },
    ]), [])
    const userBranchOptions = useMemo(() => {
        const values = new Set()
        subMerchants.forEach((sm) => {
            const name = sm?.name ? String(sm.name).trim() : ''
            if (name) values.add(name)
        })
        return Array.from(values).sort((a, b) => a.localeCompare(b))
    }, [subMerchants])
    const addUserBranchOptions = useMemo(() => {
        return subMerchants
            .filter((sm) => !sm.userId)
            .map((sm) => ({
                id: sm.id,
                label: sm.name && sm.code ? `${sm.name} (${sm.code})` : sm.name || sm.code || `Branch ${sm.id}`,
            }))
    }, [subMerchants])
    const [subForm, setSubForm] = useState({
        id: null,
        branchCode: '',
        branchName: '',
        blocked: true,
        adminBlocked: false,
        adminApproved: false,
        createUser: false,
        userName: '',
        userEmail: '',
        userUsername: '',
        userPassword: '',
        userRoleName: '',
        userPermissions: [],
        userPermissionSearch: '',
    })
    const [subUserForm, setSubUserForm] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        roleName: '',
        permissions: [],
        permissionSearch: '',
    })

    const [dashboardStats, setDashboardStats] = useState({
        collectionsTodayAmount: 0,
        collectionsTodayCount: 0,
        successRate: 0,
        failedCount: 0,
        pendingCount: 0,
        refundsTodayAmount: 0,
        refundsTodayCount: 0,
        pendingSettlementsAmount: 0,
        pendingSettlementsRuns: 0,
    })

    const [balanceInfo, setBalanceInfo] = useState(null)
    const [balanceError, setBalanceError] = useState('')
    const [balanceBusy, setBalanceBusy] = useState(false)
    const formatBalanceUpdatedAt = (value) => {
        if (!value) return 'Unknown'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return String(value)
        return date.toLocaleString()
    }

    const canAccessMerchantPage = (pageKey) => {
        if (!Object.prototype.hasOwnProperty.call(MERCHANT_PAGE_PERMISSIONS, pageKey)) return false
        const required = MERCHANT_PAGE_PERMISSIONS[pageKey] || []
        if (required.length === 0) return true
        return canAny(required)
    }

    const filteredNavigation = useMemo(() => {
        const filterItems = (items) =>
            items.filter((item) => canAccessMerchantPage(item.key))

        return MERCHANT_NAVIGATION.map((section) => ({
            ...section,
            items: filterItems(section.items),
        })).filter((section) => section.items.length > 0)
    }, [permissionsVersion])

    const mapSubMerchants = (rows) =>
        rows.map((row) => ({
            id: row.id,
            code: row.branchCode,
            name: row.branchName,
            status: row.blocked ? 'blocked' : 'active',
            blocked: Boolean(row.blocked),
            adminBlocked: Boolean(row.adminBlocked),
            adminApproved: row.adminApproved !== null && row.adminApproved !== undefined
                ? Boolean(row.adminApproved)
                : true,
            vol30: row.collections30d ?? row.collections30Days ?? 0,
            success: row.successRate ?? 0,
            merchantName: row.merchantName,
            createdAt: row.createdAt,
            userId: row.userId ?? row.user_id ?? null,
            userEmail: row.userEmail ?? row.user_email ?? null,
            userUsername: row.userUsername ?? row.user_username ?? null,
            userName: row.userName ?? row.user_name ?? null,
        }))

    const buildReportRangeLabel = () => {
        if (repFrom && repTo) return `${repFrom} to ${repTo}`
        if (repFrom) return `${repFrom} to ...`
        if (repTo) return `... to ${repTo}`
        return 'All time'
    }

    const handlePasswordChange = async () => {
        const current = passwordForm.current.trim()
        const next = passwordForm.next.trim()
        const confirm = passwordForm.confirm.trim()
        if (!current || !next || !confirm) {
            setPasswordError('All password fields are required.')
            return
        }
        if (next !== confirm) {
            setPasswordError('New password confirmation does not match.')
            return
        }
        try {
            setPasswordBusy(true)
            setPasswordError('')
            setPasswordNotice('')
            await changeMerchantPassword({ currentPassword: current, newPassword: next })
            setPasswordForm({ current: '', next: '', confirm: '' })
            setPasswordNotice('Password updated.')
        } catch (err) {
            setPasswordError(err?.data?.message || err?.message || 'Unable to update password.')
        } finally {
            setPasswordBusy(false)
        }
    }

    const generateReport = async () => {
        setReportBusy(true)
        setReportError('')
        try {
            const rangeLabel = buildReportRangeLabel()
            const createdLabel = new Date().toLocaleString()
            let rows = []
            let columns = []
            let csvColumns = []
            let summary = { count: 0 }

            if (repType === 'Collections') {
                const page = await fetchMerchantPayments({
                    status: repStatus || undefined,
                    fromDate: repFrom || undefined,
                    toDate: repTo || undefined,
                    page: 0,
                    size: 500,
                })
                const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
                const scopedRows = content.filter(isRowInMerchantScope)
                rows = scopedRows.map((r, idx) => {
                    const createdAtRaw = r.successAt || r.success_at || r.createdAt || r.created_at
                    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null
                    const orderId = r.orderId ?? '-'
                    return {
                        rowKey: `COL-${orderId}-${createdAtRaw || idx}`,
                        date: createdAt ? createdAt.toISOString().slice(0, 10) : '-',
                        time: createdAt ? createdAt.toLocaleTimeString() : '-',
                        orderId,
                        shop: (() => {
                            const name =
                                r.subMerchantBranchName ||
                                r.subMerchantName ||
                                r.branchName ||
                                r.shopName ||
                                ''
                            const code =
                                r.subMerchantBranchCode ||
                                r.branchCode ||
                                r.shopCode ||
                                ''
                            return name && code ? `${name} (${code})` : name || code || '-'
                        })(),
                        amount: r.amount ?? 0,
                        status: r.status || '-',
                        providerRef: r.providerRef || r.providerReference || '-',
                        paymentMethod: r.paymentMethodName || '-',
                        _raw: r,
                    }
                })
                columns = COLLECTION_COLUMNS
                csvColumns = COLLECTION_CSV_COLUMNS
                summary = {
                    count: rows.length,
                    total: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
                }
            } else if (repType === 'Refunds') {
                const page = await fetchMerchantRefunds({
                    status: repStatus || undefined,
                    fromDate: repFrom || undefined,
                    toDate: repTo || undefined,
                    page: 0,
                    size: 500,
                })
                const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
                const scopedRows = content.filter(isRowInMerchantScope)
                rows = scopedRows.map((r, idx) => {
                    const dateRaw = r.requestedAt || r.createdAt || r.updatedAt || r.completedAt
                    const createdAt = dateRaw ? new Date(dateRaw) : null
                    const orderId =
                        r.orderId ??
                        r.paymentOrderId ??
                        r.merchantOrderId ??
                        r.payment?.orderId ??
                        r.order_id ??
                        '-'
                    const refundId =
                        r.refundId ??
                        r.id ??
                        r.pspRefundId ??
                        r.pspTransactionId ??
                        r.refund_id ??
                        (orderId !== '-' ? `RF-${orderId}` : '-')
                    return {
                        rowKey: `RF-${refundId}-${idx}`,
                        date: createdAt ? createdAt.toISOString().slice(0, 10) : '-',
                        refundId,
                        orderId,
                        shop: (() => {
                            const name =
                                r.subMerchantBranchName ||
                                r.subMerchantName ||
                                r.branchName ||
                                r.shopName ||
                                ''
                            const code =
                                r.subMerchantBranchCode ||
                                r.branchCode ||
                                r.shopCode ||
                                ''
                            return name && code ? `${name} (${code})` : name || code || '-'
                        })(),
                        amount: r.amount ?? r.refundAmount ?? 0,
                        reason: r.reason || r.notes || '-',
                        status: r.status || r.refundStatus || '-',
                        _raw: r,
                    }
                })
                columns = REFUND_COLUMNS
                csvColumns = REFUND_CSV_COLUMNS
                summary = {
                    count: rows.length,
                    total: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
                }
            } else if (repType === 'Settlements') {
                const page = await fetchMerchantSettlements({
                    status: repStatus || undefined,
                    fromDate: repFrom || undefined,
                    toDate: repTo || undefined,
                    page: 0,
                    size: 500,
                })
                const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
                rows = content.map((r, idx) => {
                    const startRaw = r.periodStart || r.from || r.period_start
                    const endRaw = r.periodEnd || r.to || r.period_end
                    const from = startRaw ? new Date(startRaw).toISOString().slice(0, 10) : '-'
                    const to = endRaw ? new Date(endRaw).toISOString().slice(0, 10) : '-'
                    return {
                        rowKey: `ST-${r.id ?? r.settlementId ?? idx}`,
                        settlementId: r.id ?? r.settlementId ?? r.settlement_id ?? '-',
                        from,
                        to,
                        total: r.grossAmount ?? r.totalAmount ?? r.gross_amount ?? 0,
                        fees: r.commissionAmount ?? r.fees ?? r.commission_amount ?? 0,
                        net:
                            r.netAmount ??
                            r.net ??
                            r.net_amount ??
                            0,
                        settledAmount: r.settledAmount ?? r.settled_amount ?? 0,
                        adjustmentsApplied: r.adjustmentsApplied ?? r.adjustments_applied ?? 0,
                        payoutAmount: r.payoutAmount ?? r.payout_amount ?? 0,
                        endingBalance: r.endingBalance ?? r.ending_balance ?? 0,
                        status: r.status ?? '-',
                        _raw: r,
                    }
                })
                columns = SETTLEMENT_COLUMNS
                csvColumns = SETTLEMENT_CSV_COLUMNS
                summary = {
                    count: rows.length,
                    total: rows.reduce((sum, row) => sum + Number(row.net || 0), 0),
                }
            } else if (repType === 'Ledger') {
                const page = await fetchMerchantSettlementLedger({
                    fromDate: repFrom || undefined,
                    toDate: repTo || undefined,
                    page: 0,
                    size: 500,
                })
                const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
                rows = content.map((r, idx) => {
                    const createdAt = r.createdAt ? new Date(r.createdAt) : null
                    return {
                        rowKey: `LED-${r.id ?? idx}`,
                        time: createdAt ? createdAt.toISOString().replace('T', ' ').slice(0, 19) : '-',
                        entryType: r.entryType || '-',
                        reason: r.reason || '-',
                        amount: r.amount ?? 0,
                        settlementId: r.settlementId ?? '-',
                        note: r.note || '-',
                        _raw: r,
                    }
                })
                columns = ledgerReportColumns
                csvColumns = ledgerReportCsvColumns
                summary = {
                    count: rows.length,
                    total: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
                }
            } else if (repType === 'SubMerchants') {
                let content = null
                try {
                    const page = await fetchMerchantSubMerchants({ page: 0, size: 500 })
                    content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
                } catch {
                    setReportError('Sub-merchants API not reachable, using current list.')
                }
                const source = content !== null ? mapSubMerchants(content) : (Array.isArray(subMerchants) ? subMerchants : [])
                rows = source.map((row, idx) => ({
                    ...row,
                    rowKey: row.id ?? `SM-${idx}`,
                }))
                columns = SUB_MERCHANT_COLUMNS
                csvColumns = SUB_MERCHANT_COLUMNS.map((col) => ({ key: col.key, label: col.label }))
                summary = { count: rows.length }
            } else if (repType === 'Users') {
                if (!Array.isArray(subMerchants) || subMerchants.length === 0) {
                    setReportError('Sub-merchant list is empty, nothing to report.')
                    rows = []
                } else {
                    rows = subMerchants.map((sm, idx) => {
                        const branchName = sm.name || ''
                        const branchCode = sm.code || ''
                        const branch =
                            branchName && branchCode
                                ? `${branchName} (${branchCode})`
                                : branchName || branchCode || '-'
                        const hasAccount = Boolean(sm.userId || sm.userEmail)
                        const status = hasAccount
                            ? sm.adminBlocked
                                ? 'Admin Blocked'
                                : sm.adminApproved === false
                                    ? 'Awaiting Approval'
                                    : sm.blocked
                                        ? 'Blocked'
                                        : 'Active'
                            : 'No User'
                        return {
                            rowKey: sm.userId ? `U-${sm.userId}` : `SM-${sm.id ?? idx}`,
                            name: sm.userName || '-',
                            username: sm.userUsername || '-',
                            email: sm.userEmail || '-',
                            role: hasAccount ? 'Sub-Merchant' : '-',
                            status,
                            branch,
                            hasUser: hasAccount,
                            _raw: sm,
                        }
                    })
                }
                columns = USER_COLUMNS
                csvColumns = USER_CSV_COLUMNS
                summary = { count: rows.length }
            }

            const run = {
                id: `rep-${Date.now()}`,
                name: `${repType} Report`,
                range: rangeLabel,
                created: createdLabel,
                status: 'READY',
                type: repType,
                rows,
                columns,
                csvColumns,
                summary,
            }
            setReportRuns((prev) => [run, ...prev])
            setReportPreview(run)
        } catch (err) {
            setReportError(err?.message || 'Report generation failed.')
        } finally {
            setReportBusy(false)
        }
    }

    const removeReportRun = (id) => {
        setReportRuns((prev) => prev.filter((run) => run.id !== id))
        setReportPreview((prev) => (prev?.id === id ? null : prev))
    }

    useEffect(() => {
        let active = true

        const loadSubMerchants = async () => {
            try {
                const page = await fetchMerchantSubMerchants({ page: 0, size: 200 })
                const rows = Array.isArray(page?.content) ? page.content : []
                const mapped = mapSubMerchants(rows)
                if (active) {
                    setSubMerchants(mapped)
                }
            } catch {
                if (active) {
                    setApiNotice('API not reachable, showing demo data.')
                }
            }
        }

        if (canViewSubMerchants) {
            loadSubMerchants()
        }
        return () => {
            active = false
        }
    }, [canViewSubMerchants])

    useEffect(() => {
        let active = true

        if (hash !== 'users-roles' || !canViewUsers) {
            return () => {
                active = false
            }
        }

        const loadUsers = async () => {
            try {
                const role = userRoleFilter || undefined
                let blocked
                if (userStatusFilter === 'Blocked') blocked = true
                else if (userStatusFilter === 'Active') blocked = false

                let hasUser
                if (userHasAccount === 'yes') hasUser = true
                else if (userHasAccount === 'no') hasUser = false
                if (userStatusFilter === 'No User') hasUser = false

                const rows = await fetchMerchantUsers({
                    role,
                    blocked,
                    hasUser,
                    branchName: userBranchFilter || undefined,
                    email: debouncedUserEmailSearch || undefined,
                    name: debouncedUserSearch || undefined,
                    page: Math.max(userPage - 1, 0),
                    size: userPageSize,
                })

                const content = Array.isArray(rows?.content) ? rows.content : Array.isArray(rows) ? rows : []
                const mapped = content.map((r) => {
                    const branchName = r.branchName || ''
                    const branchCode = r.branchCode || ''
                    const branch =
                        branchName && branchCode
                            ? `${branchName} (${branchCode})`
                            : branchName || branchCode || '-'
                    const roleName = r.roles || r.role || '-'
                    const hasAccount = Boolean(r.hasUser || r.userId)
                    const status = hasAccount
                        ? r.blocked
                            ? 'Blocked'
                            : 'Active'
                        : 'No User'
                    return {
                        id: r.userId ? `U-${r.userId}` : `SM-${r.subMerchantId}`,
                        subMerchantId: r.subMerchantId ?? r.sub_merchant_id ?? null,
                        name: r.name || '-',
                        username: r.username || '-',
                        email: r.email || '-',
                        role: roleName,
                        status,
                        branch,
                        hasUser: hasAccount,
                        branchName,
                        branchCode,
                        _raw: r,
                    }
                })

                if (active) {
                    setUsers(mapped)
                    setUsersNotice('')
                    const totalElements = rows?.totalElements ?? mapped.length
                    const totalPages = rows?.totalPages ?? Math.max(1, Math.ceil(totalElements / userPageSize))
                    setUserTotalElements(totalElements)
                    setUserTotalPages(totalPages)
                }
            } catch {
                if (active) {
                    const fallback = usersData.map((u, idx) => ({
                        id: `DEMO-${idx}`,
                        subMerchantId: null,
                        name: u.name || '-',
                        username: u.username || '-',
                        email: u.email || '-',
                        role: u.role || '-',
                        status: u.status || 'Active',
                        branch: u.branch || '-',
                        hasUser: true,
                        _raw: u,
                    }))
                    setUsers(fallback)
                    setUsersNotice('Users API not reachable, showing demo data.')
                    setUserTotalElements(fallback.length)
                    setUserTotalPages(Math.max(1, Math.ceil(fallback.length / userPageSize)))
                }
            }
        }

        loadUsers()
        return () => {
            active = false
        }
    }, [
        hash,
        userRoleFilter,
        userStatusFilter,
        userHasAccount,
        userBranchFilter,
        userPage,
        userPageSize,
        debouncedUserSearch,
        debouncedUserEmailSearch,
        userRefreshTick,
    ])

    useEffect(() => {
        let active = true

        if (hash !== 'refunds') {
            return () => {
                active = false
            }
        }

        const loadRefunds = async () => {
            try {
                const rawOrderId = rfSearch.trim()
                const orderId = rawOrderId && /^\d+$/.test(rawOrderId) ? Number(rawOrderId) : undefined
                const page = await fetchMerchantRefunds({
                    status: rfStatus || undefined,
                    fromDate: rfFrom || undefined,
                    toDate: rfTo || undefined,
                    orderId,
                    page: Math.max(rfPage - 1, 0),
                    size: rfPageSize,
                })
                const rows = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
                const scopedRows = rows.filter(isRowInMerchantScope)
                const scoped = scopedRows.length !== rows.length
                const mapped = scopedRows.map((r) => {
                    const dateRaw = r.requestedAt || r.createdAt || r.updatedAt || r.completedAt
                    const createdAt = dateRaw ? new Date(dateRaw) : null
                    const orderId =
                        r.orderId ??
                        r.paymentOrderId ??
                        r.merchantOrderId ??
                        r.payment?.orderId ??
                        r.order_id ??
                        '-'
                    const refundId =
                        r.refundId ??
                        r.id ??
                        r.pspRefundId ??
                        r.pspTransactionId ??
                        r.refund_id ??
                        (orderId !== '-' ? `RF-${orderId}` : '-')
                    return {
                        refundId,
                        orderId,
                        shop: (() => {
                            const name =
                                r.subMerchantBranchName ||
                                r.subMerchantName ||
                                r.branchName ||
                                r.shopName ||
                                ''
                            const code =
                                r.subMerchantBranchCode ||
                                r.branchCode ||
                                r.shopCode ||
                                ''
                            return name && code ? `${name} (${code})` : name || code || '-'
                        })(),
                        amount: r.refundAmount ?? r.amount ?? r.refundedAmount ?? 0,
                        reason: r.reason ?? r.note ?? '-',
                        status: r.status ?? r.pspStatus ?? r.refundStatus ?? '-',
                        date: createdAt ? createdAt.toISOString().slice(0, 10) : '-',
                        _raw: r,
                    }
                })
                if (active) {
                    setRefunds(mapped)
                    setRefundsNotice('')
                    setSelectedRefunds(new Set())
                    const totalElements = scoped ? mapped.length : page?.totalElements ?? mapped.length
                    const totalPages = scoped
                        ? Math.max(1, Math.ceil(totalElements / rfPageSize))
                        : page?.totalPages ?? Math.max(1, Math.ceil(totalElements / rfPageSize))
                    setRfTotalElements(totalElements)
                    setRfTotalPages(totalPages)
                }
            } catch {
                if (active) {
                    setRefunds([])
                    setRefundsNotice('Refunds API not reachable, showing empty list.')
                    setRfTotalElements(0)
                    setRfTotalPages(1)
                }
            }
        }

        loadRefunds()
        return () => {
            active = false
        }
    }, [hash, rfFrom, rfTo, rfStatus, rfSearch, rfPage, rfPageSize, rfRefreshTick])


    useEffect(() => {
        let active = true

        if (!(hash === 'dashboard' || hash === 'collections' || hash === 'refunds')) {
            return () => {
                active = false
            }
        }
        if ((hash === 'dashboard' || hash === 'collections') && !canViewCollections) {
            return () => {
                active = false
            }
        }
        if (hash === 'refunds' && !canViewRefundPayments) {
            return () => {
                active = false
            }
        }

        const loadPayments = async () => {
            try {
                const rawOrderId = debouncedColSearch.trim()
                const orderId = rawOrderId && /^\d+$/.test(rawOrderId) ? Number(rawOrderId) : undefined
                const isCollections = hash === 'collections'
                const isRefunds = hash === 'refunds'
                const pageRequest = isCollections
                    ? { page: Math.max(colPage - 1, 0), size: colPageSize }
                    : { page: 0, size: 200 }
                const page = await fetchMerchantPayments({
                    status: isRefunds ? 'SUCCESS' : (debouncedColStatus || undefined),
                    paymentMethodName: isRefunds ? undefined : (debouncedColPaymentMethod || undefined),
                    fromDate: isRefunds ? undefined : (debouncedColFrom || undefined),
                    toDate: isRefunds ? undefined : (debouncedColTo || undefined),
                    orderId: isRefunds ? undefined : orderId,
                    page: pageRequest.page,
                    size: pageRequest.size,
                })
                const rows = Array.isArray(page?.content) ? page.content : []
                const scopedRows = rows.filter(isRowInMerchantScope)
                const scoped = scopedRows.length !== rows.length
                const mapped = scopedRows.map((r) => {
                    const createdAtRaw = r.successAt || r.success_at || r.createdAt || r.created_at
                    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null
                    return {
                        date: createdAt ? createdAt.toISOString().slice(0, 10) : '-',
                        time: createdAt ? createdAt.toLocaleTimeString() : '-',
                        orderId: r.orderId ?? '-',
                        shop: (() => {
                            const name =
                                r.subMerchantBranchName ||
                                r.subMerchantName ||
                                r.branchName ||
                                r.shopName ||
                                ''
                            const code =
                                r.subMerchantBranchCode ||
                                r.branchCode ||
                                r.shopCode ||
                                ''
                            return name && code ? `${name} (${code})` : name || code || '-'
                        })(),
                        amount: r.amount ?? 0,
                        status: r.status || '-',
                        providerRef: r.providerRef || r.providerReference || '-',
                        paymentMethod: r.paymentMethodName || '-',
                        _raw: r,
                    }
                })
                if (active) {
                    setMerchantPayments(mapped)
                    setPaymentsNotice('')
                    if (isCollections) {
                        const totalElements = scoped ? mapped.length : page?.totalElements ?? mapped.length
                        const totalPages = scoped
                            ? Math.max(1, Math.ceil(totalElements / colPageSize))
                            : page?.totalPages ?? Math.max(1, Math.ceil(totalElements / colPageSize))
                        setColTotalElements(totalElements)
                        setColTotalPages(totalPages)
                    }
                }
            } catch {
                if (active) {
                    setMerchantPayments([])
                    setPaymentsNotice('Payments API not reachable, showing empty list.')
                    setColTotalElements(0)
                    setColTotalPages(1)
                }
            }
        }

        loadPayments()
        return () => {
            active = false
        }
    }, [
        debouncedColFrom,
        debouncedColTo,
        debouncedColStatus,
        debouncedColSearch,
        debouncedColPaymentMethod,
        colRefreshTick,
        hash,
        colPage,
        colPageSize,
    ])

    const loadBalance = async () => {
        if (!claims) return
        setBalanceBusy(true)
        setBalanceError('')
        try {
            const res = await fetchMerchantBalance()
            setBalanceInfo({
                balanceAmount: res?.balanceAmount ?? res?.balance ?? 0,
                currency: res?.currency || 'PKR',
                updatedAt: res?.updatedAt ?? res?.updated_at ?? res?.asOf ?? null,
                payoutFreeze: Boolean(res?.payoutFreeze ?? res?.payout_freeze ?? false),
                payoutFreezeReason: res?.payoutFreezeReason ?? res?.payout_freeze_reason ?? '',
            })
        } catch (err) {
            setBalanceInfo(null)
            setBalanceError(err?.message || 'Unable to load balance.')
        } finally {
            setBalanceBusy(false)
        }
    }

    useEffect(() => {
        if (!['balance', 'settlements', 'dashboard'].includes(hash)) return
        loadBalance()
    }, [hash, claims])

    useEffect(() => {
        let active = true

        if (hash !== 'settlements' || !canViewSettlements) {
            return () => {
                active = false
            }
        }

        const loadSettlements = async () => {
            try {
                const page = await fetchMerchantSettlements({
                    status: stStatus || undefined,
                    fromDate: stFrom || undefined,
                    toDate: stTo || undefined,
                    page: 0,
                    size: 200,
                })
                const rows = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
                const mapped = rows.map((r) => {
                    const startRaw = r.periodStart || r.from || r.period_start
                    const endRaw = r.periodEnd || r.to || r.period_end
                    const from = startRaw ? new Date(startRaw).toISOString().slice(0, 10) : '-'
                    const to = endRaw ? new Date(endRaw).toISOString().slice(0, 10) : '-'
                    return {
                        settlementId: r.id ?? r.settlementId ?? r.settlement_id ?? '-',
                        from,
                        to,
                        total: r.grossAmount ?? r.totalAmount ?? r.gross_amount ?? 0,
                        fees: r.commissionAmount ?? r.fees ?? r.commission_amount ?? 0,
                        net:
                            r.netAmount ??
                            r.net ??
                            r.net_amount ??
                            0,
                        settledAmount: r.settledAmount ?? r.settled_amount ?? 0,
                        adjustmentsApplied: r.adjustmentsApplied ?? r.adjustments_applied ?? 0,
                        payoutAmount: r.payoutAmount ?? r.payout_amount ?? 0,
                        endingBalance: r.endingBalance ?? r.ending_balance ?? 0,
                        status: r.status ?? '-',
                        _raw: r,
                    }
                })
                if (active) {
                    setSettlements(mapped)
                    setSettlementsNotice('')
                }
            } catch {
                if (active) {
                    setSettlements([])
                    setSettlementsNotice('Settlements API not reachable, showing empty list.')
                }
            }
        }

        loadSettlements()
        return () => {
            active = false
        }
    }, [hash, stFrom, stTo, stStatus])

    useEffect(() => {
        let active = true
        if (hash !== 'settlements' || !canViewLedger) {
            return () => {
                active = false
            }
        }
        const loadLedger = async () => {
            try {
                const page = await fetchMerchantSettlementLedger({
                    fromDate: ledgerFrom || undefined,
                    toDate: ledgerTo || undefined,
                    page: Math.max(ledgerPage - 1, 0),
                    size: ledgerPageSize,
                })
                const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
                if (active) {
                    setLedgerRows(content)
                    setLedgerNotice('')
                }
            } catch {
                if (active) {
                    setLedgerRows([])
                    setLedgerNotice('Ledger API not reachable.')
                }
            }
        }
        loadLedger()
        return () => {
            active = false
        }
    }, [hash, ledgerFrom, ledgerTo, ledgerPage, ledgerPageSize, canViewLedger])

    useEffect(() => {
        if (!(hash === 'dashboard' || hash === 'collections' || hash === 'refunds')) return
        const handle = setInterval(() => setColRefreshTick((tick) => tick + 1), COLLECTIONS_REFRESH_MS)
        return () => clearInterval(handle)
    }, [hash, merchantPayments, refunds])

    useEffect(() => {
        let active = true
        if (hash !== 'dashboard') {
            return () => {
                active = false
            }
        }

        const parseRowDate = (row) => {
            const raw =
                row?.successAt ||
                row?.success_at ||
                row?._raw?.successAt ||
                row?._raw?.success_at ||
                row?.createdAt ||
                row?._raw?.createdAt ||
                row?._raw?.created_at ||
                row?.date ||
                row?.paymentDate ||
                row?.payment_date
            if (!raw) return null
            const date = raw instanceof Date ? raw : new Date(raw)
            return Number.isNaN(date.getTime()) ? null : date
        }

        const toDateOnly = (date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
        const today = new Date()
        const todayStr = toDateOnly(today)
        const from30 = new Date(today)
        from30.setDate(today.getDate() - 30)
        const from30Str = toDateOnly(from30)

        const loadDashboard = async () => {
            try {
                const [todayPayments, monthPayments, refundsToday, unsettled] = await Promise.all([
                    canViewCollections
                        ? fetchMerchantPayments({ fromDate: todayStr, toDate: todayStr, page: 0, size: 200 })
                        : Promise.resolve({ content: [], totalElements: 0 }),
                    canViewCollections
                        ? fetchMerchantPayments({ fromDate: from30Str, toDate: todayStr, page: 0, size: 200 })
                        : Promise.resolve({ content: [], totalElements: 0 }),
                    canViewRefunds
                        ? fetchMerchantRefunds({ fromDate: todayStr, toDate: todayStr, page: 0, size: 200 })
                        : Promise.resolve({ content: [], totalElements: 0 }),
                    canViewSettlements
                        ? fetchMerchantUnsettledSummary({ fromDate: from30Str, toDate: todayStr })
                        : Promise.resolve({ pendingAmount: 0, pendingCount: 0 }),
                ])

                const todayRows = Array.isArray(todayPayments?.content) ? todayPayments.content : []
                const monthRows = Array.isArray(monthPayments?.content) ? monthPayments.content : []
                const todaySummary = todayPayments?.summary || {}
                const monthSummary = monthPayments?.summary || {}

                const hasMonthSummary =
                    monthSummary.totalCount !== undefined ||
                    monthSummary.successCount !== undefined ||
                    monthSummary.failedCount !== undefined
                const total30 = hasMonthSummary ? monthSummary.totalCount || 0 : monthRows.length
                const success30 = hasMonthSummary
                    ? monthSummary.successCount || 0
                    : monthRows.filter((r) => String(r.status || '').toUpperCase() === 'SUCCESS').length
                const failed30 = hasMonthSummary
                    ? monthSummary.failedCount || 0
                    : monthRows.filter((r) => String(r.status || '').toUpperCase() === 'FAILED').length
                const pending30 = Math.max(0, total30 - success30 - failed30)
                const successRate = total30 > 0 ? (success30 / total30) * 100 : 0

                const refundRows = Array.isArray(refundsToday?.content) ? refundsToday.content : []
                const refundsAmount = refundRows.reduce(
                    (sum, r) => sum + Number(r.refundAmount ?? r.amount ?? 0),
                    0
                )
                const refundsCount = refundsToday?.totalElements ?? refundRows.length
                const hasTodaySummary =
                    todaySummary.successAmount !== undefined ||
                    todaySummary.successCount !== undefined
                const todaySuccessAmount = hasTodaySummary
                    ? Number(todaySummary.successAmount || 0)
                    : todayRows
                        .filter((r) => String(r.status || '').toUpperCase() === 'SUCCESS')
                        .reduce((sum, r) => sum + Number(r.amount ?? 0), 0)
                const todaySuccessCount = hasTodaySummary
                    ? Number(todaySummary.successCount || 0)
                    : todayRows.filter((r) => String(r.status || '').toUpperCase() === 'SUCCESS').length

                const fallbackRows = Array.isArray(merchantPayments) ? merchantPayments : []
                const fallbackToday = fallbackRows.filter((r) => {
                    const d = parseRowDate(r)
                    return d && d.toISOString().slice(0, 10) === todayStr
                })
                const fallback30 = fallbackRows.filter((r) => {
                    const d = parseRowDate(r)
                    return d && d >= from30 && d <= today
                })
                const fallbackTodaySuccessAmount = fallbackToday
                    .filter((r) => String(r.status || '').toUpperCase() === 'SUCCESS')
                    .reduce((sum, r) => sum + Number(r.amount ?? 0), 0)
                const fallbackTodaySuccessCount = fallbackToday
                    .filter((r) => String(r.status || '').toUpperCase() === 'SUCCESS').length
                const fallbackTotal30 = fallback30.length
                const fallbackSuccess30 = fallback30
                    .filter((r) => String(r.status || '').toUpperCase() === 'SUCCESS').length
                const fallbackFailed30 = fallback30
                    .filter((r) => String(r.status || '').toUpperCase() === 'FAILED').length
                const fallbackPending30 = Math.max(0, fallbackTotal30 - fallbackSuccess30 - fallbackFailed30)
                const fallbackSuccessRate = fallbackTotal30 > 0 ? (fallbackSuccess30 / fallbackTotal30) * 100 : 0

                const useFallbackToday =
                    (!hasTodaySummary && fallbackToday.length > 0) ||
                    (todaySuccessCount === 0 && fallbackTodaySuccessCount > 0)
                const useFallbackMonth =
                    (!hasMonthSummary && fallback30.length > 0) ||
                    (total30 === 0 && fallbackTotal30 > 0)

                const refundsFallbackRows = Array.isArray(refunds) ? refunds : []
                const refundsFallbackToday = refundsFallbackRows.filter((r) => {
                    const d = parseRowDate(r)
                    return d && d.toISOString().slice(0, 10) === todayStr
                })
                const refundsFallbackAmount = refundsFallbackToday.reduce(
                    (sum, r) => sum + Number(r.amount ?? r.refundAmount ?? 0),
                    0
                )
                const refundsFallbackCount = refundsFallbackToday.length

                if (active) {
                    setDashboardStats({
                        collectionsTodayAmount: useFallbackToday ? fallbackTodaySuccessAmount : todaySuccessAmount,
                        collectionsTodayCount: useFallbackToday ? fallbackTodaySuccessCount : todaySuccessCount,
                        successRate: useFallbackMonth ? fallbackSuccessRate : successRate,
                        failedCount: Number(useFallbackMonth ? fallbackFailed30 : failed30 || 0),
                        pendingCount: Number(useFallbackMonth ? fallbackPending30 : pending30 || 0),
                        refundsTodayAmount: refundsCount > 0 ? refundsAmount : refundsFallbackAmount,
                        refundsTodayCount: refundsCount > 0 ? Number(refundsCount || 0) : refundsFallbackCount,
                        pendingSettlementsAmount: Number(unsettled?.totalAmount || 0),
                        pendingSettlementsRuns: Number(unsettled?.totalCount || 0),
                    })
                }
            } catch {
                if (active) {
                    setDashboardStats((prev) => ({ ...prev }))
                }
            }
        }

        loadDashboard()
        return () => {
            active = false
        }
    }, [hash])

    useEffect(() => {
        if (hash !== 'refunds') return
        setRfPage(1)
    }, [hash, rfFrom, rfTo, rfStatus, rfSearch])

    useEffect(() => {
        if (hash !== 'collections') return
        setColPage(1)
    }, [
        hash,
        colFrom,
        colTo,
        colStatus,
        colShop,
        colSearch,
        colPaymentMethod,
    ])

    useEffect(() => {
        if (hash !== 'users-roles') return
        setUserPage(1)
    }, [
        hash,
        userRoleFilter,
        userStatusFilter,
        userSearch,
        userEmailSearch,
        userBranchFilter,
        userHasAccount,
    ])

    const filteredSubMerchants = useMemo(() => {
        const s = subSearch.toLowerCase()
        return subMerchants
            .filter((r) => !subStatus || r.status === subStatus)
            .filter((r) => !s || (r.code + ' ' + r.name).toLowerCase().includes(s))
    }, [subMerchants, subSearch, subStatus])

    const filteredCollections = useMemo(() => {
        const q = colSearch.toLowerCase()
        const methodQuery = colPaymentMethod.trim().toLowerCase()
        return merchantPayments
            .filter((r) => withinDate(r.date, colFrom, colTo))
            .filter((r) => !colStatus || r.status === colStatus)
            .filter((r) => !colShop || (r.shop || '').toLowerCase().includes(colShop.toLowerCase()))
            .filter((r) => !methodQuery || (r.paymentMethod || '').toLowerCase().includes(methodQuery))
            .filter((r) => !q || (r.orderId + ' ' + r.providerRef).toLowerCase().includes(q))
    }, [merchantPayments, colFrom, colTo, colStatus, colShop, colSearch, colPaymentMethod])
    const refundableCollections = useMemo(() => {
        const baseRows = hash === 'refunds' ? merchantPayments : filteredCollections
        return baseRows.filter((r) => !isRefundBlocked(r))
    }, [hash, merchantPayments, filteredCollections])
    const refundPayTotalPages = Math.max(1, Math.ceil(refundableCollections.length / refundPayPageSize))
    const refundPayPageSafe = Math.min(refundPayPage, refundPayTotalPages)
    const refundPayRows = useMemo(() => {
        const start = (refundPayPageSafe - 1) * refundPayPageSize
        return refundableCollections.slice(start, start + refundPayPageSize)
    }, [refundableCollections, refundPayPageSafe, refundPayPageSize])
    const colSafeTotalPages = Math.max(1, colTotalPages || 1)
    const dashTotalPages = Math.max(1, Math.ceil(filteredCollections.length / dashPageSize))
    const dashboardCollections = useMemo(() => {
        const start = (dashPage - 1) * dashPageSize
        return filteredCollections.slice(start, start + dashPageSize)
    }, [filteredCollections, dashPage, dashPageSize])

    const parseRowDate = (row) => {
        const raw = row?.date || row?.createdAt || row?.created_at || row?.time
        if (!raw) return null
        const dt = new Date(raw)
        if (Number.isNaN(dt.getTime())) return null
        return dt
    }

    const trendSeries = useMemo(() => {
        const rows = filteredCollections.filter((row) => {
            const dt = parseRowDate(row)
            if (!dt) return false
            return true
        })
        const map = new Map()
        rows.forEach((row) => {
            const dt = parseRowDate(row)
            if (!dt) return
            const key = dt.toISOString().slice(0, 10)
            const status = String(row.status || '').toUpperCase()
            const entry = map.get(key) || { label: key, success: 0, pending: 0, failed: 0, initiated: 0 }
            if (status === 'SUCCESS') entry.success += 1
            else if (status === 'PENDING') entry.pending += 1
            else if (status === 'FAILED') entry.failed += 1
            else if (status === 'INITIATED') entry.initiated += 1
            map.set(key, entry)
        })
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
    }, [filteredCollections])

    const methodSplit = useMemo(() => {
        const rows = filteredCollections.filter((row) => {
            const dt = parseRowDate(row)
            if (!dt) return false
            return true
        })
        const map = new Map()
        rows.forEach((row) => {
            const key = row.paymentMethod || 'Unknown'
            map.set(key, (map.get(key) || 0) + 1)
        })
        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
        const top = sorted.slice(0, 6)
        const otherCount = sorted.slice(6).reduce((acc, [, v]) => acc + v, 0)
        const data = top.map(([name, value]) => ({ name, value }))
        if (otherCount > 0) data.push({ name: 'Other', value: otherCount })
        return data
    }, [filteredCollections])

    const filteredRefunds = useMemo(() => {
        const q = rfSearch.toLowerCase()
        return refunds
            .filter((r) => withinDate(r.date, rfFrom, rfTo))
            .filter((r) => !rfStatus || r.status === rfStatus)
            .filter((r) => !rfShop || (r.shop || '').toLowerCase().includes(rfShop.toLowerCase()))
            .filter((r) => !q || (r.refundId + ' ' + r.orderId).toLowerCase().includes(q))
    }, [refunds, rfFrom, rfTo, rfStatus, rfShop, rfSearch])
    useEffect(() => {
        setDashPage(1)
    }, [colFrom, colTo, colStatus, colShop, colSearch, colPaymentMethod])

    useEffect(() => {
        if (hash !== 'refunds') return
        setRefundPayPage(1)
    }, [hash, refundableCollections.length])
    const filteredUserPerms = useMemo(() => {
        const q = subForm.userPermissionSearch.trim().toLowerCase()
        return merchantPermissions.filter((perm) => perm.toLowerCase().includes(q))
    }, [merchantPermissions, subForm.userPermissionSearch])
    const filteredAddUserPerms = useMemo(() => {
        const q = addUserForm.permissionSearch.trim().toLowerCase()
        return merchantPermissions.filter((perm) => perm.toLowerCase().includes(q))
    }, [merchantPermissions, addUserForm.permissionSearch])
    const filteredDetailPerms = useMemo(() => {
        const q = subUserForm.permissionSearch.trim().toLowerCase()
        return merchantPermissions.filter((perm) => perm.toLowerCase().includes(q))
    }, [merchantPermissions, subUserForm.permissionSearch])

    const [settlements, setSettlements] = useState([])
    const filteredSettlements = useMemo(() => {
        const q = stSearch.toLowerCase()
        return settlements
            .filter((r) => withinDate(r.from, stFrom, stTo) || withinDate(r.to, stFrom, stTo))
            .filter((r) => !stStatus || r.status === stStatus)
            .filter((r) => !q || String(r.settlementId || '').toLowerCase().includes(q))
    }, [settlements, stFrom, stTo, stStatus, stSearch])

    const ledgerColumns = useMemo(() => ([
        { key: 'createdAt', label: 'Time' },
        { key: 'entryType', label: 'Type' },
        { key: 'reason', label: 'Reason' },
        {
            key: 'amount',
            label: 'Amount',
            render: (row) => {
                const amount = fmtPKR(row.amount || 0)
                const isDebit = String(row.entryType || '').toUpperCase() === 'DEBIT'
                return (
                    <span className={isDebit ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}>
                        {isDebit ? '-' : '+'}{amount}
                    </span>
                )
            },
        },
        { key: 'settlementId', label: 'Settlement ID' },
        { key: 'note', label: 'Note', render: (row) => row.note || '-' },
    ]), [])

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase()
        const emailQ = userEmailSearch.trim().toLowerCase()
        const branchQ = userBranchFilter.trim().toLowerCase()
        return users
            .filter((u) => !userRoleFilter || u.role === userRoleFilter)
            .filter((u) => !userStatusFilter || u.status === userStatusFilter)
            .filter((u) => {
                if (!userHasAccount) return true
                return userHasAccount === 'yes' ? u.hasUser : !u.hasUser
            })
            .filter((u) => !branchQ || (u.branch || '').toLowerCase().includes(branchQ))
            .filter((u) => !emailQ || (u.email || '').toLowerCase().includes(emailQ))
            .filter((u) => !q || ((u.name + ' ' + u.username).toLowerCase().includes(q)))
    }, [
        users,
        userRoleFilter,
        userStatusFilter,
        userHasAccount,
        userBranchFilter,
        userEmailSearch,
        userSearch,
    ])
    const userRoleOptions = useMemo(() => {
        const values = new Set()
        users.forEach((u) => {
            if (!u.role || u.role === '-' || u.role === 'NO_USER') return
            String(u.role)
                .split(',')
                .map((r) => r.trim())
                .filter(Boolean)
                .forEach((r) => values.add(r))
        })
        const list = Array.from(values).sort((a, b) => a.localeCompare(b))
        return list.length ? list : USER_ROLE_OPTIONS
    }, [users])
    const merchantRoleOptions = useMemo(
        () => ['MERCHANT_MANAGER', 'MERCHANT_FINANCE', 'MERCHANT_SUPPORT'],
        []
    )
    const userSafeTotalPages = Math.max(1, userTotalPages || 1)

    // Detail content
    const detailContent = useMemo(() => getDetailContent(detailState), [detailState])

    // Update page meta when hash changes
    useEffect(() => {
        setPageMeta(getPageMeta(hash, detailState.backHash))
    }, [hash, detailState.backHash])

    useEffect(() => {
        if (hash !== 'users-roles' && showAddUserPanel) {
            setShowAddUserPanel(false)
        }
    }, [hash, showAddUserPanel])

    // Update active nav link
    useEffect(() => {
        const links = Array.from(document.querySelectorAll('.nav__link'))
        links.forEach((a) => a.classList.remove('is-active'))
        const active = document.querySelector(`.nav__link[href="#${hash}"]`)
        if (active) active.classList.add('is-active')
        setSidebarOpen(false)
    }, [hash])

    useEffect(() => {
        if (!canAccessMerchantPage(hash)) {
            navigate('/forbidden', { replace: true, state: { missing: (MERCHANT_PAGE_PERMISSIONS[hash] || [])[0] } })
        }
    }, [hash, navigate, permissionsVersion])

    useEffect(() => {
        let active = true
        if (hash !== 'detail' || detailState.type !== 'sub' || !detailState.record?.id) {
            return () => {
                active = false
            }
        }

        const loadSubMerchantDetail = async () => {
            try {
                const detail = await fetchMerchantSubMerchant(detailState.record.id)
                if (!active) return
                setDetailState((prev) => ({
                    ...prev,
                        record: {
                            ...prev.record,
                            id: detail.id,
                            code: detail.branchCode,
                            name: detail.branchName,
                            blocked: Boolean(detail.blocked),
                            adminBlocked: Boolean(detail.adminBlocked),
                            adminApproved: detail.adminApproved !== null && detail.adminApproved !== undefined
                                ? Boolean(detail.adminApproved)
                                : true,
                            status: detail.blocked ? 'blocked' : 'active',
                            userId: detail.userId,
                            userEmail: detail.userEmail,
                            userUsername: detail.userUsername,
                            userName: detail.userName,
                    },
                }))
            } catch {
                // ignore detail fetch errors
            }
        }

        loadSubMerchantDetail()
        return () => {
            active = false
        }
    }, [hash, detailState.type, detailState.record?.id])

    useEffect(() => {
        let active = true
        if (hash !== 'detail' || detailState.type !== 'settlement') {
            return () => {
                active = false
            }
        }

        const settlementId =
            detailState.record?.settlementId ??
            detailState.record?.id ??
            detailState.id

        if (!settlementId) {
            setSettlementPayments([])
            setSettlementPaymentsNotice('Settlement ID missing.')
            return () => {
                active = false
            }
        }

        const loadSettlementPayments = async () => {
            try {
                const rows = await fetchMerchantSettlementPayments(settlementId)
                if (!active) return
                const mapped = (Array.isArray(rows) ? rows : []).map((r, idx) => ({
                    rowKey: r.paymentId ?? `PAY-${idx}`,
                    orderId: r.orderId ?? '-',
                    paymentMethod: r.paymentMethod || '-',
                    status: r.status || '-',
                    amount: r.amount ?? 0,
                    commissionAmount: r.commissionAmount ?? 0,
                    netAmount: r.netAmount ?? 0,
                    settledAmount: r.settledAmount ?? 0,
                    providerRef: r.providerRef || '-',
                    successAt: r.successAt ? new Date(r.successAt).toISOString().replace('T', ' ').slice(0, 19) : '-',
                    _raw: r,
                }))
                setSettlementPayments(mapped)
                setSettlementPaymentsNotice('')
            } catch {
                if (active) {
                    setSettlementPayments([])
                    setSettlementPaymentsNotice('Settlement payments API not reachable.')
                }
            }
        }

        loadSettlementPayments()
        return () => {
            active = false
        }
    }, [hash, detailState.type, detailState.record?.id, detailState.id])

    useEffect(() => {
        if (hash === 'create-sub-merchant' && !subForm.id) {
            resetSubForm()
        }
    }, [hash])

    const handleOpenDetail = (type, id, backHash) => {
        const dataMap = {
            collection: merchantPayments,
            refund: refunds,
            settlement: settlements,
            sub: subMerchants,
            report: reportRuns,
            user: users,
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

    const handleRotateApiKeys = async () => {
        if (!canRotateApiKeys) return
        try {
            setApiKeyBusy(true)
            setApiKeyError('')
            const res = await rotateMerchantApiKeys()
            if (res?.apiKey && res?.apiSecret) {
                setApiKeyModalData([{ apiKey: res.apiKey, apiSecret: res.apiSecret }])
                setApiKeyModalOpen(true)
            } else {
                setApiKeyError('Rotate API keys response missing values.')
            }
        } catch (err) {
            setApiKeyError(err?.data?.message || err?.message || 'Failed to rotate API keys.')
        } finally {
            setApiKeyBusy(false)
        }
    }

    const handleLogout = () => {
        clearAuthToken()
        navigate('/')
    }

    const toggleRefundSelection = (key) => {
        setSelectedRefunds((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const toggleAllRefunds = (checked) => {
        if (!checked) {
            setSelectedRefunds(new Set())
            return
        }
        const next = new Set(filteredRefunds.map((r) => r.refundId))
        setSelectedRefunds(next)
    }

    const togglePaymentSelection = (orderId) => {
        const row = refundableCollections.find((r) => String(r.orderId) === String(orderId))
        if (row && isRefundBlocked(row)) {
            setRefundsNotice('Refund blocked for this payment (status or fully refunded).')
            return
        }
        setSelectedPayments((prev) => {
            const next = new Set(prev)
            if (next.has(orderId)) {
                next.delete(orderId)
            } else {
                next.add(orderId)
            }
            return next
        })
    }

    const toggleAllPayments = (checked) => {
        if (!checked) {
            setSelectedPayments(new Set())
            return
        }
        const refundable = refundableCollections
            .filter((r) => !isRefundBlocked(r))
            .map((r) => r.orderId)
        setSelectedPayments(new Set(refundable))
    }

    const copyValue = async (value) => {
        if (!value) return
        try {
            await navigator.clipboard.writeText(value)
        } catch {
            // ignore clipboard errors
        }
    }

    const handleBulkRefund = async () => {
        const selectedRows = refundableCollections.filter((r) => selectedPayments.has(r.orderId))
        if (selectedRows.length === 0) return
        if (!bulkRefundPassword.trim()) {
            setRefundsNotice('Current password is required for bulk refunds.')
            return
        }
        const amountOverride = bulkRefundAmount.trim()
        const parsedAmount = amountOverride && !Number.isNaN(Number(amountOverride)) ? Number(amountOverride) : null
        const reason = bulkRefundReason.trim() || undefined

        try {
            const items = selectedRows
                .filter((row) => row?.orderId && row?.orderId !== '-')
                .filter((row) => !isRefundBlocked(row))
                .map((row) => ({
                    orderId: String(row.orderId),
                    amount: parsedAmount != null ? parsedAmount : row.amount,
                    reason,
                }))
            if (items.length === 0) {
                setRefundsNotice('No refundable payments selected.')
                return
            }
            await initiateMerchantRefundBulk({
                currentPassword: bulkRefundPassword.trim(),
                items,
            })
            setBulkRefundReason('')
            setBulkRefundAmount('')
            setBulkRefundPassword('')
            setSelectedPayments(new Set())
            setRfPage(1)
            setRfRefreshTick((t) => t + 1)
            setRefundsNotice('')
        } catch {
            setRefundsNotice('Unable to initiate refund. Please try again.')
        }
    }

    const handleManualRefund = async () => {
        const orderId = manualOrderId.trim()
        if (!orderId) return
        if (!manualRefundPassword.trim()) {
            setRefundsNotice('Current password is required for refunds.')
            return
        }
        const amountRaw = manualRefundAmount.trim()
        const amount = amountRaw && !Number.isNaN(Number(amountRaw)) ? Number(amountRaw) : undefined
        const reason = manualRefundReason.trim() || undefined
        try {
            await initiateMerchantRefund({
                orderId,
                amount,
                reason,
                currentPassword: manualRefundPassword.trim(),
            })
            setManualOrderId('')
            setManualRefundAmount('')
            setManualRefundReason('')
            setManualRefundPassword('')
            setRfPage(1)
            setRfRefreshTick((t) => t + 1)
            setRefundsNotice('')
        } catch {
            setRefundsNotice('Unable to initiate refund. Please try again.')
        }
    }

    const handleRefundFromPayment = (row) => {
        if (!row || !row.orderId) return
        if (isRefundBlocked(row)) {
            setRefundsNotice('Refund blocked for this payment (status or fully refunded).')
            setHash('refunds')
            return
        }
        setManualOrderId(String(row.orderId))
        const remaining = getRefundableRemaining(row)
        if (remaining > 0) {
            setManualRefundAmount(String(remaining))
        }
        setShowRefundInitiate(true)
        setHash('refunds')
    }

    const handleGlobalSearchKey = (e) => {
        if (e.key === 'Enter') {
            // eslint-disable-next-line no-alert
            alert('Global search (UI demo). Connect API later.')
        }
    }

    const resetSubForm = () => {
        setSubForm({
            id: null,
            branchCode: '',
            branchName: '',
            blocked: true,
            adminBlocked: false,
            adminApproved: false,
            createUser: false,
            userName: '',
            userEmail: '',
            userUsername: '',
            userPassword: '',
            userRoleName: '',
            userPermissions: [],
            userPermissionSearch: '',
        })
    }

    const reloadSubMerchants = async () => {
        const page = await fetchMerchantSubMerchants({ page: 0, size: 200 })
        const rows = Array.isArray(page?.content) ? page.content : []
        setSubMerchants(mapSubMerchants(rows))
    }

    const handleEditSubMerchant = (row) => {
        setSubForm({
            id: row.id,
            branchCode: row.code || '',
            branchName: row.name || '',
            blocked: Boolean(row.blocked),
            adminBlocked: Boolean(row.adminBlocked),
            adminApproved: Boolean(row.adminApproved),
            createUser: false,
            userName: '',
            userEmail: '',
            userUsername: '',
            userPassword: '',
            userRoleName: '',
            userPermissions: [],
            userPermissionSearch: '',
        })
        setHash('create-sub-merchant')
    }

    const handleSubmitSubMerchant = async (e) => {
        e.preventDefault()
        try {
            const payload = {
                branchCode: subForm.branchCode.trim(),
                branchName: subForm.branchName.trim(),
                blocked: subForm.id ? Boolean(subForm.blocked) : true,
            }
            if (!payload.branchCode || !payload.branchName) {
                setApiNotice('Branch code and name are required.')
                return
            }
            if (subForm.id) {
                await updateMerchantSubMerchant(subForm.id, payload)
            } else {
                if (subForm.createUser) {
                    if (subForm.userPermissions.length > 0 && !subForm.userRoleName.trim()) {
                        setApiNotice('Role name is required when selecting permissions.')
                        return
                    }
                    payload.user = {
                        name: subForm.userName.trim(),
                        email: subForm.userEmail.trim(),
                        username: subForm.userUsername.trim(),
                        password: subForm.userPassword,
                        roleName: subForm.userRoleName.trim() || undefined,
                        permissions: subForm.userPermissions.length > 0 ? subForm.userPermissions : undefined,
                    }
                }
                await createMerchantSubMerchant(payload)
            }
            resetSubForm()
            await reloadSubMerchants()
            setHash('sub-merchants')
            setApiNotice('')
        } catch {
            setApiNotice('Unable to save sub-merchant. Please try again.')
        }
    }

    const handleCreateSubMerchantUser = async (id) => {
        if (!id) return
        if (subUserForm.permissions.length > 0 && !subUserForm.roleName.trim()) {
            setApiNotice('Role name is required when selecting permissions.')
            return
        }
        try {
            await createMerchantSubMerchantUser(id, {
                name: subUserForm.name.trim(),
                email: subUserForm.email.trim(),
                username: subUserForm.username.trim(),
                password: subUserForm.password,
                roleName: subUserForm.roleName.trim() || undefined,
                permissions: subUserForm.permissions.length > 0 ? subUserForm.permissions : undefined,
            })
            setSubUserForm({ name: '', email: '', username: '', password: '', roleName: '', permissions: [], permissionSearch: '' })
            const detail = await fetchMerchantSubMerchant(id)
            setDetailState((prev) => ({
                ...prev,
                record: {
                    ...prev.record,
                    userId: detail.userId,
                    userEmail: detail.userEmail,
                    userUsername: detail.userUsername,
                    userName: detail.userName,
                },
            }))
        } catch {
            setApiNotice('Unable to create sub-merchant user. Please try again.')
        }
    }

    const handleCreateUserForBranch = async () => {
        const isMerchantUser = addUserForm.userType === 'merchant'
        const id = addUserForm.subMerchantId
        if (!isMerchantUser && !id) {
            setApiNotice('Please select a branch.')
            return
        }
        if (addUserForm.permissions.length > 0 && !addUserForm.roleName.trim()) {
            setApiNotice('Role name is required when selecting permissions.')
            return
        }
        try {
            const payload = {
                name: addUserForm.name.trim(),
                email: addUserForm.email.trim(),
                username: addUserForm.username.trim(),
                password: addUserForm.password,
                roleName: isMerchantUser ? (addUserForm.roleName.trim() || undefined) : 'SUB_MERCHANT',
            }
            if (isMerchantUser) {
                await createMerchantUser(payload)
            } else {
                await createMerchantSubMerchantUser(id, payload)
            }
            setAddUserForm({
                userType: 'merchant',
                subMerchantId: '',
                name: '',
                email: '',
                username: '',
                password: '',
                roleName: '',
                permissions: [],
                permissionSearch: '',
            })
            if (!isMerchantUser) {
                await reloadSubMerchants()
            }
            setUserRefreshTick((t) => t + 1)
            setShowAddUserPanel(false)
            setApiNotice('')
        } catch {
            setApiNotice('Unable to create user. Please try again.')
        }
    }

    const handleToggleSubMerchant = async (row) => {
        if (!row?.id) return
        if (row.adminBlocked) {
            setApiNotice('This sub-merchant is blocked by admin and cannot be changed.')
            return
        }
        if (!row.adminApproved) {
            setApiNotice('This sub-merchant needs admin approval before you can activate it.')
            return
        }
        const nextBlocked = !row.blocked
        try {
            await updateMerchantSubMerchant(row.id, { blocked: nextBlocked })
            setSubMerchants((prev) =>
                prev.map((item) =>
                    item.id === row.id
                        ? { ...item, blocked: nextBlocked, status: nextBlocked ? 'blocked' : 'active' }
                        : item
                )
            )
        } catch {
            setApiNotice('Unable to update sub-merchant status. Please try again.')
        }
    }

    const toggleSubFormPermission = (perm) => {
        setSubForm((prev) => {
            const next = new Set(prev.userPermissions)
            if (next.has(perm)) {
                next.delete(perm)
            } else {
                next.add(perm)
            }
            return { ...prev, userPermissions: Array.from(next) }
        })
    }

    const toggleSubUserPermission = (perm) => {
        setSubUserForm((prev) => {
            const next = new Set(prev.permissions)
            if (next.has(perm)) {
                next.delete(perm)
            } else {
                next.add(perm)
            }
            return { ...prev, permissions: Array.from(next) }
        })
    }

    const toggleAddUserPermission = (perm) => {
        setAddUserForm((prev) => {
            const next = new Set(prev.permissions)
            if (next.has(perm)) {
                next.delete(perm)
            } else {
                next.add(perm)
            }
            return { ...prev, permissions: Array.from(next) }
        })
    }

    const handlePrimaryAction = () => {
        if (detailState.type === 'sub' && detailState.record) {
            const shopValue = detailState.record.code || detailState.record.name || ''
            if (shopValue) {
                setColShop(shopValue)
            }
            setHash('collections')
            return
        }
        // eslint-disable-next-line no-alert
        alert(`Primary action (UI demo) for ${detailState.type} / ${detailState.id}`)
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex items-center justify-center px-6">
                <div className="max-w-md w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-6 text-center shadow-card">
                    <div className="text-lg font-semibold">Access denied</div>
                    <div className="mt-2 text-sm text-[var(--color-text-secondary)]/80">
                        Contact support. (null)
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans"
            style={{ '--sidebar-pad': '300px' }}
        >
            <div className="relative">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                activeMenu={hash}
                sections={filteredNavigation}
                brand={{ name: 'Merchant Portal', sub: 'ABC Traders - Admin' }}
                onLogout={null}
                footer={
                    <div className="text-xs text-[var(--color-text-secondary)]/80 leading-relaxed">
                        <div><strong>Scoping Rule</strong></div>
                        <div className="mt-1">Merchant can only see their own data.</div>
                        <div className="mt-1">Shop operator can only see their shop.</div>
                    </div>
                }
            />

            <div className="w-full min-w-0 flex flex-col layout-pad">
                <main className="flex-1 flex flex-col">
                    <Topbar
                        title={pageMeta.title}
                        crumbs={pageMeta.crumbs}
                        onToggle={() => setSidebarOpen(true)}
                        showMenu={!sidebarOpen}
                        portalLinks={[
                            {
                                label: 'Merchant Portal',
                                onClick: () => navigate('/merchant'),
                                active: true,
                            },
                            {
                                label: 'Admin Portal',
                                onClick: () => navigate('/admin'),
                                active: false,
                            },
                        ]}
                        actions={
                            <>
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]/50" size={14} aria-hidden="true" />
                                <input
                                    className="h-9 w-48 lg:w-64 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-9 pr-4 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)] placeholder:text-[var(--color-text-secondary)]/40"
                                    id="globalSearch"
                                    name="globalSearch"
                                    placeholder="Search..."
                                    autoComplete="off"
                                    onKeyDown={handleGlobalSearchKey}
                                />
                            </div>
                            <ThemeMenu />
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    className="h-10 w-10 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] grid place-items-center"
                                    type="button"
                                    onClick={() => setUserMenuOpen((open) => !open)}
                                    aria-label="Open user menu"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] grid place-items-center text-xs font-semibold">
                                        {merchantInitials}
                                    </div>
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-card overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[var(--color-border-soft)]">
                                            <div className="text-sm font-semibold text-[var(--color-text-primary)]">{merchantName}</div>
                                            <div className="text-xs text-[var(--color-text-secondary)]/80">{merchantLabel}</div>
                                        </div>
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-white/[0.06] transition"
                                            type="button"
                                            onClick={() => {
                                                setHash('security')
                                                setUserMenuOpen(false)
                                            }}
                                        >
                                            <Settings size={14} />
                                            Change Password
                                        </button>
                                        <div className="border-t border-[var(--color-border-soft)]" />
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-white/[0.06] transition"
                                            type="button"
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={14} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                            {showContextButton && (
                                <a
                                    className="flex h-9 items-center justify-center rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-3 sm:px-4 text-xs sm:text-[13px] font-bold text-[var(--color-text-primary)] transition hover:bg-[var(--color-accent-soft-hover)]"
                                    href={pageMeta.btnHref}
                                    id="contextBtn"
                                >
                                    {pageMeta.btnText}
                                </a>
                            )}
                            </>
                        }
                    />

                    <section className="pt-4 sm:pt-5 px-4 sm:px-6 lg:px-8 pb-6 space-y-6">
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
                        {refundsNotice && (
                            <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                                {refundsNotice}
                            </div>
                        )}
                        {balanceInfo?.payoutFreeze && (
                            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                <div className="font-semibold">Payouts are currently frozen</div>
                                <div className="mt-1 text-xs text-red-100/80">
                                    Reason: {balanceInfo?.payoutFreezeReason || 'No reason provided.'}
                                </div>
                            </div>
                        )}
                        {/* Dashboard Page */}
                        <div id="dashboard" className={hash === 'dashboard' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {canViewCollections && (
                                <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-5 shadow-sm transition hover:bg-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)]/80 tracking-wide uppercase">Collections (Today)</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgba(47,208,122,0.12)] text-[var(--color-success)] border-[rgba(47,208,122,0.25)]">
                                            <span className="w-1 h-1 rounded-full bg-[var(--color-success)] mr-1.5" /> Live
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            {fmtPKR(dashboardStats.collectionsTodayAmount)}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-white/5">
                                                Count: {dashboardStats.collectionsTodayCount}
                                            </span>
                                            <span className="text-[11px] text-[var(--color-text-secondary)]/60">-</span>
                                        </div>
                                    </div>
                                </article>
                                )}

                                {canViewCollections && (
                                <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-5 shadow-sm transition hover:bg-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)]/80 tracking-wide uppercase">Success Rate</h3>
                                        <span className="text-[11px] text-[var(--color-text-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">30d</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            {dashboardStats.successRate.toFixed(1)}%
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-white/5">
                                                Failed: {dashboardStats.failedCount}
                                            </span>
                                            <span className="text-[11px] font-medium text-[var(--color-warning)]">
                                                Pending: {dashboardStats.pendingCount}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                                )}

                                {canViewRefunds && (
                                <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-5 shadow-sm transition hover:bg-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)]/80 tracking-wide uppercase">Refunds (Today)</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgba(255,204,102,0.12)] text-[var(--color-warning)] border-[rgba(255,204,102,0.25)]">
                                            <span className="w-1 h-1 rounded-full bg-[var(--color-warning)] mr-1.5" /> Review
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            {fmtPKR(dashboardStats.refundsTodayAmount)}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-white/5">
                                                Count: {dashboardStats.refundsTodayCount}
                                            </span>
                                            <span className="text-[11px] text-[var(--color-text-secondary)]/60">-</span>
                                        </div>
                                    </div>
                                </article>
                                )}

                                {canViewSettlements && (
                                <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-5 shadow-sm transition hover:bg-white/[0.06]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)]/80 tracking-wide uppercase">Pending Settlements</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgba(255,204,102,0.12)] text-[var(--color-warning)] border-[rgba(255,204,102,0.25)]">
                                            <span className="w-1 h-1 rounded-full bg-[var(--color-warning)] mr-1.5" /> Pending
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            {fmtPKR(dashboardStats.pendingSettlementsAmount)}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-white/5">
                                                Runs: {dashboardStats.pendingSettlementsRuns}
                                            </span>
                                            <span className="text-[11px] text-[var(--color-text-secondary)]/60">Weekly</span>
                                        </div>
                                    </div>
                                </article>
                                )}
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
                                <article className="xl:col-span-2 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-5 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-[var(--color-text-primary)]">Transaction Trend</div>
                                            <div className="text-xs text-[var(--color-text-secondary)]/70">Based on Collections filters</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-[260px]">
                                        {trendSeries.length === 0 ? (
                                            <div className="h-full grid place-items-center text-xs text-[var(--color-text-secondary)]/70">
                                                No data for selected range.
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={trendSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                                    <XAxis dataKey="label" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
                                                    <YAxis stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} width={32} />
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-chart-tooltip-border)', borderRadius: 10 }}
                                                        labelStyle={{ color: 'var(--color-text-primary)' }}
                                                        itemStyle={{ color: 'var(--color-text-primary)' }}
                                                    />
                                                    <Area type="monotone" dataKey="success" stroke="var(--color-success)" fill="rgba(34,197,94,0.12)" strokeWidth={2} />
                                                    <Area type="monotone" dataKey="pending" stroke="var(--color-warning)" fill="rgba(245,158,11,0.12)" strokeWidth={2} />
                                                    <Area type="monotone" dataKey="failed" stroke="var(--color-danger)" fill="rgba(239,68,68,0.12)" strokeWidth={2} />
                                                    <Area type="monotone" dataKey="initiated" stroke="var(--color-accent)" fill="rgba(90,167,255,0.12)" strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </article>

                                {canViewCollections && (
                                    <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-5 shadow-sm">
                                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">Payment Methods</div>
                                        <div className="text-xs text-[var(--color-text-secondary)]/70">Based on Collections filters</div>
                                        <div className="mt-4 h-[260px]">
                                            {methodSplit.length === 0 ? (
                                                <div className="h-full grid place-items-center text-xs text-[var(--color-text-secondary)]/70">
                                                    No data for selected range.
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={methodSplit}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            innerRadius={45}
                                                            outerRadius={85}
                                                            paddingAngle={2}
                                                        >
                                                            {methodSplit.map((entry, index) => (
                                                                <Cell
                                                                    key={`${entry.name}-${index}`}
                                                                    fill={['var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', 'var(--color-accent-hover)', 'var(--color-success)', 'var(--color-text-muted)'][index % 7]}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value, name) => [`${name} : ${value}`, '']}
                                                            contentStyle={{
                                                                background: 'rgba(8, 12, 20, 0.96)',
                                                                border: '1px solid var(--color-border-soft)',
                                                                borderRadius: 10,
                                                                color: 'var(--color-text-inverse)',
                                                                fontWeight: 600,
                                                                fontSize: '12px',
                                                            }}
                                                            labelStyle={{ color: 'var(--color-text-inverse)', fontWeight: 600 }}
                                                            itemStyle={{ color: 'var(--color-text-inverse)', fontWeight: 600 }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </article>
                                )}
                            </div>

                            {canViewCollections && (
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Recent Collections</h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Latest</span>
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
                                        <ShopFilter value={colShop} onChange={setColShop} shops={shopOptions} />
                                        <ClearableInput
                                            className="min-w-[170px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Payment Method"
                                            value={colPaymentMethod}
                                            onChange={(e) => setColPaymentMethod(e.target.value)}
                                        />
                                        <SearchFilter
                                            value={colSearch}
                                            onChange={setColSearch}
                                            placeholder="Search Order ID / Provider Ref"
                                        />
                                    </FilterBar>

                                    <DataTable
                                        columns={COLLECTION_COLUMNS}
                                        data={dashboardCollections}
                                        keyField="orderId"
                                        renderActions={(r) => (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                                type="button"
                                                onClick={() => handleOpenDetail('collection', r.orderId, 'dashboard')}
                                            >
                                                View
                                            </button>
                                        )}
                                    />
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                        <div>
                                            Page {dashPage} of {dashTotalPages} - Total {filteredCollections.length}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>Items per page:</span>
                                            <select
                                                className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)]"
                                                value={dashPageSize}
                                                onChange={(e) => {
                                                    setDashPageSize(Number(e.target.value))
                                                    setDashPage(1)
                                                }}
                                            >
                                                {[8, 20, 50, 100].map((size) => (
                                                    <option key={size} value={size}>
                                                        {size}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] disabled:opacity-50"
                                                type="button"
                                                disabled={dashPage <= 1}
                                                onClick={() => setDashPage((p) => Math.max(p - 1, 1))}
                                            >
                                                Prev
                                            </button>
                                            <button
                                                className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] disabled:opacity-50"
                                                type="button"
                                                disabled={dashPage >= dashTotalPages}
                                                onClick={() => setDashPage((p) => Math.min(p + 1, dashTotalPages))}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                            )}
                        </div>

                        {/* Sub-Merchants Page */}
                        {canViewSubMerchants && (
                        <div
                            id="sub-merchants"
                            className={hash === 'sub-merchants' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}
                        >
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Sub-Merchants (Shops / Collection Points)</h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Total: 3</span>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        <StatusFilter value={subStatus} onChange={setSubStatus} options={SUB_MERCHANT_STATUS_OPTIONS} />
                                        <SearchFilter
                                            value={subSearch}
                                            onChange={setSubSearch}
                                            placeholder="Search Branch Code / Name"
                                        />
                                    </FilterBar>
                                    {reportError && (
                                        <div className="mb-3 text-xs text-[var(--color-warning)]">{reportError}</div>
                                    )}

                                    <DataTable
                                        columns={SUB_MERCHANT_COLUMNS}
                                        data={filteredSubMerchants}
                                        keyField="code"
                                        renderActions={(r) => (
                                            <>
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                                    type="button"
                                                    onClick={() => handleOpenDetail('sub', r.code, 'sub-merchants')}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                                    type="button"
                                                    onClick={() => handleEditSubMerchant(r)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className={`h-9 px-4 rounded-xl border transition text-xs font-medium ${
                                                        r.adminBlocked || !r.adminApproved
                                                            ? 'border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]/60 cursor-not-allowed'
                                                            : r.blocked
                                                                ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] text-[var(--color-text-primary)]'
                                                                : 'border-[rgba(255,90,122,0.35)] bg-[rgba(255,90,122,0.18)] hover:bg-[rgba(255,90,122,0.25)] text-[var(--color-danger)]'
                                                    }`}
                                                    type="button"
                                                    onClick={() => handleToggleSubMerchant(r)}
                                                    disabled={r.adminBlocked || !r.adminApproved}
                                                >
                                                    {r.adminBlocked
                                                        ? 'Admin Blocked'
                                                        : !r.adminApproved
                                                            ? 'Awaiting Approval'
                                                            : (r.blocked ? 'Unblock' : 'Block')}
                                                </button>
                                            </>
                                        )}
                                    />
                                </div>
                            </article>
                        </div>
                        )}

                        {/* Create Sub-Merchant Page */}
                        {canCreateSubMerchant && (
                        <div
                            id="create-sub-merchant"
                            className={hash === 'create-sub-merchant' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}
                        >
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                                        {subForm.id ? 'Update Sub-Merchant' : 'Create Sub-Merchant'}
                                    </h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Shop / Collection Point</span>
                                </div>
                                <form className="p-4" onSubmit={handleSubmitSubMerchant}>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <input
                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Branch Code"
                                            value={subForm.branchCode}
                                            onChange={(e) => setSubForm((s) => ({ ...s, branchCode: e.target.value }))}
                                        />
                                        <input
                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Branch Name"
                                            value={subForm.branchName}
                                            onChange={(e) => setSubForm((s) => ({ ...s, branchName: e.target.value }))}
                                        />
                                        <select
                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            value={subForm.blocked ? 'blocked' : 'active'}
                                            onChange={(e) => setSubForm((s) => ({ ...s, blocked: e.target.value === 'blocked' }))}
                                            disabled={
                                                !subForm.id
                                                || Boolean(subForm.adminBlocked)
                                                || !Boolean(subForm.adminApproved)
                                            }
                                        >
                                            <option value="active">Status: Active</option>
                                            <option value="blocked">Status: Blocked</option>
                                        </select>
                                        {!subForm.id && (
                                            <div className="text-[11px] text-[var(--color-text-secondary)]/70">
                                                New sub-merchants start inactive until admin approves.
                                            </div>
                                        )}
                                        {subForm.id && subForm.adminBlocked && (
                                            <div className="text-[11px] text-[var(--color-danger)]">
                                                Blocked by admin. You cannot override this.
                                            </div>
                                        )}
                                        {subForm.id && !subForm.adminApproved && !subForm.adminBlocked && (
                                            <div className="text-[11px] text-[var(--color-danger)]">
                                                Awaiting admin approval before activation.
                                            </div>
                                        )}
                                    </div>

                                    {canCreateSubMerchant && !subForm.id && (
                                    <div className="mt-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                                        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]/90">
                                            <input
                                                type="checkbox"
                                                checked={subForm.createUser}
                                                onChange={(e) => setSubForm((s) => ({ ...s, createUser: e.target.checked }))}
                                            />
                                            Create user for this branch
                                        </label>
                                        {subForm.createUser && (
                                            <div className="mt-3 grid grid-cols-1 gap-3">
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                    <input
                                                        className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        placeholder="Full Name"
                                                        value={subForm.userName}
                                                        onChange={(e) => setSubForm((s) => ({ ...s, userName: e.target.value }))}
                                                    />
                                                    <input
                                                        className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        placeholder="Email"
                                                        value={subForm.userEmail}
                                                        autoComplete="off"
                                                        name="sub-merchant-user-email"
                                                        onChange={(e) => setSubForm((s) => ({ ...s, userEmail: e.target.value }))}
                                                    />
                                                    <input
                                                        className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        placeholder="Username"
                                                        value={subForm.userUsername}
                                                        onChange={(e) => setSubForm((s) => ({ ...s, userUsername: e.target.value }))}
                                                    />
                                                    <input
                                                        className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        placeholder="Password"
                                                        type="password"
                                                        value={subForm.userPassword}
                                                        autoComplete="new-password"
                                                        name="sub-merchant-user-password"
                                                        onChange={(e) => setSubForm((s) => ({ ...s, userPassword: e.target.value }))}
                                                    />
                                                </div>
                                                <input
                                                    className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    placeholder="Role Name (MERCHANT_*)"
                                                    value={subForm.userRoleName}
                                                    onChange={(e) => setSubForm((s) => ({ ...s, userRoleName: e.target.value }))}
                                                />
                                                <input
                                                    className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    placeholder="Search permissions..."
                                                    value={subForm.userPermissionSearch}
                                                    onChange={(e) => setSubForm((s) => ({ ...s, userPermissionSearch: e.target.value }))}
                                                />
                                                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 max-h-44 overflow-y-auto">
                                                    {filteredUserPerms.length === 0 ? (
                                                        <div className="text-xs text-[var(--color-text-secondary)]/70">No permissions found.</div>
                                                    ) : (
                                                        <div className="grid gap-2">
                                                            {filteredUserPerms.map((perm) => (
                                                                <label key={perm} className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={subForm.userPermissions.includes(perm)}
                                                                        onChange={() => toggleSubFormPermission(perm)}
                                                                    />
                                                                    <span>{perm}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    )}

                                    <div className="filters" style={{ justifyContent: 'flex-end' }}>
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                            type="button"
                                            onClick={() => {
                                                resetSubForm()
                                                setHash('sub-merchants')
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        {canCreateSubMerchant && (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs font-medium text-[var(--color-text-primary)]"
                                                type="submit"
                                            >
                                                {subForm.id ? 'Update Sub-Merchant' : 'Create Sub-Merchant'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </article>
                        </div>
                        )}

                        {/* Collections Page */}
                        {canViewCollections && (
                        <div id="collections" className={hash === 'collections' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Collections</h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Transactions</span>
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
                                        <ShopFilter value={colShop} onChange={setColShop} shops={shopOptions} />
                                        <ClearableInput
                                            className="min-w-[170px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Payment Method"
                                            value={colPaymentMethod}
                                            onChange={(e) => setColPaymentMethod(e.target.value)}
                                        />
                                        <SearchFilter
                                            value={colSearch}
                                            onChange={setColSearch}
                                            placeholder="Search Order ID / Provider Ref"
                                        />
                                        {canExportReports && (
                                            <ExportMenu
                                                onExportCSV={() => {
                                                    const payload = buildExportPayload(
                                                        filteredCollections.map((r) => ({ ...r, date: r.date })),
                                                        COLLECTION_CSV_COLUMNS
                                                    )
                                                    exportDataToCSV(payload.rows, payload.columns, 'collections.csv')
                                                }}
                                                onExportPDF={() => {
                                                    const payload = buildExportPayload(
                                                        filteredCollections.map((r) => ({ ...r, date: r.date })),
                                                        COLLECTION_CSV_COLUMNS
                                                    )
                                                    exportDataToPDF(payload.rows, payload.columns, {
                                                        title: 'Collections',
                                                        filename: 'collections.pdf',
                                                    })
                                                }}
                                            />
                                        )}
                                    </FilterBar>

                                    <DataTable
                                        columns={COLLECTION_COLUMNS}
                                        data={filteredCollections}
                                        keyField="orderId"
                                        renderActions={(r) => (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                                    type="button"
                                                    onClick={() => handleOpenDetail('collection', r.orderId, 'collections')}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        )}
                                    />
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                        <div>
                                            Page {colPage} of {colSafeTotalPages} - Total {colTotalElements}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>Items per page:</span>
                                            <select
                                                value={colPageSize}
                                                onChange={(e) => {
                                                    setColPageSize(Number(e.target.value))
                                                    setColPage(1)
                                                }}
                                                className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)]"
                                            >
                                                {[10, 20, 50, 100].map((size) => (
                                                    <option key={size} value={size}>
                                                        {size}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition"
                                                type="button"
                                                disabled={colPage <= 1}
                                                onClick={() => setColPage((p) => Math.max(p - 1, 1))}
                                            >
                                                Prev
                                            </button>
                                            <button
                                                className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition"
                                                type="button"
                                                disabled={colPage >= colSafeTotalPages}
                                                onClick={() => setColPage((p) => Math.min(p + 1, colSafeTotalPages))}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </div>
                        )}

                        {/* Refunds Page */}
                        {canViewRefunds && (
                        <div id="refunds" className={hash === 'refunds' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Refunds</h3>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[rgba(255,204,102,0.12)] text-[var(--color-warning)] border-[rgba(255,204,102,0.25)]">
                                        <span className="w-1 h-1 rounded-full bg-[var(--color-warning)] mr-1.5" /> Review
                                    </span>
                                </div>
                                <div className="p-4">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-xs text-[var(--color-text-secondary)]/70">
                                            Review refund history and initiate new refunds when needed.
                                        </div>
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs font-medium text-[var(--color-text-primary)] disabled:opacity-50"
                                            type="button"
                                            onClick={() => {
                                                setShowRefundInitiate((v) => {
                                                    const next = !v
                                                    if (!next) {
                                                        setSelectedPayments(new Set())
                                                        setBulkRefundAmount('')
                                                        setBulkRefundReason('')
                                                        setBulkRefundPassword('')
                                                    }
                                                    return next
                                                })
                                            }}
                                            disabled={!canCreateRefund}
                                        >
                                            {showRefundInitiate ? 'Close Refund Form' : 'Initiate Refund'}
                                        </button>
                                    </div>

                                    {!showRefundInitiate && (
                                        <>
                                            <FilterBar>
                                                <DateRangeFilter fromValue={rfFrom} toValue={rfTo} onFromChange={setRfFrom} onToChange={setRfTo} />
                                                <StatusFilter value={rfStatus} onChange={setRfStatus} options={REFUND_STATUS_OPTIONS} />
                                                <ShopFilter value={rfShop} onChange={setRfShop} shops={shopOptions} />
                                                <SearchFilter
                                                    value={rfSearch}
                                                    onChange={setRfSearch}
                                                    placeholder="Search Refund ID / Order ID"
                                                />
                                                {canExportReports && (
                                                    <ExportMenu
                                                        onExportCSV={() => {
                                                            const payload = buildExportPayload(
                                                                filteredRefunds.map((r) => ({ ...r })),
                                                                REFUND_CSV_COLUMNS
                                                            )
                                                            exportDataToCSV(payload.rows, payload.columns, 'refunds.csv')
                                                        }}
                                                        onExportPDF={() => {
                                                            const payload = buildExportPayload(
                                                                filteredRefunds.map((r) => ({ ...r })),
                                                                REFUND_CSV_COLUMNS
                                                            )
                                                            exportDataToPDF(payload.rows, payload.columns, {
                                                                title: 'Refunds',
                                                                filename: 'refunds.pdf',
                                                            })
                                                        }}
                                                    />
                                                )}
                                            </FilterBar>

                                            <DataTable
                                                columns={REFUND_COLUMNS}
                                                data={filteredRefunds}
                                                keyField="refundId"
                                                renderActions={(r) => (
                                                    <button
                                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                                        type="button"
                                                        onClick={() => handleOpenDetail('refund', r.refundId, 'refunds')}
                                                    >
                                                        View
                                                    </button>
                                                )}
                                            />
                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                                <div>
                                                    Page {rfPage} of {Math.max(rfTotalPages || 1, 1)} - Total {rfTotalElements}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>Items per page:</span>
                                                    <select
                                                        className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)]"
                                                        value={rfPageSize}
                                                        onChange={(e) => {
                                                            setRfPageSize(Number(e.target.value))
                                                            setRfPage(1)
                                                        }}
                                                    >
                                                        {[10, 20, 50, 100].map((size) => (
                                                            <option key={size} value={size}>
                                                                {size}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] disabled:opacity-50"
                                                        type="button"
                                                        disabled={rfPage <= 1}
                                                        onClick={() => setRfPage((p) => Math.max(p - 1, 1))}
                                                    >
                                                        Prev
                                                    </button>
                                                    <button
                                                        className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] disabled:opacity-50"
                                                        type="button"
                                                        disabled={rfPage >= Math.max(rfTotalPages || 1, 1)}
                                                        onClick={() => setRfPage((p) => p + 1)}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {showRefundInitiate && (
                                        <div className="mt-6 grid gap-4">
                                            <div className="grid gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                                                <div className="text-xs text-[var(--color-text-secondary)]/80">
                                                    Initiate a refund for a specific order. Refunds are blocked for disputed/chargeback payments.
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                    <ClearableInput
                                                        value={manualOrderId}
                                                        onChange={(e) => setManualOrderId(e.target.value)}
                                                        placeholder="Order ID"
                                                        inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    <ClearableInput
                                                        value={manualRefundAmount}
                                                        onChange={(e) => setManualRefundAmount(e.target.value)}
                                                        placeholder="Amount (optional)"
                                                        inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    <ClearableInput
                                                        value={manualRefundReason}
                                                        onChange={(e) => setManualRefundReason(e.target.value)}
                                                        placeholder="Reason (optional)"
                                                        inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    <ClearableInput
                                                        value={manualRefundPassword}
                                                        onChange={(e) => setManualRefundPassword(e.target.value)}
                                                        placeholder="Current password"
                                                        type="password"
                                                        inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]/70">
                                                    <button
                                                        className="h-9 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs font-medium text-[var(--color-text-primary)] disabled:opacity-50"
                                                        type="button"
                                                        onClick={handleManualRefund}
                                                        disabled={!canCreateRefund || !manualOrderId.trim()}
                                                    >
                                                        Initiate Refund
                                                    </button>
                                                    <span>Commission policy applies based on merchant settings.</span>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                                                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]/80">
                                                    <span className="text-[12px] font-medium text-[var(--color-text-primary)]">Select Payment</span>
                                                    <span>Pick a refundable SUCCESS payment and click Refund.</span>
                                                </div>
                                                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]/80">
                                                    <span className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[11px] text-[var(--color-text-primary)]">
                                                        Selected: {selectedPayments.size}
                                                    </span>
                                                    {selectedPayments.size <= 1 && (
                                                        <ClearableInput
                                                            value={bulkRefundAmount}
                                                            onChange={(e) => setBulkRefundAmount(e.target.value)}
                                                            placeholder="Amount (optional)"
                                                            inputClassName="h-8 w-36 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        />
                                                    )}
                                                    <ClearableInput
                                                        value={bulkRefundReason}
                                                        onChange={(e) => setBulkRefundReason(e.target.value)}
                                                        placeholder="Reason (optional)"
                                                        inputClassName="h-8 w-44 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    <ClearableInput
                                                        value={bulkRefundPassword}
                                                        onChange={(e) => setBulkRefundPassword(e.target.value)}
                                                        placeholder="Current password"
                                                        type="password"
                                                        inputClassName="h-8 w-44 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    <button
                                                        className="h-8 px-3 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs font-medium text-[var(--color-text-primary)] disabled:opacity-50"
                                                        type="button"
                                                        onClick={handleBulkRefund}
                                                        disabled={!canCreateRefund || selectedPayments.size === 0}
                                                    >
                                                        Refund Selected
                                                    </button>
                                                </div>
                                                <DataTable
                                                    columns={COLLECTION_COLUMNS}
                                                    data={refundPayRows}
                                                    keyField="orderId"
                                                    selectable
                                                    selectedKeys={selectedPayments}
                                                    onToggleRow={togglePaymentSelection}
                                                    onToggleAll={toggleAllPayments}
                                                    renderActions={(r) => (
                                                        <button
                                                            className="h-9 px-3 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs text-[var(--color-text-primary)] font-medium disabled:opacity-50"
                                                            type="button"
                                                            onClick={() => handleRefundFromPayment(r)}
                                                            disabled={isRefundBlocked(r)}
                                                        >
                                                            Refund
                                                        </button>
                                                    )}
                                                />
                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                                    <div>
                                                        Page {refundPayPageSafe} of {refundPayTotalPages} - Total {refundableCollections.length}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span>Items per page:</span>
                                                        <select
                                                            value={refundPayPageSize}
                                                            onChange={(e) => {
                                                                setRefundPayPageSize(Number(e.target.value))
                                                                setRefundPayPage(1)
                                                            }}
                                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)]"
                                                        >
                                                            {[5, 10, 20, 50].map((size) => (
                                                                <option key={size} value={size}>
                                                                    {size}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition"
                                                            type="button"
                                                            disabled={refundPayPageSafe <= 1}
                                                            onClick={() => setRefundPayPage((p) => Math.max(p - 1, 1))}
                                                        >
                                                            Prev
                                                        </button>
                                                        <button
                                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition"
                                                            type="button"
                                                            disabled={refundPayPageSafe >= refundPayTotalPages}
                                                            onClick={() => setRefundPayPage((p) => Math.min(p + 1, refundPayTotalPages))}
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </article>
                        </div>
                        )}

                        {/* Balance Page */}
                        {canViewBalance && (
                        <div
                            id="balance"
                            className={hash === 'balance' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}
                        >
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Balance</h3>
                                    <button
                                        className="h-8 px-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={loadBalance}
                                        disabled={balanceBusy}
                                    >
                                        {balanceBusy ? 'Loading...' : 'Refresh'}
                                    </button>
                                </div>
                                <div className="p-4 space-y-4">
                                    {balanceError && (
                                        <div className="text-xs text-[var(--color-warning)]">{balanceError}</div>
                                    )}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">
                                                Current Balance
                                            </div>
                                            <div className={`text-2xl font-semibold ${Number(balanceInfo?.balanceAmount || 0) < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                                                {fmtPKR(balanceInfo?.balanceAmount ?? 0)}
                                            </div>
                                        <div className="text-xs text-[var(--color-text-secondary)]/70 mt-2">
                                            Currency: {balanceInfo?.currency || 'PKR'}
                                        </div>
                                        <div className="text-xs text-[var(--color-text-secondary)]/70 mt-1">
                                            Updated: {formatBalanceUpdatedAt(balanceInfo?.updatedAt)}
                                        </div>
                                    </div>
                                        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">
                                                Note
                                            </div>
                                            <div className="text-xs text-[var(--color-text-secondary)]/80 leading-relaxed">
                                                Negative balance means carry-forward due to refunds or chargebacks. Payouts will resume once balance is positive.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </div>
                        )}

                        {/* Settlements Page */}
                        {canViewSettlements && (
                        <div
                            id="settlements"
                            className={hash === 'settlements' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}
                        >
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Settlements</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Finance</span>
                                      <div className="relative group">
                                          <button
                                              type="button"
                                              className="h-8 w-8 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition grid place-items-center text-[var(--color-text-primary)] shadow-[0_8px_20px_rgba(2,8,23,0.45)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                                              aria-label="Settlement info"
                                          >
                                              <Info size={14} />
                                          </button>
                                          <div className="pointer-events-none absolute right-0 mt-2 w-[320px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-bg-secondary)] p-3 text-[11px] text-[var(--color-text-primary)] shadow-[0_18px_40px_rgba(0,0,0,0.8)] backdrop-blur-md opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0">
                                              <div className="font-semibold mb-1 text-[12px]">Settlement Info</div>
                                              <div>Status meanings: CREATED (generated), PENDING (partial payout), COMPLETED (paid), FAILED/CANCELLED (not paid).</div>
                                              <div className="mt-1">Due Amount on dashboard = sum of pending settlement balance (net - settled).</div>
                                          </div>
                                      </div>
                                  </div>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        <DateRangeFilter fromValue={stFrom} toValue={stTo} onFromChange={setStFrom} onToChange={setStTo} />
                                        <StatusFilter value={stStatus} onChange={setStStatus} options={SETTLEMENT_STATUS_OPTIONS} />
                                        <SearchFilter value={stSearch} onChange={setStSearch} placeholder="Search Settlement ID" />
                                        {canExportReports && (
                                            <ExportMenu
                                                onExportCSV={() => {
                                                    const payload = buildExportPayload(
                                                        filteredSettlements.map((r) => ({ ...r })),
                                                        SETTLEMENT_CSV_COLUMNS
                                                    )
                                                    exportDataToCSV(payload.rows, payload.columns, 'settlements.csv')
                                                }}
                                                onExportPDF={() => {
                                                    const payload = buildExportPayload(
                                                        filteredSettlements.map((r) => ({ ...r })),
                                                        SETTLEMENT_CSV_COLUMNS
                                                    )
                                                    exportDataToPDF(payload.rows, payload.columns, {
                                                        title: 'Settlements',
                                                        filename: 'settlements.pdf',
                                                    })
                                                }}
                                            />
                                        )}
                                    </FilterBar>
                                    {settlementsNotice && (
                                        <div className="mb-3 text-xs text-[var(--color-warning)]">{settlementsNotice}</div>
                                    )}

                                    <DataTable
                                        columns={SETTLEMENT_COLUMNS}
                                        data={filteredSettlements}
                                        keyField="settlementId"
                                        renderActions={(r) => (
                                            <button
                                                className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                                type="button"
                                                onClick={() => handleOpenDetail('settlement', r.settlementId, 'settlements')}
                                            >
                                                View
                                            </button>
                                        )}
                                    />
                                </div>
                            </article>

                            {canViewLedger && (
                            <article className="mt-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Settlement Ledger</h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Debit / Credit</span>
                                </div>
                                <div className="p-4">
                                    <FilterBar>
                                        <DateRangeFilter fromValue={ledgerFrom} toValue={ledgerTo} onFromChange={setLedgerFrom} onToChange={setLedgerTo} />
                                    </FilterBar>
                                    {ledgerNotice && (
                                        <div className="mb-3 text-xs text-[var(--color-warning)]">{ledgerNotice}</div>
                                    )}
                                    <DataTable
                                        columns={ledgerColumns}
                                        data={ledgerRows}
                                        keyField="id"
                                    />
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                        <div>
                                            Page {ledgerPage}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>Items per page:</span>
                                            <select
                                                className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)]"
                                                value={ledgerPageSize}
                                                onChange={(e) => {
                                                    setLedgerPageSize(Number(e.target.value))
                                                    setLedgerPage(1)
                                                }}
                                            >
                                                {[10, 20, 50, 100].map((size) => (
                                                    <option key={size} value={size}>
                                                        {size}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition"
                                                type="button"
                                                disabled={ledgerPage <= 1}
                                                onClick={() => setLedgerPage((p) => Math.max(p - 1, 1))}
                                            >
                                                Prev
                                            </button>
                                            <button
                                                className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition"
                                                type="button"
                                                onClick={() => setLedgerPage((p) => p + 1)}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                            )}
                        </div>
                        )}

                        {/* Reports Page */}
                        {canViewReports && (
                        <div id="reports" className={hash === 'reports' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Reports</h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Generate</span>
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
                                            {allowedReportTypes.includes('Collections') && (
                                                <option value="Collections">Report Type: Collections</option>
                                            )}
                                            {allowedReportTypes.includes('Settlements') && (
                                                <option value="Settlements">Settlements</option>
                                            )}
                                            {allowedReportTypes.includes('Refunds') && (
                                                <option value="Refunds">Refunds</option>
                                            )}
                                            {allowedReportTypes.includes('Ledger') && (
                                                <option value="Ledger">Ledger</option>
                                            )}
                                            {allowedReportTypes.includes('SubMerchants') && (
                                                <option value="SubMerchants">Sub-Merchants</option>
                                            )}
                                            {allowedReportTypes.includes('Users') && (
                                                <option value="Users">Users</option>
                                            )}
                                        </ClearableSelect>
                                        <DateRangeFilter
                                            fromValue={repFrom}
                                            toValue={repTo}
                                            onFromChange={setRepFrom}
                                            onToChange={setRepTo}
                                        />
                                        {reportStatusOptions.length > 0 && (
                                            <StatusFilter
                                                value={repStatus}
                                                onChange={setRepStatus}
                                                options={reportStatusOptions}
                                            />
                                        )}
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs font-medium text-[var(--color-text-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                                            type="button"
                                            onClick={generateReport}
                                            disabled={reportBusy}
                                        >
                                            {reportBusy ? 'Generating...' : 'Generate'}
                                        </button>
                                        {canExportReports && (
                                            <ExportMenu
                                                onExportCSV={() => {
                                                    const payload = buildExportPayload(
                                                        reportPreview?.rows?.length
                                                            ? reportPreview.rows
                                                            : reportRuns.map((r) => ({
                                                                  report: r.name,
                                                                  range: r.range,
                                                                  created: r.created,
                                                                  status: r.status,
                                                              })),
                                                        reportPreview?.rows?.length
                                                            ? reportPreview.csvColumns
                                                            : REPORT_CSV_COLUMNS
                                                    )
                                                    exportDataToCSV(
                                                        payload.rows,
                                                        payload.columns,
                                                        reportPreview?.rows?.length
                                                            ? `${repType.toLowerCase()}-report.csv`
                                                            : 'reports.csv'
                                                    )
                                                }}
                                                onExportPDF={() => {
                                                    const payload = buildExportPayload(
                                                        reportPreview?.rows?.length
                                                            ? reportPreview.rows
                                                            : reportRuns.map((r) => ({
                                                                  report: r.name,
                                                                  range: r.range,
                                                                  created: r.created,
                                                                  status: r.status,
                                                              })),
                                                        reportPreview?.rows?.length
                                                            ? reportPreview.csvColumns
                                                            : REPORT_CSV_COLUMNS
                                                    )
                                                    exportDataToPDF(payload.rows, payload.columns, {
                                                        title: reportPreview?.rows?.length ? `${repType} Report` : `${repType} Reports`,
                                                        filename: reportPreview?.rows?.length
                                                            ? `${repType.toLowerCase()}-report.pdf`
                                                            : 'reports.pdf',
                                                    })
                                                }}
                                            />
                                        )}
                                    </FilterBar>

                                    <DataTable
                                        columns={REPORT_COLUMNS}
                                        data={reportRuns}
                                        keyField="id"
                                        renderActions={(r) => (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                                    type="button"
                                                    onClick={() => setReportPreview(r)}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-[rgba(255,90,122,0.35)] bg-[rgba(255,90,122,0.18)] hover:bg-[rgba(255,90,122,0.25)] transition text-xs font-medium text-[var(--color-danger)]"
                                                    type="button"
                                                    onClick={() => removeReportRun(r.id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    />
                                    {reportPreview && (
                                        <div className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-white/[0.03] p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                        Report Preview: {reportPreview.name}
                                                    </div>
                                                    <div className="text-xs text-[var(--color-text-secondary)]/70">
                                                        {reportPreview.range} • Created {reportPreview.created}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-primary)]">
                                                    <span className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-1">
                                                        Rows: {reportPreview.summary?.count ?? reportPreview.rows?.length ?? 0}
                                                    </span>
                                                    {reportPreview.summary?.total !== undefined && (
                                                        <span className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-1">
                                                            Total: {fmtPKR(reportPreview.summary.total)}
                                                        </span>
                                                    )}
                                                    <button
                                                        className="h-8 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)]"
                                                        type="button"
                                                        onClick={() => setReportPreview(null)}
                                                    >
                                                        Close
                                                    </button>
                                                    <button
                                                        className="h-8 px-3 rounded-xl border border-[rgba(255,90,122,0.35)] bg-[rgba(255,90,122,0.18)] hover:bg-[rgba(255,90,122,0.25)] transition text-xs font-medium text-[var(--color-danger)]"
                                                        type="button"
                                                        onClick={() => removeReportRun(reportPreview.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <DataTable
                                                    columns={reportPreview.columns || []}
                                                    data={reportPreview.rows || []}
                                                    keyField="rowKey"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </article>
                        </div>
                        )}

                        {/* Users & Roles Page */}
                        {canViewUsers && (
                        <div id="users-roles" className={hash === 'users-roles' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Users & Roles</h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">RBAC</span>
                                </div>
                                <div className="p-4">
                                    {!showAddUserPanel && (
                                        <FilterBar>
                                            {canCreateUser && (
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs font-medium text-[var(--color-text-primary)]"
                                                    type="button"
                                                    onClick={() => {
                                                        setAddUserForm((prev) => ({
                                                            ...prev,
                                                            userType: 'merchant',
                                                            subMerchantId: '',
                                                        }))
                                                        setShowAddUserPanel(true)
                                                    }}
                                                >
                                                    + Add User
                                                </button>
                                            )}
                                            <ClearableSelect value={userRoleFilter} onChange={setUserRoleFilter} className="min-w-[160px]">
                                                <option value="">Role: All</option>
                                                {userRoleOptions.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role}
                                                    </option>
                                                ))}
                                            </ClearableSelect>
                                            <ClearableSelect value={userBranchFilter} onChange={setUserBranchFilter} className="min-w-[180px]">
                                                <option value="">Branch: All</option>
                                                {userBranchOptions.map((branch) => (
                                                    <option key={branch} value={branch}>
                                                        {branch}
                                                    </option>
                                                ))}
                                            </ClearableSelect>
                                            <ClearableSelect value={userHasAccount} onChange={setUserHasAccount} className="min-w-[150px]">
                                                <option value="">Has User: All</option>
                                                <option value="yes">Has User: Yes</option>
                                                <option value="no">Has User: No</option>
                                            </ClearableSelect>
                                            <StatusFilter
                                                value={userStatusFilter}
                                                onChange={setUserStatusFilter}
                                                options={USER_STATUS_OPTIONS}
                                            />
                                            <SearchFilter value={userSearch} onChange={setUserSearch} placeholder="Search name / username" />
                                            <SearchFilter value={userEmailSearch} onChange={setUserEmailSearch} placeholder="Search email" />
                                        {canExportReports && (
                                            <ExportMenu
                                                onExportCSV={() => {
                                                    const payload = buildExportPayload(users, USER_CSV_COLUMNS)
                                                    exportDataToCSV(payload.rows, payload.columns, 'users.csv')
                                                }}
                                                onExportPDF={() => {
                                                    const payload = buildExportPayload(users, USER_CSV_COLUMNS)
                                                    exportDataToPDF(payload.rows, payload.columns, {
                                                        title: 'Users',
                                                        filename: 'users.pdf',
                                                    })
                                                }}
                                            />
                                        )}
                                        </FilterBar>
                                    )}
                                    {showAddUserPanel && (
                                        <div className="mb-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4 text-[var(--color-text-primary)]">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="text-sm font-semibold">
                                                    {addUserForm.userType === 'merchant' ? 'Create Merchant User' : 'Create Branch User'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <button
                                                        type="button"
                                                        className={`h-8 px-3 rounded-lg border transition ${
                                                            addUserForm.userType === 'merchant'
                                                                ? 'border-[rgba(90,167,255,0.5)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]'
                                                                : 'border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                                                        }`}
                                                        onClick={() =>
                                                            setAddUserForm((s) => ({
                                                                ...s,
                                                                userType: 'merchant',
                                                                subMerchantId: '',
                                                            }))
                                                        }
                                                    >
                                                        Merchant User
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`h-8 px-3 rounded-lg border transition ${
                                                            addUserForm.userType === 'branch'
                                                                ? 'border-[rgba(90,167,255,0.5)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]'
                                                                : 'border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                                                        }`}
                                                        onClick={() =>
                                                            setAddUserForm((s) => ({
                                                                ...s,
                                                                userType: 'branch',
                                                                roleName: 'SUB_MERCHANT',
                                                                permissions: [],
                                                                permissionSearch: '',
                                                            }))
                                                        }
                                                    >
                                                        Branch User
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-1 gap-3">
                                                {addUserForm.userType === 'branch' && (
                                                    <div className="text-xs text-[var(--color-text-secondary)]/70">
                                                        Select a branch from the list below.
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                    <ClearableInput
                                                        value={addUserForm.name}
                                                        onChange={(e) => setAddUserForm((s) => ({ ...s, name: e.target.value }))}
                                                        placeholder="Full Name"
                                                        inputClassName="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    <ClearableInput
                                                        value={addUserForm.email}
                                                        onChange={(e) => setAddUserForm((s) => ({ ...s, email: e.target.value }))}
                                                        placeholder="Email"
                                                        inputClassName="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    <ClearableInput
                                                        value={addUserForm.username}
                                                        onChange={(e) => setAddUserForm((s) => ({ ...s, username: e.target.value }))}
                                                        placeholder="Username"
                                                        inputClassName="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    <ClearableInput
                                                        value={addUserForm.password}
                                                        onChange={(e) => setAddUserForm((s) => ({ ...s, password: e.target.value }))}
                                                        placeholder="Password"
                                                        type="password"
                                                        inputClassName="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    />
                                                    {addUserForm.userType === 'branch' ? (
                                                        <ClearableSelect
                                                            value="SUB_MERCHANT"
                                                            onChange={() => {}}
                                                            selectClassName="h-10"
                                                            showClear={false}
                                                        >
                                                            <option value="SUB_MERCHANT">Role: SUB_MERCHANT</option>
                                                        </ClearableSelect>
                                                    ) : (
                                                        <ClearableSelect
                                                            value={addUserForm.roleName}
                                                            onChange={(value) => setAddUserForm((s) => ({ ...s, roleName: value }))}
                                                            selectClassName="h-10"
                                                        >
                                                            <option value="">Role: Optional</option>
                                                            {merchantRoleOptions.map((role) => (
                                                                <option key={role} value={role}>
                                                                    {role}
                                                                </option>
                                                            ))}
                                                        </ClearableSelect>
                                                    )}
                                                </div>
                                                {addUserForm.userType === 'branch' ? (
                                                    <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 max-h-44 overflow-y-auto">
                                                        {addUserBranchOptions.length === 0 ? (
                                                            <div className="text-xs text-[var(--color-text-secondary)]/70">All branches already have users.</div>
                                                        ) : (
                                                            <div className="grid gap-2">
                                                                {addUserBranchOptions.map((branch) => (
                                                                    <label key={branch.id} className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
                                                                        <input
                                                                            type="radio"
                                                                            name="add-user-branch"
                                                                            checked={String(addUserForm.subMerchantId) === String(branch.id)}
                                                                            onChange={() =>
                                                                                setAddUserForm((s) => ({
                                                                                    ...s,
                                                                                    subMerchantId: String(branch.id),
                                                                                }))
                                                                            }
                                                                        />
                                                                        <span>{branch.label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                ) : null}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <button
                                                        className="h-10 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-50"
                                                        type="button"
                                                        onClick={handleCreateUserForBranch}
                                                        disabled={
                                                            !canCreateUser ||
                                                            (addUserForm.userType === 'branch' && addUserBranchOptions.length === 0)
                                                        }
                                                    >
                                                        Create User
                                                    </button>
                                                    <button
                                                        className="h-10 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-sm text-[var(--color-text-primary)]"
                                                        type="button"
                                                        onClick={() => setShowAddUserPanel(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    {addUserForm.userType === 'branch' && addUserBranchOptions.length === 0 && (
                                                        <div className="text-xs text-[var(--color-text-secondary)]/70">All branches already have users.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {!showAddUserPanel && (
                                        <>
                                            {usersNotice && (
                                                <div className="mb-3 text-xs text-[var(--color-warning)]">{usersNotice}</div>
                                            )}

                                            <DataTable
                                                columns={USER_COLUMNS}
                                                data={users}
                                                keyField="id"
                                                renderActions={(u) => (
                                                    u.hasUser ? (
                                                        <button
                                                            className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                                            type="button"
                                                            onClick={() => handleOpenDetail('user', u.username, 'users-roles')}
                                                        >
                                                            View
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className={`h-9 px-4 rounded-xl border border-[var(--color-border-soft)] text-xs font-medium transition ${
                                                                canCreateUser
                                                                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-soft-hover)]'
                                                                    : 'bg-white/[0.02] text-[var(--color-text-secondary)]/60 cursor-not-allowed'
                                                            }`}
                                                            type="button"
                                                            onClick={() =>
                                                                canCreateUser
                                                                    ? (() => {
                                                                        if (!u.subMerchantId) {
                                                                            setApiNotice('Branch id not available for this user.')
                                                                            return
                                                                        }
                                                                        setAddUserForm((prev) => ({
                                                                            ...prev,
                                                                            userType: 'branch',
                                                                            subMerchantId: String(u.subMerchantId),
                                                                        }))
                                                                        setShowAddUserPanel(true)
                                                                    })()
                                                                    : null
                                                            }
                                                            disabled={!canCreateUser || !u.subMerchantId}
                                                        >
                                                            Add User
                                                        </button>
                                                    )
                                                )}
                                            />
                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                                <div>
                                                    Page {userPage} of {userSafeTotalPages} - Total {userTotalElements}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>Items per page:</span>
                                                    <select
                                                        value={userPageSize}
                                                        onChange={(e) => {
                                                            setUserPageSize(Number(e.target.value))
                                                            setUserPage(1)
                                                        }}
                                                        className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)]"
                                                    >
                                                        {[10, 20, 50, 100].map((size) => (
                                                            <option key={size} value={size}>
                                                                {size}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition"
                                                        type="button"
                                                        disabled={userPage <= 1}
                                                        onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                                                    >
                                                        Prev
                                                    </button>
                                                    <button
                                                        className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition"
                                                        type="button"
                                                        disabled={userPage >= userSafeTotalPages}
                                                        onClick={() => setUserPage((p) => Math.min(p + 1, userSafeTotalPages))}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </article>
                        </div>
                        )}

                        {/* API Keys Page */}
                        {canViewApiKeys && (
                        <div id="api-keys" className={hash === 'api-keys' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">API Keys</h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Security</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="text-sm text-[var(--color-text-secondary)]/80">
                                        Rotate keys to invalidate previous credentials. Share keys only with trusted systems.
                                    </div>
                                    {apiKeyError && (
                                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                                            {apiKeyError}
                                        </div>
                                    )}
                                    {canRotateApiKeys && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                className="h-10 px-4 rounded-xl text-sm font-medium transition border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] text-[var(--color-text-primary)] disabled:opacity-60"
                                                type="button"
                                                onClick={handleRotateApiKeys}
                                                disabled={apiKeyBusy}
                                            >
                                                {apiKeyBusy ? 'Rotating...' : 'Rotate API Keys'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        </div>
                        )}

                        {/* Security Page */}
                        <div id="security" className={hash === 'security' ? 'block animate-in fade-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
                            <article className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Change Password</h3>
                                    <span className="text-[11px] text-[var(--color-text-secondary)]/60 bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--color-border-soft)]">Security</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <input
                                        className="hidden"
                                        type="text"
                                        name="username"
                                        autoComplete="username"
                                        value=""
                                        readOnly
                                    />
                                    <input
                                        className="hidden"
                                        type="password"
                                        name="password"
                                        autoComplete="new-password"
                                        value=""
                                        readOnly
                                    />
                                    <div className="text-sm text-[var(--color-text-secondary)]/80">
                                        Update your password using your current credentials. Email changes are not allowed.
                                    </div>
                                    {passwordError && (
                                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                                            {passwordError}
                                        </div>
                                    )}
                                    {passwordNotice && (
                                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                                            {passwordNotice}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 pr-10 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                placeholder="Current password"
                                                type={showPasswordCurrent ? 'text' : 'password'}
                                                value={passwordForm.current}
                                                autoComplete="new-password"
                                                data-lpignore="true"
                                                name="current-passcode"
                                                onChange={(e) => setPasswordForm((s) => ({ ...s, current: e.target.value }))}
                                                disabled={passwordBusy}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)]"
                                                onClick={() => setShowPasswordCurrent((prev) => !prev)}
                                                aria-label={showPasswordCurrent ? 'Hide password' : 'Show password'}
                                                tabIndex={-1}
                                            >
                                                {showPasswordCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 pr-10 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                placeholder="New password"
                                                type={showPasswordNext ? 'text' : 'password'}
                                                value={passwordForm.next}
                                                autoComplete="new-password"
                                                name="new-passcode"
                                                onChange={(e) => setPasswordForm((s) => ({ ...s, next: e.target.value }))}
                                                disabled={passwordBusy}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)]"
                                                onClick={() => setShowPasswordNext((prev) => !prev)}
                                                aria-label={showPasswordNext ? 'Hide password' : 'Show password'}
                                                tabIndex={-1}
                                            >
                                                {showPasswordNext ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 pr-10 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                placeholder="Confirm new password"
                                                type={showPasswordConfirm ? 'text' : 'password'}
                                                value={passwordForm.confirm}
                                                autoComplete="new-password"
                                                name="confirm-passcode"
                                                onChange={(e) => setPasswordForm((s) => ({ ...s, confirm: e.target.value }))}
                                                disabled={passwordBusy}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)]"
                                                onClick={() => setShowPasswordConfirm((prev) => !prev)}
                                                aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                                                tabIndex={-1}
                                            >
                                                {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    {passwordForm.next.length > 0 && (
                                        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text-secondary)]/80">
                                            <div className="text-[11px] uppercase tracking-wide mb-2">Password rules</div>
                                            <div className={`flex items-center gap-2 ${passwordRuleState.length ? 'text-emerald-300' : 'text-red-300'}`}>
                                                <span>{passwordRuleState.length ? '✓' : '•'}</span>
                                                <span>At least 8 characters</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${passwordRuleState.upper ? 'text-emerald-300' : 'text-red-300'}`}>
                                                <span>{passwordRuleState.upper ? '✓' : '•'}</span>
                                                <span>One uppercase letter</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${passwordRuleState.lower ? 'text-emerald-300' : 'text-red-300'}`}>
                                                <span>{passwordRuleState.lower ? '✓' : '•'}</span>
                                                <span>One lowercase letter</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${passwordRuleState.number ? 'text-emerald-300' : 'text-red-300'}`}>
                                                <span>{passwordRuleState.number ? '✓' : '•'}</span>
                                                <span>One number</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${passwordRuleState.special ? 'text-emerald-300' : 'text-red-300'}`}>
                                                <span>{passwordRuleState.special ? '✓' : '•'}</span>
                                                <span>One special character</span>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <button
                                            className="h-10 px-4 rounded-xl text-sm font-medium transition border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] text-[var(--color-text-primary)] disabled:opacity-60"
                                            type="button"
                                            onClick={handlePasswordChange}
                                            disabled={passwordBusy}
                                        >
                                            {passwordBusy ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
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
                                onPrimaryAction={handlePrimaryAction}
                                detailState={detailState}
                                detailPayments={settlementPayments}
                                detailPaymentsColumns={settlementPaymentColumns}
                                detailPaymentsNotice={settlementPaymentsNotice}
                            />
                            {detailState.type === 'sub' && detailState.record && !detailState.record.userId && canCreateUser && (
                                <div className="mt-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4 sm:p-6 shadow-xl text-[var(--color-text-primary)]">
                                    <div className="text-sm font-semibold">Add User for this Branch</div>
                                    <div className="mt-4 grid grid-cols-1 gap-3">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <input
                                                className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                placeholder="Full Name"
                                                value={subUserForm.name}
                                                onChange={(e) => setSubUserForm((s) => ({ ...s, name: e.target.value }))}
                                            />
                                            <input
                                                className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                placeholder="Email"
                                                value={subUserForm.email}
                                                autoComplete="off"
                                                name="branch-user-email"
                                                onChange={(e) => setSubUserForm((s) => ({ ...s, email: e.target.value }))}
                                            />
                                            <input
                                                className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                placeholder="Username"
                                                value={subUserForm.username}
                                                onChange={(e) => setSubUserForm((s) => ({ ...s, username: e.target.value }))}
                                            />
                                            <input
                                                className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                placeholder="Password"
                                                type="password"
                                                value={subUserForm.password}
                                                autoComplete="new-password"
                                                name="branch-user-password"
                                                onChange={(e) => setSubUserForm((s) => ({ ...s, password: e.target.value }))}
                                            />
                                        </div>
                                        <input
                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Role Name (MERCHANT_*)"
                                            value={subUserForm.roleName}
                                            onChange={(e) => setSubUserForm((s) => ({ ...s, roleName: e.target.value }))}
                                        />
                                        <input
                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Search permissions..."
                                            value={subUserForm.permissionSearch}
                                            onChange={(e) => setSubUserForm((s) => ({ ...s, permissionSearch: e.target.value }))}
                                        />
                                        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 max-h-44 overflow-y-auto">
                                            {filteredDetailPerms.length === 0 ? (
                                                <div className="text-xs text-[var(--color-text-secondary)]/70">No permissions found.</div>
                                            ) : (
                                                <div className="grid gap-2">
                                                    {filteredDetailPerms.map((perm) => (
                                                        <label key={perm} className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
                                                            <input
                                                                type="checkbox"
                                                                checked={subUserForm.permissions.includes(perm)}
                                                                onChange={() => toggleSubUserPermission(perm)}
                                                            />
                                                            <span>{perm}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <button
                                            className="h-10 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-sm font-medium text-[var(--color-text-primary)]"
                                            type="button"
                                            onClick={() => handleCreateSubMerchantUser(detailState.record.id)}
                                        >
                                            Create User
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {apiKeyModalOpen && (
                            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                                <div className="w-full max-w-[640px] max-h-[90vh] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card flex flex-col overflow-hidden">
                                    <div className="text-lg font-semibold">API Keys</div>
                                    <div className="mt-2 text-xs text-[var(--color-text-secondary)]/80">
                                        Copy and store these secrets now. They will not be shown again.
                                    </div>
                                    <div className="mt-4 space-y-3 overflow-y-auto pr-2 theme-scrollbar">
                                        {apiKeyModalData.map((item, idx) => (
                                            <div key={`api-key-modal-${idx}`} className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                                                <div className="grid gap-3 text-sm">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="truncate">
                                                            <div className="text-xs text-[var(--color-text-secondary)]/70">API Key</div>
                                                            <div className="text-[var(--color-text-primary)] break-all">{item.apiKey}</div>
                                                        </div>
                                                        <button
                                                            className="h-8 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs"
                                                            type="button"
                                                            onClick={() => copyValue(item.apiKey)}
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="truncate">
                                                            <div className="text-xs text-[var(--color-text-secondary)]/70">API Secret</div>
                                                            <div className="text-[var(--color-text-primary)] break-all">{item.apiSecret}</div>
                                                        </div>
                                                        <button
                                                            className="h-8 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs"
                                                            type="button"
                                                            onClick={() => copyValue(item.apiSecret)}
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3 text-sm">
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                            type="button"
                                            onClick={() => {
                                                setApiKeyModalOpen(false)
                                                setApiKeyModalData([])
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <footer className="text-center py-6 text-xs text-[var(--color-text-secondary)]/40 border-t border-white/5">
                            © Merchant Portal • Standardized Tailwind UI
                        </footer>
                    </section>
                </main>
            </div>
            </div>
        </div>
    )
}

export default MerchantPortal







