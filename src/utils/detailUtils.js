import { fmtPKR } from '../utils/helpers'

export function getDetailContent(detailState) {
    const r = detailState.record
    const type = detailState.type

    if (!r) {
        return {
            title: 'Detail',
            sub: 'No record selected',
            primaryText: 'Primary Action',
            overviewPairs: [],
            timelineItems: [],
        }
    }

    switch (type) {
        case 'collection':
            return {
                title: `Collection: ${r.orderId}`,
                sub: `${r.date} • ${r.shop} • ${r.providerRef}`,
                primaryText: 'Download Receipt',
                overviewPairs: [
                    ['Order ID', r.orderId],
                    ['Date', r.date],
                    ['Time', r.time],
                    ['Shop', r.shop],
                    ['Amount', fmtPKR(r.amount)],
                    ['Status', r.status],
                    ['Provider Ref', r.providerRef],
                ],
                timelineItems: [
                    {
                        time: `${r.date} ${r.time}`,
                        event: 'Created',
                        actor: 'System',
                        remark: 'Transaction created',
                    },
                    {
                        time: `${r.date} ${r.time}`,
                        event: 'Gateway',
                        actor: 'Provider',
                        remark: `Status: ${r.status}`,
                    },
                ],
            }

        case 'refund':
            return {
                title: `Refund: ${r.refundId}`,
                sub: `${r.date} • ${r.shop} • Order ${r.orderId}`,
                primaryText: 'Approve Refund',
                overviewPairs: [
                    ['Refund ID', r.refundId],
                    ['Order ID', r.orderId],
                    ['Date', r.date],
                    ['Shop', r.shop],
                    ['Amount', fmtPKR(r.amount)],
                    ['Reason', r.reason],
                    ['Status', r.status],
                ],
                timelineItems: [
                    {
                        time: r.date,
                        event: 'Requested',
                        actor: 'Shop Operator',
                        remark: r.reason,
                    },
                    {
                        time: r.date,
                        event: 'Reviewed',
                        actor: 'Merchant Admin',
                        remark: `Status: ${r.status}`,
                    },
                ],
            }

        case 'settlement':
            return {
                title: `Settlement: ${r.settlementId}`,
                sub: `${r.from} → ${r.to} • Status ${r.status}`,
                primaryText: 'Download Statement',
                overviewPairs: [
                    ['Settlement ID', r.settlementId],
                    ['Period', `${r.from} – ${r.to}`],
                    ['Gross', fmtPKR(r.total ?? r.grossAmount ?? 0)],
                    ['Fees', fmtPKR(r.fees ?? r.commissionAmount ?? 0)],
                    ['Net', fmtPKR(r.net ?? r.netAmount ?? 0)],
                    ['Settled', fmtPKR(r.settledAmount ?? 0)],
                    ['Adjustments', fmtPKR(r.adjustmentsApplied ?? 0)],
                    ['Payout', fmtPKR(r.payoutAmount ?? 0)],
                    ['Ending Balance', fmtPKR(r.endingBalance ?? 0)],
                    ['Status', r.status],
                ],
                timelineItems: [
                    {
                        time: r.to,
                        event: 'Calculated',
                        actor: 'System',
                        remark: 'Fees applied and net computed',
                    },
                    {
                        time: r.to,
                        event: 'Status',
                        actor: 'Finance',
                        remark: `Status: ${r.status}`,
                    },
                ],
            }

        case 'sub':
            const userInfo = r.userEmail
                ? [
                      ['User Email', r.userEmail],
                      ['User Username', r.userUsername || '-'],
                      ['User Name', r.userName || '-'],
                  ]
                : [['User', 'Not linked']]
            return {
                title: `Sub-Merchant: ${r.code}`,
                sub: `${r.name} • Status ${r.status}`,
                primaryText: 'Open Collections',
                overviewPairs: [
                    ['Branch Code', r.code],
                    ['Branch Name', r.name],
                    ['Status', r.status],
                    ['Collections (30d)', fmtPKR(r.vol30)],
                    ['Success Rate', `${r.success}%`],
                    ...userInfo,
                ],
                timelineItems: [
                    {
                        time: '2026-01-01',
                        event: 'Created',
                        actor: 'Merchant Admin',
                        remark: 'Sub-merchant created',
                    },
                    {
                        time: '2026-01-09',
                        event: 'Performance',
                        actor: 'System',
                        remark: `Success Rate: ${r.success}%`,
                    },
                ],
            }

        case 'report':
            return {
                title: `Report: ${r.name}`,
                sub: `${r.range} • Created ${r.created}`,
                primaryText: 'Download CSV',
                overviewPairs: [
                    ['Report', r.name],
                    ['Range', r.range],
                    ['Created', r.created],
                    ['Status', r.status],
                ],
                timelineItems: [
                    {
                        time: r.created,
                        event: 'Generated',
                        actor: 'Merchant Admin',
                        remark: 'Report ready',
                    },
                ],
            }

        case 'user':
            return {
                title: `User: ${r.username}`,
                sub: `${r.role} • Status ${r.status}`,
                primaryText: 'Reset Password',
                overviewPairs: [
                    ['Name', r.name],
                    ['Username', r.username],
                    ['Role', r.role],
                    ['Status', r.status],
                ],
                timelineItems: [
                    {
                        time: '2025-12-20',
                        event: 'Created',
                        actor: 'Merchant Admin',
                        remark: 'User created',
                    },
                    {
                        time: '2026-01-09',
                        event: 'Login',
                        actor: r.username,
                        remark: 'Last login activity (demo)',
                    },
                ],
            }

        default:
            return {
                title: 'Detail',
                sub: 'Unknown type',
                primaryText: 'Action',
                overviewPairs: [],
                timelineItems: [],
            }
    }
}







