import {
  BarChart3,
  BedDouble,
  BookMarked,
  Bot,
  Calendar,
  CalendarDays,
  CalendarRange,
  DollarSign,
  FileText,
  Globe,
  Instagram,
  LayoutDashboardIcon,
  Link2,
  ListChecks,
  Megaphone,
  MessageCircle,
  PiggyBank,
  Settings,
  Share2,
  Target,
  TrendingUp,
  History,
} from "lucide-react";

export interface HotelNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  subItems?: HotelNavItem[];
}

/**
 * Navegacao do Painel Reserve, agrupada por TIPO de assunto em vez de
 * empilhada num submenu unico "Hotel Marketing".
 *
 * A Visao Geral fica solta no topo de proposito: e a primeira tela depois do
 * login e responde "esta indo bem?" em 10 segundos (§3.1) — enterrar ela num
 * grupo custaria um clique justamente na tela mais usada.
 *
 * O Funil do Bot fica em Atendimento, NAO no grupo Leads: o grupo Leads e o
 * modulo de captacao do site; o funil do bot e o kanban das conversas de
 * WhatsApp. Fluxos diferentes, dados diferentes, endpoints diferentes.
 *
 * Os ids batem com `MODULE_NAV_IDS.hotel` em
 * `src/modules/settings/domain/navigation.ts` — id que nao estiver la nao e
 * gateado pelo modulo e vaza para tenant que nao contratou. Excecao: o grupo
 * "Calendario" (`hotel-motor-menu` e os ids `motor-*`) e gateado pelo modulo
 * `motor` via `MODULE_NAV_IDS.motor` — motor de reservas e contratado a parte
 * do painel de marketing.
 */
export function buildHotelNavItems(
  t: (key: string) => string,
): HotelNavItem[] {
  return [
    {
      id: "hotel-overview",
      label: t("hotelOverview"),
      icon: LayoutDashboardIcon,
      path: "/dashboard/hotel/overview",
    },
    {
      id: "hotel-marketing-menu",
      label: t("hotelMarketing"),
      icon: Megaphone,
      subItems: [
        {
          id: "hotel-trafego",
          label: t("hotelTrafego"),
          icon: BarChart3,
          path: "/dashboard/hotel/trafego",
        },
        {
          id: "hotel-campaigns",
          label: t("hotelCampaigns"),
          icon: Megaphone,
          path: "/dashboard/hotel/campaigns",
        },
        {
          id: "hotel-instagram",
          label: t("hotelInstagram"),
          icon: Instagram,
          path: "/dashboard/hotel/instagram",
        },
        {
          id: "hotel-site",
          label: t("hotelSite"),
          icon: Globe,
          path: "/dashboard/hotel/site",
        },
      ],
    },
    {
      id: "hotel-atendimento-menu",
      label: t("hotelAtendimento"),
      icon: MessageCircle,
      subItems: [
        {
          id: "hotel-conversas",
          label: t("hotelConversas"),
          icon: MessageCircle,
          path: "/dashboard/hotel/atendimento",
        },
        {
          id: "hotel-bot",
          label: t("hotelBot"),
          icon: Bot,
          path: "/dashboard/hotel/atendimento/bot",
        },
        {
          id: "hotel-funil",
          label: t("hotelFunil"),
          icon: Target,
          path: "/dashboard/hotel/funil",
        },
        {
          id: "hotel-whatsapp-links",
          label: t("hotelWhatsappLinks"),
          icon: Link2,
          path: "/dashboard/hotel/whatsapp-links",
        },
      ],
    },
    {
      id: "hotel-reservas-menu",
      label: t("hotelReservas"),
      icon: Calendar,
      subItems: [
        {
          id: "hotel-ota",
          label: t("hotelOta"),
          icon: TrendingUp,
          path: "/dashboard/hotel/ota",
        },
        {
          id: "hotel-calendario",
          label: t("hotelCalendario"),
          icon: Calendar,
          path: "/dashboard/hotel/calendario",
        },
      ],
    },
    {
      id: "hotel-motor-menu",
      label: t("hotelMotor"),
      icon: CalendarDays,
      subItems: [
        {
          id: "motor-calendario",
          label: t("motorCalendario"),
          icon: CalendarRange,
          path: "/dashboard/motor/calendario",
        },
        {
          id: "motor-tarifas",
          label: t("motorTarifas"),
          icon: DollarSign,
          path: "/dashboard/motor/tarifas",
        },
        {
          id: "motor-reservas",
          label: t("motorReservas"),
          icon: BookMarked,
          path: "/dashboard/motor/reservas",
        },
        {
          id: "motor-acomodacoes",
          label: t("motorAcomodacoes"),
          icon: BedDouble,
          path: "/dashboard/motor/acomodacoes",
        },
        {
          id: "motor-canais",
          label: t("motorCanais"),
          icon: Share2,
          path: "/dashboard/motor/canais",
        },
      ],
    },
    {
      id: "hotel-resultados-menu",
      label: t("hotelResultados"),
      icon: PiggyBank,
      subItems: [
        {
          id: "hotel-retorno",
          label: t("hotelRetorno"),
          icon: PiggyBank,
          path: "/dashboard/hotel/retorno",
        },
        {
          id: "hotel-reports",
          label: t("hotelReports"),
          icon: FileText,
          path: "/dashboard/hotel/reports",
        },
        {
          id: "hotel-evolucao",
          label: t("hotelEvolucao"),
          icon: History,
          path: "/dashboard/hotel/evolucao",
        },
      ],
    },
    {
      id: "hotel-conta-menu",
      label: t("hotelConta"),
      icon: Settings,
      subItems: [
        {
          id: "hotel-plano",
          label: t("hotelPlano"),
          icon: Target,
          path: "/dashboard/hotel/plano",
        },
        {
          id: "hotel-atividades",
          label: t("hotelAtividades"),
          icon: ListChecks,
          path: "/dashboard/hotel/atividades",
        },
        {
          id: "hotel-config",
          label: t("hotelConfig"),
          icon: Settings,
          path: "/dashboard/hotel/config",
        },
      ],
    },
  ];
}

/** Ids dos grupos, para o aside abrir o certo conforme a rota ativa. */
export const HOTEL_GROUP_IDS = [
  "hotel-marketing-menu",
  "hotel-atendimento-menu",
  "hotel-reservas-menu",
  "hotel-motor-menu",
  "hotel-resultados-menu",
  "hotel-conta-menu",
] as const;
