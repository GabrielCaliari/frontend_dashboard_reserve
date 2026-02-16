import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash } from "lucide-react";
import { Lead } from "../modals/LeadDetailModal";
import { displayOrigin } from "@/src/common/utils";
import { useTranslations } from "next-intl";

// Componente de Menu de Ações
function ActionsMenu({
  lead,
  onView,
}: {
  lead: Lead;
  onView: (lead: Lead) => void;
}) {
  const t = useTranslations("leadsTable");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex justify-center rounded-md border border-gray-700 shadow-sm px-2 py-2 bg-[#1a1a2e] text-sm font-medium text-gray-300 hover:bg-[#1e1e3a] focus:outline-none">
          <MoreVertical className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-gray-700">
        <DropdownMenuItem
          onClick={() => onView(lead)}
          className="text-blue-400 cursor-pointer flex items-center hover:bg-[#1e1e3a]"
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>{t("view")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-indigo-400 cursor-pointer flex items-center hover:bg-[#1e1e3a]">
          <Edit className="mr-2 h-4 w-4" />
          <span>{t("edit")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-400 cursor-pointer flex items-center hover:bg-[#1e1e3a]">
          <Trash className="mr-2 h-4 w-4" />
          <span>{t("delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Componente de Linha da Tabela
function LeadTableRow({
  lead,
  index,
  onView,
}: {
  lead: Lead;
  index: number;
  onView: (lead: Lead) => void;
}) {
  return (
    <tr
      key={lead.id}
      className={
        index % 2 === 0
          ? "bg-[#12121f] hover:bg-[#1e1e3a]"
          : "bg-[#16162a] hover:bg-[#1e1e3a]"
      }
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
        {lead.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200 text-center">
        {lead.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
        {lead.phone_number}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
        {lead.brand || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
        {lead.origin || displayOrigin(lead.origin as number)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
        {lead.created_at}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
        <ActionsMenu lead={lead} onView={onView} />
      </td>
    </tr>
  );
}

// Interface para as props da tabela
interface LeadsTableProps {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
}

// Componente de Tabela
export function LeadsTable({ leads, onViewLead }: LeadsTableProps) {
  const t = useTranslations();
  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[#12121f] rounded-lg">
        <p className="text-gray-400 text-lg mb-2">{t("leads.noLeadsFound")}</p>
        <p className="text-gray-500 text-sm">{t("leads.noDataToShow")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-full bg-[#12121f] divide-y divide-gray-800">
        <thead className="bg-[#1a1a2e]">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider text-center"
            >
              ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider text-center"
            >
              {t("common.name")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider text-center"
            >
              {t("common.phone")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider text-center"
            >
              {t("leads.brand")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider text-center"
            >
              {t("leads.origin")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider text-center"
            >
              {t("common.createdAt")}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider text-center"
            >
              {t("common.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#12121f] divide-y divide-gray-800">
          {leads.map((lead, index) => (
            <LeadTableRow
              key={lead.id}
              lead={lead}
              index={index}
              onView={onViewLead}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
