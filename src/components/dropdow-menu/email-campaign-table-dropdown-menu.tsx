'use client'

import { EyeIcon, MoreHorizontalIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export default function EmailCampaignTableDropdownMenu({ id }: { id: string }) {
    const router = useRouter()
    const t = useTranslations("campaignDropdown")

    const handleRowClick = (e: React.MouseEvent<any>, id: string) => {
        e.stopPropagation()
        router.push(`/dashboard/email-campaign/${id}`)
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-gray-100">
                    <MoreHorizontalIcon className="h-5 w-5 text-muted-foreground" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={(e) => handleRowClick(e, id)} className="hover:bg-gray-100 cursor-pointer">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    {t("view")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}