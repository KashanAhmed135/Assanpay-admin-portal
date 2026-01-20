import { Card, Pill } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'

export function DashboardKpis() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
      <Card
        title="Payments (Today)"
        right={<StatusBadge status="ACTIVE" />}
      >
        <div className="text-2xl font-semibold">Rs 1,245,900</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill>Count: 1,284</Pill>
          <Pill tone="good">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(47,208,122,0.95)]" />
            +8.4%
          </Pill>
        </div>
      </Card>

      <Card
        title="Refunds (Today)"
        right={<StatusBadge status="REVIEW" />}
      >
        <div className="text-2xl font-semibold">Rs 34,200</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill>Count: 12</Pill>
          <Pill tone="warn">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,204,102,0.95)]" />
            +1.1%
          </Pill>
        </div>
      </Card>

      <Card
        title="Pending Settlements"
        right={<StatusBadge status="PENDING" />}
      >
        <div className="text-2xl font-semibold">Rs 412,800</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill>Merchants: 9</Pill>
          <Pill tone="warn">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,204,102,0.95)]" />
            Due
          </Pill>
        </div>
      </Card>

      <Card
        title="Blocked Merchants"
        right={<StatusBadge status="RISK" />}
      >
        <div className="text-2xl font-semibold">3</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill>Total: 128</Pill>
          <Pill tone="bad">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,90,122,0.95)]" />
            High Risk
          </Pill>
        </div>
      </Card>
    </div>
  )
}

export function DashboardInsights() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 w-full">
      <div className="xl:col-span-8">
        <Card title="Payment Volume Trend" right={<Pill>Last 30 days</Pill>}>
          <div className="h-[220px] sm:h-[280px] rounded-xl border border-white/10 bg-black/20 grid place-items-center text-[#a9b7d4]/75">
            Chart Placeholder (connect to data later)
          </div>
        </Card>
      </div>

      <div className="xl:col-span-4">
        <Card
          right={<StatusBadge status="PENDING" value="3 New" />}
        >
          <div className="overflow-x-auto">
            <table className="min-w-[320px] w-full text-sm">
              <thead>
                <tr className="text-left text-[#a9b7d4]/80">
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-[#eaf1ff]">
                <tr className="border-t border-white/10">
                  <td className="py-2 pr-3">Settlement Overdue</td>
                  <td className="py-2">
                    <StatusBadge status="PENDING" />
                  </td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-2 pr-3">High Refund Rate</td>
                  <td className="py-2">
                    <StatusBadge status="RISK" />
                  </td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-2 pr-3">Blocked Merchant</td>
                  <td className="py-2">
                    <StatusBadge status="BLOCKED" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function DashboardSection() {
  return (
    <div className="space-y-4 sm:space-y-5 w-full">
      <DashboardKpis />
      <DashboardInsights />
      <div className="pt-2 text-center text-xs text-[#a9b7d4]/70">Ac AssanPay Admin Portal UI Template (React)</div>
    </div>
  )
}
