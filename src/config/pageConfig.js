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
    'reports': {
        title: 'Reports',
        crumbs: 'Merchant / Finance / Reports',
        btnText: 'Dashboard',
        btnHref: '#dashboard',
    },
    'users-roles': {
        title: 'Users & Roles',
        crumbs: 'Merchant / Settings / Users & Roles',
        btnText: '+ Add User',
        btnHref: '#users-roles',
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
