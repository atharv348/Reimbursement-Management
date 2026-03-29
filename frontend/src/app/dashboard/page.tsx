"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, CheckCircle, Clock, XCircle, TrendingUp, ArrowRight } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalAmount: 0,
    currency: "INR"
  })
  const [recentExpenses, setRecentExpenses] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/expenses/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const expenses = res.data
        const approved = expenses.filter((e: any) => e.status === "approved")
        const pending = expenses.filter((e: any) => e.status === "pending")
        const rejected = expenses.filter((e: any) => e.status === "rejected")
        const totalAmount = approved.reduce((acc: number, e: any) => acc + e.base_amount, 0)

        setStats({
          total: expenses.length,
          approved: approved.length,
          pending: pending.length,
          rejected: rejected.length,
          totalAmount: totalAmount,
          currency: expenses[0]?.currency || "INR"
        })
        setRecentExpenses(expenses.slice(0, 5))
      } catch (err: any) {
        console.error("Failed to fetch dashboard stats", err)
        if (err.response?.status === 401) {
          localStorage.removeItem("token")
          window.location.href = "/"
        }
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Submitted", value: `₹${stats.totalAmount.toLocaleString()}`, sub: `${stats.total} expenses`, icon: <Receipt className="text-white opacity-20" size={40} />, color: "from-[#4f46e5] to-[#7c3aed]" },
    { label: "Approved", value: stats.approved, sub: "Successfully reimbursed", icon: <CheckCircle className="text-white opacity-20" size={40} />, color: "from-[#059669] to-[#34d399]" },
    { label: "Pending", value: stats.pending, sub: "Waiting for review", icon: <Clock className="text-white opacity-20" size={40} />, color: "from-[#d97706] to-[#fbbf24]" },
    { label: "Rejected", value: stats.rejected, sub: "Policy violations", icon: <XCircle className="text-white opacity-20" size={40} />, color: "from-[#dc2626] to-[#f87171]" },
  ]

  return (
    <div className="space-y-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Card key={i} className="relative overflow-hidden border-none shadow-lg rounded-2xl group hover:scale-[1.02] transition-all duration-300">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">{card.label}</CardTitle>
              <div className="absolute right-4 top-4">{card.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[#0d0a2e] font-syne">{card.value}</div>
              <p className="text-[13px] text-[#6b7280] mt-1 font-medium">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Expenses */}
        <Card className="lg:col-span-2 border-[#e0dcff] shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-[#f4f2ff] pb-4 px-6 pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#0d0a2e] font-syne flex items-center gap-2">
                <span className="p-1.5 bg-[#eef2ff] rounded-lg text-[#4f46e5]">📊</span> Recent Expenses
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[#4f46e5] font-bold hover:bg-[#eef2ff] gap-1"
                onClick={() => router.push("/dashboard/expenses")}
              >
                View All <ArrowRight size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#fafafe] text-left text-[11px] font-bold text-[#6b7280] uppercase tracking-widest border-b border-[#f4f2ff]">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f2ff]">
                  {recentExpenses.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-[#6b7280] font-medium">No recent expenses found</td></tr>
                  ) : (
                    recentExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#fafafe] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#4f46e5] text-xs">{exp.employee?.full_name}</div>
                          <div className="text-[10px] text-[#6b7280] truncate w-24">{exp.employee?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#0d0a2e] text-sm">{exp.description}</div>
                          <div className="text-[11px] text-[#6b7280] mt-0.5">{new Date(exp.date).toLocaleDateString()} · {exp.category}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#0d0a2e] font-syne">₹{exp.amount.toLocaleString()}</div>
                          <div className="text-[10px] text-[#6b7280] font-medium uppercase tracking-tighter">({exp.currency})</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            exp.status === 'approved' ? 'bg-[#d1fae5] text-[#065f46]' :
                            exp.status === 'rejected' ? 'bg-[#fee2e2] text-[#991b1b]' :
                            'bg-[#fef3c7] text-[#92400e]'
                          }`}>
                            {exp.status === 'approved' ? '✓ Approved' : exp.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-[#e0dcff] shadow-sm rounded-2xl bg-white h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-[#0d0a2e] font-syne flex items-center gap-2">
              <span className="p-1.5 bg-[#fef3c7] rounded-lg text-[#d97706]">⚡</span> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#6b7280] leading-relaxed font-medium">
              Submit a new expense claim and our AI will automatically scan your receipt for instant processing.
            </p>
            <Button 
              className="w-full h-12 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 transition-all"
              onClick={() => router.push("/dashboard/expenses")}
            >
              New Expense Claim ➕
            </Button>
            <div className="mt-6 p-4 bg-[#eef2ff] rounded-xl border border-[#e0dcff]">
              <div className="font-bold text-[#4f46e5] text-xs uppercase tracking-widest mb-2">Did you know?</div>
              <p className="text-[12px] text-[#4f46e5] font-medium leading-relaxed">
                Expenses under ₹500 with a valid receipt are auto-approved by the smart policy engine.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
