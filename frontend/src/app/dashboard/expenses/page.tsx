"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Camera, FileText, Check, AlertCircle, Scan, History, ArrowRight, DollarSign, X } from "lucide-react"
import axios from "axios"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    applicant_name: "",
    applicant_email: "",
    amount: "",
    currency: "INR",
    category: "Meals",
    description: "",
    date: new Date().toISOString().split('T')[0],
    vendor: "",
    is_manager_approver: true
  })
  const [file, setFile] = useState<File | null>(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchExpenses()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await axios.get(`${baseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data)
    } catch (err) {
      console.error("Failed to fetch user", err)
    }
  }

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await axios.get(`${baseUrl}/api/expenses/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setExpenses(res.data)
    } catch (err: any) {
      console.error("Failed to fetch expenses", err)
      if (err.response?.status === 401) {
        localStorage.removeItem("token")
        window.location.href = "/"
      }
    }
  }

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm("Are you sure you want to delete this expense claim?")) return
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      await axios.delete(`${baseUrl}/api/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert("Expense deleted successfully!")
      fetchExpenses()
    } catch (err: any) {
      alert(`Failed to delete: ${err.response?.data?.detail || err.message}`)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)

    // Trigger OCR immediately
    setIsUploading(true)
    const ocrData = new FormData()
    ocrData.append("receipt", selectedFile)
    
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await axios.post(`${baseUrl}/api/expenses/ocr`, ocrData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      console.log("OCR Result:", res.data)
      
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          amount: res.data.amount?.toString() || "",
          currency: res.data.currency || "INR",
          category: res.data.category || "Meals",
          description: res.data.description || res.data.merchant_name || "",
          date: res.data.date || new Date().toISOString().split('T')[0],
          vendor: res.data.merchant_name || ""
        }))
      }
    } catch (err: any) {
      console.error("OCR Failed:", err)
      const errorDetail = err.response?.data?.detail
      const errorMessage = typeof errorDetail === 'string' ? errorDetail : (err.response?.data?.message || "OCR failed. Please check your backend logs.")
      alert(`OCR Error: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    
    const submitData = new FormData()
    submitData.append("applicant_name", formData.applicant_name)
    submitData.append("applicant_email", formData.applicant_email)
    submitData.append("amount", formData.amount)
    submitData.append("currency", formData.currency)
    submitData.append("category", formData.category)
    submitData.append("description", formData.description)
    submitData.append("date", formData.date)
    submitData.append("is_manager_approver", String(formData.is_manager_approver))
    // Manual identity entry is now prioritized over the logged-in user.
    if (file) submitData.append("receipt", file)

    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      await axios.post(`${baseUrl}/api/expenses/submit`, submitData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      alert("Expense submitted successfully!")
      setFormData({
        applicant_name: "",
        applicant_email: "",
        amount: "",
        currency: "INR",
        category: "Meals",
        description: "",
        date: new Date().toISOString().split('T')[0],
        vendor: "",
        is_manager_approver: true
      })
      setFile(null)
      fetchExpenses()
    } catch (err: any) {
      console.error("Submission failed", err)
      const errorDetail = err.response?.data?.detail
      const errorMessage = typeof errorDetail === 'string' ? errorDetail : (err.response?.data?.message || "Submission failed. Please check your connection or backend logs.")
      alert(`Submission Error: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  const filteredExpenses = expenses.filter(exp => filter === "all" || exp.status === filter)

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      {/* LEFT COL: SUBMIT FORM */}
      <div className="lg:col-span-1 space-y-8">
        <Card className="border-[#e0dcff] shadow-lg rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="bg-[#fafafe] border-b border-[#f4f2ff] px-6 py-5">
            <CardTitle className="text-lg font-bold text-[#0d0a2e] font-syne flex items-center gap-2">
              <span className="p-1.5 bg-[#eef2ff] rounded-lg text-[#4f46e5]"><Scan size={18} /></span> OCR Receipt Scan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="group relative border-2 border-dashed border-[#e0dcff] rounded-2xl p-8 text-center cursor-pointer hover:border-[#4f46e5] hover:bg-[#eef2ff] transition-all duration-200">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={handleFileChange}
                accept="image/*,application/pdf"
              />
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#eef2ff] rounded-full flex items-center justify-center text-[#4f46e5] mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={28} />
                </div>
                <p className="text-[15px] font-bold text-[#0d0a2e]">
                  {file ? file.name : "Click to upload receipt"}
                </p>
                <p className="text-[12px] text-[#6b7280] mt-1 font-medium">AI will auto-fill the form details</p>
              </div>
            </div>
            
            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[#4f46e5] text-sm font-bold animate-pulse">
                <Scan size={16} className="animate-spin" /> AI scanning in progress...
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#e0dcff] shadow-lg rounded-[24px] overflow-hidden bg-white">
          <CardHeader className="bg-[#fafafe] border-b border-[#f4f2ff] px-6 py-5">
            <CardTitle className="text-lg font-bold text-[#0d0a2e] font-syne flex items-center gap-2">
              <span className="p-1.5 bg-[#eef2ff] rounded-lg text-[#4f46e5]"><FileText size={18} /></span> Expense Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4 p-4 bg-[#fafafe] rounded-xl border border-[#e0dcff] mb-4">
                <div className="text-[10px] font-black text-[#6b7280] uppercase tracking-[0.2em] mb-1">Applicant Details</div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Full Name</Label>
                  <Input 
                    type="text" 
                    value={formData.applicant_name} 
                    onChange={(e) => setFormData({...formData, applicant_name: e.target.value})} 
                    required 
                    className="h-10 rounded-lg bg-white border-[#e0dcff]"
                    placeholder="Enter applicant name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Email Address</Label>
                  <Input 
                    type="email" 
                    value={formData.applicant_email} 
                    onChange={(e) => setFormData({...formData, applicant_email: e.target.value})} 
                    required 
                    className="h-10 rounded-lg bg-white border-[#e0dcff]"
                    placeholder="Enter applicant email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Amount</Label>
                  <Input 
                    type="number" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    required 
                    className="h-11 rounded-xl bg-[#fafafe]"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Currency</Label>
                  <select 
                    className="w-full h-11 rounded-xl border border-input bg-[#fafafe] px-3 py-2 text-sm font-medium"
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  >
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Category</Label>
                <select 
                  className="w-full h-11 rounded-xl border border-input bg-[#fafafe] px-3 py-2 text-sm font-medium"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option>Meals</option>
                  <option>Travel</option>
                  <option>Supplies</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Date</Label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})} 
                  required 
                  className="h-11 rounded-xl bg-[#fafafe]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Description</Label>
                <textarea 
                  className="w-full min-h-[80px] rounded-xl border border-input bg-[#fafafe] px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#4f46e5] outline-none transition-all"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="What was this for?"
                  required 
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 pb-4">
                <input 
                  type="checkbox" 
                  id="manager_approver"
                  checked={formData.is_manager_approver}
                  onChange={(e) => setFormData({...formData, is_manager_approver: e.target.checked})}
                  className="w-4 h-4 text-[#4f46e5] border-[#e0dcff] rounded focus:ring-[#4f46e5]"
                />
                <Label htmlFor="manager_approver" className="text-sm font-bold text-[#0d0a2e] cursor-pointer">
                  Require Manager Approval First?
                </Label>
              </div>

              <Button 
                className="w-full h-12 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.98]" 
                type="submit" 
                disabled={isUploading}
              >
                {isUploading ? "Processing..." : "Submit Expense →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COL: HISTORY */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm text-[#4f46e5]"><History size={20} /></div>
            <h3 className="text-xl font-bold text-[#0d0a2e] font-syne">Claim History</h3>
          </div>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-[#f4f2ff]">
            {['all', 'approved', 'pending', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all ${
                  filter === f ? 'bg-[#4f46e5] text-white shadow-md' : 'text-[#6b7280] hover:bg-[#fafafe]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {filteredExpenses.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-[#e0dcff] rounded-[32px] bg-white">
              <div className="w-16 h-16 bg-[#f4f2ff] rounded-full flex items-center justify-center text-[#4f46e5] mx-auto mb-4">
                <FileText size={32} />
              </div>
              <h4 className="text-lg font-bold text-[#0d0a2e] mb-1">No claims found</h4>
              <p className="text-sm text-[#6b7280] font-medium">Your submitted expenses will appear here.</p>
            </Card>
          ) : (
            filteredExpenses.map((exp) => (
              <Card key={exp.id} className="border-[#e0dcff] shadow-sm rounded-2xl hover:shadow-md transition-all duration-300 bg-white overflow-hidden group">
                <div className="flex items-center p-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shrink-0 transition-colors ${
                    exp.status === 'approved' ? 'bg-[#d1fae5] text-[#059669]' :
                    exp.status === 'rejected' ? 'bg-[#fee2e2] text-[#dc2626]' :
                    'bg-[#fef3c7] text-[#d97706]'
                  }`}>
                    <DollarSign size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-[#0d0a2e] truncate">{exp.description}</h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        exp.status === 'approved' ? 'bg-[#d1fae5] text-[#065f46]' :
                        exp.status === 'rejected' ? 'bg-[#fee2e2] text-[#991b1b]' :
                        'bg-[#fef3c7] text-[#92400e]'
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#4f46e5] font-bold mb-1.5">
                      <div className="w-4 h-4 rounded-full bg-[#eef2ff] flex items-center justify-center text-[8px]">👤</div>
                      <span className="truncate">Claimed by: {exp.applicant_name || exp.employee?.full_name} ({exp.applicant_email || exp.employee?.email})</span>
                    </div>
                    <div className="text-[12px] text-[#6b7280] font-medium flex items-center gap-3">
                      <span>{exp.category}</span>
                      <span className="w-1 h-1 bg-[#e0dcff] rounded-full" />
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                    </div>

                    {/* Step Tracker */}
                    {exp.status === 'pending' && exp.approvals && exp.approvals.length > 0 && (
                      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {exp.approvals.sort((a, b) => a.sequence_order - b.sequence_order).map((ap, idx) => (
                          <div key={ap.id} className="flex items-center shrink-0">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                              ap.status === 'approved' ? 'bg-[#d1fae5] border-[#10b981] text-[#065f46]' :
                              ap.status === 'rejected' ? 'bg-[#fee2e2] border-[#ef4444] text-[#991b1b]' :
                              ap.status === 'pending' ? 'bg-[#4f46e5] border-[#4f46e5] text-white shadow-sm ring-2 ring-[#e0dcff]' :
                              'bg-[#fafafe] border-[#e0dcff] text-[#6b7280]'
                            }`}>
                              {ap.status === 'approved' && <Check size={10} />}
                              {ap.approver?.full_name?.split(' ')[0] || `Step ${ap.sequence_order}`}
                              {ap.status === 'approved' && " ✓"}
                              {ap.status === 'pending' && "..."}
                            </div>
                            {idx < exp.approvals.length - 1 && (
                              <div className="w-4 h-[1px] bg-[#e0dcff] mx-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-[#0d0a2e] font-syne tracking-tight">₹{exp.amount.toLocaleString()}</div>
                    <div className="text-[10px] text-[#6b7280] font-bold uppercase tracking-widest">{exp.currency}</div>
                    
                    {/* Step Badge */}
                    {exp.status === 'pending' && exp.approvals && exp.approvals.length > 0 && (
                      <div className="mt-2 inline-block px-2 py-0.5 rounded bg-[#fef3c7] text-[#92400e] text-[9px] font-black uppercase tracking-tighter shadow-sm border border-[#fde68a]">
                        Step {exp.approvals.filter(a => a.status === 'approved').length + 1}/{exp.approvals.length}
                      </div>
                    )}
                  </div>
                  <div className="ml-6 flex items-center gap-2">
                    {exp.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <X size={18} />
                      </Button>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#f4f2ff] text-[#4f46e5]">
                        <ArrowRight size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
