"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@heroui/react";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/presentation/components/atoms/reserve/modal";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Progress,
  useDisclosure,
} from "@heroui/react";

import { CardType } from "./kanban-board-with-autosave";
import { formatDateTimeToBRL } from "@/src/shared/utils";
import useCompleteScreening from "@/src/common/hooks/use-complete-screening";
import { useRouter } from "next/navigation";
import { ETemperature } from "@/src/shared/interfaces/lead-qualification.interface";
import useTemperatureAnalysisByMessageId from "@/src/common/hooks/use-temperature-analysis-by-message-id";
import { useTranslations } from "next-intl";

interface KanbanCardProps {
  card: CardType;
  onRemove: (id: string) => void;
}

export default function KanbanCard({ card, onRemove }: KanbanCardProps) {
  const t = useTranslations("kanban");
  const tCommon = useTranslations("common");
  const { refresh } = useRouter();
  const { execCompleteScreening } = useCompleteScreening();
  const { execTemperatureAnalysisByMessageId } =
    useTemperatureAnalysisByMessageId();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCloseScreeningOpen, setIsCloseScreeningOpen] = useState(false);
  const [isTemperatureAnalysisOpen, setIsTemperatureAnalysisOpen] =
    useState(false);

  const [cardDetails, setCardDetails] = useState(card);

  const [isLoadingCloseScreening, setIsLoadingCloseScreening] = useState(false);
  const [isLoadingTemperatureAnalysis, setIsLoadingTemperatureAnalysis] =
    useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const onCompleteScreeningModalOpen = () => {
    setIsDetailsOpen(false);
    setIsCloseScreeningOpen(true);
  };

  const onTemperatureAnalysisModalOpen = () => {
    setIsDetailsOpen(false);
    setIsTemperatureAnalysisOpen(true);
  };

  const completeScreening = async () => {
    setIsLoadingCloseScreening(true);
    const id = card.id.split("-")[0];
    await execCompleteScreening(id);
    setIsLoadingCloseScreening(false);
    setIsCloseScreeningOpen(false);
    window.location.reload();
  };

  const temperatureAnalysis = async () => {
    const id = card.id.split("-")[0];
    setIsLoadingTemperatureAnalysis(true);
    await execTemperatureAnalysisByMessageId(id);
    setIsTemperatureAnalysisOpen(false);
    setIsLoadingTemperatureAnalysis(false);
    window.location.reload();
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-md border bg-card p-3 relative"
        onClick={() => setIsDetailsOpen(true)}
      >
        <div className="flex items-start justify-between">
          <h4 className="font-medium">{card.title}</h4>
          {/* <Dropdown>
 <DropdownTrigger asChild onClick={(e: any) => e.stopPropagation()}>
 <Button variant="ghost" size="sm" className="-mr-2 h-8 w-8 p-0">
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </DropdownTrigger>
 <DropdownMenu>
 <DropdownItem
 key={1}
 onClick={(e: any) => {
 e.stopPropagation()
 onRemove(card.id)
 }}
 className="text-destructive"
 >
 <div className="flex items-center gap-2 font-semibold">
 <Trash2 className="mr-2 h-4 w-4" />
 Excluir Cartão
 </div>
 </DropdownItem>
 </DropdownMenu>
 </Dropdown> */}
        </div>
        {card.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {card.description.length > 100
              ? `${card.description.substring(0, 100)}...`
              : card.description}
          </p>
        )}
        <div
          className={`absolute top-2 right-2 w-3 h-3 rounded-full 
 ${
   card.details[0].temperature == ETemperature.cold
     ? "bg-blue-700"
     : card.details[0].temperature == ETemperature.warm
       ? "bg-yellow-700"
       : card.details[0].temperature == ETemperature.hot
         ? "bg-red-700"
         : "bg-default-100"
 }`}
          title={
            card.details[0].temperature == ETemperature.cold
              ? t("coldLead")
              : card.details[0].temperature == ETemperature.warm
                ? t("warmLead")
                : card.details[0].temperature == ETemperature.hot
                  ? t("hotLead")
                  : t("undefinedTemperature")
          }
        />
      </div>
      <Modal isOpen={isCloseScreeningOpen} onOpenChange={setIsDetailsOpen}>
        <ModalContent className="sm:max-w-1xl overflow-auto hide-scrollbar py-4">
          <ModalHeader className="flex items-center justify-between">
            <h2>{t("completeScreening")}</h2>
          </ModalHeader>
          <ModalBody>
            <p>
              {t("confirmCloseScreening")} <b>{card.title}</b>
            </p>
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center gap-2 w-full">
              <Button
                isDisabled={isLoadingCloseScreening}
                className="w-full bg-red-600 text-white"
                onClick={completeScreening}
              >
                {tCommon("confirm")}
              </Button>
              <Button
                className="w-full"
                onClick={() => setIsCloseScreeningOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isTemperatureAnalysisOpen}
        onOpenChange={setIsTemperatureAnalysisOpen}
      >
        <ModalContent className="sm:max-w-1xl overflow-auto hide-scrollbar py-4">
          <ModalHeader className="flex items-center justify-between">
            <h2>{t("leadInterestLevel")}</h2>
          </ModalHeader>
          <ModalBody>
            <p>
              {t("confirmInterestAnalysis")} <b>{card.title}</b>
            </p>
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center gap-2 w-full">
              <Button
                isDisabled={isLoadingTemperatureAnalysis}
                className="w-full bg-red-600 text-white"
                onClick={temperatureAnalysis}
              >
                {tCommon("confirm")}
              </Button>
              <Button
                className="w-full"
                onClick={() => setIsCloseScreeningOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <ModalContent className="sm:max-w-2xl max-h-[500px] overflow-auto hide-scrollbar">
          <ModalHeader className="flex items-center justify-between px-8">
            <h2>{t("conversationDetails")}</h2>
            <div className="flex gap-2">
              <Button
                isDisabled={isLoadingTemperatureAnalysis}
                className="bg-orange-600 text-white"
                variant="solid"
                onClick={onTemperatureAnalysisModalOpen}
              >
                {t("analyzeTemperature")}
              </Button>
              <Button
                isDisabled={card.details[0].screening_complete}
                className="bg-red-600 text-white"
                variant="solid"
                onClick={onCompleteScreeningModalOpen}
              >
                {t("completeScreening")}
              </Button>
            </div>
          </ModalHeader>
          <ModalBody>
            {card.details.map((detail, index) => (
              <div
                key={index}
                className="mb-4 flex flex-col gap-1 border-solid border-2 border-[#ebebeb] p-3 rounded-md"
              >
                <p className="font-semibold text-[18px]">
                  {detail.type == "pergunta"
                    ? t("system")
                    : detail.profile_name}
                </p>
                <p className="text-[16px]">{detail.json.conteudo}</p>
                <div className="flex justify-between">
                  <p className="text-[14px] text-muted-foreground">
                    {formatDateTimeToBRL(new Date(detail.message_date))}
                  </p>
                  <p className="text-[14px] font-semibold text-muted-foreground">
                    {detail.json.slug}
                  </p>
                </div>
              </div>
            ))}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
