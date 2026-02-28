import {
    Building2,
    ClipboardList,
    CreditCard,
    FileText,
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
    'page-reports': { title: 'Reports', crumbs: 'Super Admin / Operations / Reports' },
    'page-settlements': { title: 'Settlements', crumbs: 'Super Admin / Operations / Settlements' },
    'page-refunds': { title: 'Refunds', crumbs: 'Super Admin / Operations / Refunds' },
    'page-webhooks': { title: 'Webhooks', crumbs: 'Super Admin / Operations / Webhooks' },
    'page-risk': { title: 'Risk Dashboard', crumbs: 'Super Admin / Compliance / Risk' },
    'page-payment-methods': { title: 'Payment Methods', crumbs: 'Super Admin / Controls / Payment Methods' },
    'page-limits': { title: 'Limits', crumbs: 'Super Admin / Controls / Limits' },
    'page-users': { title: 'Users', crumbs: 'Super Admin / Security / Users' },
    'page-rbac': { title: 'Roles & Permissions', crumbs: 'Super Admin / Security / RBAC' },
    'page-inquiries': { title: 'Inquiries', crumbs: 'Super Admin / Support / Inquiries' },
    'page-audit-logs': { title: 'Audit Logs', crumbs: 'Super Admin / Compliance / Audit Logs' },
    'page-settings': { title: 'Settings', crumbs: 'Super Admin / Settings' },
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
            { key: 'page-reports', label: 'Reports', icon: FileText },
            { key: 'page-settlements', label: 'Settlements', icon: Receipt },
            { key: 'page-refunds', label: 'Refunds', icon: RefreshCcw },
            { key: 'page-webhooks', label: 'Webhooks', icon: FileText },
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
            { key: 'page-risk', label: 'Risk Dashboard', icon: ClipboardList },
        ],
    },
]

export const STORAGE_KEY = 'assanpay-merchants'
export const VIEW_KEY = 'assanpay-selected-merchant'

export const PLACEHOLDER_PAGES = []

export const PAGE_QUICK_TIPS = {
    'page-dashboard': [
        'Use the date range to compare totals across periods.',
        'Filter by merchant ID or email to isolate specific performance.',
        'Watch unsettled payments and refund counts for risk signals.',
    ],
    'page-merchants': [
        'Use status filters to find active, blocked, or pending merchants.',
        'Open Actions for quick manage, edit, or block operations.',
        'Use search to locate a merchant by ID or email.',
    ],
    'page-create-merchant': [
        'Choose only the payment methods you want enabled for this merchant.',
        'Set limits carefully; use -1 for unlimited where allowed.',
        'Pick a role or enable restricted role to control permissions.',
    ],
    'page-submerchants': [
        'Use search to find sub-merchants by parent merchant or ID.',
        'Actions include edit, block, and user management.',
        'Keep sub-merchant permissions minimal and scoped.',
    ],
    'page-payments': [
        'Filter by date, status, and merchant for faster triage.',
        'Use Order ID or Provider Ref to find a specific payment.',
        'Export only the filtered range you need.',
    ],
    'page-reports': [
        'Generate reports for a specific date range before exporting.',
        'Use merchant and status filters to narrow the dataset.',
        'Reports export the current view to CSV.',
    ],
    'page-settlements': [
        'Check due amount and status before running settlement.',
        'Filter by merchant to review settlement history.',
        'Use API/Manual actions based on approval flow.',
    ],
    'page-refunds': [
        'Review pending refunds before approve/reject.',
        'Filter by status to track backlog or completed items.',
        'Use Order ID to validate refund requests quickly.',
    ],
    'page-webhooks': [
        'Monitor webhook delivery attempts and retry failures when needed.',
        'Use date filters to isolate incidents during a window.',
        'Resend only after confirming merchant endpoint health.',
    ],
    'page-payment-methods': [
        'Enable only the methods you support for compliance.',
        'Set a clear display name for each method.',
        'Deactivate unused methods instead of deleting.',
    ],
    'page-limits': [
        'Set limits per merchant role to control exposure.',
        'Use -1 for unlimited where applicable.',
        'Filter by active/inactive to audit policy changes.',
    ],
    'page-users': [
        'Assign least-privilege roles to reduce risk.',
        'Use search to find users by email or role.',
        'Reset passwords only after verification.',
    ],
    'page-rbac': [
        'Create roles aligned to job functions, not individuals.',
        'Review permissions before assigning to users.',
        'Avoid giving admin permissions to support roles.',
    ],
    'page-inquiries': [
        'Respond to oldest tickets first for SLA.',
        'Add internal notes for audit trail.',
        'Escalate suspicious requests to compliance.',
    ],
    'page-audit-logs': [
        'Filter by user or action to trace critical events.',
        'Export logs only when required.',
        'Review unusual permission changes weekly.',
    ],
    'page-risk': [
        'Override risk levels only after documented review.',
        'Use payout freeze for high-risk incidents.',
        'Reserve changes impact payouts, not payments.',
    ],
    'page-settings': [
        'Keep system settings aligned with production policy.',
        'Review integrations after any key rotation.',
        'Document changes for audit purposes.',
    ],
}

export function getPageMeta(page) {
    return PAGE_META[page] || PAGE_META['page-dashboard']
}
