"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, MessageSquare, FileText, History, Receipt, Download } from "lucide-react"
import axios from "axios"

interface ApprovalsPanelProps {
  title: string;
  description: string;
  roleType?: 'manager' | 'finance' | 'director';
}

export default function ApprovalsPanel({ title, description, roleType }: ApprovalsPanelProps) {
  const [approvals, setApprovals] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<{ [key: string]: string }>({})
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [selectedApproval, setSelectedApproval] = useState<any>(null)

  // Determine panel theme colors based on roleType
  const getPanelTheme = () => {
    switch (roleType) {
      case 'manager':
        return {
          primary: '#4f46e5',
          secondary: '#eef2ff',
          text: 'Manager Panel 👨‍💼',
          accent: 'blue'
        }
      case 'finance':
        return {
          primary: '#0891b2',
          secondary: '#ecfeff',
          text: 'Finance Panel 💳',
          accent: 'cyan'
        }
      case 'director':
        return {
          primary: '#7c3aed',
          secondary: '#f5f3ff',
          text: 'Director Panel 🛡️',
          accent: 'violet'
        }
      default:
        return {
          primary: '#4f46e5',
          secondary: '#f4f2ff',
          text: title,
          accent: 'indigo'
        }
    }
  }

  const theme = getPanelTheme()

  useEffect(() => {
    fetchApprovals()
    fetchHistory()
  }, [roleType])

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        window.location.href = "/"
        return
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await axios.get(`${baseUrl}/api/approvals/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      let data = res.data
      if (roleType) {
        const orderMap = { manager: 1, finance: 2, director: 3 }
        data = data.filter((ap: any) => ap.sequence_order === orderMap[roleType])
      }
      setApprovals(data)
    } catch (err: any) {
      console.error("Failed to fetch approvals:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await axios.get(`${baseUrl}/api/approvals/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      let data = res.data
      if (roleType) {
        const orderMap = { manager: 1, finance: 2, director: 3 }
        data = data.filter((ap: any) => ap.sequence_order === orderMap[roleType])
      }
      setHistory(data)
    } catch (err: any) {
      console.error("Failed to fetch history:", err)
    }
  }

  const handleAction = async (approvalId: number, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        window.location.href = "/"
        return
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await axios.post(`${baseUrl}/api/approvals/${approvalId}/${action}`, 
        { comments: comments[approvalId] || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log(`${action} response:`, res.data)
      alert(`Expense ${action}d successfully!`)
      setSelectedApproval(null)
      fetchApprovals()
      fetchHistory()
    } catch (err: any) {
      console.error(`Failed to ${action} expense:`, err)
      if (err.response?.status === 401) {
        alert("Your session has expired. Please login again.")
        localStorage.removeItem("token")
        window.location.href = "/"
      } else {
        const message = err.response?.data?.detail || `Failed to ${action} expense`
        alert(message)
      }
    }
  }

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("Session expired. Please log in again.")
        return
      }
      
      console.log("Starting Excel export...")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const response = await axios.get(`${baseUrl}/api/expenses/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      
      console.log("Export data received, creating download link...")
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `expenses_report_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      console.log("Download triggered successfully.")
    } catch (err: any) {
      console.error("Export failed:", err)
      
      let errorMessage = "Failed to export Excel report. Please ensure there are expenses to export."
      
      // Handle blob error responses
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string)
            alert(`Export Error: ${errorData.detail || errorMessage}`)
          } catch (e) {
            alert(`Export Error: ${errorMessage}`)
          }
        }
        reader.readAsText(err.response.data)
      } else {
        const message = err.response?.data?.detail || errorMessage
        alert(`Export Error: ${message}`)
      }
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center">
    <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2`} style={{ borderColor: theme.primary }}></div>
  </div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Approval Modal (Pop-up) */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0a2e]/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-8 flex items-center justify-between" style={{ backgroundColor: theme.secondary }}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-2xl" style={{ color: theme.primary }}>
                  {roleType === 'manager' ? '👨‍💼' : roleType === 'finance' ? '💳' : '🛡️'}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#0d0a2e] font-syne leading-tight">Review Application</h3>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">{theme.text}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedApproval(null)} 
                className="w-12 h-12 flex items-center justify-center hover:bg-white/50 rounded-full text-[#6b7280] transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100" style={{ backgroundColor: theme.primary }}>
                      {selectedApproval.expense.employee.full_name[0]}
                    </div>
                    <div>
                      <p className="font-black text-[#0d0a2e] text-xl leading-tight">{selectedApproval.expense.employee.full_name}</p>
                      <p className="text-sm text-[#6b7280] font-bold mt-1">{selectedApproval.expense.employee.email}</p>
                    </div>
                  </div>

                  <div className="bg-[#fafafe] p-6 rounded-[28px] border border-[#f4f2ff] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Receipt size={40} />
                    </div>
                    <span className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest block mb-3">Claim Details</span>
                    <p className="text-lg text-[#374151] font-bold leading-relaxed">"{selectedApproval.expense.description}"</p>
                    <div className="mt-4 flex gap-2">
                      <span className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold text-[#4f46e5] border border-[#e0dcff] uppercase tracking-wider">
                        {selectedApproval.expense.category}
                      </span>
                      <span className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold text-[#6b7280] border border-[#e0dcff] uppercase tracking-wider">
                        {new Date(selectedApproval.expense.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-[32px] border-2 border-dashed border-[#e0dcff] flex flex-col items-center justify-center gap-4 text-center">
                    <p className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest">Total Amount Requested</p>
                    <div className="space-y-1">
                      <p className="text-5xl font-black font-syne tracking-tighter" style={{ color: theme.primary }}>
                        ₹{selectedApproval.expense.amount?.toLocaleString()}
                      </p>
                      <p className="text-xs font-bold text-[#6b7280] uppercase tracking-widest">
                        {selectedApproval.expense.currency} • ₹{selectedApproval.expense.base_amount?.toLocaleString()} Base
                      </p>
                    </div>
                  </div>

                  {selectedApproval.expense.receipt_url && (
                    <Button 
                      variant="outline"
                      className="w-full h-16 rounded-[24px] border-[#e0dcff] text-[#4f46e5] font-black text-sm uppercase tracking-widest hover:bg-[#fafafe] gap-3"
                      onClick={() => window.open(selectedApproval.expense.receipt_url, '_blank')}
                    >
                      <FileText size={20} /> View Scanned Receipt ↗
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <label className="text-[11px] font-black text-[#6b7280] uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                  <MessageSquare size={14} /> Decision Commentary
                </label>
                <textarea 
                  className="w-full min-h-[120px] rounded-[28px] border-2 border-[#f4f2ff] bg-[#fafafe] px-6 py-5 text-sm font-bold focus:border-[#4f46e5] focus:ring-4 focus:ring-[#eef2ff] outline-none transition-all placeholder:text-[#9ca3af]"
                  placeholder="Provide a reason for your approval or rejection..."
                  value={comments[selectedApproval.id] || ""}
                  onChange={(e) => setComments({...comments, [selectedApproval.id]: e.target.value})}
                />
              </div>

              <div className="flex gap-6">
                {roleType ? (
                  <>
                    <Button 
                      variant="outline"
                      className="flex-1 h-20 rounded-[30px] border-2 border-[#fee2e2] text-[#dc2626] font-black text-lg hover:bg-[#fef2f2] hover:border-[#fecaca] transition-all shadow-xl shadow-red-50 gap-3"
                      onClick={() => handleAction(selectedApproval.id, 'reject')}
                    >
                      <X size={24} strokeWidth={3} /> Reject Application
                    </Button>
                    <Button 
                      className="flex-1 h-20 text-white rounded-[30px] font-black text-lg transition-all shadow-2xl gap-3"
                      style={{ backgroundColor: theme.primary, boxShadow: `0 20px 40px -10px ${theme.primary}40` }}
                      onClick={() => handleAction(selectedApproval.id, 'approve')}
                    >
                      <Check size={24} strokeWidth={3} /> Approve Application ✅
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full h-20 bg-[#0d0a2e] text-white rounded-[30px] font-black text-lg shadow-xl"
                    onClick={() => setSelectedApproval(null)}
                  >
                    Close Review 🚪
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[24px] bg-white shadow-xl flex items-center justify-center text-3xl" style={{ borderBottom: `4px solid ${theme.primary}` }}>
            {roleType === 'manager' ? '👨‍💼' : roleType === 'finance' ? '💳' : '🛡️'}
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#0d0a2e] font-syne tracking-tight">{theme.text}</h2>
            <p className="text-[#6b7280] font-bold text-sm tracking-wide opacity-80">{description}</p>
          </div>
        </div>
        <div className="flex bg-white/60 backdrop-blur-sm p-1.5 rounded-[24px] shadow-inner border border-[#e0dcff]/50">
          {!roleType && (
            <button
              onClick={handleExportExcel}
              className="px-6 py-3 rounded-[18px] text-[12px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 bg-[#059669] text-white shadow-lg hover:bg-[#047857] mr-2"
            >
              <Download size={16} /> Export Excel
            </button>
          )}
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-8 py-3 rounded-[18px] text-[12px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${
              activeTab === 'pending' ? 'bg-[#0d0a2e] text-white shadow-xl' : 'text-[#6b7280] hover:bg-white'
            }`}
          >
            Pending {approvals.length > 0 && <span className="bg-white/10 px-2.5 py-0.5 rounded-lg text-[10px]">{approvals.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-3 rounded-[18px] text-[12px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 ${
              activeTab === 'history' ? 'bg-[#0d0a2e] text-white shadow-xl' : 'text-[#6b7280] hover:bg-white'
            }`}
          >
            History {history.length > 0 && <span className="bg-[#4f46e5]/10 text-[#4f46e5] px-2.5 py-0.5 rounded-lg text-[10px]">{history.length}</span>}
          </button>
        </div>
      </div>

      <div className="grid gap-8">
        {activeTab === 'pending' ? (
          approvals.length === 0 ? (
            <Card className="text-center py-24 border-2 border-dashed border-[#e0dcff] rounded-[48px] bg-white/50 backdrop-blur-sm">
              <CardContent>
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center text-[#059669] border border-[#d1fae5]">
                    <Check size={48} strokeWidth={2.5} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-[#0d0a2e] font-syne">Maximum Productivity!</CardTitle>
                    <CardDescription className="text-[#6b7280] font-bold mt-2 text-lg">No pending expense applications require your attention.</CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            approvals.map((approval) => {
              if (!approval.expense || !approval.expense.employee) return null;
              return (
                <Card key={approval.id} className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[40px] overflow-hidden bg-white hover:shadow-[0_40px_80px_rgba(79,70,229,0.08)] transition-all duration-500 group">
                  <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-8 md:p-10">
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-lg" style={{ backgroundColor: theme.primary }}>
                            {approval.expense.employee.full_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-black text-[#0d0a2e] text-2xl leading-tight group-hover:text-[#4f46e5] transition-colors">{approval.expense.employee.full_name}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[12px] text-[#6b7280] font-bold">{approval.expense.employee.email}</p>
                              <span className="w-1 h-1 bg-[#e0dcff] rounded-full" />
                              <p className="text-[11px] text-[#4f46e5] font-black uppercase tracking-widest">
                                {new Date(approval.expense.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-[#0d0a2e] font-syne tracking-tighter">
                            ₹{approval.expense.amount?.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[#6b7280] font-bold mt-1 uppercase tracking-[0.2em] opacity-60">
                            {approval.expense.category} • {approval.expense.currency}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-[#fafafe] p-6 rounded-[28px] border border-[#f4f2ff] flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-[#6b7280] uppercase tracking-widest block mb-1.5 opacity-60">Application Summary</span>
                          <p className="text-[17px] text-[#374151] font-bold italic leading-relaxed">"{approval.expense.description}"</p>
                        </div>
                        <div className="hidden md:block pl-8 border-l border-[#e0dcff]">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#4f46e5]">
                            <Receipt size={24} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#fafafe] border-t lg:border-t-0 lg:border-l border-[#f4f2ff] p-8 md:p-10 flex items-center justify-center w-full lg:w-72 shrink-0">
                      <Button 
                        className="w-full h-16 text-white font-black text-sm uppercase tracking-[0.2em] rounded-[22px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group-hover:shadow-[#4f46e5]/20"
                        style={{ backgroundColor: theme.primary }}
                        onClick={() => setSelectedApproval(approval)}
                      >
                        Review Details 📋
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )
        ) : (
          history.length === 0 ? (
            <Card className="text-center py-24 border-2 border-dashed border-[#e0dcff] rounded-[48px] bg-white/50 backdrop-blur-sm">
              <CardContent>
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center text-[#6b7280]">
                    <History size={48} strokeWidth={2.5} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-[#0d0a2e] font-syne">Archive Empty</CardTitle>
                    <CardDescription className="text-[#6b7280] font-bold mt-2 text-lg">Your history of processed applications will appear here.</CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
          history.map((ap) => {
            if (!ap.expense || !ap.expense.employee) return null;
            return (
              <Card key={ap.id} className="border-none shadow-sm rounded-[32px] bg-white/80 backdrop-blur-sm overflow-hidden hover:shadow-md transition-all group">
                <div className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center font-black text-white shadow-lg ${
                      ap.status === 'approved' ? 'bg-[#059669]' : 'bg-[#dc2626]'
                    }`}>
                      {ap.status === 'approved' ? <Check size={28} strokeWidth={3} /> : <X size={28} strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="font-black text-[#0d0a2e] text-xl">{ap.expense.employee.full_name}</p>
                      <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider mt-1">
                        {new Date(ap.updated_at).toLocaleDateString()} • {ap.expense.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#0d0a2e] text-2xl tracking-tight">₹{ap.expense.amount?.toLocaleString()}</p>
                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] mt-1 ${
                      ap.status === 'approved' ? 'text-[#059669]' : 'text-[#dc2626]'
                    }`}>{ap.status}</p>
                  </div>
                </div>
                {ap.comments && (
                  <div className="px-8 pb-8 pt-0">
                    <div className="bg-[#fafafe] p-5 rounded-[22px] border border-[#f4f2ff] text-sm text-[#6b7280] font-bold italic flex items-start gap-3">
                      <MessageSquare size={16} className="mt-1 shrink-0 opacity-40" />
                      "{ap.comments}"
                    </div>
                  </div>
                )}
              </Card>
            );
          })
          )
        )}
      </div>
    </div>
  )
}
