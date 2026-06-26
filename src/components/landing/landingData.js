export const navItems = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

export const trustMetrics = [
  { value: "Agenda online", label: "Reservas públicas por slug da arena" },
  { value: "Financeiro", label: "Controle de pagamentos e mensalistas" },
  { value: "WhatsApp", label: "Solicitações prontas para atendimento" },
  { value: "Multiusuário", label: "Perfis e permissões por arena" },
];

export const problemas = [
  "Reservas espalhadas em conversas e planilhas.",
  "Horários duplicados por falta de visão em tempo real.",
  "Mensalistas, avulsos e pagamentos sem padrão operacional.",
  "Equipe sem clareza sobre pendências do dia.",
];

export const funcionalidades = [
  {
    title: "Agenda visual por semana",
    text: "Veja horários livres, pendentes, pagos, fixos e mensalistas em uma visão rápida para operação diária.",
  },
  {
    title: "Página pública da arena",
    text: "Cada arena ganha um link público por slug para exibir horários disponíveis e receber solicitações.",
  },
  {
    title: "Clientes e histórico",
    text: "Centralize contatos, reservas e informações importantes para atender melhor e vender mais recorrência.",
  },
  {
    title: "Financeiro operacional",
    text: "Acompanhe valores, pagamentos, pendências e indicadores essenciais sem sair do fluxo da agenda.",
  },
  {
    title: "Mensalistas organizados",
    text: "Controle contratos recorrentes e libere exceções com segurança quando houver necessidade.",
  },
  {
    title: "Permissões por perfil",
    text: "Dê acesso para administradores e equipe com regras claras para proteger a operação.",
  },
];

export const beneficios = [
  "Menos retrabalho para confirmar horários.",
  "Mais velocidade no atendimento pelo WhatsApp.",
  "Operação padronizada para equipe e gestores.",
  "Visão clara de agenda, clientes e recebimentos.",
  "Experiência pública mais profissional para a arena.",
];

export const passos = [
  {
    title: "Configure sua arena",
    text: "Cadastre dados, usuários, horários e regras principais de operação.",
  },
  {
    title: "Publique a agenda",
    text: "Compartilhe o link público para clientes consultarem horários disponíveis.",
  },
  {
    title: "Gerencie tudo no painel",
    text: "Acompanhe reservas, mensalistas, clientes e financeiro em um único lugar.",
  },
];

export const diferenciais = [
  "Criado para arenas esportivas, não para agendas genéricas.",
  "Interface premium, rápida e simples para rotina de balcão.",
  "Fluxo público e interno conectados sem expor dados sensíveis.",
  "Base preparada para expansão SaaS e múltiplas arenas.",
];

export const depoimentos = [
  {
    quote:
      "O ArenaBase trouxe uma visão muito mais clara dos horários e reduziu a confusão no atendimento.",
    author: "Gestor de arena esportiva",
    role: "Operação e agenda",
  },
  {
    quote:
      "A equipe consegue entender pendências e reservas do dia sem depender de mensagens antigas.",
    author: "Administrador de quadras",
    role: "Atendimento",
  },
  {
    quote:
      "A página pública deixa a arena com aparência profissional e facilita a chegada de novas reservas.",
    author: "Responsável comercial",
    role: "Vendas locais",
  },
];

export const planos = [
  {
    name: "Essencial",
    price: "Sob consulta",
    description: "Para arenas que querem sair da planilha e organizar a agenda.",
    features: ["Agenda semanal", "Página pública", "Clientes", "Suporte inicial"],
  },
  {
    name: "Profissional",
    price: "Sob consulta",
    description: "Para operação com equipe, mensalistas e controle financeiro.",
    featured: true,
    features: [
      "Tudo do Essencial",
      "Mensalistas",
      "Financeiro",
      "Permissões por usuário",
    ],
  },
  {
    name: "Rede",
    price: "Sob consulta",
    description: "Para gestores com múltiplas arenas ou expansão comercial.",
    features: [
      "Múltiplas arenas",
      "Painel SaaS",
      "Implantação guiada",
      "Prioridade no suporte",
    ],
  },
];

export const perguntas = [
  {
    question: "O ArenaBase substitui minha planilha atual?",
    answer:
      "Sim. A proposta é centralizar agenda, clientes, mensalistas e financeiro em uma experiência própria para arenas.",
  },
  {
    question: "Meus clientes conseguem ver horários disponíveis?",
    answer:
      "Sim. Cada arena pode ter uma página pública por slug para consulta de horários e solicitação de reserva.",
  },
  {
    question: "Preciso instalar algum aplicativo?",
    answer:
      "Não. O ArenaBase roda no navegador e foi pensado para funcionar bem em desktop e celular.",
  },
  {
    question: "O sistema altera minhas rotas internas?",
    answer:
      "Não. A landing é uma camada pública separada da operação administrativa.",
  },
];
