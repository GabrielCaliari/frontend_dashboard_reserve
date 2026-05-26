'use client'

import { useRouter } from"next/navigation"

export default function CampaignsTableRow({ children, id }: { children: React.ReactNode, id: string }) {
 const router = useRouter()

 const handleRowClick = (id: string) => {
 router.push(`/dashboard/email-campaign/${id}`)
 }

 return (
 <tr
 key={id}
 className="hover:bg-default-100 cursor-pointer"
 onClick={() => handleRowClick(id)}
 >
 {children}
 </tr>
 )
}
