"use client";

import type { ReactNode } from"react";
import { Button, Card, CardBody } from"@heroui/react";
import { ArrowLeft } from"lucide-react";
import { useRouter } from"next/navigation";
import { LayoutScopeRoot } from"@/src/layout/root-layout";

type IconColor ="warning" |"destructive";

interface ArticleEditorGuardProps {
 icon: ReactNode;
 iconColor: IconColor;
 title: string;
 description: string;
 backHref?: string;
 backLabel?: string;
}

const colorMap: Record<IconColor, { border: string; bg: string; iconBg: string }> = {
 warning: {
 border:"border-warning/20",
 bg:"bg-warning/5",
 iconBg:"bg-warning/10",
 },
 destructive: {
 border:"border-destructive/20",
 bg:"bg-destructive/5",
 iconBg:"bg-destructive/10",
 },
};

export function ArticleEditorGuard({
 icon,
 iconColor,
 title,
 description,
 backHref,
 backLabel ="Back to Articles",
}: ArticleEditorGuardProps) {
 const router = useRouter();
 const colors = colorMap[iconColor];

 return (
 <LayoutScopeRoot routeActive="articles">
 <div className="p-8 max-w-7xl mx-auto">
 <div className="flex flex-col items-center justify-center py-16">
 <Card className={`max-w-md ${colors.border} ${colors.bg}`}>
 <CardBody className="p-8 text-center">
 <div
 className={`w-16 h-16 rounded-full ${colors.iconBg} flex items-center justify-center mx-auto mb-4`}
 >
 {icon}
 </div>
 <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
 <p className="text-muted-foreground mb-6">{description}</p>
 {backHref && (
 <Button
 variant="bordered"
 onPress={() => router.push(backHref!)}
 startContent={<ArrowLeft className="w-4 h-4" />}
 >
 {backLabel}
 </Button>
 )}
 </CardBody>
 </Card>
 </div>
 </div>
 </LayoutScopeRoot>
 );
}
