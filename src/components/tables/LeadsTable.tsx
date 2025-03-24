import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash } from "lucide-react";
import { Lead } from "../modals/LeadDetailModal";
import { displayOrigin } from "@/src/common/utils";

// Componente de Menu de Ações
function ActionsMenu({ lead, onView }: { lead: Lead; onView: (lead: Lead) => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-2 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                    <MoreVertical className="h-5 w-5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem 
                    onClick={() => onView(lead)}
                    className="text-blue-600 cursor-pointer flex items-center"
                >
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Ver</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-indigo-600 cursor-pointer flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 cursor-pointer flex items-center">
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Excluir</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Componente de Linha da Tabela
function LeadTableRow({ lead, index, onView }: { lead: Lead; index: number; onView: (lead: Lead) => void }) {
    return (
        <tr key={lead.id} className={index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{lead.id}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{lead.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{lead.phone_number}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{lead.brand || '-'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{lead.origin || displayOrigin(lead.origin as number)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{lead.created_at}</td>
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
    if (!leads || leads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-lg mb-2">Nenhum lead encontrado</p>
                <p className="text-gray-400 text-sm">Não há dados para exibir neste momento.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Nome</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Telefone</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Marca</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Origem</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Data de Criação</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead, index) => (
                        <LeadTableRow key={lead.id} lead={lead} index={index} onView={onViewLead} />
                    ))}
                </tbody>
            </table>
        </div>
    );
} 