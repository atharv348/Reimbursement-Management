"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, ShieldCheck, ListOrdered, Users, ArrowRight, Settings, Plus, Info, X } from "lucide-react"
import axios from "axios"

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
  
  // New User Form
  const [userEmail, setUserEmail] = useState("")
  const [userFullName, setUserFullName] = useState("")
  const [userRole, setUserRole] = useState("employee")
  const [managerId, setManagerId] = useState<string>("")

  // Rule Form
  const [ruleName, setRuleName] = useState("")
  const [ruleType, setRuleType] = useState("sequence")
  const [approverIds, setApproverIds] = useState<string>("")
  const [threshold, setThreshold] = useState("60")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No token found in localStorage")
        window.location.href = "/"
        return
      }
      
      const config = { headers: { Authorization: `Bearer ${token}` } }
      console.log("Fetching admin data...")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      
      const [usersRes, rulesRes] = await Promise.all([
        axios.get(`${baseUrl}/api/users`, config),
        axios.get(`${baseUrl}/api/rules`, config)
      ])
      
      setUsers(usersRes.data)
      setRules(rulesRes.data)
    } catch (err: any) {
      console.error("Failed to fetch admin data:", err)
      const detail = err.response?.data?.detail || err.message
      if (err.response?.status === 401) {
        alert(`Session Error: ${detail}. Redirecting to login...`)
        localStorage.removeItem("token")
        window.location.href = "/"
      } else if (err.response?.status === 403) {
        alert(`Permission Denied: ${detail}`)
        window.location.href = "/dashboard"
      } else {
        alert(`Error: ${detail}`)
      }
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      await axios.post(`${baseUrl}/api/users/employees`, {
        email: userEmail,
        full_name: userFullName,
        password: "Password123!",
        role: userRole,
        manager_id: managerId ? parseInt(managerId) : null
      }, { headers: { Authorization: `Bearer ${token}` } })
      alert("Team member added successfully!")
      setUserEmail("")
      setUserFullName("")
      setManagerId("")
      fetchData()
    } catch (err: any) {
      console.error("Failed to add user:", err)
      const detail = err.response?.data?.detail || err.message
      alert(`Failed to add user: ${detail}`)
    }
  }

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const config = {
        approver_ids: approverIds.split(",").map(id => parseInt(id.trim())),
        threshold_percentage: parseInt(threshold)
      }
      await axios.post(`${baseUrl}/api/rules/`, {
        name: ruleName,
        rule_type: ruleType,
        config: config
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Smart approval rule activated!")
      fetchData()
    } catch (err) {
      alert("Failed to update rule")
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      await axios.delete(`${baseUrl}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Member removed successfully!")
      fetchData()
    } catch (err: any) {
      alert(`Failed to delete: ${err.response?.data?.detail || err.message}`)
    }
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* User Management */}
        <Card className="border-[#e0dcff] shadow-lg rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="bg-[#fafafe] border-b border-[#f4f2ff] px-6 py-5">
            <CardTitle className="text-lg font-bold text-[#0d0a2e] font-syne flex items-center gap-2">
              <span className="p-1.5 bg-[#eef2ff] rounded-lg text-[#4f46e5]"><UserPlus size={18} /></span> Add Team Member
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAddUser} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Full Name</Label>
                <Input value={userFullName} onChange={(e) => setUserFullName(e.target.value)} placeholder="Arjun Sharma" required className="h-11 rounded-xl bg-[#fafafe]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Work Email</Label>
                <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="arjun@company.com" required className="h-11 rounded-xl bg-[#fafafe]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Role</Label>
                  <select 
                    className="w-full h-11 rounded-xl border border-input bg-[#fafafe] px-3 py-2 text-sm font-medium"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                  >
                    <option value="employee">👤 Employee</option>
                    <option value="manager">👨‍💼 Manager</option>
                    <option value="finance">💳 Finance</option>
                    <option value="director">🛡️ Director</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Manager ID</Label>
                  <Input value={managerId} onChange={(e) => setManagerId(e.target.value)} placeholder="e.g. 1" className="h-11 rounded-xl bg-[#fafafe]" />
                </div>
              </div>
              <Button className="w-full h-12 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]" type="submit">
                Register Member ➕
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Rule Configuration */}
        <Card className="border-[#e0dcff] shadow-lg rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="bg-[#fafafe] border-b border-[#f4f2ff] px-6 py-5">
            <CardTitle className="text-lg font-bold text-[#0d0a2e] font-syne flex items-center gap-2">
              <span className="p-1.5 bg-[#eef2ff] rounded-lg text-[#4f46e5]"><ShieldCheck size={18} /></span> Workflow Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveRule} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Flow Name</Label>
                <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="e.g. Finance Chain" required className="h-11 rounded-xl bg-[#fafafe]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Logic Type</Label>
                <select 
                  className="w-full h-11 rounded-xl border border-input bg-[#fafafe] px-3 py-2 text-sm font-medium"
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value)}
                >
                  <option value="sequence">Sequential (A → B → C)</option>
                  <option value="percentage">Quorum (X% Approval)</option>
                  <option value="hybrid">Hybrid (Quorum OR CFO)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Approver IDs</Label>
                <Input value={approverIds} onChange={(e) => setApproverIds(e.target.value)} placeholder="e.g. 2, 5, 8" required className="h-11 rounded-xl bg-[#fafafe]" />
                <p className="text-[10px] text-[#6b7280] font-medium italic">* Enter User IDs separated by commas</p>
              </div>
              {ruleType !== "sequence" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Threshold (%)</Label>
                  <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="h-11 rounded-xl bg-[#fafafe]" />
                </div>
              )}
              <Button className="w-full h-12 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]" type="submit">
                Activate Flow ⚡
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Directory Table */}
      <Card className="border-[#e0dcff] shadow-lg rounded-[24px] overflow-hidden bg-white mb-8">
        <CardHeader className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] border-b border-[#f4f2ff] px-6 py-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-white font-syne flex items-center gap-2">
              <span className="p-1.5 bg-white/20 rounded-lg text-white"><ShieldCheck size={18} /></span> Access Directory (Reference)
            </CardTitle>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
              Quick Login Access
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafafe] text-left text-[11px] font-bold text-[#6b7280] uppercase tracking-widest border-b border-[#f4f2ff]">
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Work Email</th>
                  <th className="px-6 py-4">Password</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f2ff]">
                {[
                  { role: "Admin", email: "admin@gmail.com", pass: "admin123", color: "bg-[#d1fae5] text-[#065f46]" },
                  { role: "Manager", email: "manager@gmail.com", pass: "manager123", color: "bg-[#e0f2fe] text-[#075985]" },
                  { role: "Employee", email: "employee@gmail.com", pass: "employee123", color: "bg-[#f3f4f6] text-[#374151]" },
                  { role: "Finance", email: "Dixit345@abc.com", pass: "finance123", color: "bg-[#fef3c7] text-[#92400e]" },
                  { role: "Director", email: "Manish32@abc.com", pass: "director123", color: "bg-[#eef2ff] text-[#4f46e5]" }
                ].map((cred, idx) => (
                  <tr key={idx} className="hover:bg-[#fafafe] transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cred.color}`}>
                        {cred.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#0d0a2e]">{cred.email}</td>
                    <td className="px-6 py-4 text-sm font-mono text-[#4f46e5] font-bold bg-[#f5f7ff] rounded-lg">{cred.pass}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-[#059669] bg-[#d1fae5] px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card className="border-[#e0dcff] shadow-lg rounded-[24px] overflow-hidden bg-white">
        <CardHeader className="bg-[#fafafe] border-b border-[#f4f2ff] px-6 py-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-[#0d0a2e] font-syne flex items-center gap-2">
              <span className="p-1.5 bg-[#eef2ff] rounded-lg text-[#4f46e5]"><Users size={18} /></span> Company Directory
            </CardTitle>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#eef2ff] rounded-full text-[#4f46e5] text-[11px] font-bold uppercase tracking-wider">
              {users.length} Active Members
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafafe] text-left text-[11px] font-bold text-[#6b7280] uppercase tracking-widest border-b border-[#f4f2ff]">
                  <th className="px-6 py-4 text-center">ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Work Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Manager ID</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f2ff]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#fafafe] transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-[#4f46e5] bg-[#eef2ff] px-2.5 py-1 rounded-lg text-xs">#{u.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0d0a2e] text-sm group-hover:text-[#4f46e5] transition-colors">{u.full_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#6b7280]">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-[#d1fae5] text-[#065f46]' :
                        u.role === 'manager' ? 'bg-[#e0f2fe] text-[#075985]' :
                        u.role === 'finance' ? 'bg-[#fef3c7] text-[#92400e]' :
                        u.role === 'director' ? 'bg-[#eef2ff] text-[#4f46e5]' :
                        'bg-[#f3f4f6] text-[#374151]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.manager_id ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6b7280]">
                          <ArrowRight size={14} className="text-[#e0dcff]" /> Manager #{u.manager_id}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-[#e0dcff] italic">No Manager</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors rounded-lg h-8 px-2"
                      >
                        <X size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
