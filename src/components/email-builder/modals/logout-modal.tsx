import { Button } from"@heroui/react";
import {
 Modal,
 ModalContent,
 ModalHeader,
 ModalBody,
 ModalFooter,
} from"@/src/components/ui/modal";

import { deleteCookie } from"cookies-next";
import { useRouter } from"nextjs-toploader/app";
import { useTranslations } from"next-intl";

interface LogoutModalProps {
 isOpen: boolean;
 onOpenChange: any;
 onClose: any;
}

export function LogoutModal({
 isOpen,
 onOpenChange,
 onClose,
}: LogoutModalProps) {
 const { replace } = useRouter();
 const t = useTranslations("logout");
 const tc = useTranslations("common");

 const handleLogout = () => {
 deleteCookie("session");
 deleteCookie("token");
 deleteCookie("session_name");
 replace("/auth/login");
 onClose();
 };

 return (
 <>
 <Modal backdrop="opaque" isOpen={isOpen} onOpenChange={onOpenChange}>
 <ModalContent>
 {(onClose) => (
 <>
 <ModalBody>
 <div className="p-3 py-6">
 <h1 className="text-2xl font-bold mb-1 text-foreground">
 {t("title")}
 </h1>
 <span className="text-base text-muted-foreground mt-12">
 {t("confirm")}
 </span>
 </div>
 </ModalBody>
 <ModalFooter>
 <Button color="danger" variant="light" onPress={onClose}>
 {tc("cancel")}
 </Button>
 <Button color="primary" onPress={() => handleLogout()}>
 {t("end")}
 </Button>
 </ModalFooter>
 </>
 )}
 </ModalContent>
 </Modal>
 </>
 );
}
