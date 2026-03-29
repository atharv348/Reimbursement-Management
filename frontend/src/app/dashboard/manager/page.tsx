import ApprovalsPanel from "@/components/dashboard/ApprovalsPanel"

export default function ManagerPage() {
  return (
    <ApprovalsPanel 
      title="Manager Panel" 
      description="Review and process expense claims from your direct reports." 
      roleType="manager"
    />
  )
}
