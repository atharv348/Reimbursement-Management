"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"
import { Eye, EyeOff } from "lucide-react"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [strength, setStrength] = useState(0)

  const checkStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    setStrength(score)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match!")
      return
    }
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      if (isLogin) {
        const formData = new FormData()
        formData.append("username", email)
        formData.append("password", password)
        const res = await axios.post(`${baseUrl}/auth/login`, formData)
        localStorage.setItem("token", res.data.access_token)
        window.location.href = "/dashboard"
      } else {
        const res = await axios.post(`${baseUrl}/auth/signup`, {
          user_in: { email, password, full_name: fullName },
          company_in: { name: companyName, country, base_currency: "USD" }
        })
        localStorage.setItem("token", res.data.access_token)
        window.location.href = "/dashboard"
      }
    } catch (error: any) {
      console.error("Auth error", error)
      const message = error.response?.data?.detail || "Authentication failed. Please check your credentials."
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f2ff] p-4 overflow-hidden relative">
      {/* Animated blobs */}
      <div className="blob w-[340px] h-[340px] bg-[#7c3aed] top-[-80px] left-[-80px]" />
      <div className="blob w-[280px] h-[280px] bg-[#4f46e5] bottom-[-60px] right-[-60px] animation-delay-[-4s]" />

      <Card className="w-full max-w-[460px] shadow-[0_20px_60px_rgba(79,70,229,0.12)] border-[#e0dcff] rounded-[24px] z-10 p-4 md:p-8">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-xl flex items-center justify-center text-white text-xl">💸</div>
            <div className="font-bold text-xl tracking-tight text-[#0d0a2e]">Reimburse<span className="text-[#4f46e5]">X</span></div>
          </div>
          
          <div className="flex bg-[#eef2ff] rounded-xl p-1 mb-8">
            <button 
              className={`flex-1 text-center py-2 rounded-lg font-semibold text-sm transition-all ${isLogin ? 'bg-white text-[#4f46e5] shadow-[0_2px_8px_rgba(79,70,229,0.15)]' : 'text-[#6b7280]'}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 text-center py-2 rounded-lg font-semibold text-sm transition-all ${!isLogin ? 'bg-white text-[#4f46e5] shadow-[0_2px_8px_rgba(79,70,229,0.15)]' : 'text-[#6b7280]'}`}
              onClick={() => setIsLogin(false)}
            >
              Create Account
            </button>
          </div>

          <CardTitle className="text-2xl font-bold text-[#0d0a2e]">
            {isLogin ? "Welcome back 👋" : "Create your workspace ✨"}
          </CardTitle>
          <CardDescription className="text-[#6b7280]">
            {isLogin ? "Sign in to your workspace" : "Your company account starts here"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-xs font-semibold">Full Name</Label>
                    <Input id="fullName" placeholder="Arjun Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="companyName" className="text-xs font-semibold">Company</Label>
                    <Input id="companyName" placeholder="Acme Corp" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="country" className="text-xs font-semibold">Country</Label>
                  <select 
                    id="country" 
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    required
                  >
                    <option value="">Select country</option>
                    <option value="IN">🇮🇳 India (INR)</option>
                    <option value="US">🇺🇸 United States (USD)</option>
                    <option value="GB">🇬🇧 United Kingdom (GBP)</option>
                    <option value="EU">🇪🇺 Eurozone (EUR)</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold">Work Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder={isLogin ? "Your password" : "Min 8 characters"}
                  value={password} 
                  onChange={(e) => {
                    setPassword(e.target.value)
                    checkStrength(e.target.value)
                  }} 
                  required 
                  className="h-11 rounded-xl pr-10"
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!isLogin && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-full transition-colors ${
                          i <= strength 
                            ? (strength === 1 ? 'bg-red-500' : strength === 2 ? 'bg-amber-500' : strength === 3 ? 'bg-blue-500' : 'bg-emerald-500')
                            : 'bg-gray-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">
                    {strength === 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : strength === 4 ? 'Strong' : ''}
                  </div>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <Label htmlFor="confirm" className="text-xs font-semibold">Confirm Password</Label>
                <Input 
                  id="confirm" 
                  type="password" 
                  placeholder="Repeat password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            <Button 
              className="w-full h-12 mt-6 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-base hover:shadow-[0_8px_24px_rgba(79,70,229,0.35)] transition-all active:scale-[0.98]" 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Processing..." : (isLogin ? "Sign In →" : "Create Account & Workspace →")}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center mt-6 p-0">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-[#4f46e5] hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
