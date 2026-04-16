"use client";

import { ReactNode } from "react";
import { Button, Input, Tabs, Tab, Chip } from "@heroui/react";
import { Search } from "lucide-react";

export interface CmsTabItem {
  id: string;
  label: string;
  count?: number;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
}

interface CmsPageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;

  // Action Button
  actionLabel?: string;
  actionIcon?: ReactNode;
  onActionClick?: () => void;
  isActionDisabled?: boolean;

  // Search
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Tabs
  tabs?: CmsTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  // Extra elements like BlogSelector
  extraTopContent?: ReactNode;
}

export function CmsPageHeader({
  title,
  description,
  icon,
  actionLabel,
  actionIcon,
  onActionClick,
  isActionDisabled = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  tabs,
  activeTab,
  onTabChange,
  extraTopContent,
}: CmsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {extraTopContent}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between w-full">
        <div className="min-w-0 flex items-start gap-4">
          {icon && (
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl bg-default-100 text-primary flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {icon && <span className="sm:hidden text-primary">{icon}</span>}
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {actionLabel && onActionClick && (
          <Button
            color="primary"
            onPress={onActionClick}
            isDisabled={isActionDisabled}
            startContent={actionIcon}
            className="w-full sm:w-auto font-medium shadow-sm"
          >
            {actionLabel}
          </Button>
        )}
      </div>

      {(onSearchChange !== undefined || (tabs && tabs.length > 0)) && (
        <div className="flex flex-col gap-2 w-full">
          {onSearchChange !== undefined && (
            <Input
              placeholder={searchPlaceholder}
              value={searchValue || ""}
              onValueChange={onSearchChange}
              startContent={
                <Search className="w-4 h-4 text-muted-foreground" />
              }
              isClearable
              onClear={() => onSearchChange("")}
              classNames={{
                base: "max-w-md",
                inputWrapper: "bg-default-50 border border-border shadow-none",
              }}
            />
          )}

          {tabs && tabs.length > 0 && onTabChange && (
            <Tabs
              aria-label="Filter tabs"
              selectedKey={activeTab || "all"}
              onSelectionChange={(key) => onTabChange(key as string)}
              variant="underlined"
              color="primary"
              classNames={{
                tabList:
                  "gap-4 sm:gap-6 w-full relative rounded-none p-0 border-b border-border overflow-x-auto",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent:
                  "group-data-[selected=true]:text-primary font-medium text-sm",
              }}
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  title={
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color={tab.color || "default"}
                          className="h-5 text-[10px] px-1"
                        >
                          {tab.count}
                        </Chip>
                      )}
                    </div>
                  }
                />
              ))}
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}
