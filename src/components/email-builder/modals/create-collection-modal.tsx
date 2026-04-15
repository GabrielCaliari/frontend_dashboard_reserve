"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/presentation/components/atoms/reserve/modal";
import { useCreateCollection } from "@/src/common/hooks/leads/use-create-collection";
import {
  createCollectionSchema,
  type CreateCollectionFormData,
} from "@/src/shared/schemas/lead-schema";
import { CollectionAccessMode } from "@/src/shared/domain/types/@lead";
import { useState } from "react";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const accessModeLabels: Record<CollectionAccessMode, string> = {
  [CollectionAccessMode.PUBLIC]: "Public",
  [CollectionAccessMode.PRIVATE]: "Private (CORS)",
  [CollectionAccessMode.RESTRICTED]: "Restricted (API Key)",
};

const accessModeDescriptions: Record<CollectionAccessMode, string> = {
  [CollectionAccessMode.PUBLIC]: "Anyone can submit leads to this collection",
  [CollectionAccessMode.PRIVATE]:
    "Only allowed domains can submit leads (CORS protection)",
  [CollectionAccessMode.RESTRICTED]:
    "Requires API key authentication for submissions",
};

export function CreateCollectionModal({
  isOpen,
  onClose,
}: CreateCollectionModalProps) {
  const createCollection = useCreateCollection();
  const [domains, setDomains] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateCollectionFormData>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      access_mode: CollectionAccessMode.PUBLIC,
    },
  });

  const accessMode = watch("access_mode");

  const onSubmit = (data: CreateCollectionFormData) => {
    const payload = {
      ...data,
      allowed_domains:
        accessMode === CollectionAccessMode.PRIVATE && domains
          ? domains.split("\n").filter((d) => d.trim())
          : undefined,
    };

    createCollection.mutate(payload, {
      onSuccess: () => {
        reset();
        setDomains("");
        onClose();
      },
    });
  };

  const handleClose = () => {
    reset();
    setDomains("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <h2 className="text-xl font-semibold">Create Lead Collection</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Collection Name"
                placeholder="e.g., Landing Page Home"
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                isRequired
              />

              <Input
                label="Source Identifier"
                placeholder="e.g., website-main, landing-v1"
                description="Internal identifier for tracking"
                {...register("source")}
                isInvalid={!!errors.source}
                errorMessage={errors.source?.message}
                isRequired
              />

              <Select
                label="Access Mode"
                placeholder="Select access mode"
                {...register("access_mode")}
                isInvalid={!!errors.access_mode}
                errorMessage={errors.access_mode?.message}
                isRequired
              >
                {Object.entries(accessModeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>

              {accessMode && (
                <div className="p-3 bg-default-100 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {accessModeDescriptions[accessMode]}
                  </p>
                </div>
              )}

              {accessMode === CollectionAccessMode.PRIVATE && (
                <Textarea
                  label="Allowed Domains"
                  placeholder="https://example.com&#10;https://app.example.com"
                  description="One domain per line"
                  value={domains}
                  onValueChange={setDomains}
                  minRows={3}
                />
              )}

              {accessMode === CollectionAccessMode.RESTRICTED && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary">
                    A secret API key will be generated after creation. Make sure
                    to save it securely as it won't be shown again.
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={createCollection.isPending}
            >
              Create Collection
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
