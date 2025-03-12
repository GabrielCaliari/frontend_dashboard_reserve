import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";

import { deleteCookie } from "cookies-next";
import { useRouter } from "nextjs-toploader/app";

interface LogoutModalProps {
  isOpen: boolean;
  onOpenChange: any;
  onClose: any,
}

export function LogoutModal({ isOpen, onOpenChange, onClose }: LogoutModalProps) {
  const { replace } = useRouter();

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
                  <h1 className="text-2xl font-bold mb-1">Encerrar sessão</h1>
                  <span className=" text-base text-gray-500 mt-12">
                    Você realmente deseja fazer isso?
                  </span>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={() => handleLogout()}>
                  Encerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
