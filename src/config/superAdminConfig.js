import {
    Building2,
    ClipboardList,
    CreditCard,
    HelpCircle,
    KeyRound,
    LayoutDashboard,
    Receipt,
    RefreshCcw,
    Settings2,
    Store,
    Users,
} from 'lucide-react'

export const PAGE_META = {
    'page-dashboard': { title: 'Dashboard', crumbs: 'Super Admin / Overview' },
    'page-merchants': { title: 'Merchants', crumbs: 'Super Admin / Operations / Merchants' },
    'page-create-merchant': { title: 'Create Merchant', crumbs: 'Super Admin / Operations / Merchants / Create' },
    'page-submerchants': { title: 'Sub-Merchants', crumbs: 'Super Admin / Operations / Sub-Merchants' },
    'page-payments': { title: 'Payments', crumbs: 'Super Admin / Operations / Payments' },
    'page-settlements': { title: 'Settlements', crumbs: 'Super Admin / Operations / Settlements' },
    'page-refunds': { title: 'Refunds', crumbs: 'Super Admin / Operations / Refunds' },
    'page-payment-methods': { title: 'Payment Methods', crumbs: 'Super Admin / Controls / Payment Methods' },
    'page-limits': { title: 'Limits', crumbs: 'Super Admin / Controls / Limits' },
    'page-users': { title: 'Users', crumbs: 'Super Admin / Security / Users' },
    'page-rbac': { title: 'Roles & Permissions', crumbs: 'Super Admin / Security / RBAC' },
    'page-inquiries': { title: 'Inquiries', crumbs: 'Super Admin / Support / Inquiries' },
    'page-audit-logs': { title: 'Audit Logs', crumbs: 'Super Admin / Compliance / Audit Logs' },
}

export const SUPER_ADMIN_NAVIGATION = [
    {
        section: 'Overview',
        items: [{ key: 'page-dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
        section: 'Operations',
        items: [
            { key: 'page-merchants', label: 'Merchants', icon: Store },
            { key: 'page-submerchants', label: 'Sub-Merchants', icon: Building2 },
            { key: 'page-payments', label: 'Payments', icon: CreditCard },
            { key: 'page-settlements', label: 'Settlements', icon: Receipt },
            { key: 'page-refunds', label: 'Refunds', icon: RefreshCcw },
        ],
    },
    {
        section: 'Controls',
        items: [
            { key: 'page-payment-methods', label: 'Payment Methods', icon: Settings2 },
            { key: 'page-limits', label: 'Limits', icon: Settings2 },
        ],
    },
    {
        section: 'Security & Support',
        items: [
            { key: 'page-users', label: 'Users', icon: Users },
            { key: 'page-rbac', label: 'Roles & Permissions', icon: KeyRound },
            { key: 'page-inquiries', label: 'Inquiries', icon: HelpCircle },
            { key: 'page-audit-logs', label: 'Audit Logs', icon: ClipboardList },
        ],
    },
]

export const STORAGE_KEY = 'assanpay-merchants'
export const VIEW_KEY = 'assanpay-selected-merchant'

export const PLACEHOLDER_PAGES = [
    'page-submerchants',
    'page-payments',
    'page-settlements',
    'page-refunds',
    'page-payment-methods',
    'page-limits',
    'page-users',
    'page-rbac',
    'page-inquiries',
    'page-audit-logs',
]

export function getPageMeta(page) {
    return PAGE_META[page] || PAGE_META['page-dashboard']
}
