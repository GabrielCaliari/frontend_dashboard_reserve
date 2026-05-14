"use client";

import { Card, CardBody, Chip } from "@heroui/react";
import { FileText, FileCheck, Archive, Files } from "lucide-react";
import type { BlogWithStats } from "@/src/shared/domain/types/@cms-blog";

interface BlogStatsProps {
  blog: BlogWithStats;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "default" | "success" | "warning" | "primary";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardBody className="flex flex-row items-center gap-4 p-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export default function BlogStats({ blog }: BlogStatsProps) {
  const { article_counts } = blog;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Article Statistics</h3>
        <Chip variant="flat" color="primary">
          {article_counts.total} Total
        </Chip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Articles"
          value={article_counts.total}
          icon={<Files size={24} className="text-primary" />}
          color="primary"
        />
        <StatCard
          label="Draft"
          value={article_counts.draft}
          icon={<FileText size={24} className="text-muted-foreground" />}
          color="default"
        />
        <StatCard
          label="Published"
          value={article_counts.published}
          icon={<FileCheck size={24} className="text-success" />}
          color="success"
        />
        <StatCard
          label="Archived"
          value={article_counts.archived}
          icon={<Archive size={24} className="text-warning" />}
          color="warning"
        />
      </div>
    </div>
  );
}
