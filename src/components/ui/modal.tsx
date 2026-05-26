"use client";

import React from"react";
import {
 Modal as NextUIModal,
 ModalContent as NextUIModalContent,
 ModalHeader as NextUIModalHeader,
 ModalBody as NextUIModalBody,
 ModalFooter as NextUIModalFooter,
 ModalProps as NextUIModalProps,
} from"@heroui/react";
import { cn } from"@/src/common/lib/utils";

export interface ModalProps extends Omit<NextUIModalProps,"classNames"> {
 children: React.ReactNode;
 variant?:"default" |"danger" |"warning";
 className?: string;
}

/**
 * A consistent wrapper for NextUI Modal that applies project-wide
 * dark theme styling and structural consistency.
 */
export const Modal = ({
 children,
 variant ="default",
 className,
 ...props
}: ModalProps) => {
 return (
 <NextUIModal
 backdrop="blur"
 classNames={{
 base: cn("bg-content1 border border-border",
 variant ==="danger" &&"border-danger/50 -danger/20",
 variant ==="warning" &&"border-warning/50 -warning/20",
 className,
 ),
 backdrop:"bg-background/80",
 header:"border-b border-divider/50 pb-4 pt-6 px-6",
 body:"py-6 px-6",
 footer:"border-t border-divider/50 pt-4 pb-6 px-6",
 closeButton:"hover:bg-content2 active:bg-content3 transition-colors right-4 top-4",
 }}
 radius="lg"
 {...props}
 >
 {children}
 </NextUIModal>
 );
};

export const ModalContent = NextUIModalContent;

export const ModalHeader = ({
 className,
 children,
 ...props
}: React.ComponentProps<typeof NextUIModalHeader>) => (
 <NextUIModalHeader
 className={cn("flex items-center gap-2 text-xl font-semibold text-foreground",
 className,
 )}
 {...props}
 >
 {children}
 </NextUIModalHeader>
);

export const ModalBody = ({
 className,
 children,
 ...props
}: React.ComponentProps<typeof NextUIModalBody>) => (
 <NextUIModalBody
 className={cn("gap-4 text-foreground-600", className)}
 {...props}
 >
 {children}
 </NextUIModalBody>
);

export const ModalFooter = ({
 className,
 children,
 ...props
}: React.ComponentProps<typeof NextUIModalFooter>) => (
 <NextUIModalFooter
 className={cn("flex justify-end gap-3", className)}
 {...props}
 >
 {children}
 </NextUIModalFooter>
);
