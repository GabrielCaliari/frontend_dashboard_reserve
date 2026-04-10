import { SimpleEmailEditorDialog } from "./simple-email-editor-dialog";
import { IEmailCampaign } from "@/src/shared/domain/types/@email-campaign";
import { IEmail } from "@/src/shared/domain/types/@email";

export function CopyCreatedDialog({
  isOpen,
  onClose,
  email,
  campaign,
  primaryCopy,
}: CopyCreatedDialogProps) {
  return (
    <SimpleEmailEditorDialog
      isOpen={isOpen}
      onClose={onClose}
      email={email}
      campaign={campaign}
      primaryCopy={primaryCopy}
    />
  );
}

interface CopyCreatedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  campaign: IEmailCampaign;
  primaryCopy: IEmail | null;
}
