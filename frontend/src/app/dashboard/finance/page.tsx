import ApprovalsPanel from "@/components/dashboard/ApprovalsPanel"

export default function FinancePage() {
  return (
    <ApprovalsPanel 
      title="Finance Panel" 
      description="Review and process expense claims for final disbursement." 
      roleType="finance"
    />
  )
}
