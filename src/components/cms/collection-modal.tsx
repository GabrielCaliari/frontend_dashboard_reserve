"use client";

import {
 Modal,
 ModalContent,
 ModalHeader,
 ModalBody,
} from"@/src/components/ui/modal";
import { CollectionForm } from"./collection-form";
import {
 useCreateCollection,
 useUpdateCollection,
} from"@/src/common/hooks/cms/use-collections";
import { toast } from"sonner";
import { useTranslations } from"next-intl";
import type { CollectionType, MediaCollection } from"@/src/common/@types/@cms-media";

interface CollectionFormData {
 name: string;
 slug: string;
 description?: string;
 type: CollectionType;
 allowed_mime_types: string[];
 max_file_size: number;
 max_items?: number;
}

interface CollectionModalProps {
 isOpen: boolean;
 onClose: () => void;
 collection?: MediaCollection;
}

export function CollectionModal({
 isOpen,
 onClose,
 collection,
}: CollectionModalProps) {
 const t = useTranslations("cms.media");
 const isEditMode = !!collection;
 const createMutation = useCreateCollection();
 const updateMutation = useUpdateCollection();

 const isPending = createMutation.isPending || updateMutation.isPending;

 const handleSubmit = async (data: CollectionFormData) => {
 try {
 if (isEditMode && collection) {
 await updateMutation.mutateAsync({
 id: collection.id,
 data: {
 name: data.name,
 description: data.description,
 allowed_mime_types: data.allowed_mime_types,
 max_file_size: data.max_file_size,
 max_items: data.max_items,
 },
 });
 toast.success(t("collectionUpdateSuccess"));
 } else {
 await createMutation.mutateAsync({
 name: data.name,
 slug: data.slug,
 description: data.description,
 type: data.type,
 allowed_mime_types: data.allowed_mime_types,
 max_file_size: data.max_file_size,
 max_items: data.max_items,
 });
 toast.success(t("collectionCreateSuccess"));
 }
 onClose();
 } catch (err: any) {
 toast.error(err?.message || t("operationFailed"));
 }
 };

 return (
 <Modal isOpen={isOpen} onClose={onClose} size="2xl">
 <ModalContent>
 <ModalHeader>
 {isEditMode ? t("editCollectionTitle") : t("newCollection")}
 </ModalHeader>
 <ModalBody>
 <CollectionForm
 collection={collection}
 onSubmit={handleSubmit}
 onCancel={onClose}
 isSubmitting={isPending}
 />
 </ModalBody>
 </ModalContent>
 </Modal>
 );
}
