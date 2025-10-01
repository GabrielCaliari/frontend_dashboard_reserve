'use client'

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { CreateCampaignDialog } from "../create-campaign-dialog";

export default function CreateEmailCampaignButton() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
                <PlusIcon className="h-5 w-5" />
                Nova Campanha
            </button>
            <CreateCampaignDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} />
        </>
    )
}
