export const PAGE_CONFIG = {
    'dashboard': {
        title: 'Dashboard',
        crumbs: 'Merchant / Overview',
        btnText: 'Create Sub-Merchant',
        btnHref: '#create-sub-merchant',
    },
    'sub-merchants': {
        title: 'Sub-Merchants',
        crumbs: 'Merchant / Operations / Sub-Merchants',
        btnText: '+ Create Sub-Merchant',
        btnHref: '#create-sub-merchant',
    },
    'create-sub-merchant': {
        title: 'Create Sub-Merchant',
        crumbs: 'Merchant / Operations / Sub-Merchant / Create',
        btnText: 'Back to List',
        btnHref: '#sub-merchants',
    },
    'collections': {
        title: 'Collections',
        crumbs: 'Merchant / Operations / Collections',
        btnText: 'Reports',
        btnHref: '#reports',
    },
    'refunds': {
        title: 'Refunds',
        crumbs: 'Merchant / Operations / Refunds',
        btnText: 'Reports',
        btnHref: '#reports',
    },
    'settlements': {
        title: 'Settlements',
        crumbs: 'Merchant / Finance / Settlements',
        btnText: 'Reports',
        btnHref: '#reports',
    },
    'balance': {
        title: 'Balance',
        crumbs: 'Merchant / Finance / Balance',
        btnText: 'Settlements',
        btnHref: '#settlements',
    },
    'reports': {
        title: 'Reports',
        crumbs: 'Merchant / Finance / Reports',
        btnText: 'Dashboard',
        btnHref: '#dashboard',
    },
    'users-roles': {
        title: 'Users & Roles',
        crumbs: 'Merchant / Settings / Users & Roles',
    },
    'api-keys': {
        title: 'API Keys',
        crumbs: 'Merchant / Settings / API Keys',
        btnText: 'Users & Roles',
        btnHref: '#users-roles',
    },
    'security': {
        title: 'Change Password',
        crumbs: 'Merchant / Settings / Change Password',
        btnText: 'API Keys',
        btnHref: '#api-keys',
    },
}

export function getPageMeta(hash, backHash = 'dashboard') {
    if (hash === 'detail') {
        return {
            title: 'Detail',
            crumbs: 'Merchant / Detail',
            btnText: 'Back',
            btnHref: backHash.startsWith('#') ? backHash : `#${backHash}`,
        }
    }
    return PAGE_CONFIG[hash] || PAGE_CONFIG['dashboard']
}
