"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Receipt, CheckCircle, LogOut, Users, User, Settings, ShieldCheck, CreditCard, UserCheck, Bell, X } from "lucide-react"
import axios from "axios"

function SidebarContent({ user, pendingCount }: { user: any, pendingCount: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view')

  const navItems = [
    { id: "overview", name: "Overview", icon: <LayoutDashboard size={20} />, path: "/dashboard", roles: ["admin", "manager", "employee"] },
    { id: "my-expenses", name: "My Expenses", icon: <Receipt size={20} />, path: "/dashboard/expenses", roles: ["admin", "manager", "employee"] },
    { id: "approvals", name: "Approvals", icon: <CheckCircle size={20} />, path: "/dashboard/approvals", roles: ["admin", "manager"] },
    { id: "manager-panel", name: "Manager Panel", icon: <UserCheck size={20} />, path: "/dashboard/manager", roles: ["admin", "manager"] },
    { id: "finance-panel", name: "Finance Panel", icon: <CreditCard size={20} />, path: "/dashboard/finance", roles: ["admin", "manager"] },
    { id: "director-panel", name: "Director Panel", icon: <ShieldCheck size={20} />, path: "/dashboard/director", roles: ["admin", "manager"] },
    { id: "admin-panel", name: "Admin Panel", icon: <Users size={20} />, path: "/dashboard/admin", roles: ["admin", "manager"] },
  ]

  const isActive = (item: any) => {
    if (item.path.includes('?')) {
      const [basePath, query] = item.path.split('?')
      const view = new URLSearchParams(query).get('view')
      return pathname === basePath && currentView === view
    }
    return pathname === item.path && !currentView
  }

  return (
    <aside className="w-[250px] bg-[#1a1040] text-white flex flex-col p-6 sticky top-0 h-screen shrink-0 shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-xl flex items-center justify-center text-white text-lg">💸</div>
        <div className="font-bold text-xl tracking-tight text-white font-syne">Reimburse<span className="text-[#a5b4fc]">X</span></div>
      </div>

      <div className="inline-flex items-center gap-2 bg-white/10 text-[#c4b5fd] text-[11px] font-bold px-3 py-1.5 rounded-full mb-8 self-start uppercase tracking-wider">
        {user.role === 'admin' ? '👑 Admin' : user.role === 'manager' ? '👨‍💼 Manager' : '👤 Employee'}
      </div>

      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-3">Menu</div>
      <nav className="space-y-1">
        {navItems.filter(item => item.roles.includes(user.role)).map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.path)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[14px] transition-all duration-200 ${
              isActive(item)
                ? 'bg-[#4f46e5]/40 text-white font-semibold shadow-lg' 
                : 'text-[#c4b5fd] hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon} {item.name}
            </div>
            {item.id === "approvals" && pendingCount > 0 && (
              <span className="bg-[#ef4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mt-8 mb-3">Account</div>
      <nav className="space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] text-[#c4b5fd] hover:bg-white/5 hover:text-white transition-all">
          <User size={20} /> Profile
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem("token")
            window.location.href = "/"
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] text-[#fca5a5] hover:bg-red-500/10 hover:text-red-400 transition-all mt-4"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center font-bold text-sm">
            {user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-sm truncate">{user.full_name}</div>
            <div className="text-[11px] text-[#a5b4fc] capitalize">{user.role}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/")
      return
    }

    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
        const [userRes, approvalsRes, notifRes] = await Promise.all([
          axios.get(`${baseUrl}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseUrl}/api/approvals/pending`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${baseUrl}/api/users/notifications`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        setUser(userRes.data)
        setPendingCount(approvalsRes.data.length)
        setNotifications(notifRes.data)
      } catch (err) {
        localStorage.removeItem("token")
        router.push("/")
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [router])

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("token")
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      await axios.post(`${baseUrl}/api/users/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error("Failed to mark notification as read", err)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!user) return <div className="flex h-screen items-center justify-center bg-[#f4f2ff]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4f46e5]"></div>
  </div>

  return (
    <div className="flex min-h-screen bg-[#f4f2ff] text-[#374151]">
      {/* SIDEBAR */}
      <Suspense fallback={<div className="w-[250px] bg-[#1a1040]" />}>
        <SidebarContent user={user} pendingCount={pendingCount} />
      </Suspense>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 md:p-10">
        <header className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0d0a2e] font-syne tracking-tight">
              {pathname === '/dashboard' ? `Good morning, ${user.full_name.split(' ')[0]} 👋` : 
               pathname === '/dashboard/expenses' ? 'My Expenses 📋' :
               pathname === '/dashboard/approvals' ? 'Approvals ✅' :
               pathname === '/dashboard/admin' ? 'Admin Panel 👑' : 
               pathname === '/dashboard/manager' ? 'Manager Panel 👨‍💼' :
               pathname === '/dashboard/finance' ? 'Finance Panel 💳' :
               pathname === '/dashboard/director' ? 'Director Panel 🛡️' : 'Dashboard'}
            </h1>
            <p className="text-[#6b7280] mt-1 text-[15px]">
              {pathname === '/dashboard' ? "Here's a summary of your company reimbursements" :
               pathname === '/dashboard/expenses' ? 'Manage and track your expense claims' :
               pathname === '/dashboard/approvals' ? 'Review and action team requests' :
               pathname === '/dashboard/admin' ? 'Manage users and approval workflows' : ''}
            </p>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 bg-white rounded-2xl shadow-sm border border-[#e0dcff] text-[#4f46e5] hover:bg-[#fafafe] transition-all relative"
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#f4f2ff]">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-[24px] shadow-2xl border border-[#e0dcff] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-[#f4f2ff] flex items-center justify-between bg-[#fafafe]">
                  <h4 className="font-bold text-[#0d0a2e] text-sm">Notifications</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-[#6b7280] hover:text-[#0d0a2e]"><X size={16} /></button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[#6b7280] text-sm font-medium">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 border-b border-[#f4f2ff] cursor-pointer transition-colors ${!n.is_read ? 'bg-[#eef2ff]/50' : 'hover:bg-[#fafafe]'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] ${n.title.includes('Approved') ? 'bg-[#059669]' : 'bg-[#dc2626]'}`}>
                            {n.title.includes('Approved') ? '✓' : '✗'}
                          </div>
                          <div>
                            <div className="font-bold text-[#0d0a2e] text-xs mb-0.5">{n.title}</div>
                            <div className="text-[11px] text-[#6b7280] leading-tight mb-1.5">{n.message}</div>
                            <div className="text-[9px] text-[#9ca3af] font-bold uppercase">{new Date(n.created_at).toLocaleString()}</div>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 bg-[#4f46e5] rounded-full shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
