import ApprovalsPanel from "@/components/dashboard/ApprovalsPanel"

export default function DirectorPage() {
  return (
    <ApprovalsPanel 
      title="Director Panel" 
      description="Review and process high-value expense claims requiring executive approval." 
      roleType="director"
    />
  )
}
