'use client';

import {
 Modal,
 ModalContent,
 ModalHeader,
 ModalBody,
 ModalFooter,
 Button,
} from'@heroui/react';
import { AlertTriangle } from'lucide-react';

interface ConfirmModalProps {
 isOpen: boolean;
 onClose: () => void;
 onConfirm: () => void;
 title: string;
 message: string;
 confirmText?: string;
 cancelText?: string;
 confirmColor?:'default' |'primary' |'secondary' |'success' |'warning' |'danger';
 isLoading?: boolean;
}

export function ConfirmModal({
 isOpen,
 onClose,
 onConfirm,
 title,
 message,
 confirmText ='Confirmar',
 cancelText ='Cancelar',
 confirmColor ='primary',
 isLoading = false,
}: ConfirmModalProps) {
 return (
 <Modal isOpen={isOpen} onClose={onClose} size="md">
 <ModalContent>
 <ModalHeader className="flex gap-3 items-center">
 <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
 <AlertTriangle className="w-5 h-5 text-orange-500" />
 </div>
 <span>{title}</span>
 </ModalHeader>
 <ModalBody>
 <p className="text-muted-foreground dark:text-muted-foreground">{message}</p>
 </ModalBody>
 <ModalFooter>
 <Button variant="light" onPress={onClose} isDisabled={isLoading}>
 {cancelText}
 </Button>
 <Button
 color={confirmColor}
 onPress={onConfirm}
 isLoading={isLoading}
 >
 {confirmText}
 </Button>
 </ModalFooter>
 </ModalContent>
 </Modal>
 );
}
