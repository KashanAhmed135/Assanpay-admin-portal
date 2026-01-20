import {
    BarChart3,
    Building2,
    CreditCard,
    Home,
    Receipt,
    RefreshCcw,
    Users
} from 'lucide-react'

export const MERCHANT_NAVIGATION = [
    {
        section: 'Overview',
        items: [{ key: 'dashboard', label: 'Dashboard', icon: Home }],
    },
    {
        section: 'Operations',
        items: [
            { key: 'sub-merchants', label: 'Sub-Merchants', icon: Building2 },
            { key: 'collections', label: 'Collections', icon: CreditCard },
            { key: 'refunds', label: 'Refunds', icon: RefreshCcw },
        ],
    },
    {
        section: 'Finance',
        items: [
            { key: 'settlements', label: 'Settlements', icon: Receipt },
            { key: 'reports', label: 'Reports', icon: BarChart3 },
        ],
    },
    {
        section: 'Settings',
        items: [
            { key: 'users-roles', label: 'Users & Roles', icon: Users },
        ],
    },
]
