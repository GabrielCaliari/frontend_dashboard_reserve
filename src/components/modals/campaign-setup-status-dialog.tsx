import { Dialog, DialogContent } from "../ui/dialog"

import { DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { closeSetupService } from "@/src/common/services/email-campaign/close-setup-service";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CampaignSetupStatusDialog({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
    const [sub, setSub] = useState(false);
    const { refresh } = useRouter();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[50%]">
                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-bold">Finalizar Setup</h1>
                    <p className="text-sm text-gray-500">
                        Você pode finalizar o setup da campanha agora ou continuar com o setup.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={async () => {
                        setSub(true);
                        await onConfirm();
                        setSub(false);
                        onClose();
                        refresh()
                    }} disabled={sub}>
                        Finalizar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
