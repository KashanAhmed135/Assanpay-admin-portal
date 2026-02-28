import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Pill } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { MerchantsFilters, MerchantsTable, ActionMenu } from '../components/superadmin/SuperAdminMerchants'
import { DashboardSection } from '../components/superadmin/SuperAdminDashboard'
import { CreateMerchantForm } from '../components/superadmin/SuperAdminCreateMerchantForm'
import { DateRangeFilter, FilterBar, ExportMenu } from '../components/merchant'
import { Sidebar } from '../components/ui/Sidebar'
import { Topbar } from '../components/ui/Topbar'
import { PermissionGate } from '../components/auth/PermissionGate'
import { useHashRoute } from '../hooks/useHashRoute'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useMerchantStorage } from '../hooks/useMerchantStorage'
import { getPageMeta, PAGE_QUICK_TIPS, SUPER_ADMIN_NAVIGATION, VIEW_KEY } from '../config/superAdminConfig'
import { ADMIN_PAGE_PERMISSIONS } from '../config/permissionMap'
import { clearAuthToken, setAuthToken } from '../utils/apiClient'
import { getAuthClaims, hasPermission } from '../utils/auth'
import { canAny } from '../utils/permissions'
import { useAuthStore } from '../hooks/useAuthStore'
import {
    createAdminMerchant,
    createAdminPaymentMethod,
    createAdminSubMerchant,
    createAdminSubMerchantUser,
    createAdminUser,
    fetchAdminAuditLogs,
    fetchAdminMerchants,
    fetchAdminSettlementSummary,
    fetchAdminSettlementLedger,
    fetchAdminLimits,
    fetchAdminMerchant,
    fetchAdminPaymentMethods,
    fetchAdminPayments,
    fetchAdminPermissions,
    fetchAdminRoles,
    fetchAdminWebhooks,
    resendAdminWebhook,
    fetchAdminMerchantRisk,
    overrideAdminRiskLevel,
    overrideAdminReservePercent,
    freezeAdminPayout,
    fetchAdminSubMerchant,
    fetchAdminSubMerchants,
    fetchAdminUser,
    fetchAdminUsers,
    createAdminRole,
    updateAdminRolePermissions,
    updateAdminMerchant,
    updateAdminLimit,
    updateAdminPaymentMethodStatus,
    updateAdminSubMerchant,
    updateAdminUser,
    updateAdminUserBlock,
    updateAdminAutoSettlementPaused,
    rotateAdminMerchantApiKeys,
    checkAdminUsernameAvailability,
    adminReauth,
    previewAdminResetTest,
    executeAdminResetTest,
    adminGoLive,
    fetchAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
} from '../api/adminApi'
import {
    AUDIT_LOG_COLUMNS,
    AUDIT_LOG_CSV_COLUMNS,
    INQUIRIES_ADMIN_COLUMNS,
    LIMIT_POLICY_COLUMNS,
    PAYMENT_COLUMNS,
    REPORT_COLUMNS,
    REPORT_CSV_COLUMNS,
    REFUND_ADMIN_COLUMNS,
    RISK_DASHBOARD_COLUMNS,
    SETTLEMENT_SUMMARY_COLUMNS,
    SUB_MERCHANT_ADMIN_COLUMNS,
    USERS_ADMIN_COLUMNS,
    WEBHOOK_OUTBOX_COLUMNS,
} from '../config/tableColumns.jsx'
import {
    adminInquiriesData,
    adminRefundsData,
    adminSubMerchantsData,
    COLLECTION_STATUS_OPTIONS,
    REFUND_STATUS_OPTIONS,
    SETTLEMENT_STATUS_OPTIONS,
} from '../data/merchantMockData'
import { fmtPKR, withinDate } from '../utils/helpers'
import { exportDataToCSV } from '../utils/csvExport'
import { exportDataToPDF } from '../utils/pdfExport'
import { buildExportPayload } from '../utils/exportHelpers'
import { ChevronDown, ChevronUp, Eye, EyeOff, Info, LogOut, Settings, User, X } from 'lucide-react'
import { ClearableInput } from '../components/ui/ClearableInput'
import { ClearableSelect } from '../components/ui/ClearableSelect'
import { ThemeMenu } from '../components/ui/ThemeMenu'
import { getPaymentMethodLogo } from '../utils/paymentLogos'
import { passwordRules } from '../utils/passwordValidator'
import { SupportError } from '../components/ui/SupportError'
import {
    validateMerchantFormData,
    EMAIL_PATTERN,
    NAME_PATTERN,
    USERNAME_PATTERN,
    PASSWORD_PATTERN,
    COMMISSION_PERCENT_PATTERN,
    COMMISSION_AMOUNT_PATTERN,
    LIMIT_AMOUNT_PATTERN,
} from '../utils/merchantValidation'

const ADMIN_DASHBOARD_NAV_KEY = 'assanpay:admin-dashboard-nav'
const ADMIN_SETTINGS_TAB_KEY = 'assanpay:admin-settings-tab'

export function SuperAdminPortal() {
    const navigate = useNavigate()
    const [page] = useHashRoute('page-dashboard')
    const claims = getAuthClaims()
    const permissionsVersion = useAuthStore((state) => state.permissionsList)
    const hasAccess = Object.keys(ADMIN_PAGE_PERMISSIONS).some((key) => {
        const required = ADMIN_PAGE_PERMISSIONS[key] || []
        if (required.length === 0) return true
        return canAny(required)
    })
    const canViewWebhooks = canAny(['VIEW_PAYMENT', 'VIEW_WEBHOOK_OUTBOX'])
    const canResendWebhooks = canAny(['RETRY_PAYMENT', 'RESEND_WEBHOOK_OUTBOX'])
    const canViewRisk = canAny(['VIEW_RISK_DASHBOARD'])
    const canManageRisk = canAny(['MANAGE_RISK_OVERRIDES'])
    const canFreezePayout = canAny(['FREEZE_PAYOUT'])
    const PAYMENTS_DEBOUNCE_MS = 1200
    const PAYMENTS_REFRESH_MS = 30000
    const MERCHANT_FILTER_DEBOUNCE_MS = 250

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [quickTipsOpen, setQuickTipsOpen] = useState(false)
    const [editingMerchantId, setEditingMerchantId] = useState(null)
    const [actionMenu, setActionMenu] = useState(null)
    const [settlementMenu, setSettlementMenu] = useState(null)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const userMenuRef = useRef(null)
    const adminUsersLoadedRef = useRef(false)

    // Filter State
    const [filterMerchantEmail, setFilterMerchantEmail] = useState('')
    const [filterMerchantName, setFilterMerchantName] = useState('')
    const [filterMerchantId, setFilterMerchantId] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterSettlementMode, setFilterSettlementMode] = useState('')
    const [merchantPage, setMerchantPage] = useState(1)
    const [merchantPageSize, setMerchantPageSize] = useState(20)

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
    const [payStatus, setPayStatus] = useState('')
    const [payPage, setPayPage] = useState(1)
    const [payPageSize, setPayPageSize] = useState(20)
    const [payRefreshTick, setPayRefreshTick] = useState(0)

    // Reports Filters
    const [reportType, setReportType] = useState('collections')
    const [reportFrom, setReportFrom] = useState('')
    const [reportTo, setReportTo] = useState('')
    const [reportMerchant, setReportMerchant] = useState('')
    const [reportMerchantOpen, setReportMerchantOpen] = useState(false)
    const [reportStatus, setReportStatus] = useState('')
    const [reportRows, setReportRows] = useState([])
    const [reportBusy, setReportBusy] = useState(false)
    const [reportError, setReportError] = useState('')
    const [reportRuns, setReportRuns] = useState([])
    const [reportPreview, setReportPreview] = useState(null)

    const debouncedPayFrom = useDebouncedValue(payFrom, PAYMENTS_DEBOUNCE_MS)
    const debouncedPayTo = useDebouncedValue(payTo, PAYMENTS_DEBOUNCE_MS)
    const debouncedPayMerchant = useDebouncedValue(payMerchant, PAYMENTS_DEBOUNCE_MS)
    const debouncedPayOrderId = useDebouncedValue(payOrderId, PAYMENTS_DEBOUNCE_MS)
    const debouncedPayMethod = useDebouncedValue(payMethod, PAYMENTS_DEBOUNCE_MS)
    const debouncedPayStatus = useDebouncedValue(payStatus, PAYMENTS_DEBOUNCE_MS)
    const debouncedMerchantEmail = useDebouncedValue(filterMerchantEmail, MERCHANT_FILTER_DEBOUNCE_MS)
    const debouncedMerchantName = useDebouncedValue(filterMerchantName, MERCHANT_FILTER_DEBOUNCE_MS)

    // Refunds Filters
    const [rfSearchPayment, setRfSearchPayment] = useState('')
    const [rfMerchant, setRfMerchant] = useState('')
    const [rfStatus, setRfStatus] = useState('')
    const [rfPage, setRfPage] = useState(1)
    const [rfPageSize, setRfPageSize] = useState(10)

    // Settlements Filters
    const [stMerchantName, setStMerchantName] = useState('')
    const [stMerchantEmail, setStMerchantEmail] = useState('')
    const [stStatus, setStStatus] = useState('')
    const [stPage, setStPage] = useState(1)
    const [stPageSize, setStPageSize] = useState(10)
    const [ledgerMerchantId, setLedgerMerchantId] = useState('')
    const [ledgerFrom, setLedgerFrom] = useState('')
    const [ledgerTo, setLedgerTo] = useState('')
    const [ledgerRows, setLedgerRows] = useState([])
    const [ledgerError, setLedgerError] = useState('')
    const [ledgerPage, setLedgerPage] = useState(1)
    const [ledgerPageSize, setLedgerPageSize] = useState(20)
    const [ledgerTypeFilter, setLedgerTypeFilter] = useState('')
    const [ledgerReasonFilter, setLedgerReasonFilter] = useState('')
    const [ledgerSearch, setLedgerSearch] = useState('')

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
    const [alPage, setAlPage] = useState(1)
    const [alPageSize, setAlPageSize] = useState(20)
    const [limitMerchantName, setLimitMerchantName] = useState('')
    const [limitMerchantEmail, setLimitMerchantEmail] = useState('')
    const [limitMerchantId, setLimitMerchantId] = useState('')
    const [limitPaymentMethodName, setLimitPaymentMethodName] = useState('')
    const [limitActiveFilter, setLimitActiveFilter] = useState('')
    const [limitPage, setLimitPage] = useState(1)
    const [limitPageSize, setLimitPageSize] = useState(20)
    const [subMerchantMerchantId, setSubMerchantMerchantId] = useState('')
    const [subMerchantBranchCode, setSubMerchantBranchCode] = useState('')
    const [subMerchantBranchName, setSubMerchantBranchName] = useState('')
    const [subMerchantStatus, setSubMerchantStatus] = useState('')
    const [subMerchantHasUser, setSubMerchantHasUser] = useState('')
    const [subMerchantPage, setSubMerchantPage] = useState(1)
    const [subMerchantPageSize, setSubMerchantPageSize] = useState(20)
    const [subMerchantModalOpen, setSubMerchantModalOpen] = useState(false)
    const [subMerchantActionMenu, setSubMerchantActionMenu] = useState(null)
    const [subMerchantModalMode, setSubMerchantModalMode] = useState('create')
    const [subMerchantFormBusy, setSubMerchantFormBusy] = useState(false)
    const [subMerchantFormError, setSubMerchantFormError] = useState('')
    const [subMerchantUsernameStatus, setSubMerchantUsernameStatus] = useState('idle')
    const [subMerchantUsernameSuggestions, setSubMerchantUsernameSuggestions] = useState([])
    const subMerchantUsernameRef = useRef(null)
    const [subMerchantMerchantQuery, setSubMerchantMerchantQuery] = useState('')
    const [subMerchantMerchantOptions, setSubMerchantMerchantOptions] = useState([])
    const [subMerchantMerchantBusy, setSubMerchantMerchantBusy] = useState(false)
    const debouncedSubMerchantMerchantQuery = useDebouncedValue(subMerchantMerchantQuery, 400)
    const [subMerchantForm, setSubMerchantForm] = useState({
        id: null,
        merchantId: '',
        branchCode: '',
        branchName: '',
        blocked: false,
        adminBlocked: false,
        adminApproved: false,
        hasUser: false,
        createUser: false,
        userName: '',
        userEmail: '',
        userUsername: '',
        userPassword: '',
        userRoleName: 'SUB_MERCHANT',
        userPermissions: [],
        userPermissionSearch: '',
    })
    const [userSearch, setUserSearch] = useState('')
    const [userRoleFilter, setUserRoleFilter] = useState('')
    const [userStatusFilter, setUserStatusFilter] = useState('')
    const [userTypeFilter, setUserTypeFilter] = useState('')
    const [inqSearch, setInqSearch] = useState('')
    const [inqStatus, setInqStatus] = useState('')
    const [inqPriority, setInqPriority] = useState('')

    // Webhook Outbox Filters
    const [whStatus, setWhStatus] = useState('')
    const [whMerchantId, setWhMerchantId] = useState('')
    const [whOrderId, setWhOrderId] = useState('')
    const [whPaymentId, setWhPaymentId] = useState('')
    const [whFrom, setWhFrom] = useState('')
    const [whTo, setWhTo] = useState('')
    const [whPage, setWhPage] = useState(1)
    const [whPageSize, setWhPageSize] = useState(20)
    const [whRows, setWhRows] = useState([])
    const [whTotalPages, setWhTotalPages] = useState(1)
    const [whTotalElements, setWhTotalElements] = useState(0)
    const [whBusy, setWhBusy] = useState(false)
    const [whError, setWhError] = useState(null)
    const [whResendTarget, setWhResendTarget] = useState(null)
    const [whResetAttempts, setWhResetAttempts] = useState(true)
    const [whDetail, setWhDetail] = useState(null)
    const [whExpanded, setWhExpanded] = useState(() => new Set())

    // Risk Dashboard Filters
    const [riskLevel, setRiskLevel] = useState('')
    const [riskMerchantId, setRiskMerchantId] = useState('')
    const [riskMerchantName, setRiskMerchantName] = useState('')
    const [riskPayoutFreeze, setRiskPayoutFreeze] = useState('')
    const [riskPage, setRiskPage] = useState(1)
    const [riskPageSize, setRiskPageSize] = useState(20)
    const [riskRows, setRiskRows] = useState([])
    const [riskTotalPages, setRiskTotalPages] = useState(1)
    const [riskTotalElements, setRiskTotalElements] = useState(0)
    const [riskBusy, setRiskBusy] = useState(false)
    const [riskError, setRiskError] = useState(null)
    const [riskOverrideTarget, setRiskOverrideTarget] = useState(null)
    const [riskOverrideLevel, setRiskOverrideLevel] = useState('')
    const [reserveOverrideTarget, setReserveOverrideTarget] = useState(null)
    const [reserveOverridePercent, setReserveOverridePercent] = useState('')
    const [freezeTarget, setFreezeTarget] = useState(null)
    const [freezeReason, setFreezeReason] = useState('')

    useEffect(() => {
        const stored = localStorage.getItem(ADMIN_DASHBOARD_NAV_KEY)
        if (!stored) return
        let payload = null
        try {
            payload = JSON.parse(stored)
        } catch {
            localStorage.removeItem(ADMIN_DASHBOARD_NAV_KEY)
            return
        }
        if (!payload?.page) {
            localStorage.removeItem(ADMIN_DASHBOARD_NAV_KEY)
            return
        }
        if (payload.page !== page) {
            window.location.hash = payload.page
            return
        }
        const filters = payload.filters || {}
        if (payload.page === 'page-merchants') {
            setFilterMerchantEmail('')
            setFilterMerchantName('')
            setFilterMerchantId('')
            setFilterSettlementMode('')
            setFilterStatus(filters.status || '')
        }
        if (payload.page === 'page-submerchants') {
            setSubMerchantMerchantId('')
            setSubMerchantBranchCode('')
            setSubMerchantBranchName('')
            setSubMerchantHasUser('')
            setSubMerchantStatus(filters.status || '')
        }
        localStorage.removeItem(ADMIN_DASHBOARD_NAV_KEY)
    }, [page])

    // Roles & Permissions
    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [rolePermissionSearch, setRolePermissionSearch] = useState('')
    const [showCreateRole, setShowCreateRole] = useState(false)
    const [editRoleOpen, setEditRoleOpen] = useState(false)
    const [editRoleId, setEditRoleId] = useState(null)
    const [editRoleName, setEditRoleName] = useState('')
    const [editPermissions, setEditPermissions] = useState([])
    const [editPermissionSearch, setEditPermissionSearch] = useState('')
    const [roleError, setRoleError] = useState('')
    const [settingsTab, setSettingsTab] = useState('profile')
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        username: '',
        roles: [],
        permissions: [],
    })
    const [profileBusy, setProfileBusy] = useState(false)
    const [profileError, setProfileError] = useState('')
    const [profileNotice, setProfileNotice] = useState('')
    const [profileLoaded, setProfileLoaded] = useState(false)
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

    const loadAdminProfile = async () => {
        try {
            setProfileBusy(true)
            setProfileError('')
            const data = await fetchAdminProfile()
            setProfileForm({
                name: data?.name || '',
                email: data?.email || '',
                username: data?.username || '',
                roles: Array.isArray(data?.roles) ? data.roles : [],
                permissions: Array.isArray(data?.permissions) ? data.permissions : [],
            })
        } catch (err) {
            setProfileError(err?.data?.message || err?.message || 'Unable to load profile.')
        } finally {
            setProfileBusy(false)
            setProfileLoaded(true)
        }
    }

    useEffect(() => {
        setPayPage(1)
    }, [payFrom, payTo, payMerchant, payOrderId, payMethod, payStatus])

    useEffect(() => {
        setReportStatus('')
    }, [reportType])

    useEffect(() => {
        if (profileLoaded) return
        loadAdminProfile()
    }, [profileLoaded])

    useEffect(() => {
        if (page !== 'page-payments') return
        const handle = setInterval(() => setPayRefreshTick((tick) => tick + 1), PAYMENTS_REFRESH_MS)
        return () => clearInterval(handle)
    }, [page])

    useEffect(() => {
        if (page !== 'page-settings') return
        const saved = localStorage.getItem(ADMIN_SETTINGS_TAB_KEY)
        if (saved === 'profile' || saved === 'security') {
            setSettingsTab(saved)
        }
    }, [page])

    const resetSecurityForm = () => {
        setPasswordForm({ current: '', next: '', confirm: '' })
        setPasswordError('')
        setPasswordNotice('')
        setShowPasswordCurrent(false)
        setShowPasswordNext(false)
        setShowPasswordConfirm(false)
    }

    const setSettingsTabPersist = (tab) => {
        if (tab !== settingsTab) {
            resetSecurityForm()
        }
        setSettingsTab(tab)
        localStorage.setItem(ADMIN_SETTINGS_TAB_KEY, tab)
    }

    useEffect(() => {
        if (settingsTab === 'security') {
            resetSecurityForm()
        }
    }, [settingsTab])

    // Merchant Storage
    const { merchants, updateMerchantStatus, reloadMerchants, loadError } = useMerchantStorage()
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState([])
    const [paymentMethods, setPaymentMethods] = useState([])
    const [paymentMethodName, setPaymentMethodName] = useState('')
    const [paymentMethodActive, setPaymentMethodActive] = useState(true)
    const [paymentMethodBusy, setPaymentMethodBusy] = useState(false)
    const [paymentMethodError, setPaymentMethodError] = useState('')
    const [apiNotice, setApiNotice] = useState('')
    const [subMerchants, setSubMerchants] = useState(adminSubMerchantsData || [])
    const [adminUsers, setAdminUsers] = useState([])
    const [adminUsersError, setAdminUsersError] = useState('')
    const [adminRoles, setAdminRoles] = useState([])
    const [adminRolesError, setAdminRolesError] = useState('')
    const [adminPermissions, setAdminPermissions] = useState([])
    const [adminPermissionMap, setAdminPermissionMap] = useState({})
    const [adminPermissionsError, setAdminPermissionsError] = useState('')
    const [adminLimitPolicies, setAdminLimitPolicies] = useState([])
    const [limitError, setLimitError] = useState('')
    const [payments, setPayments] = useState([])
    const [paymentsSummary, setPaymentsSummary] = useState(null)
    const [paymentsTotalPages, setPaymentsTotalPages] = useState(1)
    const [paymentsError, setPaymentsError] = useState('')
    const refunds = adminRefundsData || []
    const [auditLogs, setAuditLogs] = useState([])
    const [auditLogsError, setAuditLogsError] = useState('')
    const [auditLogsLoading, setAuditLogsLoading] = useState(false)
    const [userModalOpen, setUserModalOpen] = useState(false)
    const [userModalMode, setUserModalMode] = useState('create')
    const [editingUserId, setEditingUserId] = useState(null)
    const [showUserPassword, setShowUserPassword] = useState(false)
    const [userFormData, setUserFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        blocked: false,
        roleIds: [],
    })
    const [userFormError, setUserFormError] = useState('')
    const [userFormBusy, setUserFormBusy] = useState(false)
    const [limitModalOpen, setLimitModalOpen] = useState(false)
    const [limitFormBusy, setLimitFormBusy] = useState(false)
    const [limitFormError, setLimitFormError] = useState('')
    const [limitFormData, setLimitFormData] = useState({
        merchantId: null,
        merchantName: '',
        paymentMethodId: null,
        paymentMethodName: '',
        active: true,
        dailyLimit: '',
        monthlyLimit: '',
        perTransactionLimit: '',
        minSingleAmount: '',
    })

    // Get editing merchant
    const editingMerchant = useMemo(
        () => merchants.find((m) => m.id === editingMerchantId) || null,
        [editingMerchantId, merchants]
    )
    const [editingMerchantDetail, setEditingMerchantDetail] = useState(null)
    const roleFilterOptions = useMemo(() => {
        const roleNames = adminRoles.map((role) => role.name).filter(Boolean)
        const userRoleNames = adminUsers.map((user) => user.role).filter((role) => role && role !== '-')
        return Array.from(new Set([...roleNames, ...userRoleNames]))
    }, [adminRoles, adminUsers])

    const filteredSubMerchantPerms = useMemo(() => {
        const search = subMerchantForm.userPermissionSearch.trim().toLowerCase()
        if (!search) return adminPermissions
        return adminPermissions.filter((perm) => perm.toLowerCase().includes(search))
    }, [adminPermissions, subMerchantForm.userPermissionSearch])

    const filteredRolePermissions = useMemo(() => {
        const search = rolePermissionSearch.trim().toLowerCase()
        if (!search) return adminPermissions
        return adminPermissions.filter((perm) => perm.toLowerCase().includes(search))
    }, [adminPermissions, rolePermissionSearch])

    const filteredEditPermissions = useMemo(() => {
        const search = editPermissionSearch.trim().toLowerCase()
        if (!search) return adminPermissions
        return adminPermissions.filter((perm) => perm.toLowerCase().includes(search))
    }, [adminPermissions, editPermissionSearch])

    const reportMerchantOptions = useMemo(() => {
        const query = reportMerchant.trim().toLowerCase()
        const base = merchants.map((merchant) => ({
            id: merchant.id ?? merchant.merchantId,
            legalName: merchant.legal_name || merchant.legalName || merchant.business_name || merchant.businessName || '',
            businessName: merchant.business_name || merchant.businessName || '',
        })).filter((row) => row.id)

        if (!query) {
            return base.slice(0, 10)
        }
        return base
            .filter((row) => row.legalName.toLowerCase().includes(query))
            .slice(0, 10)
    }, [merchants, reportMerchant])

    const reportColumns = useMemo(() => ([
        { key: 'merchantName', label: 'Merchant' },
        { key: 'orderId', label: 'Order ID' },
        { key: 'amount', label: 'Amount' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created' },
    ]), [])

    const reportTypeOptions = useMemo(
        () => ([
            { value: 'collections', label: 'Collections' },
            { value: 'settlements', label: 'Settlements' },
            { value: 'refunds', label: 'Refunds' },
            { value: 'ledger', label: 'Backoffice Ledger' },
            { value: 'submerchants', label: 'Sub Merchants' },
            { value: 'users', label: 'Users' },
        ]),
        []
    )

    const reportStatusOptions = useMemo(() => {
        if (reportType === 'collections') return COLLECTION_STATUS_OPTIONS
        if (reportType === 'settlements') return SETTLEMENT_STATUS_OPTIONS
        if (reportType === 'refunds') return REFUND_STATUS_OPTIONS
        if (reportType === 'submerchants') return ['active', 'blocked', 'admin-blocked', 'awaiting']
        if (reportType === 'users') {
            const statuses = adminUsers.map((row) => row.status).filter(Boolean)
            return Array.from(new Set(statuses))
        }
        return []
    }, [reportType, adminUsers])

    const buildReportRangeLabel = () => {
        if (reportFrom && reportTo) return `${reportFrom} to ${reportTo}`
        if (reportFrom) return `From ${reportFrom}`
        if (reportTo) return `Up to ${reportTo}`
        return 'All time'
    }

    const subMerchantDefaultPerms = useMemo(
        () => ['VIEW_PAYMENT', 'VIEW_REFUND', 'CREATE_REFUND'],
        []
    )

    useEffect(() => {
        if (!subMerchantForm.createUser) {
            setSubMerchantUsernameStatus('idle')
            setSubMerchantUsernameSuggestions([])
            if (subMerchantUsernameRef.current) {
                subMerchantUsernameRef.current.setCustomValidity('')
            }
            return
        }
        const clean = subMerchantForm.userUsername.trim()
        if (!clean) {
            setSubMerchantUsernameStatus('idle')
            setSubMerchantUsernameSuggestions([])
            if (subMerchantUsernameRef.current) {
                subMerchantUsernameRef.current.setCustomValidity('')
            }
            return
        }
        setSubMerchantUsernameStatus('checking')
        const handle = setTimeout(async () => {
            try {
                const res = await checkAdminUsernameAvailability(clean)
                const available = Boolean(res?.available)
                const suggestions = Array.isArray(res?.suggestions) ? res.suggestions : []
                setSubMerchantUsernameStatus(available ? 'available' : 'taken')
                setSubMerchantUsernameSuggestions(available ? [] : suggestions)
                if (subMerchantUsernameRef.current) {
                    subMerchantUsernameRef.current.setCustomValidity(available ? '' : 'Username already exists')
                }
            } catch {
                setSubMerchantUsernameStatus('idle')
                setSubMerchantUsernameSuggestions([])
                if (subMerchantUsernameRef.current) {
                    subMerchantUsernameRef.current.setCustomValidity('')
                }
            }
        }, 450)
        return () => clearTimeout(handle)
    }, [subMerchantForm.createUser, subMerchantForm.userUsername])

    useEffect(() => {
        if (subMerchantForm.userRoleName !== 'SUB_MERCHANT') return
        if (subMerchantForm.userPermissions.length === 0 && !subMerchantForm.userPermissionSearch) return
        setSubMerchantForm((prev) => ({
            ...prev,
            userPermissions: [],
            userPermissionSearch: '',
        }))
    }, [subMerchantForm.userRoleName, subMerchantForm.userPermissions.length, subMerchantForm.userPermissionSearch])

    const normalizedSelectedPermissions = useMemo(() => {
        return new Set(permissions.map((p) => p.trim().toLowerCase()))
    }, [permissions])

    const normalizedEditPermissions = useMemo(() => {
        return new Set(editPermissions.map((p) => p.trim().toLowerCase()))
    }, [editPermissions])

    const formatMerchantOption = (merchant) => {
        if (!merchant) return ''
        const legal = merchant.legalName || '-'
        const business = merchant.businessName ? ` · ${merchant.businessName}` : ''
        return `${legal}${business} (#${merchant.id})`
    }

    const mapAdminUserRow = (user) => ({
        id: user.id ?? user.userId ?? user.user_id,
        name: user.name,
        email: user.email,
        role: user.roles?.[0] || '-',
        status: user.blocked ? 'blocked' : 'active',
        createdAt: '-',
    })
    const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
    const [apiKeyModalData, setApiKeyModalData] = useState([])
    const [stepUpModalOpen, setStepUpModalOpen] = useState(false)
    const [stepUpBusy, setStepUpBusy] = useState(false)
    const [stepUpError, setStepUpError] = useState('')
    const [stepUpPassword, setStepUpPassword] = useState('')
    const [stepUpToken, setStepUpToken] = useState('')
    const [stepUpExpiresAt, setStepUpExpiresAt] = useState(null)
    const [pendingStepUpAction, setPendingStepUpAction] = useState(null)
    const [backofficeBusy, setBackofficeBusy] = useState(false)
    const [backofficeNotice, setBackofficeNotice] = useState('')
    const currentUserId = claims?.userId ? Number(claims.userId) : null

    const mapLimitRow = (row) => ({
        ...row,
        rowKey: `${row.merchantId}-${row.paymentMethodId}`,
    })

    const resetLimitForm = () => {
        setLimitFormData({
            merchantId: null,
            merchantName: '',
            paymentMethodId: null,
            paymentMethodName: '',
            active: true,
            dailyLimit: '',
            monthlyLimit: '',
            perTransactionLimit: '',
            minSingleAmount: '',
        })
        setLimitFormError('')
    }

    const openLimitEditor = (row) => {
        setLimitFormData({
            merchantId: row.merchantId,
            merchantName: row.merchantName,
            paymentMethodId: row.paymentMethodId,
            paymentMethodName: row.paymentMethodName,
            active: Boolean(row.active),
            dailyLimit: row.dailyLimit ?? '',
            monthlyLimit: row.monthlyLimit ?? '',
            perTransactionLimit: row.perTransactionLimit ?? '',
            minSingleAmount: row.minSingleAmount ?? '',
        })
        setLimitFormError('')
        setLimitModalOpen(true)
    }

    const submitLimitForm = async () => {
        if (!limitFormData.merchantId || !limitFormData.paymentMethodId) return
        setLimitFormBusy(true)
        setLimitFormError('')
        try {
            const payload = {
                active: Boolean(limitFormData.active),
                dailyLimit: limitFormData.dailyLimit === '' ? null : Number(limitFormData.dailyLimit),
                monthlyLimit: limitFormData.monthlyLimit === '' ? null : Number(limitFormData.monthlyLimit),
                perTransactionLimit:
                    limitFormData.perTransactionLimit === '' ? null : Number(limitFormData.perTransactionLimit),
                minSingleAmount: limitFormData.minSingleAmount === '' ? null : Number(limitFormData.minSingleAmount),
            }
            await updateAdminLimit(limitFormData.merchantId, limitFormData.paymentMethodId, payload)
            const rows = await fetchAdminLimits()
            const mapped = Array.isArray(rows) ? rows.map(mapLimitRow) : []
            setAdminLimitPolicies(mapped)
            setLimitModalOpen(false)
            resetLimitForm()
        } catch (err) {
            setLimitFormError(err?.data?.message || err?.message || 'Unable to update limits.')
        } finally {
            setLimitFormBusy(false)
        }
    }

    const copyValue = async (value) => {
        if (!value) return
        try {
            await navigator.clipboard.writeText(value)
        } catch {
            // fallback: do nothing
        }
    }

    const resetSubMerchantForm = () => {
        setSubMerchantForm({
            id: null,
            merchantId: '',
            branchCode: '',
            branchName: '',
            blocked: false,
            adminBlocked: false,
            adminApproved: false,
            hasUser: false,
            createUser: false,
            userName: '',
            userEmail: '',
            userUsername: '',
            userPassword: '',
            userRoleName: 'SUB_MERCHANT',
            userPermissions: [],
            userPermissionSearch: '',
        })
        setSubMerchantFormError('')
        setSubMerchantMerchantQuery('')
        setSubMerchantMerchantOptions([])
        setSubMerchantUsernameStatus('idle')
        setSubMerchantUsernameSuggestions([])
    }

    const openCreateSubMerchant = () => {
        resetSubMerchantForm()
        setSubMerchantModalMode('create')
        setSubMerchantModalOpen(true)
    }

    const openEditSubMerchant = async (row) => {
        if (!row?.id) return
        resetSubMerchantForm()
        setSubMerchantModalMode('edit')
        setSubMerchantFormBusy(true)
        setSubMerchantModalOpen(true)
        try {
            const detail = await fetchAdminSubMerchant(row.id)
            setSubMerchantForm((prev) => ({
                ...prev,
                id: detail?.id ?? row.id,
                merchantId: String(detail?.merchantId ?? row.merchantId ?? ''),
                branchCode: detail?.branchCode ?? row.branchCode ?? '',
                branchName: detail?.branchName ?? row.branchName ?? '',
                blocked: Boolean(detail?.blocked ?? row.blocked),
                adminBlocked: Boolean(detail?.adminBlocked ?? row.adminBlocked),
                adminApproved: detail?.adminApproved !== null && detail?.adminApproved !== undefined
                    ? Boolean(detail.adminApproved)
                    : Boolean(row.adminApproved),
                hasUser: Boolean(detail?.userEmail ?? row.userEmail),
            }))
            const label = detail?.merchantName || detail?.legalName || row.merchantName || ''
            setSubMerchantMerchantQuery(label)
        } catch (err) {
            setSubMerchantFormError(err?.message || 'Unable to load sub-merchant details.')
        } finally {
            setSubMerchantFormBusy(false)
        }
    }

    const searchSubMerchantMerchants = async () => {
        const query = subMerchantMerchantQuery.trim()
        if (!query) {
            setSubMerchantMerchantOptions([])
            return
        }
        setSubMerchantMerchantBusy(true)
        try {
            const email = query.includes('@') ? query : undefined
            const legalName = email ? undefined : query
            const page = await fetchAdminMerchants({
                page: 0,
                size: 50,
                legalName,
                email,
            })
            const rows = Array.isArray(page?.content) ? page.content : []
            const mapped = rows.map((row) => ({
                id: row.merchantId ?? row.id,
                legalName: row.legalName || row.legal_name || row.businessName || row.business_name || '-',
                businessName: row.businessName || row.business_name || '',
                email: row.email || '',
            }))
            setSubMerchantMerchantOptions(mapped)
            if (mapped.length === 1) {
                setSubMerchantForm((prev) => ({
                    ...prev,
                    merchantId: String(mapped[0].id),
                }))
                setSubMerchantMerchantQuery(formatMerchantOption(mapped[0]))
            }
        } catch {
            setSubMerchantMerchantOptions([])
        } finally {
            setSubMerchantMerchantBusy(false)
        }
    }

    useEffect(() => {
        if (!subMerchantModalOpen) return
        const query = debouncedSubMerchantMerchantQuery.trim()
        if (query) {
            searchSubMerchantMerchants()
            return
        }
        const seed = Array.isArray(merchants) ? merchants.slice(0, 50) : []
        const mapped = seed.map((row) => ({
            id: row.id ?? row.merchantId,
            legalName: row.legal_name || row.legalName || row.business_name || row.businessName || '-',
            businessName: row.businessName || row.business_name || '',
            email: row.email || '',
        }))
        setSubMerchantMerchantOptions(mapped)
    }, [subMerchantModalOpen, debouncedSubMerchantMerchantQuery, merchants])

    const toggleSubMerchantPermission = (perm) => {
        setSubMerchantForm((prev) => {
            const next = new Set(prev.userPermissions)
            if (next.has(perm)) {
                next.delete(perm)
            } else {
                next.add(perm)
            }
            return { ...prev, userPermissions: Array.from(next) }
        })
    }

    const loadSubMerchants = async () => {
        try {
            const merchantIdRaw = subMerchantMerchantId.trim()
            const merchantId = merchantIdRaw ? Number(merchantIdRaw) : undefined
            const isBlocked =
                subMerchantStatus === 'blocked'
                    ? true
                    : subMerchantStatus === 'active'
                        ? false
                        : undefined
            const hasUser =
                subMerchantHasUser === 'yes'
                    ? true
                    : subMerchantHasUser === 'no'
                        ? false
                        : undefined

            const page = await fetchAdminSubMerchants({
                page: 0,
                size: 200,
                merchantId: Number.isNaN(merchantId) ? undefined : merchantId,
                branchCode: subMerchantBranchCode.trim() || undefined,
                branchName: subMerchantBranchName.trim() || undefined,
                isBlocked,
                hasUser,
            })
            const rows = Array.isArray(page?.content) ? page.content : []
            const mapped = rows.map((row) => ({
                id: row.id,
                merchantId: row.merchantId,
                merchantName: row.merchantName,
                branchCode: row.branchCode,
                branchName: row.branchName,
                status: row.adminBlocked
                    ? 'admin-blocked'
                    : row.adminApproved === false
                        ? 'awaiting'
                        : (row.blocked ? 'blocked' : 'active'),
                blocked: Boolean(row.blocked),
                adminBlocked: Boolean(row.adminBlocked),
                adminApproved: row.adminApproved !== null && row.adminApproved !== undefined
                    ? Boolean(row.adminApproved)
                    : true,
                userEmail: row.userEmail || '',
                hasUser: Boolean(row.userEmail),
                createdAt: row.createdAt,
            }))
            setSubMerchants(mapped)
            setApiNotice('')
        } catch {
            setApiNotice('API not reachable, showing demo data.')
        }
    }

    const submitSubMerchantForm = async (e) => {
        e?.preventDefault?.()
        setSubMerchantFormError('')
        const merchantIdValue = subMerchantForm.merchantId.trim()
        if (!merchantIdValue || Number.isNaN(Number(merchantIdValue))) {
            setSubMerchantFormError('Merchant ID is required.')
            return
        }
        if (!subMerchantForm.branchCode.trim() || !subMerchantForm.branchName.trim()) {
            setSubMerchantFormError('Branch code and branch name are required.')
            return
        }
        if (subMerchantForm.createUser) {
            if (!subMerchantForm.userName.trim()
                || !subMerchantForm.userEmail.trim()
                || !subMerchantForm.userUsername.trim()
                || !subMerchantForm.userPassword.trim()
            ) {
                setSubMerchantFormError('User name, email, username, and password are required.')
                return
            }
            if (subMerchantUsernameStatus === 'taken') {
                setSubMerchantFormError('Username already exists. Please pick another.')
                return
            }
            if (subMerchantForm.userPermissions.length > 0 && !subMerchantForm.userRoleName.trim()) {
                setSubMerchantFormError('Role name is required when selecting permissions.')
                return
            }
        }

        setSubMerchantFormBusy(true)
        try {
            const payload = {
                branchCode: subMerchantForm.branchCode.trim(),
                branchName: subMerchantForm.branchName.trim(),
                blocked: Boolean(subMerchantForm.blocked),
            }
            if (subMerchantModalMode === 'create') {
                const createPayload = { ...payload }
                if (subMerchantForm.createUser) {
                    createPayload.user = {
                        name: subMerchantForm.userName.trim(),
                        email: subMerchantForm.userEmail.trim(),
                        username: subMerchantForm.userUsername.trim(),
                        password: subMerchantForm.userPassword,
                        roleName: subMerchantForm.userPermissions.length > 0
                            ? (subMerchantForm.userRoleName.trim() || null)
                            : null,
                        permissions: subMerchantForm.userPermissions,
                    }
                }
                await createAdminSubMerchant(Number(merchantIdValue), createPayload)
            } else if (subMerchantForm.id) {
                await updateAdminSubMerchant(subMerchantForm.id, payload)
                if (subMerchantForm.createUser && !subMerchantForm.hasUser) {
                    await createAdminSubMerchantUser(subMerchantForm.id, {
                        name: subMerchantForm.userName.trim(),
                        email: subMerchantForm.userEmail.trim(),
                        username: subMerchantForm.userUsername.trim(),
                        password: subMerchantForm.userPassword,
                        roleName: subMerchantForm.userPermissions.length > 0
                            ? (subMerchantForm.userRoleName.trim() || null)
                            : null,
                        permissions: subMerchantForm.userPermissions,
                    })
                }
            }
            await loadSubMerchants()
            setSubMerchantModalOpen(false)
            resetSubMerchantForm()
        } catch (err) {
            setSubMerchantFormError(err?.data?.message || err?.message || 'Unable to save sub-merchant.')
        } finally {
            setSubMerchantFormBusy(false)
        }
    }

    const handleToggleSubMerchant = async (row) => {
        if (!row?.id) return
        const nextBlocked = !row.blocked
        try {
            await updateAdminSubMerchant(row.id, { blocked: nextBlocked })
            setSubMerchants((prev) =>
                prev.map((item) =>
                    item.id === row.id
                        ? {
                            ...item,
                            status: nextBlocked ? 'admin-blocked' : 'active',
                            blocked: nextBlocked,
                            adminBlocked: nextBlocked,
                            adminApproved: !nextBlocked,
                        }
                        : item
                )
            )
        } catch (err) {
            setApiNotice(err?.data?.message || err?.message || 'Unable to update sub-merchant status.')
        }
    }

    const handleCreateSubMerchantUser = async (row) => {
        if (!row?.id) return
        resetSubMerchantForm()
        setSubMerchantModalMode('edit')
        setSubMerchantModalOpen(true)
        setSubMerchantForm((prev) => ({
            ...prev,
            id: row.id,
            merchantId: String(row.merchantId ?? ''),
            branchCode: row.branchCode || '',
            branchName: row.branchName || '',
            blocked: Boolean(row.blocked),
            adminBlocked: Boolean(row.adminBlocked),
            adminApproved: Boolean(row.adminApproved),
            hasUser: Boolean(row.userEmail),
            createUser: true,
        }))
    }

    const loadAdminUsers = async ({ force = false } = {}) => {
        if (!force && adminUsersLoadedRef.current) return
        try {
            const rows = await fetchAdminUsers()
            const mapped = Array.isArray(rows) ? rows.map(mapAdminUserRow) : []
            setAdminUsers(mapped)
            setAdminUsersError('')
            adminUsersLoadedRef.current = true
        } catch (err) {
            setAdminUsers([])
            setAdminUsersError(err?.message || 'Unable to load users.')
        }
    }

    const resetUserForm = () => {
        setUserFormData({
            name: '',
            email: '',
            username: '',
            password: '',
            blocked: false,
            roleIds: [],
        })
        setShowUserPassword(false)
        setUserFormError('')
        setEditingUserId(null)
    }

    const openCreateUser = () => {
        resetUserForm()
        setUserModalMode('create')
        setUserModalOpen(true)
    }

    const openEditUser = async (row) => {
        if (row?.id === undefined || row?.id === null) return
        setUserModalMode('edit')
        setUserModalOpen(true)
        setUserFormBusy(true)
        setUserFormError('')
        setEditingUserId(row.id)
        try {
            const detail = await fetchAdminUser(row.id)
            setUserFormData({
                name: detail?.name || '',
                email: detail?.email || '',
                username: detail?.username || '',
                password: '',
                blocked: Boolean(detail?.blocked),
                roleIds: Array.from(detail?.roleIds || []).map((id) => String(id)),
            })
        } catch (err) {
            setUserFormError(err?.message || 'Unable to load user details.')
        } finally {
            setUserFormBusy(false)
        }
    }

    const toggleUserRole = (roleId) => {
        const roleKey = String(roleId)
        setUserFormData((prev) => {
            const next = new Set(prev.roleIds)
            if (next.has(roleKey)) {
                next.delete(roleKey)
            } else {
                next.add(roleKey)
            }
            return { ...prev, roleIds: Array.from(next) }
        })
    }

    const toggleRolePermission = (perm) => {
        setPermissions((prev) => {
            const next = new Set(prev.filter(Boolean))
            if (next.has(perm)) {
                next.delete(perm)
            } else {
                next.add(perm)
            }
            return Array.from(next)
        })
    }

    const toggleEditRolePermission = (perm) => {
        setEditPermissions((prev) => {
            const next = new Set(prev.filter(Boolean))
            if (next.has(perm)) {
                next.delete(perm)
            } else {
                next.add(perm)
            }
            return Array.from(next)
        })
    }

    const submitUserForm = async () => {
        const name = userFormData.name.trim()
        const email = userFormData.email.trim()
        const username = userFormData.username.trim()
        const password = userFormData.password
        const roleIds = userFormData.roleIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id))

        const errors = []
        if (!name) errors.push('Name is required.')
        else if (!new RegExp(NAME_PATTERN).test(name)) errors.push('Name format is invalid.')

        if (userModalMode === 'create') {
            if (!email) errors.push('Email is required.')
            else if (!new RegExp(EMAIL_PATTERN).test(email)) errors.push('Email format is invalid.')
            if (!username) errors.push('Username is required.')
            else if (!new RegExp(USERNAME_PATTERN).test(username)) errors.push('Username format is invalid.')
            if (!password) errors.push('Password is required.')
            else if (!new RegExp(PASSWORD_PATTERN).test(password)) errors.push('Password must be at least 8 characters and include a number.')
        }

        if (roleIds.length === 0) errors.push('Select at least one role.')
        if (!adminRoles.length) errors.push('Roles are not loaded yet.')

        if (errors.length) {
            setUserFormError(errors[0])
            return
        }

        setUserFormBusy(true)
        setUserFormError('')
        try {
            if (userModalMode === 'create') {
                await createAdminUser({
                    user: {
                        email,
                        username,
                        name,
                        password,
                        blocked: userFormData.blocked,
                    },
                    roleIds,
                })
            } else if (editingUserId) {
                await updateAdminUser(editingUserId, {
                    name,
                    blocked: userFormData.blocked,
                    roleIds,
                })
            }
            const rows = await fetchAdminUsers()
            const mapped = Array.isArray(rows) ? rows.map(mapAdminUserRow) : []
            setAdminUsers(mapped)
            setApiNotice('')
            setUserModalOpen(false)
            resetUserForm()
        } catch (err) {
            setUserFormError(err?.data?.message || err?.message || 'Unable to save user.')
        } finally {
            setUserFormBusy(false)
        }
    }

    const loadRoles = async (activeRef) => {
        try {
            const rows = await fetchAdminRoles()
            const mapped = Array.isArray(rows) ? rows : []
            if (!activeRef || activeRef.current) {
                setAdminRoles(mapped)
                setAdminRolesError('')
            }
        } catch (err) {
            if (!activeRef || activeRef.current) {
                setAdminRoles([])
                setAdminRolesError(err?.message || 'Unable to load roles.')
            }
        }
    }

    useEffect(() => {
        const activeRef = { current: true }
        loadRoles(activeRef)
        return () => {
            activeRef.current = false
        }
    }, [])

    useEffect(() => {
        let active = true
        const loadPermissions = async () => {
            try {
                const rows = await fetchAdminPermissions()
                const mapped = Array.isArray(rows) ? rows : []
                const options = mapped
                    .map((p) => {
                        const name = p?.permissionName || p?.name || p?.permission
                        const id = p?.id ?? null
                        return name && id != null ? { id, name } : null
                    })
                    .filter(Boolean)
                const allPerms = options.map((p) => p.name).sort()
                const nameToId = options.reduce((acc, p) => {
                    acc[p.name] = p.id
                    return acc
                }, {})
                if (active) {
                    setAdminPermissions(allPerms)
                    setAdminPermissionMap(nameToId)
                    setAdminPermissionsError('')
                }
            } catch (err) {
                if (active) {
                    setAdminPermissions([])
                    setAdminPermissionMap({})
                    setAdminPermissionsError(err?.message || 'Unable to load permissions.')
                }
            }
        }
        loadPermissions()
        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        let active = true
        const run = async () => {
            await loadSubMerchants()
            if (active) {
                loadAdminUsers()
            }
        }

        run()

        return () => {
            active = false
        }
    }, [subMerchantMerchantId, subMerchantBranchCode, subMerchantBranchName, subMerchantStatus, subMerchantHasUser])

    useEffect(() => {
        if (page !== 'page-users') return
        loadAdminUsers({ force: true })
    }, [page])

    useEffect(() => {
        if (!subMerchantActionMenu) return
        const handleClick = (event) => {
            if (!event.target.closest('[data-subm-actions-root]')) {
                setSubMerchantActionMenu(null)
            }
        }
        const handleClose = () => setSubMerchantActionMenu(null)
        document.addEventListener('mousedown', handleClick)
        window.addEventListener('scroll', handleClose, true)
        window.addEventListener('resize', handleClose)
        return () => {
            document.removeEventListener('mousedown', handleClick)
            window.removeEventListener('scroll', handleClose, true)
            window.removeEventListener('resize', handleClose)
        }
    }, [subMerchantActionMenu])

    useEffect(() => {
        let active = true

        if (page !== 'page-payments') {
            return () => {
                active = false
            }
        }

        const resolveMerchantId = () => {
            const q = debouncedPayMerchant.trim()
            if (!q) return undefined
            const asNumber = Number(q)
            if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
                return asNumber
            }
            const lowered = q.toLowerCase()
            const matches = merchants.filter((m) =>
                (m.business_name || '').toLowerCase().includes(lowered)
            )
            if (matches.length === 1) return matches[0].id
            return undefined
        }

        const loadPayments = async () => {
            try {
                const merchantId = resolveMerchantId()
                const merchantQuery = debouncedPayMerchant.trim().toLowerCase()
                const rawOrderId = debouncedPayOrderId.trim()
                const orderId = rawOrderId && /^\d+$/.test(rawOrderId) ? Number(rawOrderId) : undefined
                const params = {
                    merchantId,
                    status: debouncedPayStatus || undefined,
                    paymentMethodName: debouncedPayMethod || undefined,
                    fromDate: debouncedPayFrom || undefined,
                    toDate: debouncedPayTo || undefined,
                    orderId,
                    page: Math.max(payPage - 1, 0),
                    size: payPageSize,
                }
                const res = await fetchAdminPayments(params)
                const rows = Array.isArray(res?.content) ? res.content : []
                const mapped = rows.map((r) => {
                        const merchant = merchants.find((m) => m.id === r.merchantId)
                        return {
                            id: r.id,
                            merchantName: merchant?.business_name || `Merchant ${r.merchantId ?? ''}`,
                            branchCode: r.subMerchantBranchCode || '-',
                            orderId: r.orderId,
                            amount: r.amount,
                            paymentMethod: r.paymentMethodName || '-',
                            status: r.status,
                            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
                            _merchantId: r.merchantId,
                        }
                    })
                const nameFiltered = merchantId || !merchantQuery
                    ? mapped
                    : mapped.filter((row) =>
                        (row.merchantName || '').toLowerCase().includes(merchantQuery)
                    )
                if (active) {
                    setPayments(nameFiltered)
                    setPaymentsSummary(res?.summary || null)
                    setPaymentsError('')
                }
            } catch (err) {
                if (active) {
                    const message = err?.data?.message || err?.message || 'Failed to load payments.'
                    setPaymentsError(message)
                }
            }
        }

        loadPayments()

        return () => {
            active = false
        }
    }, [
        debouncedPayFrom,
        debouncedPayTo,
        debouncedPayMerchant,
        debouncedPayOrderId,
        debouncedPayMethod,
        debouncedPayStatus,
        payPage,
        payPageSize,
        payRefreshTick,
        page,
        merchants,
    ])

    const resolveReportMerchantId = () => {
        const q = reportMerchant.trim()
        if (!q) return undefined
        const asNumber = Number(q)
        if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
            return asNumber
        }
        const lowered = q.toLowerCase()
        const matches = merchants.filter((m) =>
            (m.legal_name || m.legalName || '').toLowerCase().includes(lowered)
        )
        if (matches.length === 1) return matches[0].id
        return undefined
    }

    const generateAdminReport = async () => {
        setReportBusy(true)
        setReportError('')
        try {
            const rangeLabel = buildReportRangeLabel()
            const merchantId = resolveReportMerchantId()
            let rows = []
            let run = null

            if (reportType === 'collections') {
                const params = {
                    merchantId,
                    status: reportStatus || undefined,
                    fromDate: reportFrom || undefined,
                    toDate: reportTo || undefined,
                    page: 0,
                    size: 1000,
                }
                const res = await fetchAdminPayments(params)
                const content = Array.isArray(res?.content) ? res.content : []
                rows = content.map((r, idx) => {
                    const merchant = merchants.find((m) => m.id === r.merchantId)
                    return {
                        rowKey: r.id ?? `${r.orderId}-${idx}`,
                        merchantName: merchant?.business_name || `Merchant ${r.merchantId ?? ''}`,
                        branchCode: r.subMerchantBranchCode || '-',
                        orderId: r.orderId,
                        amount: r.amount ?? 0,
                        paymentMethod: r.paymentMethodName || '-',
                        status: r.status || '-',
                        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
                    }
                })
                const totalAmount = content.reduce((sum, r) => sum + Number(r.amount || 0), 0)
                run = {
                    id: `admin-report-${Date.now()}`,
                    name: 'Collections Report',
                    range: rangeLabel,
                    created: new Date().toLocaleString(),
                    status: 'READY',
                    rows,
                    columns: PAYMENT_COLUMNS,
                    csvColumns: [
                        { key: 'merchantName', label: 'Merchant Name' },
                        { key: 'branchCode', label: 'Branch Code' },
                        { key: 'orderId', label: 'Order ID' },
                        { key: 'amount', label: 'Amount' },
                        { key: 'paymentMethod', label: 'Payment Method' },
                        { key: 'status', label: 'Status' },
                        { key: 'createdAt', label: 'Created At' },
                    ],
                    summary: { count: rows.length, total: totalAmount },
                }
            } else if (reportType === 'settlements') {
                const res = await fetchAdminSettlementSummary({
                    merchantName: reportMerchant || undefined,
                    status: reportStatus || undefined,
                })
                const content = Array.isArray(res) ? res : []
                rows = content.map((r, idx) => ({
                    rowKey: `${r.merchantName || 'merchant'}-${idx}`,
                    merchantName: r.merchantName || '-',
                    merchantEmail: r.merchantEmail || '-',
                    totalSettlements: r.totalSettlements ?? 0,
                    totalSettledAmount: r.totalSettledAmount ?? 0,
                    dueAmount: r.dueAmount ?? 0,
                    status: r.status || '-',
                }))
                const totalAmount = content.reduce((sum, r) => sum + Number(r.totalSettledAmount || 0), 0)
                run = {
                    id: `admin-report-${Date.now()}`,
                    name: 'Settlement Summary',
                    range: rangeLabel,
                    created: new Date().toLocaleString(),
                    status: 'READY',
                    rows,
                    columns: SETTLEMENT_SUMMARY_COLUMNS,
                    csvColumns: [
                        { key: 'merchantName', label: 'Merchant Name' },
                        { key: 'merchantEmail', label: 'Legal Email' },
                        { key: 'totalSettlements', label: 'Total Settlements' },
                        { key: 'totalSettledAmount', label: 'Total Settled Amount' },
                        { key: 'dueAmount', label: 'Due Amount' },
                        { key: 'status', label: 'Settlement Status' },
                    ],
                    summary: { count: rows.length, total: totalAmount },
                }
            } else if (reportType === 'refunds') {
                const content = Array.isArray(adminRefundsData) ? adminRefundsData : []
                const query = reportMerchant.trim().toLowerCase()
                rows = content
                    .filter((r) => !reportStatus || r.status === reportStatus)
                    .filter((r) => !query || (r.merchantName || '').toLowerCase().includes(query))
                    .map((r, idx) => ({
                        rowKey: r.paymentId || `refund-${idx}`,
                        ...r,
                    }))
                run = {
                    id: `admin-report-${Date.now()}`,
                    name: 'Refunds Report',
                    range: rangeLabel,
                    created: new Date().toLocaleString(),
                    status: 'READY',
                    rows,
                    columns: REFUND_ADMIN_COLUMNS,
                    csvColumns: [
                        { key: 'paymentId', label: 'Payment ID' },
                        { key: 'merchantName', label: 'Merchant Name' },
                        { key: 'refundAmount', label: 'Refund Amount' },
                        { key: 'refundType', label: 'Refund Type' },
                        { key: 'reason', label: 'Reason' },
                        { key: 'requestedBy', label: 'Requested By' },
                        { key: 'status', label: 'Status' },
                    ],
                    summary: { count: rows.length },
                }
            } else if (reportType === 'ledger') {
                if (!merchantId) {
                    setReportRows([])
                    setReportError('Select a merchant to generate a ledger report.')
                    return
                }
                const page = await fetchAdminSettlementLedger({
                    merchantId,
                    fromDate: reportFrom || undefined,
                    toDate: reportTo || undefined,
                    page: 0,
                    size: 1000,
                })
                const content = Array.isArray(page?.content) ? page.content : []
                rows = content.map((r, idx) => ({
                    rowKey: r.id ?? `ledger-${idx}`,
                    ...normalizeLedgerRow(r),
                }))
                run = {
                    id: `admin-report-${Date.now()}`,
                    name: 'Backoffice Ledger',
                    range: rangeLabel,
                    created: new Date().toLocaleString(),
                    status: 'READY',
                    rows,
                    columns: settlementLedgerColumns,
                    csvColumns: [
                        { key: 'createdAtLocal', label: 'Time' },
                        { key: 'direction', label: 'Direction' },
                        { key: 'reasonLabel', label: 'Category' },
                        { key: 'debit', label: 'Debit' },
                        { key: 'credit', label: 'Credit' },
                        { key: 'settlementId', label: 'Settlement ID' },
                        { key: 'note', label: 'Note' },
                    ],
                    summary: { count: rows.length },
                }
            } else if (reportType === 'submerchants') {
                const page = await fetchAdminSubMerchants({
                    page: 0,
                    size: 500,
                    merchantId: merchantId || undefined,
                })
                const content = Array.isArray(page?.content) ? page.content : []
                rows = content
                    .map((row, idx) => ({
                        rowKey: row.id ?? `sub-${idx}`,
                        id: row.id,
                        merchantId: row.merchantId,
                        merchantName: row.merchantName,
                        branchCode: row.branchCode,
                        branchName: row.branchName,
                        status: row.adminBlocked
                            ? 'admin-blocked'
                            : row.adminApproved === false
                                ? 'awaiting'
                                : (row.blocked ? 'blocked' : 'active'),
                        blocked: Boolean(row.blocked),
                        adminBlocked: Boolean(row.adminBlocked),
                        adminApproved: row.adminApproved !== null && row.adminApproved !== undefined
                            ? Boolean(row.adminApproved)
                            : true,
                        userEmail: row.userEmail || '',
                        hasUser: Boolean(row.userEmail),
                        createdAt: row.createdAt,
                    }))
                    .filter((row) => !reportStatus || row.status === reportStatus)
                run = {
                    id: `admin-report-${Date.now()}`,
                    name: 'Sub Merchants Report',
                    range: rangeLabel,
                    created: new Date().toLocaleString(),
                    status: 'READY',
                    rows,
                    columns: SUB_MERCHANT_ADMIN_COLUMNS,
                    csvColumns: [
                        { key: 'branchCode', label: 'Branch Code' },
                        { key: 'branchName', label: 'Branch Name' },
                        { key: 'merchantName', label: 'Merchant Name' },
                        { key: 'userEmail', label: 'User Email' },
                        { key: 'status', label: 'Status' },
                        { key: 'createdAt', label: 'Created At' },
                    ],
                    summary: { count: rows.length },
                }
            } else if (reportType === 'users') {
                const users = await fetchAdminUsers()
                const content = Array.isArray(users) ? users : []
                rows = content
                    .filter((r) => !reportStatus || r.status === reportStatus)
                    .map((r, idx) => ({
                        rowKey: r.id ?? `user-${idx}`,
                        name: r.name || '-',
                        email: r.email || '-',
                        role: r.role || '-',
                        status: r.status || '-',
                    }))
                run = {
                    id: `admin-report-${Date.now()}`,
                    name: 'Users Report',
                    range: rangeLabel,
                    created: new Date().toLocaleString(),
                    status: 'READY',
                    rows,
                    columns: USERS_ADMIN_COLUMNS,
                    csvColumns: [
                        { key: 'name', label: 'Name' },
                        { key: 'email', label: 'Email' },
                        { key: 'role', label: 'Role' },
                        { key: 'status', label: 'Status' },
                    ],
                    summary: { count: rows.length },
                }
            }

            if (!run) {
                setReportRows([])
                setReportError('Unable to generate report for selected type.')
                return
            }

            setReportRows(rows)
            setReportRuns((prev) => [run, ...prev])
            setReportPreview(run)
        } catch (err) {
            setReportError(err?.data?.message || err?.message || 'Unable to generate report.')
            setReportRows([])
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
        const loadMerchantDetail = async () => {
            if (!editingMerchantId) {
                setEditingMerchantDetail(null)
                return
            }
            try {
                const [detail, limitRows] = await Promise.all([
                    fetchAdminMerchant(editingMerchantId),
                    fetchAdminLimits({ merchantId: editingMerchantId }),
                ])
                if (!active) return
                const pmList = Array.isArray(detail?.paymentMethods) ? detail.paymentMethods : []
                const selected = pmList.filter((m) => m.active).map((m) => String(m.paymentMethodId))
                const commissionMap = pmList.reduce((acc, m) => {
                    acc[String(m.paymentMethodId)] = m.commissionValue ?? ''
                    return acc
                }, {})
                const limitMap = Array.isArray(limitRows)
                    ? limitRows.reduce((acc, row) => {
                        const key = String(row.paymentMethodId)
                        acc[key] = {
                            dailyLimit: row.dailyLimit ?? '',
                            monthlyLimit: row.monthlyLimit ?? '',
                            perTransactionLimit: row.perTransactionLimit ?? '',
                            minSingleAmount: row.minSingleAmount ?? '',
                            active: Boolean(row.active),
                        }
                        return acc
                    }, {})
                    : {}
                const commissionMode = pmList.length > 1 ? 'Double' : 'Single'
                const commissionType = pmList[0]?.commissionMode === 'FLAT' ? 'Flat' : 'Percentage'
                const intervalMap = {
                    'T+1': 'T+1',
                    'T+2': 'T+2',
                    '5M': '5M',
                    '10M': '10M',
                    '30M': '30M',
                    '60M': '60M',
                }
                setEditingMerchantDetail({
                    id: detail.merchantId,
                    mid: String(detail.merchantId ?? ''),
                    business_name: detail.businessName || '',
                    legal_name: detail.legalName || '',
                    legal_email: detail.legalEmail || detail.legal_email || '',
                    status: detail.blocked ? 'blocked' : 'active',
                    settlement_type: detail.settlementMode === 'MANUAL' ? 'Manual' : 'Automatic',
                    settlement_interval: intervalMap[detail.settlementInterval] || detail.settlementInterval || 'T+1',
                    refund_commission: Boolean(detail.refundCommission),
                    auto_settlement_paused: Boolean(detail.autoSettlementPaused),
                    commission_mode: commissionMode,
                    commission_type: commissionType,
                    commission_value: pmList[0]?.commissionValue ?? '',
                    payment_methods: selected,
                    payment_method_commissions: commissionMap,
                    payment_method_limits: limitMap,
                })
            } catch {
                if (active) {
                    setEditingMerchantDetail(null)
                }
            }
        }
        loadMerchantDetail()
        return () => {
            active = false
        }
    }, [editingMerchantId])

    useEffect(() => {
        let active = true
        const loadLimits = async () => {
            try {
                const rows = await fetchAdminLimits()
                if (active) {
                    const mapped = Array.isArray(rows) ? rows.map(mapLimitRow) : []
                    setAdminLimitPolicies(mapped)
                    setLimitError('')
                }
            } catch (err) {
                if (active) {
                    setAdminLimitPolicies([])
                    setLimitError(err?.message || 'Unable to load limits.')
                }
            }
        }
        if (page === 'page-limits') {
            loadLimits()
        }
        return () => {
            active = false
        }
    }, [page])

    const mapSettlementRow = (row) => ({
        ...row,
        status: row.autoSettlementPaused ? 'Paused' : 'Active',
        rowKey: String(row.merchantId),
    })

    const loadSettlementSummaries = async () => {
        setSettlementBusy(true)
        setSettlementError('')
        try {
            const rows = await fetchAdminSettlementSummary({
                merchantName: stMerchantName || undefined,
                merchantEmail: stMerchantEmail || undefined,
                status: stStatus || undefined,
            })
            setSettlementRows(Array.isArray(rows) ? rows.map(mapSettlementRow) : [])
        } catch (err) {
            setSettlementRows([])
            setSettlementError(err?.message || 'Unable to load settlements.')
        } finally {
            setSettlementBusy(false)
        }
    }

    const loadSettlementLedger = async () => {
        setLedgerError('')
        try {
            const merchantId = ledgerMerchantId.trim()
            if (!merchantId) {
                setLedgerRows([])
                return
            }
            const page = await fetchAdminSettlementLedger({
                merchantId,
                fromDate: ledgerFrom || undefined,
                toDate: ledgerTo || undefined,
                page: Math.max(ledgerPage - 1, 0),
                size: ledgerPageSize,
            })
            const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
            setLedgerRows(content.map(normalizeLedgerRow))
        } catch (err) {
            setLedgerRows([])
            setLedgerError(err?.message || 'Unable to load ledger.')
        }
    }

    const loadWebhookOutbox = async () => {
        if (!canViewWebhooks) return
        setWhBusy(true)
        setWhError(null)
        try {
            const res = await fetchAdminWebhooks({
                status: whStatus || undefined,
                merchantId: whMerchantId || undefined,
                orderId: whOrderId || undefined,
                paymentId: whPaymentId || undefined,
                fromDate: whFrom || undefined,
                toDate: whTo || undefined,
                page: Math.max(whPage - 1, 0),
                size: whPageSize,
            })
            const content = Array.isArray(res?.content) ? res.content : []
            setWhRows(content.map((row, idx) => ({
                rowKey: row?.eventId || `wh-${idx}`,
                eventId: row?.eventId || '-',
                status: row?.status || '-',
                attempts: row?.attempts ?? 0,
                maxAttempts: row?.maxAttempts ?? 0,
                nextRetryAt: row?.nextRetryAt || '-',
                lastAttemptAt: row?.lastAttemptAt || '-',
                lastError: row?.lastError || '-',
                createdAt: row?.createdAt || '-',
                updatedAt: row?.updatedAt || '-',
                merchantId: row?.merchantId ?? '-',
                paymentId: row?.paymentId ?? '-',
                orderId: row?.orderId ?? '-',
                callbackUrl: row?.callbackUrl || '-',
                raw: row,
            })))
            setWhTotalPages(res?.totalPages ?? 1)
            setWhTotalElements(res?.totalElements ?? content.length)
        } catch (err) {
            setWhRows([])
            setWhError(err)
        } finally {
            setWhBusy(false)
        }
    }

    const loadRiskDashboard = async () => {
        if (!canViewRisk) return
        setRiskBusy(true)
        setRiskError(null)
        try {
            const res = await fetchAdminMerchantRisk({
                riskLevel: riskLevel || undefined,
                merchantId: riskMerchantId || undefined,
                merchantName: riskMerchantName || undefined,
                payoutFreeze: riskPayoutFreeze === '' ? undefined : riskPayoutFreeze === 'true',
                page: Math.max(riskPage - 1, 0),
                size: riskPageSize,
            })
            const content = Array.isArray(res?.content) ? res.content : []
            setRiskRows(content.map((row, idx) => ({
                rowKey: row?.merchantId ?? `risk-${idx}`,
                merchantId: row?.merchantId ?? '-',
                merchantName: row?.merchantName || '-',
                riskScore: row?.riskScore ?? 0,
                autoRiskLevel: row?.autoRiskLevel || '-',
                finalRiskLevel: row?.finalRiskLevel || '-',
                reservePercentAuto: row?.reservePercentAuto ?? 0,
                finalReservePercent: row?.finalReservePercent ?? 0,
                payoutFreeze: Boolean(row?.payoutFreeze),
                payoutFreezeReason: row?.payoutFreezeReason || '',
                calculatedAt: row?.calculatedAt || '-',
                currentBalance: row?.currentBalance ?? 0,
                windowDays: row?.windowDays ?? 30,
                manualRiskOverride: row?.manualRiskOverride || '',
                reservePercentOverride: row?.reservePercentOverride ?? null,
                successVolume: row?.successVolume ?? 0,
                refundVolume: row?.refundVolume ?? 0,
                chargebackVolume: row?.chargebackVolume ?? 0,
                refundRate: row?.refundRate ?? 0,
                chargebackRate: row?.chargebackRate ?? 0,
                volumeSpikeFlag: Boolean(row?.volumeSpikeFlag),
                raw: row,
            })))
            setRiskTotalPages(res?.totalPages ?? 1)
            setRiskTotalElements(res?.totalElements ?? content.length)
        } catch (err) {
            setRiskRows([])
            setRiskError(err)
        } finally {
            setRiskBusy(false)
        }
    }

    useEffect(() => {
        if (page !== 'page-settlements') return
        loadSettlementSummaries()
        setStPage(1)
    }, [page, stMerchantName, stMerchantEmail, stStatus])

    useEffect(() => {
        if (page !== 'page-settlements') return
        loadSettlementLedger()
    }, [page, ledgerMerchantId, ledgerFrom, ledgerTo, ledgerPage, ledgerPageSize])

    useEffect(() => {
        if (page !== 'page-webhooks') return
        loadWebhookOutbox()
    }, [page, whStatus, whMerchantId, whOrderId, whPaymentId, whFrom, whTo, whPage, whPageSize])

    useEffect(() => {
        if (page !== 'page-risk') return
        loadRiskDashboard()
    }, [page, riskLevel, riskMerchantId, riskMerchantName, riskPayoutFreeze, riskPage, riskPageSize])

    useEffect(() => {
        setLedgerPage(1)
    }, [ledgerTypeFilter, ledgerReasonFilter, ledgerSearch])

    useEffect(() => {
        setWhPage(1)
    }, [whStatus, whMerchantId, whOrderId, whPaymentId, whFrom, whTo])

    useEffect(() => {
        setRiskPage(1)
    }, [riskLevel, riskMerchantId, riskMerchantName, riskPayoutFreeze])

    useEffect(() => {
        let active = true
        const loadPaymentMethods = async () => {
            try {
                const rows = await fetchAdminPaymentMethods()
                const mapped = Array.isArray(rows)
                    ? rows.map((m) => ({
                        id: m.id,
                        label: m.methodName,
                        active: Boolean(m.active),
                    }))
                    : []
                if (active) {
                    setAvailablePaymentMethods(mapped.filter((m) => m.active))
                    setPaymentMethods(mapped)
                    setPaymentMethodError('')
                }
            } catch {
                if (active) {
                    setAvailablePaymentMethods([])
                    setPaymentMethods([])
                    setPaymentMethodError('Unable to load payment methods.')
                }
            }
        }
        loadPaymentMethods()
        return () => {
            active = false
        }
    }, [])

    const reloadPaymentMethods = async () => {
        try {
            const rows = await fetchAdminPaymentMethods()
            const mapped = Array.isArray(rows)
                ? rows.map((m) => ({
                    id: m.id,
                    label: m.methodName,
                    active: Boolean(m.active),
                }))
                : []
            setAvailablePaymentMethods(mapped.filter((m) => m.active))
            setPaymentMethods(mapped)
            setPaymentMethodError('')
        } catch {
            setPaymentMethodError('Unable to load payment methods.')
        }
    }

    const handleCreatePaymentMethod = async () => {
        const name = paymentMethodName.trim()
        if (!name) {
            setPaymentMethodError('Payment method name is required.')
            return
        }
        setPaymentMethodBusy(true)
        try {
            await createAdminPaymentMethod({
                methodName: name,
                active: paymentMethodActive,
            })
            setPaymentMethodName('')
            setPaymentMethodActive(true)
            await reloadPaymentMethods()
        } catch (err) {
            const message = err?.data?.message || err?.message || 'Failed to create payment method.'
            setPaymentMethodError(message)
        } finally {
            setPaymentMethodBusy(false)
        }
    }

    const handleTogglePaymentMethod = async (id, next) => {
        setPaymentMethodBusy(true)
        try {
            await updateAdminPaymentMethodStatus(id, next)
            await reloadPaymentMethods()
        } catch (err) {
            const message = err?.data?.message || err?.message || 'Failed to update status.'
            setPaymentMethodError(message)
        } finally {
            setPaymentMethodBusy(false)
        }
    }

    // Merchant Filtering
    const filteredMerchants = useMemo(() => {
        const emailInput = (filterMerchantEmail || '').trim().toLowerCase()
        const nameInput = (filterMerchantName || '').trim().toLowerCase()
        const email = emailInput ? (debouncedMerchantEmail || '').trim().toLowerCase() : ''
        const name = nameInput ? (debouncedMerchantName || '').trim().toLowerCase() : ''
        const merchantId = (filterMerchantId || '').trim().toLowerCase()
        const status = (filterStatus || '').trim().toLowerCase()
        const settlementMode = (filterSettlementMode || '').trim().toLowerCase()

        if (!email && !name && !merchantId && !status && !settlementMode) return merchants

        return merchants.filter((merchant) => {
            if (email && !(merchant.legal_email || merchant.business_email || '').toLowerCase().includes(email)) return false
            if (name && !(merchant.legal_name || '').toLowerCase().includes(name)) return false
            const midValue = String(merchant.mid ?? '')
            if (merchantId && !midValue.toLowerCase().includes(merchantId)) return false
            if (status && (merchant.status || 'active').toLowerCase() !== status) return false
            if (settlementMode && (merchant.settlement_mode || '').toLowerCase() !== settlementMode) return false
            return true
        })
    }, [merchants, debouncedMerchantEmail, debouncedMerchantName, filterMerchantId, filterStatus, filterSettlementMode])

    useEffect(() => {
        setMerchantPage(1)
    }, [debouncedMerchantEmail, debouncedMerchantName, filterMerchantId, filterStatus, filterSettlementMode])

    const merchantSafeTotalPages = Math.max(1, Math.ceil(filteredMerchants.length / merchantPageSize))
    const pagedMerchants = useMemo(() => {
        const safePage = Math.min(merchantPage, merchantSafeTotalPages)
        const start = (safePage - 1) * merchantPageSize
        return filteredMerchants.slice(start, start + merchantPageSize)
    }, [filteredMerchants, merchantPage, merchantPageSize, merchantSafeTotalPages])

    const filteredRefunds = useMemo(() => {
        const p = rfSearchPayment.trim().toLowerCase()
        return refunds
            .filter((r) => !p || String(r.paymentId || '').toLowerCase().includes(p))
            .filter((r) => !rfMerchant || r.merchantName === rfMerchant)
            .filter((r) => !rfStatus || r.status === rfStatus)
    }, [refunds, rfSearchPayment, rfMerchant, rfStatus])

    const paymentSummaryView = useMemo(() => {
        if (paymentsSummary) {
            const total = Number(paymentsSummary.totalCount ?? 0)
            const success = Number(paymentsSummary.successCount ?? 0)
            const failed = Number(paymentsSummary.failedCount ?? 0)
            const refund = Number(paymentsSummary.refundCount ?? paymentsSummary.refunds ?? 0)
            const successAmount = Number(paymentsSummary.successAmount ?? 0)
            const successRate = total > 0 ? (success / total) * 100 : 0
            return {
                totalCount: total,
                successCount: success,
                failedCount: failed,
                refundCount: refund,
                successAmount,
                successRate,
            }
        }
        if (!payments || payments.length === 0) return null
        let success = 0
        let failed = 0
        let refund = 0
        let successAmount = 0
        payments.forEach((row) => {
            const status = String(row.status || '').toUpperCase()
            if (status === 'SUCCESS') {
                success += 1
                successAmount += Number(row.amount || 0)
            } else if (status === 'FAILED') {
                failed += 1
            } else if (status === 'REFUND') {
                refund += 1
            }
        })
        const total = payments.length
        const successRate = total > 0 ? (success / total) * 100 : 0
        return {
            totalCount: total,
            successCount: success,
            failedCount: failed,
            refundCount: refund,
            successAmount,
            successRate,
        }
    }, [paymentsSummary, payments])

    useEffect(() => {
        setRfPage(1)
    }, [rfSearchPayment, rfMerchant, rfStatus])

    const rfTotalPages = Math.max(1, Math.ceil(filteredRefunds.length / rfPageSize))
    const pagedRefunds = useMemo(() => {
        const safePage = Math.min(rfPage, rfTotalPages)
        const start = (safePage - 1) * rfPageSize
        return filteredRefunds.slice(start, start + rfPageSize)
    }, [filteredRefunds, rfPage, rfPageSize, rfTotalPages])

    const inquiries = adminInquiriesData || []
    const [settlementRows, setSettlementRows] = useState([])
    const [settlementError, setSettlementError] = useState('')
    const [settlementBusy, setSettlementBusy] = useState(false)
    const [settlementActionBusy, setSettlementActionBusy] = useState(false)

    const ledgerReasonMeta = useMemo(() => ({
        SETTLEMENT_NET: { label: 'Settlement Net', tone: 'good' },
        PAYOUT_RELEASED: { label: 'Payout Released', tone: 'warn' },
        DISPUTE_HOLDBACK: { label: 'Dispute Holdback', tone: 'bad' },
        CARRY_FORWARD: { label: 'Carry Forward', tone: 'neutral' },
        ADJUSTMENT: { label: 'Adjustment', tone: 'warn' },
        REFUND_DEDUCTED: { label: 'Refund Deducted', tone: 'bad' },
        CHARGEBACK_DEDUCTED: { label: 'Chargeback Deducted', tone: 'bad' },
        TOPUP: { label: 'Top Up', tone: 'good' },
    }), [])

    const formatLedgerReason = (reason) => {
        const normalized = String(reason || '').toUpperCase()
        if (ledgerReasonMeta[normalized]?.label) {
            return ledgerReasonMeta[normalized].label
        }
        if (!normalized) return '-'
        return normalized
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    const resolveLedgerTone = (reason) => {
        const normalized = String(reason || '').toUpperCase()
        return ledgerReasonMeta[normalized]?.tone || 'neutral'
    }

    const ledgerTypeOptions = useMemo(() => ([
        { value: '', label: 'All Directions' },
        { value: 'CREDIT', label: 'Credit' },
        { value: 'DEBIT', label: 'Debit' },
    ]), [])

    const ledgerReasonOptions = useMemo(() => {
        const observed = ledgerRows
            .map((row) => String(row.reason || '').toUpperCase())
            .filter(Boolean)
        const merged = Array.from(new Set([
            ...Object.keys(ledgerReasonMeta),
            ...observed,
        ]))
        return merged.map((reason) => ({
            value: reason,
            label: formatLedgerReason(reason),
        }))
    }, [ledgerRows, ledgerReasonMeta])

    const normalizeLedgerRow = (row) => {
        const entryType = String(row.entryType || '').toUpperCase()
        const isDebit = entryType === 'DEBIT'
        const amount = Number(row.amount || 0)
        return {
            ...row,
            entryType,
            direction: isDebit ? 'Debit' : 'Credit',
            reasonLabel: formatLedgerReason(row.reason),
            debit: isDebit ? amount : 0,
            credit: !isDebit ? amount : 0,
            createdAtLocal: row.createdAt ? new Date(row.createdAt).toLocaleString() : '-',
        }
    }

    const filteredLedgerRows = useMemo(() => {
        const type = ledgerTypeFilter ? ledgerTypeFilter.toUpperCase() : ''
        const reason = ledgerReasonFilter ? ledgerReasonFilter.toUpperCase() : ''
        const search = ledgerSearch.trim().toLowerCase()
        return ledgerRows.filter((row) => {
            if (type && String(row.entryType || '').toUpperCase() !== type) return false
            if (reason && String(row.reason || '').toUpperCase() !== reason) return false
            if (!search) return true
            const haystack = [
                row.reasonLabel,
                row.note,
                row.settlementId,
                row.direction,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
            return haystack.includes(search)
        })
    }, [ledgerRows, ledgerTypeFilter, ledgerReasonFilter, ledgerSearch])

    const ledgerSummary = useMemo(() => {
        let credit = 0
        let debit = 0
        filteredLedgerRows.forEach((row) => {
            const amount = Number(row.amount || 0)
            if (String(row.entryType || '').toUpperCase() === 'DEBIT') {
                debit += amount
            } else {
                credit += amount
            }
        })
        return {
            credit,
            debit,
            net: credit - debit,
            count: filteredLedgerRows.length,
        }
    }, [filteredLedgerRows])

    const settlementLedgerColumns = useMemo(() => ([
        { key: 'createdAtLocal', label: 'Time' },
        {
            key: 'direction',
            label: 'Direction',
            render: (row) => (
                <Pill tone={row.entryType === 'DEBIT' ? 'bad' : 'good'}>
                    {row.direction || '-'}
                </Pill>
            ),
        },
        {
            key: 'reasonLabel',
            label: 'Category',
            render: (row) => (
                <Pill tone={resolveLedgerTone(row.reason)}>
                    {row.reasonLabel || '-'}
                </Pill>
            ),
        },
        {
            key: 'debit',
            label: 'Debit',
            align: 'right',
            render: (row) => row.debit
                ? <span className="text-[var(--color-danger)]">{fmtPKR(row.debit)}</span>
                : '-',
        },
        {
            key: 'credit',
            label: 'Credit',
            align: 'right',
            render: (row) => row.credit
                ? <span className="text-[var(--color-success)]">{fmtPKR(row.credit)}</span>
                : '-',
        },
        { key: 'settlementId', label: 'Settlement ID', render: (row) => row.settlementId ?? '-' },
        { key: 'note', label: 'Note', render: (row) => row.note || '-' },
    ]), [ledgerReasonMeta])

    const filteredSubMerchants = useMemo(() => {
        const merchantId = subMerchantMerchantId.trim()
        const branchCode = subMerchantBranchCode.trim().toLowerCase()
        const branchName = subMerchantBranchName.trim().toLowerCase()
        const status = subMerchantStatus
        const hasUser = subMerchantHasUser

        return subMerchants
            .filter((r) => {
                if (merchantId && !String(r.merchantId ?? '').includes(merchantId)) return false
                if (branchCode && !(r.branchCode || '').toLowerCase().includes(branchCode)) return false
                if (branchName && !(r.branchName || '').toLowerCase().includes(branchName)) return false
                if (status) {
                    if (status === 'admin-blocked' && !r.adminBlocked) return false
                    if (status === 'awaiting' && r.adminApproved !== false) return false
                    if (status === 'active' && (r.adminBlocked || r.adminApproved === false || r.blocked)) return false
                    if (status === 'blocked' && !r.blocked) return false
                }
                if (hasUser) {
                    const userPresent = Boolean(r.userEmail || r.hasUser)
                    if (hasUser === 'yes' && !userPresent) return false
                    if (hasUser === 'no' && userPresent) return false
                }
                return true
            })
    }, [subMerchants, subMerchantMerchantId, subMerchantBranchCode, subMerchantBranchName, subMerchantStatus, subMerchantHasUser])

    useEffect(() => {
        setSubMerchantPage(1)
    }, [subMerchantMerchantId, subMerchantBranchCode, subMerchantBranchName, subMerchantStatus, subMerchantHasUser])

    const subMerchantTotalPages = Math.max(1, Math.ceil(filteredSubMerchants.length / subMerchantPageSize))
    const pagedSubMerchants = useMemo(() => {
        const safePage = Math.min(subMerchantPage, subMerchantTotalPages)
        const start = (safePage - 1) * subMerchantPageSize
        return filteredSubMerchants.slice(start, start + subMerchantPageSize)
    }, [filteredSubMerchants, subMerchantPage, subMerchantPageSize, subMerchantTotalPages])

    const filteredAdminUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase()
        const isMerchantRole = (role) => String(role || '').toUpperCase().includes('MERCHANT')
        return adminUsers
            .filter((r) => {
                if (!userTypeFilter) return true
                const merchant = isMerchantRole(r.role)
                return userTypeFilter === 'merchant' ? merchant : !merchant
            })
            .filter((r) => !userRoleFilter || r.role === userRoleFilter)
            .filter((r) => !userStatusFilter || r.status === userStatusFilter)
            .filter((r) => !q || `${r.name || ''} ${r.email || ''}`.toLowerCase().includes(q))
    }, [adminUsers, userSearch, userRoleFilter, userStatusFilter, userTypeFilter])

    const filteredInquiries = useMemo(() => {
        const q = inqSearch.trim().toLowerCase()
        return inquiries
            .filter((r) => !inqStatus || r.status === inqStatus)
            .filter((r) => !inqPriority || r.priority === inqPriority)
            .filter((r) => !q || `${r.ticketId || ''} ${r.subject || ''}`.toLowerCase().includes(q))
    }, [inquiries, inqSearch, inqStatus, inqPriority])

    const stTotal = settlementRows.length
    const stTotalPages = Math.max(1, Math.ceil(stTotal / stPageSize))
    const stSafePage = Math.min(stPage, stTotalPages)
    const stStart = (stSafePage - 1) * stPageSize
    const stEnd = Math.min(stStart + stPageSize, stTotal)
    const pagedSettlementRows = settlementRows.slice(stStart, stEnd)

    const filteredAuditLogs = useMemo(() => {
        return auditLogs
            .filter((r) => !alEntity || r.entityType === alEntity)
            .filter((r) => !alAction || r.action === alAction)
    }, [auditLogs, alEntity, alAction])
    useEffect(() => {
        setAlPage(1)
    }, [alEntity, alAction, alPerformedBy, alFrom, alTo, alDatePreset])
    const alTotalPages = Math.max(1, Math.ceil(filteredAuditLogs.length / alPageSize))
    const pagedAuditLogs = useMemo(() => {
        const safePage = Math.min(alPage, alTotalPages)
        const start = (safePage - 1) * alPageSize
        return filteredAuditLogs.slice(start, start + alPageSize)
    }, [filteredAuditLogs, alPage, alPageSize, alTotalPages])
    const paymentMethodMap = useMemo(() => {
        const map = new Map()
        paymentMethods.forEach((m) => {
            if (m?.id == null) return
            map.set(String(m.id), m.label)
        })
        return map
    }, [paymentMethods])
    const merchantNameMap = useMemo(() => {
        const map = new Map()
        merchants.forEach((m) => {
            if (m?.id == null) return
            map.set(String(m.id), m.legal_name || m.business_name || m.mid || m.id)
        })
        return map
    }, [merchants])
    const renderAuditMessage = (row) => {
        const message = String(row?.message || '')
        const entityMerchant = row?.entityType === 'LIMIT'
            ? merchantNameMap.get(String(row?.entityId ?? ''))
            : null
        const merchantMatch = message.match(/Merchant(Id)?=([0-9]+)/i)
        const merchantName = entityMerchant
            || (merchantMatch ? merchantNameMap.get(String(merchantMatch[2])) : null)
        const match = message.match(/PaymentMethodId=([0-9]+)/i)
        const paymentMethodId = match?.[1] || (row?.entityType === 'PAYMENT_METHOD' && row?.entityId != null
            ? String(row.entityId)
            : null)
        if (!paymentMethodId) {
            return merchantName
                ? `${message || '-'} (Merchant: ${merchantName})`
                : (message || '-')
        }
        const label = paymentMethodMap.get(String(paymentMethodId)) || `Method ${paymentMethodId}`
        const logo = getPaymentMethodLogo(label)
        const initials = String(label || '?').trim().slice(0, 2).toUpperCase()
        const prefix = message.replace(/PaymentMethodId=\d+/i, '').trim()
        return (
            <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    {logo ? (
                        <img
                            src={logo}
                            alt={`${label} logo`}
                            className="h-6 w-6 rounded-full bg-white object-contain p-1 shrink-0"
                            loading="lazy"
                        />
                    ) : (
                        <span className="h-6 w-6 rounded-full bg-white/10 text-[10px] text-[var(--color-text-primary)] grid place-items-center shrink-0">
                            {initials}
                        </span>
                    )}
                    <span className="text-xs truncate">{label}</span>
                </div>
                <div className="space-y-1 text-xs text-[var(--color-text-secondary)]/80 min-w-0">
                    {prefix && <div className="break-words">{prefix}</div>}
                    {merchantName && <div className="break-words">Merchant: {merchantName}</div>}
                </div>
            </div>
        )
    }
    const auditLogColumns = useMemo(
        () => AUDIT_LOG_COLUMNS.map((col) => (
            col.key === 'message'
                ? { ...col, render: renderAuditMessage }
                : col
        )),
        [paymentMethodMap]
    )

    useEffect(() => {
        let active = true
        if (page !== 'page-audit-logs') return () => {
            active = false
        }

        const loadAuditLogs = async () => {
            setAuditLogsLoading(true)
            setAuditLogsError('')
            try {
                const performedByRaw = alPerformedBy.trim()
                const performedByValue = performedByRaw ? Number(performedByRaw) : undefined
                const payload = {
                    entityType: alEntity || undefined,
                    action: alAction || undefined,
                    performedBy: Number.isNaN(performedByValue) ? undefined : performedByValue,
                    fromDate: alFrom || undefined,
                    toDate: alTo || undefined,
                    page: 0,
                    size: 200,
                }
                const pageRes = await fetchAdminAuditLogs(payload)
                const rows = Array.isArray(pageRes?.content) ? pageRes.content : []
                const mapped = rows.map((r) => ({
                    id: r.id,
                    entityType: r.entityType,
                    action: r.action,
                    performedBy: r.performedBy,
                    performedByUsername: r.performedByEmail || r.performedByUsername || r.performedBy,
                    performedByStatus: r.performedByBlocked ? 'blocked' : 'active',
                    message: r.message,
                    entityId: r.entityId,
                    createdAt: r.createdAt,
                }))
                if (active) {
                    setAuditLogs(mapped)
                }
            } catch (err) {
                if (active) {
                    setAuditLogs([])
                    setAuditLogsError(err?.message || 'Unable to load audit logs.')
                }
            } finally {
                if (active) {
                    setAuditLogsLoading(false)
                }
            }
        }

        loadAuditLogs()
        return () => {
            active = false
        }
    }, [page, alEntity, alAction, alPerformedBy, alFrom, alTo])

    const filteredLimitPolicies = useMemo(() => {
        const nameFilter = limitMerchantName.trim().toLowerCase()
        const emailFilter = limitMerchantEmail.trim().toLowerCase()
        const methodFilter = limitPaymentMethodName.trim().toLowerCase()
        const merchantId = limitMerchantId.trim()
        const paymentMethodId = ''
        const activeFilter = limitActiveFilter.trim()
        return adminLimitPolicies.filter((r) => {
            if (merchantId && String(r.merchantId) !== merchantId) return false
            if (paymentMethodId && String(r.paymentMethodId) !== paymentMethodId) return false
            if (nameFilter && !(r.merchantName || '').toLowerCase().includes(nameFilter)) return false
            if (emailFilter && !(r.merchantEmail || '').toLowerCase().includes(emailFilter)) return false
            if (methodFilter && !(r.paymentMethodName || '').toLowerCase().includes(methodFilter)) return false
            if (activeFilter === 'active' && !r.active) return false
            if (activeFilter === 'inactive' && r.active) return false
            return true
        })
    }, [
        adminLimitPolicies,
        limitMerchantName,
        limitMerchantEmail,
        limitMerchantId,
        limitPaymentMethodName,
        limitActiveFilter,
    ])

    useEffect(() => {
        setLimitPage(1)
    }, [limitMerchantName, limitMerchantEmail, limitMerchantId, limitPaymentMethodName, limitActiveFilter])

    const limitTotalPages = Math.max(1, Math.ceil(filteredLimitPolicies.length / limitPageSize))
    const pagedLimitPolicies = useMemo(() => {
        const safePage = Math.min(limitPage, limitTotalPages)
        const start = (safePage - 1) * limitPageSize
        return filteredLimitPolicies.slice(start, start + limitPageSize)
    }, [filteredLimitPolicies, limitPage, limitPageSize, limitTotalPages])


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
        const menuWidth = 220
        const menuHeight = 200
        const padding = 12
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const left = Math.min(
            Math.max(padding, rect.left),
            Math.max(padding, viewportWidth - menuWidth - padding)
        )
        const preferredTop = rect.bottom + 6
        const top =
            preferredTop + menuHeight > viewportHeight - padding
                ? Math.max(padding, rect.top - menuHeight - 6)
                : preferredTop
        setActionMenu((prev) =>
            prev && prev.id === merchant.id
                ? null
                : {
                    id: merchant.id,
                    mid: merchant.mid,
                    environment: merchant.environment,
                    top,
                    left,
                }
        )
    }

    const handleToggleSettlementMenu = (event, row) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const menuWidth = 180
        const menuHeight = 88
        const padding = 12
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const left = Math.min(
            Math.max(padding, rect.left),
            Math.max(padding, viewportWidth - menuWidth - padding)
        )
        const preferredTop = rect.bottom + 6
        const top =
            preferredTop + menuHeight > viewportHeight - padding
                ? Math.max(padding, rect.top - menuHeight - 6)
                : preferredTop
        setSettlementMenu((prev) =>
            prev && prev.id === row.rowKey
                ? null
                : {
                    id: row.rowKey,
                    merchantId: row.merchantId,
                    autoSettlementPaused: row.autoSettlementPaused,
                    top,
                    left,
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

    const handleRotateApiKeys = async (merchantId) => {
        setActionMenu(null)
        try {
            const res = await rotateAdminMerchantApiKeys(merchantId)
            if (res?.apiKey && res?.apiSecret) {
                setApiKeyModalData([{ apiKey: res.apiKey, apiSecret: res.apiSecret }])
                setApiKeyModalOpen(true)
            } else {
                alert('Rotate API keys response missing values.')
            }
        } catch (err) {
            const message = err?.data?.message || err?.message || 'Failed to rotate API keys.'
            alert(message)
        }
    }

    const isStepUpValid = () => {
        if (!stepUpToken || !stepUpExpiresAt) return false
        return Date.now() < stepUpExpiresAt
    }

    const openStepUp = (action) => {
        setPendingStepUpAction(action)
        setStepUpError('')
        setStepUpPassword('')
        setStepUpModalOpen(true)
    }

    const finalizeStepUpAction = async (token) => {
        if (!pendingStepUpAction) return
        const action = pendingStepUpAction
        setPendingStepUpAction(null)
        if (action.type === 'reset-preview') {
            await runResetPreview(action.merchantId)
        } else if (action.type === 'reset-execute') {
            await runResetExecute(action.merchantId, token)
        } else if (action.type === 'go-live') {
            await runGoLive(action.merchantId, token)
        }
    }

    const handleStepUpSubmit = async (e) => {
        e.preventDefault()
        if (!stepUpPassword.trim()) {
            setStepUpError('Current password is required.')
            return
        }
        setStepUpBusy(true)
        setStepUpError('')
        try {
            const res = await adminReauth({ currentPassword: stepUpPassword })
            if (!res?.token) {
                throw new Error('Step-up token missing from response.')
            }
            setStepUpToken(res.token)
            setStepUpExpiresAt(res.expiresAt || Date.now() + 5 * 60 * 1000)
            setStepUpModalOpen(false)
            await finalizeStepUpAction(res.token)
        } catch (err) {
            setStepUpError(err?.data?.message || err?.message || 'Step-up failed.')
        } finally {
            setStepUpBusy(false)
        }
    }

    const runResetPreview = async (merchantId) => {
        setBackofficeBusy(true)
        setBackofficeNotice('')
        try {
            const preview = await previewAdminResetTest(merchantId)
            setBackofficeNotice(`Test data found: ${preview?.payments ?? 0} payments, ${preview?.refunds ?? 0} refunds, ${preview?.settlements ?? 0} settlements.`)
        } catch (err) {
            setBackofficeNotice(err?.data?.message || err?.message || 'Failed to load reset preview.')
        } finally {
            setBackofficeBusy(false)
        }
    }

    const runResetExecute = async (merchantId, token) => {
        setBackofficeBusy(true)
        setBackofficeNotice('')
        try {
            const res = await executeAdminResetTest(merchantId, token)
            setBackofficeNotice(`Reset complete. Deleted ${res?.payments ?? 0} payments, ${res?.refunds ?? 0} refunds, ${res?.settlements ?? 0} settlements.`)
            await reloadMerchants()
        } catch (err) {
            setBackofficeNotice(err?.data?.message || err?.message || 'Reset failed.')
        } finally {
            setBackofficeBusy(false)
        }
    }

    const runGoLive = async (merchantId, token) => {
        setBackofficeBusy(true)
        setBackofficeNotice('')
        try {
            const res = await adminGoLive(merchantId, token)
            if (res?.apiKey && res?.apiSecret) {
                setApiKeyModalData([{ apiKey: res.apiKey, apiSecret: res.apiSecret, label: 'Go-Live API Keys' }])
                setApiKeyModalOpen(true)
            }
            setBackofficeNotice('Merchant is now live. API keys rotated.')
            await reloadMerchants()
        } catch (err) {
            setBackofficeNotice(err?.data?.message || err?.message || 'Go-live failed.')
        } finally {
            setBackofficeBusy(false)
        }
    }

    const handleResetPreview = (merchantId) => {
        setActionMenu(null)
        runResetPreview(merchantId)
    }

    const handleResetExecute = (merchantId) => {
        setActionMenu(null)
        if (isStepUpValid()) {
            runResetExecute(merchantId, stepUpToken)
            return
        }
        openStepUp({ type: 'reset-execute', merchantId })
    }

    const handleGoLive = (merchantId) => {
        setActionMenu(null)
        if (isStepUpValid()) {
            runGoLive(merchantId, stepUpToken)
            return
        }
        openStepUp({ type: 'go-live', merchantId })
    }

    const handleSettlementDashboard = (merchantId) => {
        setSettlementMenu(null)
        localStorage.setItem('assanpay:dashboard-merchant-id', String(merchantId))
        goTo('page-dashboard')
    }

    const handleSettlementToggle = async (merchantId, nextPaused) => {
        setSettlementMenu(null)
        try {
            setSettlementActionBusy(true)
            await updateAdminAutoSettlementPaused(merchantId, nextPaused)
            await loadSettlementSummaries()
        } catch (err) {
            setSettlementError(err?.message || 'Failed to update settlement status.')
        } finally {
            setSettlementActionBusy(false)
        }
    }

    const handleWebhookResend = async () => {
        if (!whResendTarget) return
        try {
            await resendAdminWebhook(whResendTarget.eventId, { resetAttempts: whResetAttempts })
            setWhResendTarget(null)
            setWhResetAttempts(true)
            loadWebhookOutbox()
        } catch (err) {
            setWhError(err)
        }
    }

    const toggleWebhookExpanded = (rowKey) => {
        setWhExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(rowKey)) {
                next.delete(rowKey)
            } else {
                next.add(rowKey)
            }
            return next
        })
    }

    const handleRiskOverride = async (merchantId, level) => {
        try {
            await overrideAdminRiskLevel(merchantId, level)
            setRiskOverrideTarget(null)
            loadRiskDashboard()
        } catch (err) {
            setRiskError(err)
        }
    }

    const handleReserveOverride = async (merchantId, percent) => {
        try {
            await overrideAdminReservePercent(merchantId, percent)
            setReserveOverrideTarget(null)
            loadRiskDashboard()
        } catch (err) {
            setRiskError(err)
        }
    }

    const handleFreezeToggle = async (merchantId, freeze) => {
        try {
            await freezeAdminPayout(merchantId, freeze, freeze ? freezeReason : null)
            setFreezeTarget(null)
            setFreezeReason('')
            loadRiskDashboard()
        } catch (err) {
            setRiskError(err)
        }
    }

    // Form Submission
    const handleCreateMerchantSubmit = async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const rawForm = new FormData(form)
        const formData = Object.fromEntries(rawForm.entries())

        // Validate form
        const errors = validateMerchantFormData(formData, '')
        if (errors.length > 0) {
            alert(errors.join('\n'))
            return
        }

        const commissionMode = formData.commission_mode || 'Single'
        const commissionType = formData.commission_type === 'Flat' ? 'FLAT' : 'PERCENTAGE'
        const commissionValue = Number(formData.commission_value || 0)

        const selectedMethodIds = rawForm
            .getAll('payment_methods')
            .map((v) => Number(v))
            .filter((id) => !Number.isNaN(id))

        const methodIds = editingMerchant
            ? availablePaymentMethods.map((m) => m.id).filter((id) => id != null)
            : selectedMethodIds

        if (methodIds.length === 0 || (!editingMerchant && selectedMethodIds.length === 0)) {
            alert('Select at least one payment method.')
            return
        }

        const paymentMethods = methodIds.map((id) => {
            const allowed = selectedMethodIds.includes(id)
            const perMethodValue = commissionMode === 'Double'
                ? Number(formData[`commission_${id}`] || 0)
                : commissionValue
            return {
                paymentMethodId: id,
                allowed,
                dailyLimit: allowed ? Number(formData[`limit_daily_${id}`] || 0) : 0,
                monthlyLimit: allowed ? Number(formData[`limit_monthly_${id}`] || 0) : 0,
                perTransactionLimit: allowed ? Number(formData[`limit_per_tx_${id}`] || 0) : 0,
                minSingleAmount: allowed ? Number(formData[`limit_min_${id}`] || 0) : 0,
                commissionMode: commissionType,
                commissionValue: allowed ? perMethodValue : 0,
                commission: {
                    mode: commissionType,
                    value: allowed ? perMethodValue : 0,
                },
            }
        })

        const settlementMode = formData.settlement_type === 'Manual' ? 'MANUAL' : 'AUTO'
        const intervalMap = {
            'T+1': 'T+1',
            'T+2': 'T+2',
            '5M': '5M',
            '10M': '10M',
            '30M': '30M',
            '60M': '60M',
        }
        const settlementInterval = intervalMap[formData.settlement_interval] || formData.settlement_interval || 'T+1'

        const payload = {
            merchant: {
                legalName: formData.legal_name,
                businessName: formData.business_name,
                legalEmail: formData.legal_email,
                blocked: formData.status === 'blocked',
            },
            settlement: {
                mode: settlementMode,
                interval: settlementInterval,
                refundCommission: formData.refund_commission === 'true',
                autoSettlementPaused: formData.auto_settlement_paused === 'true',
            },
            commission: {
                mode: commissionType,
                value: commissionValue,
            },
            paymentMethods,
        }

        if (!editingMerchant) {
            payload.owner = {
                email: formData.admin_email,
                username: formData.username,
                name: formData.admin_name,
                password: formData.password,
            }
        }
        if (!editingMerchant && formData.restricted_enabled === 'true') {
            const roleName = String(formData.restricted_role_name || '').trim()
            const permissions = rawForm
                .getAll('restricted_permissions')
                .map((perm) => String(perm || '').trim())
                .filter(Boolean)
            if (!roleName || permissions.length === 0) {
                alert('Restricted role name and at least one permission are required.')
                return
            }
            payload.restrictedRole = {
                enabled: true,
                roleName,
                permissions,
            }
        }

        const authMode = formData.auth_mode || 'HMAC_ONLY'
        let whitelistCidrs = []
        if (formData.ip_whitelist_json) {
            try {
                whitelistCidrs = JSON.parse(formData.ip_whitelist_json)
            } catch {
                whitelistCidrs = []
            }
        }
        whitelistCidrs = Array.isArray(whitelistCidrs)
            ? whitelistCidrs.map((value) => String(value).trim()).filter(Boolean)
            : []
        if (!editingMerchant) {
            payload.auth = {
                authMode,
                whitelistCidrs,
            }
        }

        try {
            if (editingMerchant) {
                await updateAdminMerchant(editingMerchant.id, payload)
            } else {
                const res = await createAdminMerchant(payload)
                if (res?.apiKey && res?.apiSecret) {
                    setApiKeyModalData([{ apiKey: res.apiKey, apiSecret: res.apiSecret }])
                    setApiKeyModalOpen(true)
                }
            }
            await reloadMerchants()
            setEditingMerchantId(null)
            setEditingMerchantDetail(null)
            alert('Merchant saved.')
            goTo('page-merchants')
            form.reset()
        } catch (err) {
            const message = err?.data?.message || err?.message || 'Failed to save merchant.'
            alert(message)
        }
    }

    // Navigation
    const goTo = (next) => {
        window.location.hash = `#${next}`
    }

    const handleLogout = () => {
        clearAuthToken()
        navigate('/')
    }

    // Close action menu on scroll/resize
    useEffect(() => {
        if (!actionMenu) return
        const close = () => setActionMenu(null)
        const handleClick = (event) => {
            if (!event.target.closest('[data-merchant-actions-root]')) {
                setActionMenu(null)
            }
        }
        document.addEventListener('mousedown', handleClick)
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)
        return () => {
            document.removeEventListener('mousedown', handleClick)
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [actionMenu])

    useEffect(() => {
        if (!settlementMenu) return
        const close = () => setSettlementMenu(null)
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)
        return () => {
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [settlementMenu])

    useEffect(() => {
        if (page !== 'page-create-merchant') return
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [page])

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
    const isProtectedRole = (name) => {
        const role = String(name || '').trim().toUpperCase()
        return role === 'SUPER_ADMIN' || role === 'SYSTEM'
    }
    const editRoleLocked = isProtectedRole(editRoleName)
    const canUpdateRole = hasValidEditRole && hasValidEditPermissions && !editRoleLocked
    const resolvePermissionIds = (names) =>
        names
            .map((name) => adminPermissionMap[name])
            .filter((id) => id !== undefined && id !== null)

    const profileRoleLabel = profileForm.roles.length > 0 ? profileForm.roles.join(', ') : '-'
    const profilePermissions = profileForm.permissions || []

    const handleProfileSave = async () => {
        const name = profileForm.name.trim()
        const email = profileForm.email.trim()
        if (!name) {
            setProfileError('Name is required.')
            return
        }
        if (!email) {
            setProfileError('Email is required.')
            return
        }
        try {
            setProfileBusy(true)
            setProfileError('')
            setProfileNotice('')
            const updated = await updateAdminProfile({ name, email })
            if (updated?.token) {
                setAuthToken(updated.token)
            }
            setProfileForm((prev) => ({
                ...prev,
                name: updated?.name || name,
                email: updated?.email || email,
                roles: Array.isArray(updated?.roles) ? updated.roles : prev.roles,
                permissions: Array.isArray(updated?.permissions) ? updated.permissions : prev.permissions,
            }))
            setProfileNotice('Profile updated.')
        } catch (err) {
            setProfileError(err?.data?.message || err?.message || 'Unable to save profile.')
        } finally {
            setProfileBusy(false)
        }
    }

    const canAccessAdminPage = (pageKey) => {
        if (!Object.prototype.hasOwnProperty.call(ADMIN_PAGE_PERMISSIONS, pageKey)) return false
        const required = ADMIN_PAGE_PERMISSIONS[pageKey] || []
        if (required.length === 0) return true
        return canAny(required)
    }

    const adminNavSections = useMemo(() => {
        return SUPER_ADMIN_NAVIGATION.map((section) => {
            const items = section.items.filter((it) => canAccessAdminPage(it.key))
            if (items.length === 0) return null
            return { ...section, items }
        }).filter(Boolean)
    }, [permissionsVersion])

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
            await changeAdminPassword({ currentPassword: current, newPassword: next })
            setPasswordForm({ current: '', next: '', confirm: '' })
            setPasswordNotice('Password updated.')
        } catch (err) {
            setPasswordError(err?.data?.message || err?.message || 'Unable to update password.')
        } finally {
            setPasswordBusy(false)
        }
    }

    const activeMenu = page === 'page-create-merchant' ? 'page-merchants' : page

    useEffect(() => {
        if (!canAccessAdminPage(page)) {
            navigate('/forbidden', { replace: true })
        }
    }, [page, permissionsVersion, navigate])
    const showNotice = (apiNotice || loadError) && !(page === 'page-dashboard' && apiNotice)

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
            className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            style={{ '--sidebar-pad': sidebarCollapsed ? '0px' : '300px' }}
        >
            <div className="relative">
                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    setIsOpen={setSidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    onCollapseToggle={() => setSidebarCollapsed((prev) => !prev)}
                    activeMenu={activeMenu}
                    sections={adminNavSections}
                    brand={{ name: 'AssanPay', sub: 'Super Admin Portal (MVP)' }}
                    onLogout={null}
                    footer={
                        <>
                            <button
                                type="button"
                                className="w-full flex items-center justify-between text-sm font-semibold text-left"
                                onClick={() => setQuickTipsOpen((prev) => !prev)}
                            >
                                Quick Tips
                                {quickTipsOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                            {quickTipsOpen && (
                                <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]/80 leading-relaxed">
                                    {(PAGE_QUICK_TIPS[page] || PAGE_QUICK_TIPS['page-dashboard']).map((tip) => (
                                        <li key={tip}>• {tip}</li>
                                    ))}
                                </ul>
                            )}
                        </>
                    }
                />

                {/* Main Content */}
                <div className="w-full min-w-0 layout-pad">
                <Topbar
                    title={pageTitle}
                    crumbs={crumbs}
                    onToggle={() => setSidebarOpen(true)}
                    onDesktopToggle={() => setSidebarCollapsed(false)}
                    showMenu={!sidebarOpen}
                    showDesktopMenu={sidebarCollapsed}
                    height="xl"
                    portalLinks={[
                        {
                            label: 'Merchant Portal',
                            onClick: () => navigate('/merchant'),
                            active: false,
                        },
                        {
                            label: 'Admin Portal',
                            onClick: () => navigate('/admin'),
                            active: true,
                        },
                    ]}
                    actions={
                        <>
                            {page === 'page-create-merchant' && (
                                <button
                                    className="h-10 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-sm"
                                    type="button"
                                    onClick={() => {
                                        setEditingMerchantId(null)
                                        setEditingMerchantDetail(null)
                                        goTo('page-merchants')
                                    }}
                                >
                                    Back
                                </button>
                            )}
                            <ThemeMenu />
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    className="h-10 w-10 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] grid place-items-center"
                                    type="button"
                                    onClick={() => setUserMenuOpen((open) => !open)}
                                    aria-label="Open user menu"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] grid place-items-center text-xs font-semibold">
                                        SA
                                    </div>
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-card overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[var(--color-border-soft)]">
                                            <div className="text-sm font-semibold text-[var(--color-text-primary)]">AssanPay Admin</div>
                                            <div className="text-xs text-[var(--color-text-secondary)]/80">Super Admin</div>
                                        </div>
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-white/[0.06] transition"
                                            type="button"
                                            onClick={() => {
                                                setSettingsTabPersist('profile')
                                                setUserMenuOpen(false)
                                                goTo('page-settings')
                                            }}
                                        >
                                            <User size={14} />
                                            Profile
                                        </button>
                                        <button
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-white/[0.06] transition"
                                            type="button"
                                            onClick={() => {
                                                setSettingsTabPersist('security')
                                                setUserMenuOpen(false)
                                                goTo('page-settings')
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
                        </>
                    }
                />

                <main className="px-4 sm:px-6 pt-0 pb-6 w-full">
                    {showNotice && (
                        <div className="mb-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                            {apiNotice || loadError}
                        </div>
                    )}
                    <div className="space-y-6">
                        {/* Dashboard */}
                        {page === 'page-dashboard' && (
                            <div className="mt-4">
                                <DashboardSection />
                            </div>
                        )}

                        {/* Merchants */}
                        {page === 'page-merchants' && (
                            <div className="space-y-4 w-full">
                            <Card title="Merchants" right={<Pill>Manage</Pill>}>
                                <MerchantsFilters
                                    filterMerchantEmail={filterMerchantEmail}
                                    filterMerchantName={filterMerchantName}
                                    filterMerchantId={filterMerchantId}
                                    filterStatus={filterStatus}
                                    filterSettlementMode={filterSettlementMode}
                                    onFilterMerchantEmail={setFilterMerchantEmail}
                                    onFilterMerchantName={setFilterMerchantName}
                                    onFilterMerchantId={setFilterMerchantId}
                                    onFilterStatus={setFilterStatus}
                                    onFilterSettlementMode={setFilterSettlementMode}
                                    onCreate={() => {
                                        setEditingMerchantId(null)
                                        goTo('page-create-merchant')
                                    }}
                                />
                                <MerchantsTable
                                    merchants={pagedMerchants}
                                    actionMenuId={actionMenu?.id}
                                    onToggleActionMenu={handleToggleActionMenu}
                                />
                            </Card>
                                <ActionMenu
                                    actionMenu={actionMenu}
                                    onView={handleActionView}
                                    onEdit={handleActionEdit}
                                    onRotate={handleRotateApiKeys}
                                    onResetPreview={handleResetPreview}
                                    onResetExecute={handleResetExecute}
                                    onGoLive={(id) => {
                                        const merchant = merchants.find((m) => m.id === id)
                                        if (merchant && String(merchant.environment || '').toUpperCase() !== 'TEST') {
                                            alert('Go-live is only available for TEST merchants.')
                                            return
                                        }
                                        handleGoLive(id)
                                    }}
                                />
                                {backofficeNotice && (
                                    <div className="mt-3 text-xs text-[var(--color-text-secondary)]/80">
                                        {backofficeNotice}
                                    </div>
                                )}
                                <div className="flex flex-col items-start gap-2 text-xs text-[var(--color-text-secondary)]/80 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="leading-relaxed">
                                        Page {merchantPage} of {merchantSafeTotalPages}
                                        <span className="ml-2 text-[var(--color-text-secondary)]/60">Total {filteredMerchants.length}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[var(--color-text-secondary)]/70">Rows</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={merchantPageSize}
                                            onChange={(e) => {
                                                const next = Number(e.target.value)
                                                setMerchantPageSize(next)
                                                setMerchantPage(1)
                                            }}
                                        >
                                            <option value="10" className="bg-[var(--color-bg-primary)]">10</option>
                                            <option value="20" className="bg-[var(--color-bg-primary)]">20</option>
                                            <option value="50" className="bg-[var(--color-bg-primary)]">50</option>
                                            <option value="100" className="bg-[var(--color-bg-primary)]">100</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={merchantPage <= 1}
                                            onClick={() => setMerchantPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={merchantPage >= merchantSafeTotalPages}
                                            onClick={() => setMerchantPage((p) => Math.min(p + 1, merchantSafeTotalPages))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Payments */}
                    {page === 'page-payments' && (
                        <div className="space-y-4 w-full">
                            <Card title="Payments" right={<Pill>API</Pill>}>
                                    {paymentsError && (
                                        <div className="mb-3 rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                                            {paymentsError}
                                        </div>
                                    )}
                                    {paymentSummaryView && (
                                        <div className="mb-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 text-xs text-[var(--color-text-secondary)]/80">
                                            <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                                                <div>Total</div>
                                                <div className="text-[var(--color-text-primary)] font-semibold">{paymentSummaryView.totalCount}</div>
                                            </div>
                                            <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                                                <div>Success</div>
                                                <div className="text-[var(--color-text-primary)] font-semibold">{paymentSummaryView.successCount}</div>
                                            </div>
                                            <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                                                <div>Failed</div>
                                                <div className="text-[var(--color-text-primary)] font-semibold">{paymentSummaryView.failedCount}</div>
                                            </div>
                                            <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                                                <div>Refunds</div>
                                                <div className="text-[var(--color-text-primary)] font-semibold">{paymentSummaryView.refundCount}</div>
                                            </div>
                                            <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                                                <div>Success Rate</div>
                                                <div className="text-[var(--color-text-primary)] font-semibold">{paymentSummaryView.successRate.toFixed(1)}%</div>
                                            </div>
                                            <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2">
                                                <div>Success Amount</div>
                                                <div className="text-[var(--color-text-primary)] font-semibold">{fmtPKR(paymentSummaryView.successAmount || 0)}</div>
                                            </div>
                                        </div>
                                    )}
                                    <FilterBar>
                                    <div className="relative min-w-[180px]">
                                            <select
                                                className="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-14 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
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
                                            <option value="all" className="bg-[var(--color-bg-primary)]">All Time</option>
                                            <option value="today" className="bg-[var(--color-bg-primary)]">Today</option>
                                            <option value="yesterday" className="bg-[var(--color-bg-primary)]">Yesterday</option>
                                            <option value="last7" className="bg-[var(--color-bg-primary)]">Last 7 days</option>
                                            <option value="last30" className="bg-[var(--color-bg-primary)]">Last 30 days</option>
                                            <option value="thisMonth" className="bg-[var(--color-bg-primary)]">This month</option>
                                            <option value="lastMonth" className="bg-[var(--color-bg-primary)]">Last month</option>
                                            <option value="custom" className="bg-[var(--color-bg-primary)]">Custom Date</option>
                                        </select>
                                        {payDatePreset !== 'all' && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear date filter"
                                                    className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
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
                                        inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                        placeholder="Merchant Name"
                                        value={payMerchant}
                                        onChange={(e) => setPayMerchant(e.target.value)}
                                    />
                                    <ClearableInput
                                        className="min-w-[160px]"
                                        inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                        placeholder="Order ID"
                                        value={payOrderId}
                                        onChange={(e) => setPayOrderId(e.target.value)}
                                    />
                                    <ClearableInput
                                        className="min-w-[170px]"
                                        inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                        placeholder="Payment Method"
                                        value={payMethod}
                                        onChange={(e) => setPayMethod(e.target.value)}
                                    />
                                    <ClearableSelect
                                        value={payStatus}
                                        onChange={setPayStatus}
                                        className="min-w-[150px]"
                                        clearValue=""
                                        showClear={Boolean(payStatus)}
                                    >
                                        <option value="">Status: All</option>
                                        <option value="SUCCESS">Success</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="FAILED">Failed</option>
                                        <option value="REFUND">Refund</option>
                                    </ClearableSelect>
                                </FilterBar>
                                <DataTable columns={PAYMENT_COLUMNS} data={payments} keyField="orderId" />
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                    <div>
                                        Page {payPage} of {Math.max(paymentsTotalPages || 1, 1)}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span>Rows</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={payPageSize}
                                            onChange={(e) => {
                                                const next = Number(e.target.value)
                                                setPayPageSize(next)
                                                setPayPage(1)
                                            }}
                                        >
                                            <option value="20" className="bg-[var(--color-bg-primary)]">20</option>
                                            <option value="50" className="bg-[var(--color-bg-primary)]">50</option>
                                            <option value="100" className="bg-[var(--color-bg-primary)]">100</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={payPage <= 1}
                                            onClick={() => setPayPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={payPage >= Math.max(paymentsTotalPages || 1, 1)}
                                            onClick={() => setPayPage((p) => p + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                                {payments.length === 0 && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
                                        No payments found for the selected filters.
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
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Search By Payment ID"
                                            value={rfSearchPayment}
                                            onChange={(e) => setRfSearchPayment(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableSelect value={rfMerchant} onChange={setRfMerchant} className="min-w-[180px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Filter by Merchant</option>
                                            {Array.from(new Set(refunds.map((r) => r.merchantName))).map((m) => (
                                                <option key={m} value={m} className="bg-[var(--color-bg-primary)]">{m}</option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableSelect value={rfStatus} onChange={setRfStatus} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Filter by Status</option>
                                            {Array.from(new Set(refunds.map((r) => r.status))).map((s) => (
                                                <option key={s} value={s} className="bg-[var(--color-bg-primary)]">{s}</option>
                                            ))}
                                        </ClearableSelect>
                                        <ExportMenu
                                            onExportCSV={() => {
                                                const payload = buildExportPayload(filteredRefunds, REFUND_ADMIN_COLUMNS, {
                                                    groupByKey: 'merchantName',
                                                })
                                                exportDataToCSV(payload.rows, payload.columns, 'admin-refunds.csv')
                                            }}
                                            onExportPDF={() => {
                                                const payload = buildExportPayload(filteredRefunds, REFUND_ADMIN_COLUMNS, {
                                                    groupByKey: 'merchantName',
                                                })
                                                exportDataToPDF(payload.rows, payload.columns, {
                                                    title: 'Refunds',
                                                    filename: 'admin-refunds.pdf',
                                                })
                                            }}
                                        />
                                    </div>
                                </FilterBar>
                                <DataTable columns={REFUND_ADMIN_COLUMNS} data={pagedRefunds} keyField="paymentId" />
                                <div className="mt-3 flex flex-col items-start gap-2 text-xs text-[var(--color-text-secondary)]/80 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="leading-relaxed">
                                        Page {rfPage} of {rfTotalPages}
                                        <span className="ml-2 text-[var(--color-text-secondary)]/60">Total {filteredRefunds.length}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[var(--color-text-secondary)]/70">Rows</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={rfPageSize}
                                            onChange={(e) => {
                                                const next = Number(e.target.value)
                                                setRfPageSize(next)
                                                setRfPage(1)
                                            }}
                                        >
                                            <option value="10" className="bg-[var(--color-bg-primary)]">10</option>
                                            <option value="20" className="bg-[var(--color-bg-primary)]">20</option>
                                            <option value="50" className="bg-[var(--color-bg-primary)]">50</option>
                                            <option value="100" className="bg-[var(--color-bg-primary)]">100</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={rfPage <= 1}
                                            onClick={() => setRfPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={rfPage >= rfTotalPages}
                                            onClick={() => setRfPage((p) => Math.min(p + 1, rfTotalPages))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                                {filteredRefunds.length === 0 && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
                                        Empty for now. Data will come from the refunds API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Settlements */}
                    {page === 'page-settlements' && (
                        <div className="space-y-4 w-full">
                            <Card
                                title="Settlement Summary"
                                right={(
                                    <div className="flex items-center gap-2">
                                        <Pill>API</Pill>
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
                                              <div>Status = auto-settlement toggle (Active/Paused).</div>
                                              <div className="mt-1">Statuses: CREATED (generated), PENDING (partial payout), COMPLETED (paid), FAILED/CANCELLED (not paid).</div>
                                              <div className="mt-1">Due Amount = sum of pending settlement balance (net - settled).</div>
                                          </div>
                                      </div>
                                    </div>
                                )}
                            >
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant name"
                                            value={stMerchantName}
                                            onChange={(e) => setStMerchantName(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[240px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant email"
                                            value={stMerchantEmail}
                                            onChange={(e) => setStMerchantEmail(e.target.value)}
                                        />
                                        <div className="relative min-w-[160px]">
                                            <select
                                                className="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-14 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                value={stStatus}
                                                onChange={(e) => setStStatus(e.target.value)}
                                            >
                                                <option value="" className="bg-[var(--color-bg-primary)]">All Status</option>
                                                <option value="active" className="bg-[var(--color-bg-primary)]">Active</option>
                                                <option value="paused" className="bg-[var(--color-bg-primary)]">Paused</option>
                                            </select>
                                            {stStatus && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear settlement status filter"
                                                    className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
                                                    onClick={() => setStStatus('')}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={() => loadSettlementSummaries()}
                                        disabled={settlementBusy}
                                    >
                                        {settlementBusy ? 'Loading...' : 'Refresh'}
                                    </button>
                                </FilterBar>
                                <DataTable
                                    columns={SETTLEMENT_SUMMARY_COLUMNS}
                                    data={pagedSettlementRows}
                                    keyField="rowKey"
                                    renderActions={(row) => (
                                        <button
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] inline-flex items-center gap-1"
                                            type="button"
                                            onClick={(e) => handleToggleSettlementMenu(e, row)}
                                            aria-haspopup="menu"
                                            aria-expanded={settlementMenu?.id === row.rowKey}
                                        >
                                            Actions
                                            <ChevronDown size={14} />
                                        </button>
                                    )}
                                />
                                <SettlementActionMenu
                                    menu={settlementMenu}
                                    onDashboard={handleSettlementDashboard}
                                    onToggle={handleSettlementToggle}
                                    busy={settlementActionBusy}
                                />
                                {settlementError && (
                                    <div className="mt-3 text-sm text-[var(--color-warning)]">{settlementError}</div>
                                )}
                                {settlementRows.length === 0 && !settlementError && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
                                        Empty for now. Data will come from the settlements API.
                                    </div>
                                )}
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                    <div className="flex items-center gap-2">
                                        <span>Items per page:</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={stPageSize}
                                            onChange={(e) => {
                                                setStPageSize(Number(e.target.value))
                                                setStPage(1)
                                            }}
                                        >
                                            <option className="bg-[var(--color-bg-primary)]" value={10}>10</option>
                                            <option className="bg-[var(--color-bg-primary)]" value={20}>20</option>
                                            <option className="bg-[var(--color-bg-primary)]" value={30}>30</option>
                                        </select>
                                    </div>
                                    <div>
                                        {stTotal === 0 ? '0-0 of 0' : `${stStart + 1}-${stEnd} of ${stTotal}`}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="h-8 w-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                            type="button"
                                            onClick={() => setStPage(Math.max(1, stSafePage - 1))}
                                            disabled={stSafePage <= 1}
                                        >
                                            ‹
                                        </button>
                                        <button
                                            className="h-8 w-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                            type="button"
                                            onClick={() => setStPage(Math.min(stTotalPages, stSafePage + 1))}
                                            disabled={stSafePage >= stTotalPages}
                                        >
                                            ›
                                        </button>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Backoffice Ledger" right={<Pill>API</Pill>}>
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                                        <div className="text-xs text-[var(--color-text-secondary)]/80">Credits</div>
                                        <div className="text-lg font-semibold text-[var(--color-success)]">
                                            +{fmtPKR(ledgerSummary.credit)}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                                        <div className="text-xs text-[var(--color-text-secondary)]/80">Debits</div>
                                        <div className="text-lg font-semibold text-[var(--color-danger)]">
                                            -{fmtPKR(ledgerSummary.debit)}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                                        <div className="text-xs text-[var(--color-text-secondary)]/80">Net Movement</div>
                                        <div className={`text-lg font-semibold ${ledgerSummary.net >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                                            {ledgerSummary.net >= 0 ? '+' : '-'}{fmtPKR(Math.abs(ledgerSummary.net))}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                                        <div className="text-xs text-[var(--color-text-secondary)]/80">Entries</div>
                                        <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                                            {ledgerSummary.count}
                                        </div>
                                    </div>
                                </div>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[160px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant ID"
                                            value={ledgerMerchantId}
                                            onChange={(e) => setLedgerMerchantId(e.target.value)}
                                        />
                                        <ClearableSelect
                                            value={ledgerTypeFilter}
                                            onChange={setLedgerTypeFilter}
                                            className="min-w-[150px]"
                                        >
                                            {ledgerTypeOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="bg-[var(--color-bg-primary)]">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableSelect
                                            value={ledgerReasonFilter}
                                            onChange={setLedgerReasonFilter}
                                            className="min-w-[180px]"
                                        >
                                            <option value="" className="bg-[var(--color-bg-primary)]">All Categories</option>
                                            {ledgerReasonOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="bg-[var(--color-bg-primary)]">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableInput
                                            className="min-w-[180px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Search note or settlement"
                                            value={ledgerSearch}
                                            onChange={(e) => setLedgerSearch(e.target.value)}
                                        />
                                        <DateRangeFilter
                                            fromValue={ledgerFrom}
                                            toValue={ledgerTo}
                                            onFromChange={setLedgerFrom}
                                            onToChange={setLedgerTo}
                                        />
                                    </div>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={() => loadSettlementLedger()}
                                    >
                                        Refresh
                                    </button>
                                    <ExportMenu
                                        disabled={filteredLedgerRows.length === 0}
                                        onExportCSV={() => {
                                            const payload = buildExportPayload(filteredLedgerRows, settlementLedgerColumns)
                                            exportDataToCSV(payload.rows, payload.columns, 'backoffice-ledger.csv')
                                        }}
                                        onExportPDF={() => {
                                            const payload = buildExportPayload(filteredLedgerRows, settlementLedgerColumns)
                                            exportDataToPDF(payload.rows, payload.columns, {
                                                title: 'Backoffice Ledger',
                                                filename: 'backoffice-ledger.pdf',
                                            })
                                        }}
                                    />
                                </FilterBar>
                                {ledgerError && (
                                    <div className="mt-3 text-sm text-[var(--color-warning)]">{ledgerError}</div>
                                )}
                                <DataTable
                                    columns={settlementLedgerColumns}
                                    data={filteredLedgerRows}
                                    keyField="id"
                                />
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                    <div>
                                        Page {ledgerPage}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>Items per page:</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={ledgerPageSize}
                                            onChange={(e) => {
                                                setLedgerPageSize(Number(e.target.value))
                                                setLedgerPage(1)
                                            }}
                                        >
                                            {[10, 20, 50, 100].map((size) => (
                                                <option key={size} value={size} className="bg-[var(--color-bg-primary)]">
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={ledgerPage <= 1}
                                            onClick={() => setLedgerPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            onClick={() => setLedgerPage((p) => p + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Reports */}
                    {page === 'page-reports' && (
                        <div className="space-y-4 w-full">
                            <Card title="Reports" right={<Pill>CSV</Pill>}>
                                <div className="space-y-4">
                                    <FilterBar>
                                        <div className="min-w-[200px]">
                                            <ClearableSelect
                                                value={reportType}
                                                onChange={setReportType}
                                            >
                                                {reportTypeOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value} className="bg-[var(--color-bg-primary)]">
                                                        Report: {opt.label}
                                                    </option>
                                                ))}
                                            </ClearableSelect>
                                        </div>
                                        <div className="min-w-[240px] relative">
                                            <ClearableInput
                                                value={reportMerchant}
                                                onChange={(e) => {
                                                    setReportMerchant(e.target.value)
                                                    setReportMerchantOpen(true)
                                                }}
                                                placeholder="Search legal name"
                                                className="w-full"
                                                inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                onFocus={() => setReportMerchantOpen(true)}
                                                onBlur={() => setTimeout(() => setReportMerchantOpen(false), 150)}
                                            />
                                            {reportMerchantOpen && reportMerchantOptions.length > 0 && (
                                                <div className="absolute z-20 mt-2 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-bg-primary)] shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden">
                                                    {reportMerchantOptions.map((option) => (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-primary)] hover:bg-white/[0.06] transition"
                                                            onClick={() => {
                                                                setReportMerchant(option.legalName)
                                                                setReportMerchantOpen(false)
                                                            }}
                                                        >
                                                            <div className="font-medium">{option.legalName || 'Merchant'}</div>
                                                            <div className="text-[11px] text-[var(--color-text-secondary)]/70">
                                                                ID: {option.id}{option.businessName ? ` • ${option.businessName}` : ''}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-[160px]">
                                            <ClearableSelect
                                                value={reportStatus}
                                                onChange={setReportStatus}
                                                disabled={reportStatusOptions.length === 0}
                                            >
                                                <option value="" className="bg-[var(--color-bg-primary)]">
                                                    {reportStatusOptions.length === 0 ? 'Status: N/A' : 'Status: All'}
                                                </option>
                                                {reportStatusOptions.map((option) => (
                                                    <option key={option} value={option} className="bg-[var(--color-bg-primary)]">
                                                        {option}
                                                    </option>
                                                ))}
                                            </ClearableSelect>
                                        </div>
                                        <DateRangeFilter
                                            fromValue={reportFrom}
                                            toValue={reportTo}
                                            onFromChange={setReportFrom}
                                            onToChange={setReportTo}
                                        />
                                        <button
                                            className={`h-9 px-4 rounded-xl text-white text-xs font-semibold transition ${
                                                reportBusy ? 'bg-white/10 cursor-not-allowed' : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
                                            }`}
                                            type="button"
                                            onClick={generateAdminReport}
                                            disabled={reportBusy}
                                        >
                                            {reportBusy ? 'Generating...' : 'Generate'}
                                        </button>
                                        <ExportMenu
                                            disabled={reportRuns.length === 0 && reportRows.length === 0}
                                            onExportCSV={() => {
                                                const data = reportPreview?.rows?.length
                                                    ? reportPreview.rows
                                                    : reportRuns.map((r) => ({
                                                        report: r.name,
                                                        range: r.range,
                                                        created: r.created,
                                                        status: r.status,
                                                    }))
                                                const columns = reportPreview?.rows?.length
                                                    ? reportPreview.csvColumns
                                                    : REPORT_CSV_COLUMNS
                                                const payload = buildExportPayload(data, columns, {
                                                    groupByKey: reportPreview?.rows?.length ? 'merchantName' : undefined,
                                                })
                                                exportDataToCSV(
                                                    payload.rows,
                                                    payload.columns,
                                                    reportPreview?.rows?.length ? 'admin-payments-report.csv' : 'admin-reports.csv'
                                                )
                                            }}
                                            onExportPDF={() => {
                                                const data = reportPreview?.rows?.length
                                                    ? reportPreview.rows
                                                    : reportRuns.map((r) => ({
                                                        report: r.name,
                                                        range: r.range,
                                                        created: r.created,
                                                        status: r.status,
                                                    }))
                                                const columns = reportPreview?.rows?.length
                                                    ? reportPreview.csvColumns
                                                    : REPORT_CSV_COLUMNS
                                                const payload = buildExportPayload(data, columns, {
                                                    groupByKey: reportPreview?.rows?.length ? 'merchantName' : undefined,
                                                })
                                                const reportTitle = reportPreview?.rows?.length
                                                    ? (reportPreview.name || 'Report')
                                                    : (reportTypeOptions.find((opt) => opt.value === reportType)?.label || 'Reports')
                                                exportDataToPDF(payload.rows, payload.columns, {
                                                    title: reportTitle,
                                                    filename: reportPreview?.rows?.length ? 'report.pdf' : 'reports.pdf',
                                                })
                                            }}
                                        />
                                    </FilterBar>
                                    {reportError && (
                                        <div className="text-xs text-[var(--color-danger)]">{reportError}</div>
                                    )}
                                    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)]/70 p-4">
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
                                    </div>
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
                                                className="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-14 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
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
                                                <option value="all" className="bg-[var(--color-bg-primary)]">All Time</option>
                                                <option value="today" className="bg-[var(--color-bg-primary)]">Today</option>
                                                <option value="yesterday" className="bg-[var(--color-bg-primary)]">Yesterday</option>
                                                <option value="last7" className="bg-[var(--color-bg-primary)]">Last 7 days</option>
                                                <option value="last30" className="bg-[var(--color-bg-primary)]">Last 30 days</option>
                                                <option value="thisMonth" className="bg-[var(--color-bg-primary)]">This month</option>
                                                <option value="lastMonth" className="bg-[var(--color-bg-primary)]">Last month</option>
                                                <option value="custom" className="bg-[var(--color-bg-primary)]">Custom Date</option>
                                            </select>
                                            {alDatePreset !== 'all' && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear audit date filter"
                                                    className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
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
                                            <option value="" className="bg-[var(--color-bg-primary)]">Entity Type</option>
                                            {Array.from(new Set(auditLogs.map((r) => r.entityType))).map((v) => (
                                                <option key={v} value={v} className="bg-[var(--color-bg-primary)]">{v}</option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableSelect value={alAction} onChange={setAlAction} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Action</option>
                                            {Array.from(new Set(auditLogs.map((r) => r.action))).map((v) => (
                                                <option key={v} value={v} className="bg-[var(--color-bg-primary)]">{v}</option>
                                            ))}
                                        </ClearableSelect>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Performed by"
                                            value={alPerformedBy}
                                            onChange={(e) => setAlPerformedBy(e.target.value)}
                                        />
                                        <ExportMenu
                                            onExportCSV={() => {
                                                const payload = buildExportPayload(filteredAuditLogs, AUDIT_LOG_CSV_COLUMNS)
                                                exportDataToCSV(payload.rows, payload.columns, 'audit-logs.csv')
                                            }}
                                            onExportPDF={() => {
                                                const payload = buildExportPayload(filteredAuditLogs, AUDIT_LOG_CSV_COLUMNS)
                                                exportDataToPDF(payload.rows, payload.columns, {
                                                    title: 'Audit Logs',
                                                    filename: 'audit-logs.pdf',
                                                })
                                            }}
                                        />
                                    </div>
                                </FilterBar>
                                <DataTable
                                    columns={auditLogColumns}
                                    data={pagedAuditLogs}
                                    keyField="createdAt"
                                    renderActions={(row) => (
                                        row.performedBy ? (
                                            <button
                                                className={`h-8 px-3 rounded-lg border transition text-xs ${row.performedBy === currentUserId
                                                    ? 'border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] cursor-not-allowed'
                                                    : 'border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20'
                                                }`}
                                                type="button"
                                                onClick={async () => {
                                                    if (row.performedBy === currentUserId) return
                                                    try {
                                                        await updateAdminUserBlock(row.performedBy, true)
                                                        setApiNotice('User blocked.')
                                                        setAuditLogs((prev) =>
                                                            prev.map((item) =>
                                                                item.performedBy === row.performedBy
                                                                    ? { ...item, performedByStatus: 'blocked' }
                                                                    : item
                                                            )
                                                        )
                                                    } catch (err) {
                                                        setApiNotice(err?.data?.message || err?.message || 'Unable to block user.')
                                                    }
                                                }}
                                                disabled={row.performedBy === currentUserId}
                                            >
                                                {row.performedBy === currentUserId ? 'Current User' : 'Block User'}
                                            </button>
                                        ) : null
                                    )}
                                />
                                <div className="mt-3 flex flex-col items-start gap-2 text-xs text-[var(--color-text-secondary)]/80 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="leading-relaxed">
                                        Page {Math.min(alPage, alTotalPages)} of {alTotalPages}
                                        <span className="ml-2 text-[var(--color-text-secondary)]/60">Total {filteredAuditLogs.length}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[var(--color-text-secondary)]/70">Rows</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={alPageSize}
                                            onChange={(e) => {
                                                const next = Number(e.target.value)
                                                setAlPageSize(next)
                                                setAlPage(1)
                                            }}
                                        >
                                            {[10, 20, 50, 100].map((size) => (
                                                <option key={size} value={size} className="bg-[var(--color-bg-primary)]">
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={alPage <= 1}
                                            onClick={() => setAlPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={alPage >= alTotalPages}
                                            onClick={() => setAlPage((p) => Math.min(p + 1, alTotalPages))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                                {auditLogsLoading && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
                                        Loading audit logs...
                                    </div>
                                )}
                                {auditLogsError && (
                                    <div className="mt-3 text-sm text-[var(--color-warning)]">
                                        {auditLogsError}
                                    </div>
                                )}
                                {filteredAuditLogs.length === 0 && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
                                        Empty for now. Data will come from the audit logs API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Webhook Outbox */}
                    {page === 'page-webhooks' && (
                        <PermissionGate anyOf={['VIEW_PAYMENT', 'VIEW_WEBHOOK_OUTBOX']} fallback={null}>
                        <div className="space-y-4 w-full">
                            <Card title="Webhook Outbox" right={<Pill>Ops</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableSelect value={whStatus} onChange={setWhStatus} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Status: All</option>
                                            {['PENDING', 'SENDING', 'SENT', 'FAILED'].map((s) => (
                                                <option key={s} value={s} className="bg-[var(--color-bg-primary)]">{s}</option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableInput
                                            className="min-w-[160px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant ID"
                                            value={whMerchantId}
                                            onChange={(e) => setWhMerchantId(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[160px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Order ID"
                                            value={whOrderId}
                                            onChange={(e) => setWhOrderId(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[160px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Payment ID"
                                            value={whPaymentId}
                                            onChange={(e) => setWhPaymentId(e.target.value)}
                                        />
                                        <DateRangeFilter
                                            from={whFrom}
                                            to={whTo}
                                            onFromChange={setWhFrom}
                                            onToChange={setWhTo}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white"
                                            type="button"
                                            onClick={() => loadWebhookOutbox()}
                                            disabled={whBusy}
                                        >
                                            {whBusy ? 'Loading...' : 'Refresh'}
                                        </button>
                                    </div>
                                </FilterBar>
                                {whError && <SupportError error={whError} />}
                                <div className="mt-3">
                                    <DataTable
                                        columns={WEBHOOK_OUTBOX_COLUMNS}
                                        data={whRows}
                                        keyField="rowKey"
                                        expandKeyField="rowKey"
                                        expandedKeys={whExpanded}
                                        onToggleExpand={toggleWebhookExpanded}
                                        renderExpanded={(row) => (
                                            <div className="grid gap-3 text-xs text-[var(--color-text-secondary)]">
                                                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3">
                                                    <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]/70 mb-2">Last Error</div>
                                                    <div className="text-[var(--color-text-primary)] break-words whitespace-pre-line">{row.lastError || '-'}</div>
                                                </div>
                                                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3">
                                                    <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]/70 mb-2">Callback URL</div>
                                                    <div className="text-[var(--color-text-primary)] break-words">{row.callbackUrl || '-'}</div>
                                                </div>
                                            </div>
                                        )}
                                        renderActions={(row) => (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-xs"
                                                    onClick={() => setWhDetail(row)}
                                                >
                                                    Details
                                                </button>
                                                <PermissionGate anyOf={['RETRY_PAYMENT', 'RESEND_WEBHOOK_OUTBOX']} fallback={null}>
                                                    <button
                                                        type="button"
                                                        className={`h-8 px-3 rounded-lg text-xs font-semibold ${canResendWebhooks ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]' : 'bg-white/10 text-white/60 cursor-not-allowed'}`}
                                                        onClick={() => canResendWebhooks && setWhResendTarget(row)}
                                                        disabled={!canResendWebhooks}
                                                    >
                                                        Resend
                                                    </button>
                                                </PermissionGate>
                                            </div>
                                        )}
                                    />
                                </div>
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                    <div>
                                        Page {whPage} of {whTotalPages} · Total {whTotalElements}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>Items per page:</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={whPageSize}
                                            onChange={(e) => {
                                                setWhPageSize(Number(e.target.value))
                                                setWhPage(1)
                                            }}
                                        >
                                            {[10, 20, 50].map((size) => (
                                                <option key={size} value={size} className="bg-[var(--color-bg-primary)]">
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={whPage <= 1}
                                            onClick={() => setWhPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={whPage >= whTotalPages}
                                            onClick={() => setWhPage((p) => Math.min(p + 1, whTotalPages))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        </PermissionGate>
                    )}

                    {/* Risk Dashboard */}
                    {page === 'page-risk' && (
                        <PermissionGate anyOf={['VIEW_RISK_DASHBOARD']} fallback={null}>
                        <div className="space-y-4 w-full">
                            <Card title="Merchant Risk Dashboard" right={<Pill>Compliance</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableSelect value={riskLevel} onChange={setRiskLevel} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Risk Level: All</option>
                                            {['LOW', 'MEDIUM', 'HIGH'].map((level) => (
                                                <option key={level} value={level} className="bg-[var(--color-bg-primary)]">{level}</option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableInput
                                            className="min-w-[160px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant ID"
                                            value={riskMerchantId}
                                            onChange={(e) => setRiskMerchantId(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant name"
                                            value={riskMerchantName}
                                            onChange={(e) => setRiskMerchantName(e.target.value)}
                                        />
                                        <ClearableSelect value={riskPayoutFreeze} onChange={setRiskPayoutFreeze} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Freeze: All</option>
                                            <option value="true" className="bg-[var(--color-bg-primary)]">Frozen</option>
                                            <option value="false" className="bg-[var(--color-bg-primary)]">Not Frozen</option>
                                        </ClearableSelect>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white"
                                            type="button"
                                            onClick={() => loadRiskDashboard()}
                                            disabled={riskBusy}
                                        >
                                            {riskBusy ? 'Loading...' : 'Refresh'}
                                        </button>
                                    </div>
                                </FilterBar>
                                {riskError && <SupportError error={riskError} />}
                                <div className="mt-3">
                                    <DataTable
                                        columns={RISK_DASHBOARD_COLUMNS}
                                        data={riskRows}
                                        keyField="rowKey"
                                        renderActions={(row) => (
                                            <div className="flex items-center justify-end gap-2">
                                                <PermissionGate anyOf={['MANAGE_RISK_OVERRIDES']} fallback={null}>
                                                    <button
                                                        type="button"
                                                        className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-xs"
                                                        onClick={() => {
                                                            setRiskOverrideTarget(row)
                                                            setRiskOverrideLevel(row.manualRiskOverride || row.finalRiskLevel || row.autoRiskLevel || '')
                                                        }}
                                                    >
                                                        Override Risk
                                                    </button>
                                                </PermissionGate>
                                                <PermissionGate anyOf={['MANAGE_RISK_OVERRIDES']} fallback={null}>
                                                    <button
                                                        type="button"
                                                        className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-xs"
                                                        onClick={() => {
                                                            setReserveOverrideTarget(row)
                                                            setReserveOverridePercent(
                                                                row.reservePercentOverride != null ? String(row.reservePercentOverride) : String(row.finalReservePercent ?? '')
                                                            )
                                                        }}
                                                    >
                                                        Override Reserve
                                                    </button>
                                                </PermissionGate>
                                                <PermissionGate anyOf={['FREEZE_PAYOUT']} fallback={null}>
                                                    <button
                                                        type="button"
                                                        className={`h-8 px-3 rounded-lg text-xs font-semibold ${row.payoutFreeze ? 'bg-red-500/20 text-red-200 border border-red-500/40' : 'bg-[var(--color-accent)] text-white'}`}
                                                        onClick={() => {
                                                            setFreezeTarget(row)
                                                            setFreezeReason(row.payoutFreezeReason || '')
                                                        }}
                                                    >
                                                        {row.payoutFreeze ? 'Unfreeze' : 'Freeze'}
                                                    </button>
                                                </PermissionGate>
                                            </div>
                                        )}
                                    />
                                </div>
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]/80">
                                    <div>
                                        Page {riskPage} of {riskTotalPages} · Total {riskTotalElements}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>Items per page:</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={riskPageSize}
                                            onChange={(e) => {
                                                setRiskPageSize(Number(e.target.value))
                                                setRiskPage(1)
                                            }}
                                        >
                                            {[10, 20, 50].map((size) => (
                                                <option key={size} value={size} className="bg-[var(--color-bg-primary)]">
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={riskPage <= 1}
                                            onClick={() => setRiskPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={riskPage >= riskTotalPages}
                                            onClick={() => setRiskPage((p) => Math.min(p + 1, riskTotalPages))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        </PermissionGate>
                    )}

                    {/* Limit Policies */}
                    {page === 'page-limits' && (
                        <div className="space-y-4 w-full">
                            <Card title="Limit Policy" right={<Pill>API</Pill>}>
                                <FilterBar className="justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ClearableInput
                                            className="min-w-[180px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant ID"
                                            value={limitMerchantId}
                                            onChange={(e) => setLimitMerchantId(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[200px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant name"
                                            value={limitMerchantName}
                                            onChange={(e) => setLimitMerchantName(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[220px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant email"
                                            value={limitMerchantEmail}
                                            onChange={(e) => setLimitMerchantEmail(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[200px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Payment method"
                                            value={limitPaymentMethodName}
                                            onChange={(e) => setLimitPaymentMethodName(e.target.value)}
                                        />
                                        <ClearableSelect value={limitActiveFilter} onChange={setLimitActiveFilter} className="min-w-[150px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Status: All</option>
                                            <option value="active" className="bg-[var(--color-bg-primary)]">Active</option>
                                            <option value="inactive" className="bg-[var(--color-bg-primary)]">Inactive</option>
                                        </ClearableSelect>
                                    </div>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white"
                                        type="button"
                                        onClick={() =>
                                            fetchAdminLimits({
                                                merchantId: limitMerchantId ? Number(limitMerchantId) : undefined,
                                                merchantName: limitMerchantName || undefined,
                                                merchantEmail: limitMerchantEmail || undefined,
                                                paymentMethodName: limitPaymentMethodName || undefined,
                                            }).then((rows) =>
                                                setAdminLimitPolicies(Array.isArray(rows) ? rows.map(mapLimitRow) : [])
                                            )
                                        }
                                    >
                                        Refresh
                                    </button>
                                </FilterBar>
                                <DataTable
                                    columns={LIMIT_POLICY_COLUMNS}
                                    data={pagedLimitPolicies}
                                    keyField="rowKey"
                                    renderActions={(row) => (
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)] font-medium"
                                            type="button"
                                            onClick={() => openLimitEditor(row)}
                                        >
                                            Edit
                                        </button>
                                    )}
                                />
                                <div className="mt-3 flex flex-col items-start gap-2 text-xs text-[var(--color-text-secondary)]/80 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="leading-relaxed">
                                        Page {limitPage} of {limitTotalPages}
                                        <span className="ml-2 text-[var(--color-text-secondary)]/60">Total {filteredLimitPolicies.length}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span>Items per page:</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={limitPageSize}
                                            onChange={(e) => {
                                                const next = Number(e.target.value)
                                                setLimitPageSize(next)
                                                setLimitPage(1)
                                            }}
                                        >
                                            {[10, 20, 30, 50].map((size) => (
                                                <option key={size} value={size} className="bg-[var(--color-bg-primary)]">
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={limitPage <= 1}
                                            onClick={() => setLimitPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={limitPage >= limitTotalPages}
                                            onClick={() => setLimitPage((p) => Math.min(p + 1, limitTotalPages))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                                {limitError && (
                                    <div className="mt-3 text-sm text-[var(--color-warning)]">{limitError}</div>
                                )}
                                {filteredLimitPolicies.length === 0 && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
                                        No records
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                                        {/* Payment Methods */}
                    {page === 'page-payment-methods' && (
                        <div className="space-y-4 w-full">
                            <Card title="Payment Methods" right={<Pill>API</Pill>}>
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex-1 min-w-[220px]">
                                        <label className="text-xs text-[var(--color-text-secondary)]/80">Method name</label>
                                                <input
                                                    className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    placeholder="Payment method name (e.g., JazzCash)"
                                                    value={paymentMethodName}
                                                    onChange={(e) => setPaymentMethodName(e.target.value)}
                                                />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-[var(--color-text-secondary)]/80">Active</label>
                                        <button
                                            type="button"
                                            className={`relative h-8 w-14 rounded-full border transition ${
                                                paymentMethodActive
                                                    ? 'border-green-400/60 bg-green-500/30'
                                                    : 'border-red-400/60 bg-red-500/30'
                                            }`}
                                            onClick={() => setPaymentMethodActive((v) => !v)}
                                            aria-checked={paymentMethodActive}
                                            role="switch"
                                        >
                                            <span
                                                className={`absolute top-1 h-6 w-6 rounded-full transition ${
                                                    paymentMethodActive ? 'left-7 bg-green-200' : 'left-1 bg-red-200'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <button
                                        className="h-10 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-sm font-semibold text-white"
                                        type="button"
                                        disabled={paymentMethodBusy}
                                        onClick={handleCreatePaymentMethod}
                                    >
                                        Add Method
                                    </button>
                                </div>
                                {paymentMethodError && (
                                    <div className="mt-3 text-sm text-red-300">{paymentMethodError}</div>
                                )}
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-[520px] w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[var(--color-text-secondary)]/80">
                                                <th className="py-2 pr-3">Name</th>
                                                <th className="py-2 pr-3">Status</th>
                                                <th className="py-2 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[var(--color-text-primary)]">
                                            {paymentMethods.length === 0 ? (
                                                <tr className="border-t border-[var(--color-border-soft)]">
                                                    <td className="py-3" colSpan={3}>
                                                        No payment methods found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paymentMethods.map((m) => (
                                                    <tr key={m.id} className="border-t border-[var(--color-border-soft)]">
                                                        <td className="py-2 pr-3">
                                                            <div className="flex items-center gap-2">
                                                                {(() => {
                                                                    const logo = getPaymentMethodLogo(m.label)
                                                                    if (!logo) {
                                                                        const initials = String(m.label || '?').trim().slice(0, 2).toUpperCase()
                                                                        return (
                                                                            <span className="h-7 w-7 rounded-full bg-white/10 text-[10px] text-[var(--color-text-primary)] grid place-items-center">
                                                                                {initials}
                                                                            </span>
                                                                        )
                                                                    }
                                                                    return (
                                                                        <img
                                                                            src={logo}
                                                                            alt={`${m.label} logo`}
                                                                            className="h-7 w-7 rounded-full bg-white object-contain p-1"
                                                                            loading="lazy"
                                                                        />
                                                                    )
                                                                })()}
                                                                <span>{m.label}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 pr-3">
                                                            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] ${
                                                                m.active
                                                                    ? 'border-[rgba(47,208,122,0.35)] bg-[rgba(47,208,122,0.10)] text-[rgba(47,208,122,0.95)]'
                                                                    : 'border-[rgba(255,90,122,0.35)] bg-[rgba(255,90,122,0.10)] text-[rgba(255,90,122,0.95)]'
                                                            }`}>
                                                                {m.active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 text-right">
                                                            <button
                                                                className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs"
                                                                type="button"
                                                                disabled={paymentMethodBusy}
                                                                onClick={() => handleTogglePaymentMethod(m.id, !m.active)}
                                                            >
                                                                {m.active ? 'Disable' : 'Enable'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Create Merchant */}
                    {page === 'page-create-merchant' && (
                        <CreateMerchantForm
                            editingMerchant={editingMerchantDetail || editingMerchant}
                            paymentMethods={availablePaymentMethods}
                            merchantPermissions={adminPermissions}
                            permissionsError={adminPermissionsError}
                            patterns={{
                                EMAIL_PATTERN,
                                NAME_PATTERN,
                                USERNAME_PATTERN,
                                PASSWORD_PATTERN,
                                COMMISSION_PERCENT_PATTERN,
                                COMMISSION_AMOUNT_PATTERN,
                                LIMIT_AMOUNT_PATTERN,
                            }}
                            onSubmit={handleCreateMerchantSubmit}
                            onCancel={() => {
                                setEditingMerchantId(null)
                                setEditingMerchantDetail(null)
                                goTo('page-merchants')
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
                                                ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]'
                                                : 'border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                                        }`}
                                        type="button"
                                        onClick={() => setSettingsTabPersist('profile')}
                                    >
                                        Profile
                                    </button>
                                    <button
                                        className={`h-9 px-4 rounded-xl border transition text-xs font-semibold ${
                                            settingsTab === 'security'
                                                ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]'
                                                : 'border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                                        }`}
                                        type="button"
                                        onClick={() => setSettingsTabPersist('security')}
                                    >
                                        Change Password
                                    </button>
                                </div>

                                {settingsTab === 'profile' && (
                                    <div className="space-y-4">
                                        {profileError && (
                                            <div className="rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
                                                {profileError}
                                            </div>
                                        )}
                                        {profileNotice && (
                                            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                                {profileNotice}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[var(--color-text-secondary)]/90">Full Name</label>
                                                <input
                                                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    value={profileForm.name}
                                                    onChange={(e) => {
                                                        setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                                                        setProfileNotice('')
                                                    }}
                                                    disabled={profileBusy}
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[var(--color-text-secondary)]/90">Email</label>
                                                <input
                                                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    value={profileForm.email}
                                                    type="email"
                                                    readOnly
                                                    aria-readonly="true"
                                                    data-lpignore="true"
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[var(--color-text-secondary)]/90">Username</label>
                                                <input
                                                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]/80"
                                                    value={profileForm.username || '-'}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[var(--color-text-secondary)]/90">Role</label>
                                                <input
                                                    className="h-11 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]/80"
                                                    value={profileRoleLabel}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="md:col-span-2 grid gap-2">
                                                <label className="text-sm text-[var(--color-text-secondary)]/90">Permissions</label>
                                                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 min-h-[48px]">
                                                    {profilePermissions.length === 0 ? (
                                                        <div className="text-xs text-[var(--color-text-secondary)]/70">No permissions found.</div>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {profilePermissions.map((perm) => (
                                                                <span
                                                                    key={perm}
                                                                    className="rounded-lg border border-[var(--color-border-soft)] bg-white/[0.04] px-2 py-1 text-[11px] text-[var(--color-text-secondary)]/90"
                                                                >
                                                                    {perm}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 flex justify-end">
                                                <button
                                                    className="h-10 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white disabled:opacity-60"
                                                    type="button"
                                                    onClick={handleProfileSave}
                                                    disabled={profileBusy}
                                                >
                                                    {profileBusy ? 'Saving...' : 'Save Profile'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'security' && (
                                    <div className="space-y-4">
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
                                        {passwordError && (
                                            <div className="rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
                                                {passwordError}
                                            </div>
                                        )}
                                        {passwordNotice && (
                                            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                                {passwordNotice}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[var(--color-text-secondary)]/90">Current Password</label>
                                                <div className="relative">
                                                    <input
                                                        className="h-11 w-full px-3 pr-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        type={showPasswordCurrent ? 'text' : 'password'}
                                                        value={passwordForm.current}
                                                        autoComplete="new-password"
                                                        data-lpignore="true"
                                                        name="current-passcode"
                                                        onChange={(e) => {
                                                            setPasswordForm((prev) => ({ ...prev, current: e.target.value }))
                                                            setPasswordNotice('')
                                                        }}
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
                                            </div>
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[var(--color-text-secondary)]/90">New Password</label>
                                                <div className="relative">
                                                    <input
                                                        className="h-11 w-full px-3 pr-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        type={showPasswordNext ? 'text' : 'password'}
                                                        value={passwordForm.next}
                                                        autoComplete="new-password"
                                                        name="new-passcode"
                                                        onChange={(e) => {
                                                            setPasswordForm((prev) => ({ ...prev, next: e.target.value }))
                                                            setPasswordNotice('')
                                                        }}
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
                                            </div>
                                            <div className="grid gap-1.5">
                                                <label className="text-sm text-[var(--color-text-secondary)]/90">Confirm New Password</label>
                                                <div className="relative">
                                                    <input
                                                        className="h-11 w-full px-3 pr-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        type={showPasswordConfirm ? 'text' : 'password'}
                                                        value={passwordForm.confirm}
                                                        autoComplete="new-password"
                                                        name="confirm-passcode"
                                                        onChange={(e) => {
                                                            setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))
                                                            setPasswordNotice('')
                                                        }}
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
                                            <div className="md:col-span-2 flex justify-end">
                                                <button
                                                    className="h-10 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white disabled:opacity-60"
                                                    type="button"
                                                    onClick={handlePasswordChange}
                                                    disabled={passwordBusy}
                                                >
                                                    {passwordBusy ? 'Updating...' : 'Update Password'}
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
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-[var(--color-text-secondary)]/70">Manage roles and permissions</div>
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs font-medium text-[var(--color-text-primary)]"
                                            type="button"
                                            onClick={() => {
                                                setShowCreateRole((prev) => !prev)
                                                setRoleError('')
                                            }}
                                        >
                                            {showCreateRole ? 'Close Create' : '+ Create Role'}
                                        </button>
                                    </div>

                                    {showCreateRole && (
                                        <div className="space-y-4 rounded-2xl border border-[var(--color-border-soft)] bg-white/[0.03] p-4">
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70">Create Role</div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Role</div>
                                                <input
                                                    className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                    placeholder="e.g. Super Admin"
                                                    value={roleName}
                                                    onChange={(e) => setRoleName(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Permissions</div>
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <ClearableInput
                                                        className="min-w-[220px]"
                                                        inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        placeholder="Search permissions"
                                                        value={rolePermissionSearch}
                                                        onChange={(e) => setRolePermissionSearch(e.target.value)}
                                                    />
                                                    <div className="text-xs text-[var(--color-text-secondary)]/70">
                                                        Selected: {cleanedPermissions.length}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 max-h-72 overflow-y-auto overflow-x-hidden theme-scrollbar">
                                                    {adminPermissionsError ? (
                                                        <div className="text-xs text-[var(--color-warning)]">{adminPermissionsError}</div>
                                                    ) : filteredRolePermissions.length === 0 ? (
                                                        <div className="text-xs text-[var(--color-text-secondary)]/70">No permissions found.</div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {filteredRolePermissions.map((perm) => (
                                                                <label key={perm} className="flex items-start gap-2 rounded-lg border border-[var(--color-border-soft)] bg-white/[0.03] px-2 py-2 text-xs text-[var(--color-text-primary)] hover:bg-white/[0.06] min-w-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 accent-[var(--color-accent)]"
                                                                        checked={normalizedSelectedPermissions.has(perm.trim().toLowerCase())}
                                                                        onChange={() => toggleRolePermission(perm)}
                                                                    />
                                                                    <span className="break-words whitespace-normal leading-5">{perm}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {roleError && (
                                                <div className="text-xs text-[var(--color-danger)]">{roleError}</div>
                                            )}

                                            <div className="flex justify-end gap-2 pt-2">
                                                <button
                                                    className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs font-medium text-[var(--color-text-primary)]"
                                                    type="button"
                                                    onClick={() => {
                                                        setRoleName('')
                                                        setPermissions([])
                                                        setRoleError('')
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className={`h-9 px-4 rounded-xl text-xs font-semibold text-white transition ${canSaveRole ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]' : 'bg-white/10 cursor-not-allowed'}`}
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!canSaveRole) return
                                                        const permissionIds = resolvePermissionIds(cleanedPermissions)
                                                        if (permissionIds.length !== cleanedPermissions.length) {
                                                            setRoleError('Some permissions could not be resolved. Reload permissions.')
                                                            return
                                                        }
                                                        try {
                                                            setRoleError('')
                                                            await createAdminRole({
                                                                name: roleName.trim(),
                                                                permissionIds,
                                                            })
                                                            setRoleName('')
                                                            setPermissions([])
                                                            setShowCreateRole(false)
                                                            await loadRoles()
                                                        } catch (err) {
                                                            setRoleError(err?.data?.message || err?.message || 'Unable to create role.')
                                                        }
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3 rounded-2xl border border-[var(--color-border-soft)] bg-white/[0.03] p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70">Saved Roles</div>
                                            <div className="text-xs text-[var(--color-text-secondary)]/70">{adminRoles.length}</div>
                                        </div>
                                        <div className="space-y-2 text-sm text-[var(--color-text-primary)] max-h-[420px] overflow-y-auto overflow-x-hidden theme-scrollbar">
                                            {adminRoles.length === 0 ? (
                                                <div className="text-xs text-[var(--color-text-secondary)]/70">No roles available.</div>
                                            ) : (
                                                adminRoles.map((r) => (
                                                    <div key={r.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 min-w-0">
                                                        <div>
                                                            <div className="font-semibold">{r.name}</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {isProtectedRole(r.name) && (
                                                                <span className="h-8 px-3 inline-flex items-center rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-xs text-[var(--color-text-secondary)]/80">
                                                                    Locked
                                                                </span>
                                                            )}
                                                            <button
                                                                className={`h-8 px-3 rounded-lg border border-[var(--color-border-soft)] transition text-xs ${isProtectedRole(r.name) ? 'bg-white/[0.02] text-[var(--color-text-secondary)]/50 cursor-not-allowed' : 'bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] text-[var(--color-text-primary)]'}`}
                                                                type="button"
                                                                disabled={isProtectedRole(r.name)}
                                                                title={isProtectedRole(r.name) ? 'SYSTEM and SUPER_ADMIN roles are locked' : 'Edit role'}
                                                                onClick={() => {
                                                                    if (isProtectedRole(r.name)) return
                                                                    setEditRoleId(r.id)
                                                                    setEditRoleName(r.name)
                                                                    setEditPermissions(r.permissions && r.permissions.length ? r.permissions : [])
                                                                    setEditPermissionSearch('')
                                                                    setRoleError('')
                                                                    setEditRoleOpen(true)
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
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
                                            className="min-w-[160px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Merchant ID"
                                            value={subMerchantMerchantId}
                                            onChange={(e) => setSubMerchantMerchantId(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[180px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Branch Code"
                                            value={subMerchantBranchCode}
                                            onChange={(e) => setSubMerchantBranchCode(e.target.value)}
                                        />
                                        <ClearableInput
                                            className="min-w-[200px]"
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Branch Name"
                                            value={subMerchantBranchName}
                                            onChange={(e) => setSubMerchantBranchName(e.target.value)}
                                        />
                                        <ClearableSelect value={subMerchantStatus} onChange={setSubMerchantStatus} className="min-w-[150px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Status: All</option>
                                            <option value="active" className="bg-[var(--color-bg-primary)]">Active</option>
                                            <option value="blocked" className="bg-[var(--color-bg-primary)]">Blocked</option>
                                            <option value="awaiting" className="bg-[var(--color-bg-primary)]">Awaiting Approval</option>
                                            <option value="admin-blocked" className="bg-[var(--color-bg-primary)]">Admin Blocked</option>
                                        </ClearableSelect>
                                        <ClearableSelect value={subMerchantHasUser} onChange={setSubMerchantHasUser} className="min-w-[150px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Has User: All</option>
                                            <option value="yes" className="bg-[var(--color-bg-primary)]">Yes</option>
                                            <option value="no" className="bg-[var(--color-bg-primary)]">No</option>
                                        </ClearableSelect>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft-hover)] transition text-xs font-medium text-[var(--color-text-primary)]"
                                            type="button"
                                            onClick={openCreateSubMerchant}
                                        >
                                            + Create Sub-Merchant
                                        </button>
                                        <ExportMenu
                                            onExportCSV={() => {
                                                const payload = buildExportPayload(filteredSubMerchants, SUB_MERCHANT_ADMIN_COLUMNS, {
                                                    groupByKey: 'merchantName',
                                                })
                                                exportDataToCSV(payload.rows, payload.columns, 'sub-merchants.csv')
                                            }}
                                            onExportPDF={() => {
                                                const payload = buildExportPayload(filteredSubMerchants, SUB_MERCHANT_ADMIN_COLUMNS, {
                                                    groupByKey: 'merchantName',
                                                })
                                                exportDataToPDF(payload.rows, payload.columns, {
                                                    title: 'Sub Merchants',
                                                    filename: 'sub-merchants.pdf',
                                                })
                                            }}
                                        />
                                    </div>
                                </FilterBar>
                                <DataTable
                                    columns={SUB_MERCHANT_ADMIN_COLUMNS}
                                    data={pagedSubMerchants}
                                    keyField="branchCode"
                                    renderActions={(row) => (
                                        <div className="flex items-center justify-end">
                                            <div className="relative" data-subm-actions-root>
                                                <button
                                                    className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)]"
                                                    type="button"
                                                    onClick={(e) => {
                                                        if (!row?.id) return
                                                        if (subMerchantActionMenu?.id === row.id) {
                                                            setSubMerchantActionMenu(null)
                                                            return
                                                        }
                                                        const rect = e.currentTarget.getBoundingClientRect()
                                                        const menuWidth = 180
                                                        const left = Math.min(
                                                            rect.right - menuWidth,
                                                            window.innerWidth - menuWidth - 8
                                                        )
                                                        const top = rect.bottom + 8
                                                        setSubMerchantActionMenu({
                                                            id: row.id,
                                                            top,
                                                            left: Math.max(8, left),
                                                        })
                                                    }}
                                                >
                                                    Actions
                                                </button>
                                                {subMerchantActionMenu?.id === row.id && subMerchantActionMenu?.top != null && subMerchantActionMenu?.left != null && (
                                                    <div
                                                        className="fixed w-[180px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-card overflow-hidden z-50"
                                                        style={{ top: subMerchantActionMenu.top, left: subMerchantActionMenu.left }}
                                                        data-subm-actions-root
                                                    >
                                                        {!row.hasUser && (
                                                            <button
                                                                className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition"
                                                                type="button"
                                                                onClick={() => {
                                                                    setSubMerchantActionMenu(null)
                                                                    handleCreateSubMerchantUser(row)
                                                                }}
                                                            >
                                                                Add User
                                                            </button>
                                                        )}
                                                        <button
                                                            className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition"
                                                            type="button"
                                                            onClick={() => {
                                                                setSubMerchantActionMenu(null)
                                                                openEditSubMerchant(row)
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className={`w-full text-left px-3 py-2 text-xs transition ${row.blocked
                                                                ? 'text-emerald-200 hover:bg-emerald-500/10'
                                                                : 'text-red-200 hover:bg-red-500/10'
                                                            }`}
                                                            type="button"
                                                            onClick={() => {
                                                                setSubMerchantActionMenu(null)
                                                                handleToggleSubMerchant(row)
                                                            }}
                                                        >
                                                            {row.blocked
                                                                ? (row.adminBlocked ? 'Unblock' : (row.adminApproved === false ? 'Activate' : 'Unblock'))
                                                                : 'Block'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                />
                                <div className="mt-3 flex flex-col items-start gap-2 text-xs text-[var(--color-text-secondary)]/80 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="leading-relaxed">
                                        Page {Math.min(subMerchantPage, subMerchantTotalPages)} of {subMerchantTotalPages}
                                        <span className="ml-2 text-[var(--color-text-secondary)]/60">Total {filteredSubMerchants.length}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[var(--color-text-secondary)]/70">Rows</span>
                                        <select
                                            className="h-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-primary)] outline-none"
                                            value={subMerchantPageSize}
                                            onChange={(e) => {
                                                const next = Number(e.target.value)
                                                setSubMerchantPageSize(next)
                                                setSubMerchantPage(1)
                                            }}
                                        >
                                            <option value="10" className="bg-[var(--color-bg-primary)]">10</option>
                                            <option value="20" className="bg-[var(--color-bg-primary)]">20</option>
                                            <option value="50" className="bg-[var(--color-bg-primary)]">50</option>
                                            <option value="100" className="bg-[var(--color-bg-primary)]">100</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={subMerchantPage <= 1}
                                            onClick={() => setSubMerchantPage((p) => Math.max(p - 1, 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] disabled:opacity-40"
                                            disabled={subMerchantPage >= subMerchantTotalPages}
                                            onClick={() => setSubMerchantPage((p) => Math.min(p + 1, subMerchantTotalPages))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                                {filteredSubMerchants.length === 0 && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
                                        No records
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
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Search name / email"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            autoComplete="off"
                                        />
                                        <ClearableSelect value={userRoleFilter} onChange={setUserRoleFilter} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Role: All</option>
                                            {roleFilterOptions.map((role) => (
                                                <option key={role} value={role} className="bg-[var(--color-bg-primary)]">{role}</option>
                                            ))}
                                        </ClearableSelect>
                                        <ClearableSelect value={userTypeFilter} onChange={setUserTypeFilter} className="min-w-[180px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">User Type: All</option>
                                            <option value="merchant" className="bg-[var(--color-bg-primary)]">Merchant Users</option>
                                            <option value="other" className="bg-[var(--color-bg-primary)]">Portal Users</option>
                                        </ClearableSelect>
                                        <ClearableSelect value={userStatusFilter} onChange={setUserStatusFilter} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Status: All</option>
                                            <option value="active" className="bg-[var(--color-bg-primary)]">Active</option>
                                            <option value="blocked" className="bg-[var(--color-bg-primary)]">Blocked</option>
                                        </ClearableSelect>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            className={`h-9 px-4 rounded-xl text-xs font-semibold text-white transition ${adminRoles.length ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]' : 'bg-white/10 cursor-not-allowed'}`}
                                            type="button"
                                            disabled={!adminRoles.length}
                                            onClick={openCreateUser}
                                            title={adminRoles.length ? 'Create admin user' : 'Load roles to create users'}
                                        >
                                            + Add User
                                        </button>
                                        <ExportMenu
                                            onExportCSV={() => {
                                                const payload = buildExportPayload(filteredAdminUsers, USERS_ADMIN_COLUMNS)
                                                exportDataToCSV(payload.rows, payload.columns, 'users.csv')
                                            }}
                                            onExportPDF={() => {
                                                const payload = buildExportPayload(filteredAdminUsers, USERS_ADMIN_COLUMNS)
                                                exportDataToPDF(payload.rows, payload.columns, {
                                                    title: 'Admin Users',
                                                    filename: 'admin-users.pdf',
                                                })
                                            }}
                                        />
                                    </div>
                                </FilterBar>
                                <DataTable
                                    columns={USERS_ADMIN_COLUMNS}
                                    data={filteredAdminUsers}
                                    keyField="email"
                                    renderActions={(row) => (
                                        <button
                                            className={`h-9 px-4 rounded-xl border border-[var(--color-border-soft)] text-xs font-medium transition ${row.id === undefined || row.id === null ? 'bg-white/5 text-[var(--color-text-secondary)] cursor-not-allowed' : 'bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] text-[var(--color-text-primary)]'}`}
                                            type="button"
                                            disabled={row.id === undefined || row.id === null}
                                            onClick={() => openEditUser(row)}
                                        >
                                            Edit
                                        </button>
                                    )}
                                />
                                {adminUsersError && (
                                    <div className="mt-3 text-sm text-[var(--color-warning)]">
                                        {adminUsersError}
                                    </div>
                                )}
                                {!adminUsersError && filteredAdminUsers.length === 0 && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
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
                                            inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Search Ticket ID / Subject"
                                            value={inqSearch}
                                            onChange={(e) => setInqSearch(e.target.value)}
                                        />
                                        <ClearableSelect value={inqStatus} onChange={setInqStatus} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Status: All</option>
                                        </ClearableSelect>
                                        <ClearableSelect value={inqPriority} onChange={setInqPriority} className="min-w-[160px]">
                                            <option value="" className="bg-[var(--color-bg-primary)]">Priority: All</option>
                                        </ClearableSelect>
                                    </div>
                                    <ExportMenu
                                        onExportCSV={() => {
                                            const payload = buildExportPayload(filteredInquiries, INQUIRIES_ADMIN_COLUMNS)
                                            exportDataToCSV(payload.rows, payload.columns, 'inquiries.csv')
                                        }}
                                        onExportPDF={() => {
                                            const payload = buildExportPayload(filteredInquiries, INQUIRIES_ADMIN_COLUMNS)
                                            exportDataToPDF(payload.rows, payload.columns, {
                                                title: 'Inquiries',
                                                filename: 'inquiries.pdf',
                                            })
                                        }}
                                    />
                                </FilterBar>
                                <DataTable columns={INQUIRIES_ADMIN_COLUMNS} data={filteredInquiries} keyField="ticketId" />
                                {filteredInquiries.length === 0 && (
                                    <div className="mt-3 text-sm text-[var(--color-text-secondary)]/80">
                                        Empty for now. Data will come from the inquiries API.
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {subMerchantModalOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[720px] max-h-[85vh] overflow-y-auto theme-scrollbar rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-lg font-semibold">
                                            {subMerchantModalMode === 'create' ? 'Create Sub-Merchant' : 'Update Sub-Merchant'}
                                        </div>
                                        <div className="text-xs text-[var(--color-text-secondary)]/80">Assign branch details for a merchant.</div>
                                    </div>
                                    <button
                                        type="button"
                                        className="h-8 w-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition grid place-items-center"
                                        onClick={() => {
                                            setSubMerchantModalOpen(false)
                                            resetSubMerchantForm()
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <form className="mt-5 space-y-4" onSubmit={submitSubMerchantForm}>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                        <div className="md:col-span-3">
                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex-1 min-w-[220px]">
                                                    <input
                                                        list="merchant-options"
                                                        className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        placeholder="Search Merchant (Legal Name)"
                                                        value={subMerchantMerchantQuery}
                                                        onChange={(e) => {
                                                            const value = e.target.value
                                                            setSubMerchantMerchantQuery(value)
                                                            const match = subMerchantMerchantOptions.find(
                                                                (m) => formatMerchantOption(m) === value
                                                            )
                                                            if (match) {
                                                                setSubMerchantForm((s) => ({ ...s, merchantId: String(match.id) }))
                                                            }
                                                        }}
                                                    />
                                                    <datalist id="merchant-options">
                                                        {subMerchantMerchantOptions.map((m) => (
                                                            <option key={m.id} value={formatMerchantOption(m)} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`h-10 px-4 rounded-xl text-xs font-semibold text-white transition ${subMerchantMerchantBusy ? 'bg-white/10 cursor-not-allowed' : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'}`}
                                                    onClick={searchSubMerchantMerchants}
                                                    disabled={subMerchantMerchantBusy}
                                                >
                                                    {subMerchantMerchantBusy ? 'Searching...' : 'Search'}
                                                </button>
                                            </div>
                                            <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]/70">
                                                Selected Merchant ID: {subMerchantForm.merchantId || '-'}
                                            </div>
                                        </div>
                                        <input
                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Branch Code"
                                            value={subMerchantForm.branchCode}
                                            onChange={(e) => setSubMerchantForm((s) => ({ ...s, branchCode: e.target.value }))}
                                        />
                                        <input
                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            placeholder="Branch Name"
                                            value={subMerchantForm.branchName}
                                            onChange={(e) => setSubMerchantForm((s) => ({ ...s, branchName: e.target.value }))}
                                        />
                                        <select
                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            value={subMerchantForm.blocked ? 'blocked' : 'active'}
                                            onChange={(e) => setSubMerchantForm((s) => ({ ...s, blocked: e.target.value === 'blocked' }))}
                                        >
                                            <option value="active">Status: Active</option>
                                            <option value="blocked">Status: Blocked</option>
                                        </select>
                                    </div>

                                    {!subMerchantForm.hasUser && (
                                        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
                                            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]/90">
                                                <input
                                                    type="checkbox"
                                                    checked={subMerchantForm.createUser}
                                                    onChange={(e) => setSubMerchantForm((s) => ({ ...s, createUser: e.target.checked }))}
                                                />
                                                Create user for this branch
                                            </label>
                                            {subMerchantForm.createUser && (
                                                <div className="mt-3 grid grid-cols-1 gap-3">
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        <input
                                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                            placeholder="Full Name"
                                                            value={subMerchantForm.userName}
                                                            onChange={(e) => setSubMerchantForm((s) => ({ ...s, userName: e.target.value }))}
                                                        />
                                                        <input
                                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                            placeholder="Email"
                                                            value={subMerchantForm.userEmail}
                                                            autoComplete="off"
                                                            onChange={(e) => setSubMerchantForm((s) => ({ ...s, userEmail: e.target.value }))}
                                                        />
                                                        <input
                                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                            placeholder="Username"
                                                            value={subMerchantForm.userUsername}
                                                            onChange={(e) => setSubMerchantForm((s) => ({ ...s, userUsername: e.target.value }))}
                                                            ref={subMerchantUsernameRef}
                                                        />
                                                        <div className="md:col-span-2 text-xs text-[var(--color-text-secondary)]/70 min-h-[16px]">
                                                            {subMerchantUsernameStatus === 'checking' && 'Checking username availability...'}
                                                            {subMerchantUsernameStatus === 'available' && 'Username is available.'}
                                                            {subMerchantUsernameStatus === 'taken' && 'Username already exists.'}
                                                        </div>
                                                        {subMerchantUsernameStatus === 'taken' && subMerchantUsernameSuggestions.length > 0 && (
                                                            <div className="md:col-span-2 flex flex-wrap gap-2">
                                                                {subMerchantUsernameSuggestions.map((suggestion) => (
                                                                    <button
                                                                        key={suggestion}
                                                                        type="button"
                                                                        className="rounded-full border border-[var(--color-border-soft)] bg-white/[0.06] px-3 py-1 text-xs text-[var(--color-text-primary)] hover:bg-white/[0.1]"
                                                                        onClick={() => setSubMerchantForm((s) => ({ ...s, userUsername: suggestion }))}
                                                                    >
                                                                        {suggestion}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <input
                                                            className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                            placeholder="Password"
                                                            type="password"
                                                            value={subMerchantForm.userPassword}
                                                            autoComplete="new-password"
                                                            onChange={(e) => setSubMerchantForm((s) => ({ ...s, userPassword: e.target.value }))}
                                                        />
                                                    </div>
                                                    <input
                                                        className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        placeholder="Role Name (MERCHANT_*)"
                                                        value={subMerchantForm.userRoleName}
                                                        onChange={(e) => setSubMerchantForm((s) => ({ ...s, userRoleName: e.target.value }))}
                                                        disabled
                                                    />
                                                    {subMerchantForm.userRoleName === 'SUB_MERCHANT' && (
                                                        <div className="text-xs text-[var(--color-text-secondary)]/70">
                                                            Default role: SUB_MERCHANT (fixed permissions)
                                                        </div>
                                                    )}
                                                    {subMerchantForm.userRoleName !== 'SUB_MERCHANT' ? (
                                                        <>
                                                            <input
                                                                className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                                placeholder="Search permissions..."
                                                                value={subMerchantForm.userPermissionSearch}
                                                                onChange={(e) => setSubMerchantForm((s) => ({ ...s, userPermissionSearch: e.target.value }))}
                                                            />
                                                            <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 max-h-44 overflow-y-auto theme-scrollbar">
                                                                {filteredSubMerchantPerms.length === 0 ? (
                                                                    <div className="text-xs text-[var(--color-text-secondary)]/70">No permissions found.</div>
                                                                ) : (
                                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                                        {filteredSubMerchantPerms.map((perm) => (
                                                                            <label key={perm} className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={subMerchantForm.userPermissions.includes(perm)}
                                                                                    onChange={() => toggleSubMerchantPermission(perm)}
                                                                                />
                                                                                <span>{perm}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3">
                                                            <div className="text-xs text-[var(--color-text-secondary)]/70 mb-2">Permissions (fixed)</div>
                                                            <div className="grid gap-2 sm:grid-cols-2">
                                                                {subMerchantDefaultPerms.map((perm) => (
                                                                    <div key={perm} className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
                                                                        <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                                                                        <span>{perm}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {subMerchantFormError && (
                                        <div className="text-sm text-[var(--color-warning)]">{subMerchantFormError}</div>
                                    )}

                                    <div className="flex justify-end gap-3">
                                        <button
                                            className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)]"
                                            type="button"
                                            onClick={() => {
                                                setSubMerchantModalOpen(false)
                                                resetSubMerchantForm()
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className={`h-9 px-4 rounded-xl text-xs font-semibold text-white transition ${subMerchantFormBusy
                                                ? 'bg-white/10 cursor-not-allowed'
                                                : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
                                            }`}
                                            type="submit"
                                            disabled={subMerchantFormBusy}
                                        >
                                            {subMerchantFormBusy ? 'Saving...' : (subMerchantModalMode === 'create' ? 'Create Sub-Merchant' : 'Update Sub-Merchant')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {payCustomOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[520px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="text-lg font-semibold">Custom Date</div>
                                <div className="mt-5 space-y-4 text-sm text-[var(--color-text-secondary)]/85">
                                    <div>
                                        <div className="mb-2">Date Start</div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-16 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                type="date"
                                                value={payCustomFrom}
                                                onChange={(e) => setPayCustomFrom(e.target.value)}
                                            />
                                            {payCustomFrom && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear start date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
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
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-16 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                type="date"
                                                value={payCustomTo}
                                                onChange={(e) => setPayCustomTo(e.target.value)}
                                            />
                                            {payCustomTo && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear end date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
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
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => {
                                            setPayCustomOpen(false)
                                            setPayDatePreset('all')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-white font-semibold"
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

                    {alCustomOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[520px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="text-lg font-semibold">Custom Date</div>
                                <div className="mt-5 space-y-4 text-sm text-[var(--color-text-secondary)]/85">
                                    <div>
                                        <div className="mb-2">Date Start</div>
                                        <div className="relative">
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-12 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                type="date"
                                                value={alCustomFrom}
                                                onChange={(e) => setAlCustomFrom(e.target.value)}
                                            />
                                            {alCustomFrom && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear start date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
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
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-12 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                type="date"
                                                value={alCustomTo}
                                                onChange={(e) => setAlCustomTo(e.target.value)}
                                            />
                                            {alCustomTo && (
                                                <button
                                                    type="button"
                                                    aria-label="Clear end date"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
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
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => {
                                            setAlCustomOpen(false)
                                            setAlDatePreset('all')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-white font-semibold"
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

                    {userModalOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[640px] max-h-[90vh] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card flex flex-col overflow-hidden">
                                <div className="text-lg font-semibold">
                                    {userModalMode === 'create' ? 'Add Admin User' : 'Edit Admin User'}
                                </div>
                                <div className="mt-5 overflow-y-auto pr-2 theme-scrollbar">
                                    <div className="grid gap-4 text-sm md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Name</div>
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                value={userFormData.name}
                                                onChange={(e) => setUserFormData((prev) => ({ ...prev, name: e.target.value }))}
                                                disabled={userFormBusy}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Email</div>
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                value={userFormData.email}
                                                onChange={(e) => setUserFormData((prev) => ({ ...prev, email: e.target.value }))}
                                                disabled={userFormBusy || userModalMode === 'edit'}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Username</div>
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                value={userFormData.username}
                                                onChange={(e) => setUserFormData((prev) => ({ ...prev, username: e.target.value }))}
                                                disabled={userFormBusy || userModalMode === 'edit'}
                                                autoComplete="off"
                                            />
                                        </div>
                                        {userModalMode === 'create' && (
                                            <div className="md:col-span-2">
                                                <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Password</div>
                                                <div className="relative">
                                                    <input
                                                        type={showUserPassword ? 'text' : 'password'}
                                                        className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 pr-12 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                        value={userFormData.password}
                                                        onChange={(e) => setUserFormData((prev) => ({ ...prev, password: e.target.value }))}
                                                        disabled={userFormBusy}
                                                        autoComplete="new-password"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
                                                        onClick={() => setShowUserPassword((prev) => !prev)}
                                                        aria-label={showUserPassword ? 'Hide password' : 'Show password'}
                                                        disabled={userFormBusy}
                                                    >
                                                        {showUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70">Blocked</div>
                                                <div className="text-xs text-[var(--color-text-secondary)]/70">Disable login for this user</div>
                                            </div>
                                            <button
                                                type="button"
                                                className={`relative h-8 w-14 rounded-full border transition ${
                                                    userFormData.blocked
                                                        ? 'border-red-400/60 bg-red-500/30'
                                                        : 'border-green-400/60 bg-green-500/30'
                                                }`}
                                                onClick={() => setUserFormData((prev) => ({ ...prev, blocked: !prev.blocked }))}
                                                aria-checked={userFormData.blocked}
                                                role="switch"
                                                disabled={userFormBusy}
                                            >
                                                <span
                                                    className={`absolute top-1 h-6 w-6 rounded-full transition ${
                                                        userFormData.blocked ? 'left-1 bg-red-200' : 'left-7 bg-green-200'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                        <div className="md:col-span-2">
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Roles</div>
                                            {adminRoles.length > 0 ? (
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {adminRoles.map((role) => (
                                                        <label
                                                            key={role.id}
                                                            className="flex items-center gap-2 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-primary)]"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]"
                                                                checked={userFormData.roleIds.includes(String(role.id))}
                                                                onChange={() => toggleUserRole(role.id)}
                                                                disabled={userFormBusy}
                                                            />
                                                            <span>{role.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-[var(--color-text-secondary)]/80">No roles available.</div>
                                            )}
                                            {adminRolesError && (
                                                <div className="mt-2 text-xs text-[var(--color-warning)]">{adminRolesError}</div>
                                            )}
                                        </div>
                                        {userFormError && (
                                            <div className="md:col-span-2 text-xs text-[var(--color-danger)]">{userFormError}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => {
                                            setUserModalOpen(false)
                                            resetUserForm()
                                        }}
                                        disabled={userFormBusy}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={`h-9 px-4 rounded-xl text-white font-semibold transition ${
                                            userFormBusy ? 'bg-white/10 cursor-not-allowed' : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
                                        }`}
                                        type="button"
                                        onClick={submitUserForm}
                                        disabled={userFormBusy}
                                    >
                                        {userModalMode === 'create' ? 'Create' : 'Update'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {limitModalOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[600px] max-h-[90vh] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card flex flex-col overflow-hidden">
                                <div className="text-lg font-semibold">Update Limits</div>
                                <div className="mt-4 text-xs text-[var(--color-text-secondary)]/80">
                                    {limitFormData.merchantName} · {limitFormData.paymentMethodName}
                                </div>
                                <div className="mt-5 grid gap-4 text-sm overflow-y-auto pr-2 theme-scrollbar">
                                    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70">Active</div>
                                            <div className="text-xs text-[var(--color-text-secondary)]/70">Allow this payment method</div>
                                        </div>
                                        <button
                                            type="button"
                                            className={`relative h-8 w-14 rounded-full border transition ${
                                                limitFormData.active
                                                    ? 'border-green-400/60 bg-green-500/30'
                                                    : 'border-red-400/60 bg-red-500/30'
                                            }`}
                                            onClick={() =>
                                                setLimitFormData((prev) => ({ ...prev, active: !prev.active }))
                                            }
                                            aria-checked={limitFormData.active}
                                            role="switch"
                                            disabled={limitFormBusy}
                                        >
                                            <span
                                                className={`absolute top-1 h-6 w-6 rounded-full transition ${
                                                    limitFormData.active ? 'left-7 bg-green-200' : 'left-1 bg-red-200'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Daily Limit</div>
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                value={limitFormData.dailyLimit}
                                                onChange={(e) =>
                                                    setLimitFormData((prev) => ({ ...prev, dailyLimit: e.target.value }))
                                                }
                                                disabled={limitFormBusy}
                                            />
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Per Transaction Limit</div>
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                value={limitFormData.perTransactionLimit}
                                                onChange={(e) =>
                                                    setLimitFormData((prev) => ({ ...prev, perTransactionLimit: e.target.value }))
                                                }
                                                disabled={limitFormBusy}
                                            />
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Min Amount</div>
                                            <input
                                                className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                value={limitFormData.minSingleAmount}
                                                onChange={(e) =>
                                                    setLimitFormData((prev) => ({ ...prev, minSingleAmount: e.target.value }))
                                                }
                                                disabled={limitFormBusy}
                                            />
                                        </div>
                                    </div>
                                    {limitFormError && (
                                        <div className="text-xs text-[var(--color-danger)]">{limitFormError}</div>
                                    )}
                                </div>
                                <div className="mt-6 flex justify-end gap-3 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => {
                                            setLimitModalOpen(false)
                                            resetLimitForm()
                                        }}
                                        disabled={limitFormBusy}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={`h-9 px-4 rounded-xl text-white font-semibold transition ${
                                            limitFormBusy ? 'bg-white/10 cursor-not-allowed' : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
                                        }`}
                                        type="button"
                                        onClick={submitLimitForm}
                                        disabled={limitFormBusy}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                            {item.label && (
                                                <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">
                                                    {item.label}
                                                </div>
                                            )}
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

                    {stepUpModalOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[520px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card flex flex-col">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-lg font-semibold">Step-up Verification</div>
                                        <div className="text-xs text-[var(--color-text-secondary)]/80">
                                            Enter your current password to approve this action.
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="h-8 w-8 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition grid place-items-center"
                                        onClick={() => setStepUpModalOpen(false)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <form className="mt-5 space-y-4" onSubmit={handleStepUpSubmit}>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">
                                            Current Password
                                        </div>
                                        <input
                                            type="password"
                                            className="h-11 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            value={stepUpPassword}
                                            onChange={(e) => setStepUpPassword(e.target.value)}
                                            disabled={stepUpBusy}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    {stepUpError && (
                                        <div className="text-xs text-[var(--color-danger)]">{stepUpError}</div>
                                    )}
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            className="h-10 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs text-[var(--color-text-primary)]"
                                            onClick={() => setStepUpModalOpen(false)}
                                            disabled={stepUpBusy}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="h-10 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white"
                                            disabled={stepUpBusy}
                                        >
                                            {stepUpBusy ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {editRoleOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[620px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-lg font-semibold">Edit Role</div>
                                        <div className="text-xs text-[var(--color-text-secondary)]/75">Update permissions for this role.</div>
                                    </div>
                                    <button
                                        className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs"
                                        type="button"
                                        onClick={() => {
                                            setEditRoleOpen(false)
                                            setEditRoleId(null)
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                                <div className="mt-5 space-y-4">
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Role</div>
                                        <input
                                            className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                            value={editRoleName}
                                            onChange={(e) => setEditRoleName(e.target.value)}
                                            disabled
                                        />
                                    </div>
                                    {editRoleLocked && (
                                        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-secondary)]/80">
                                            SYSTEM and SUPER_ADMIN roles are locked and cannot be changed.
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Permissions</div>
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <ClearableInput
                                                className="min-w-[220px]"
                                                inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                                placeholder="Search permissions"
                                                value={editPermissionSearch}
                                                onChange={(e) => setEditPermissionSearch(e.target.value)}
                                            />
                                            <div className="text-xs text-[var(--color-text-secondary)]/70">
                                                Selected: {cleanedEditPermissions.length}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 max-h-72 overflow-y-auto overflow-x-hidden theme-scrollbar">
                                            {filteredEditPermissions.length === 0 ? (
                                                <div className="text-xs text-[var(--color-text-secondary)]/70">No permissions found.</div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {filteredEditPermissions.map((perm) => (
                                                        <label key={perm} className="flex items-start gap-2 rounded-lg border border-[var(--color-border-soft)] bg-white/[0.03] px-2 py-2 text-xs text-[var(--color-text-primary)] hover:bg-white/[0.06] min-w-0">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 accent-[var(--color-accent)]"
                                                                checked={normalizedEditPermissions.has(perm.trim().toLowerCase())}
                                                                onChange={() => toggleEditRolePermission(perm)}
                                                                disabled={editRoleLocked}
                                                            />
                                                            <span className="break-words whitespace-normal leading-5">{perm}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {roleError && (
                                            <div className="mt-2 text-xs text-[var(--color-danger)]">{roleError}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => {
                                            setEditRoleOpen(false)
                                            setEditRoleId(null)
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={`h-9 px-4 rounded-xl text-white font-semibold transition ${canUpdateRole ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]' : 'bg-white/10 cursor-not-allowed'}`}
                                        type="button"
                                        onClick={async () => {
                                            if (!canUpdateRole || !editRoleId) return
                                            const permissionIds = resolvePermissionIds(cleanedEditPermissions)
                                            if (permissionIds.length !== cleanedEditPermissions.length) {
                                                setRoleError('Some permissions could not be resolved. Reload permissions.')
                                                return
                                            }
                                            try {
                                                setRoleError('')
                                                await updateAdminRolePermissions(editRoleId, { permissionIds })
                                                setEditRoleOpen(false)
                                                setEditRoleId(null)
                                                await loadRoles()
                                            } catch (err) {
                                                setRoleError(err?.data?.message || err?.message || 'Unable to update role.')
                                            }
                                        }}
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {whResendTarget && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[480px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="text-lg font-semibold">Resend Webhook</div>
                                <div className="mt-2 text-xs text-[var(--color-text-secondary)]/80">
                                    Event ID: {whResendTarget.eventId}
                                </div>
                                <label className="mt-4 flex items-center gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-[var(--color-accent)]"
                                        checked={whResetAttempts}
                                        onChange={(e) => setWhResetAttempts(e.target.checked)}
                                    />
                                    Reset attempts before resend
                                </label>
                                <div className="mt-6 flex justify-end gap-2 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => {
                                            setWhResendTarget(null)
                                            setWhResetAttempts(true)
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-white font-semibold"
                                        type="button"
                                        onClick={handleWebhookResend}
                                    >
                                        Resend
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {whDetail && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[560px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-lg font-semibold">Webhook Details</div>
                                        <div className="text-xs text-[var(--color-text-secondary)]/80">Event ID: {whDetail.eventId}</div>
                                    </div>
                                    <button
                                        className="h-8 px-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs"
                                        type="button"
                                        onClick={() => setWhDetail(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-3 text-xs">
                                    <div><span className="text-[var(--color-text-secondary)]/70">Status:</span> {whDetail.status}</div>
                                    <div><span className="text-[var(--color-text-secondary)]/70">Attempts:</span> {whDetail.attempts}/{whDetail.maxAttempts}</div>
                                    <div><span className="text-[var(--color-text-secondary)]/70">Next Retry:</span> {whDetail.nextRetryAt}</div>
                                    <div><span className="text-[var(--color-text-secondary)]/70">Last Error:</span> {whDetail.lastError}</div>
                                    <div><span className="text-[var(--color-text-secondary)]/70">Callback URL:</span> {whDetail.callbackUrl}</div>
                                    <div><span className="text-[var(--color-text-secondary)]/70">Created:</span> {whDetail.createdAt}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {riskOverrideTarget && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[460px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="text-lg font-semibold">Override Risk Level</div>
                                <div className="mt-2 text-xs text-[var(--color-text-secondary)]/80">
                                    Merchant: {riskOverrideTarget.merchantName} (ID {riskOverrideTarget.merchantId})
                                </div>
                                <div className="mt-4">
                                    <select
                                        className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none"
                                        value={riskOverrideLevel}
                                        onChange={(e) => setRiskOverrideLevel(e.target.value)}
                                    >
                                        <option value="" className="bg-[var(--color-bg-primary)]">Clear override</option>
                                        {['LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
                                            <option key={lvl} value={lvl} className="bg-[var(--color-bg-primary)]">{lvl}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-6 flex justify-end gap-2 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => setRiskOverrideTarget(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-white font-semibold"
                                        type="button"
                                        onClick={() => handleRiskOverride(riskOverrideTarget.merchantId, riskOverrideLevel || null)}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {reserveOverrideTarget && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[460px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="text-lg font-semibold">Override Reserve %</div>
                                <div className="mt-2 text-xs text-[var(--color-text-secondary)]/80">
                                    Merchant: {reserveOverrideTarget.merchantName} (ID {reserveOverrideTarget.merchantId})
                                </div>
                                <div className="mt-4">
                                    <input
                                        className="h-10 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text-primary)] outline-none"
                                        placeholder="Percent (e.g. 15)"
                                        value={reserveOverridePercent}
                                        onChange={(e) => setReserveOverridePercent(e.target.value)}
                                    />
                                </div>
                                <div className="mt-2 text-xs text-[var(--color-text-secondary)]/70">Leave empty to clear override.</div>
                                <div className="mt-6 flex justify-end gap-2 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => setReserveOverrideTarget(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-white font-semibold"
                                        type="button"
                                        onClick={() => handleReserveOverride(reserveOverrideTarget.merchantId, reserveOverridePercent ? Number(reserveOverridePercent) : null)}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {freezeTarget && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                            <div className="w-full max-w-[480px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
                                <div className="text-lg font-semibold">{freezeTarget.payoutFreeze ? 'Unfreeze Payout' : 'Freeze Payout'}</div>
                                <div className="mt-2 text-xs text-[var(--color-text-secondary)]/80">
                                    Merchant: {freezeTarget.merchantName} (ID {freezeTarget.merchantId})
                                </div>
                                {!freezeTarget.payoutFreeze && (
                                    <div className="mt-4">
                                        <div className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]/70 mb-2">Reason</div>
                                        <textarea
                                            className="w-full min-h-[100px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-primary)] outline-none"
                                            value={freezeReason}
                                            onChange={(e) => setFreezeReason(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="mt-6 flex justify-end gap-2 text-sm">
                                    <button
                                        className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                        type="button"
                                        onClick={() => setFreezeTarget(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={`h-9 px-4 rounded-xl text-white font-semibold ${freezeTarget.payoutFreeze ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]' : 'bg-red-500/60 hover:bg-red-500/70'}`}
                                        type="button"
                                        onClick={() => handleFreezeToggle(freezeTarget.merchantId, !freezeTarget.payoutFreeze)}
                                    >
                                        {freezeTarget.payoutFreeze ? 'Unfreeze' : 'Freeze'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    </div>
                </main>
            </div>
        </div>
        </div>
    )
}

function SettlementActionMenu({ menu, onDashboard, onToggle, busy }) {
    if (!menu) return null
    return (
        <div
            className="fixed z-50 w-[180px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-bg-primary)] shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden"
            style={{ top: menu.top, left: menu.left }}
        >
            <button
                className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition"
                type="button"
                onClick={() => onDashboard(menu.merchantId)}
            >
                Dashboard
            </button>
            <button
                className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition"
                type="button"
                onClick={() => onToggle(menu.merchantId, !menu.autoSettlementPaused)}
                disabled={busy}
            >
                {menu.autoSettlementPaused ? 'Activate' : 'Pause'}
            </button>
        </div>
    )
}

export default SuperAdminPortal


