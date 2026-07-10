"use client";

import { use } from "react";
import Link from "next/link";
import { useConversationDetail } from "@/src/modules/portal/presentation/hooks/use-conversation-detail";
import { ConversationTranscript } from "@/src/presentation/components/organisms/portal/attendance/conversation-transcript";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

export default function ConversationDetailPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const { data, isLoading } = useConversationDetail(conversationId);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-xl">{data?.contact_name ?? data?.contact_number ?? "Conversa"}</h1>
      {isLoading || !data ? (
        <PortalTableSkeleton rows={6} />
      ) : (
        <>
          <ConversationTranscript messages={data.messages} />
          <Button asChild size="sm" variant="outline">
            <Link href={data.chatwoot_url} target="_blank" rel="noreferrer">
              Responder no Chatwoot
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
