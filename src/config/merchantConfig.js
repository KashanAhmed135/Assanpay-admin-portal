import {
    BarChart3,
    Building2,
    CreditCard,
    Home,
    KeyRound,
    Receipt,
    RefreshCcw,
    Users,
    Shield
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
            { key: 'balance', label: 'Balance', icon: Receipt },
            { key: 'settlements', label: 'Settlements', icon: Receipt },
            { key: 'reports', label: 'Reports', icon: BarChart3 },
        ],
    },
    {
        section: 'Settings',
        items: [
            { key: 'users-roles', label: 'Users & Roles', icon: Users },
            { key: 'api-keys', label: 'API Keys', icon: KeyRound },
            { key: 'security', label: 'Change Password', icon: Shield },
        ],
    },
]
