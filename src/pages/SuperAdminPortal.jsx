import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import { Card, Pill } from '../components/ui/Card'
import { MerchantsFilters, MerchantsTable, ActionMenu } from '../components/superadmin/SuperAdminMerchants'
import { DashboardSection } from '../components/superadmin/SuperAdminDashboard'
import { CreateMerchantForm } from '../components/superadmin/SuperAdminCreateMerchantForm'
import { Sidebar } from '../components/ui/Sidebar'
import { Topbar } from '../components/ui/Topbar'
import { useHashRoute } from '../hooks/useHashRoute'
import { usePhoneInput } from '../hooks/usePhoneInput'
import { useMerchantStorage } from '../hooks/useMerchantStorage'
import { getPageMeta, SUPER_ADMIN_NAVIGATION, PLACEHOLDER_PAGES, VIEW_KEY } from '../config/superAdminConfig'
import { getFilteredPhoneCountries } from '../utils/phoneCountryUtils'
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
    const [page, setPage] = useHashRoute('page-dashboard')

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [editingMerchantId, setEditingMerchantId] = useState(null)
    const [actionMenu, setActionMenu] = useState(null)

    // Filter State
    const [filterBusiness, setFilterBusiness] = useState('')
    const [filterLegal, setFilterLegal] = useState('')
    const [filterMerchantId, setFilterMerchantId] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    // Merchant Storage
    const { merchants, saveMerchant, updateMerchantStatus } = useMerchantStorage()

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

    const activeMenu = page === 'page-create-merchant' ? 'page-merchants' : page

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
                brand={{ name: 'AssanPay Admin', sub: 'Super Admin Portal (MVP)' }}
                onLogout={handleLogout}
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
                    actions={
                        <>
                            <button
                                className="h-9 px-3 sm:px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs sm:text-sm text-[#eaf1ff]"
                                type="button"
                                onClick={() => alert('Export (UI demo).')}
                            >
                                Export
                            </button>
                            <button
                                className="h-9 px-3 sm:px-4 rounded-xl border border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.18)] hover:bg-[rgba(90,167,255,0.25)] transition text-xs sm:text-[13px] font-bold text-[#eaf1ff]"
                                type="button"
                                onClick={() => goTo('page-create-merchant')}
                            >
                                <span className="hidden sm:inline">+ </span>Create Merchant
                            </button>
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

                    {/* Placeholder Pages */}
                    {PLACEHOLDER_PAGES.includes(page) && (
                        <div className="w-full">
                            <Card title={getPageMeta(page).title} right={<Pill>Coming soon</Pill>}>
                                <div className="text-sm text-[#a9b7d4]/80">Build later</div>
                            </Card>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default SuperAdminPortal
