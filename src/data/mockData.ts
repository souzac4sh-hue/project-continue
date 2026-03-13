export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  fullDescription?: string;
  price: number;
  image: string;
  categoryId: string;
  featured?: boolean;
  bestSeller?: boolean;
  promotion?: boolean;
  promotionPrice?: number;
  status: 'active' | 'inactive';
  videoUrl?: string;
  notes?: string;
  benefits?: string[];
  badge?: 'best_seller' | 'fast' | 'recommended' | 'premium' | 'promo' | null;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  active: boolean;
  image?: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface HeroBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
  order: number;
}

export interface HeroButton {
  id: string;
  label: string;
  link: string;
  active: boolean;
  variant: 'primary' | 'secondary';
}

export interface Method {
  id: string;
  name: string;
  description: string;
  banner: string;
  status: 'active' | 'coming_soon' | 'unavailable';
  videoUrl?: string;
  notes?: string;
  linkedProductId?: string;
}

export interface Reference {
  id: string;
  image: string;
  comment: string;
  shortText: string;
  date: string;
  active: boolean;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  value: number;
  customerName: string;
  customerPhone: string;
  date: string;
  status: 'new' | 'awaiting_payment' | 'paid' | 'in_progress' | 'completed';
}

export interface Activity {
  id: string;
  message: string;
  date: string;
  active: boolean;
  scheduled?: boolean;
  showAsNotification?: boolean;
  productId?: string;
  displayName?: string;
  interval?: number;
  duration?: number;
}

export interface BrandSettings {
  brandName: string;
  slogan: string;
  logoUrl: string;
  mascotUrl: string;
  logoAnimation: boolean;
}

export interface ReferenceChannelSettings {
  channelLink: string;
  pageTitle: string;
  pageSubtitle: string;
  pageSupportText: string;
  ctaButtonText: string;
  ctaFinalText: string;
  displayCount: number;
}

export interface AuthorityStat {
  value: number;
  suffix: string;
  label: string;
  format: boolean;
}

export interface TrustBarItem {
  text: string;
}

export interface CheckoutTexts {
  waitingTitle: string;
  waitingSubtitle: string;
  urgencyMessage: string;
  centVariationNote: string;
  paymentSecureText: string;
  gatewayAlertText: string;
  transferAnywayText: string;
  guidanceTitle: string;
  guidanceDescription: string;
  guidanceBlockedText: string;
  guidanceTip1: string;
  guidanceTip2: string;
  guidanceTip3: string;
  guidanceSupportText: string;
  nudgeTitle: string;
  nudgeTip1: string;
  nudgeTip2: string;
  nudgeTip3: string;
  paidTitle: string;
  paidRedirectText: string;
  expiredTitle: string;
  expiredText: string;
  pixTimerMinutes: number;
  pixUrgencyMinutes: number;
}

export interface ColorSettings {
  primaryHue: number;
  primarySaturation: number;
  primaryLightness: number;
  accentHue: number;
  accentSaturation: number;
  accentLightness: number;
}

export type StoreMode = 'online' | 'busy' | 'offline';

export interface Settings {
  purchaseMode: 'manual' | 'automatic';
  pixEnabled: boolean;
  pixToken?: string;
  pixKey?: string;
  pixWebhook?: string;
  whatsappNumber: string;
  vipGroupLink: string;
  mainBanner: string;
  heroAutoplay: boolean;
  autoplayInterval: number;
  brand: BrandSettings;
  referenceChannel: ReferenceChannelSettings;
  authorityStats: AuthorityStat[];
  trustBarItems: TrustBarItem[];
  footerText: string;
  socialProofNames: string[];
  checkoutTexts: CheckoutTexts;
  fakeReviews: { name: string; text: string; rating: number; time: string }[];
  storeMode: StoreMode;
  storeModeMessage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  showTopNotification: boolean;
  topNotificationText: string;
  telegramLink: string;
  instagramLink: string;
  colors: ColorSettings;
}

export const BADGE_OPTIONS = [
  { value: 'best_seller', label: '🔥 Mais vendido' },
  { value: 'fast', label: '⚡ Rápido' },
  { value: 'recommended', label: '⭐ Recomendado' },
  { value: 'premium', label: '💎 Premium' },
  { value: 'promo', label: '🏷️ Promo' },
] as const;

export const FIXED_SECTIONS = [
  { id: 'best_sellers', name: '🔥 Mais Vendidos', key: 'bestSeller' as const },
  { id: 'cat-infos', name: 'Infos', categoryId: 'infos' },
  { id: 'cat-recargas', name: 'Recargas / Jogos', categoryId: 'recargas' },
  { id: 'cat-metodos', name: 'Métodos / Esquemas', categoryId: 'metodos' },
  { id: 'cat-cursos', name: 'Cursos e Mentoria', categoryId: 'cursos' },
];

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const categories: Category[] = [
  { id: 'infos', name: 'Infos', order: 1, active: true, image: '', icon: 'Info', color: '#a855f7', description: 'Conteúdos e informações exclusivas do mercado black.' },
  { id: 'recargas', name: 'Recargas / Jogos', order: 2, active: true, image: '', icon: 'Gamepad2', color: '#3b82f6', description: 'Serviços rápidos e diretos para quem quer resolver sem complicação.' },
  { id: 'metodos', name: 'Métodos / Esquemas', order: 3, active: true, image: '', icon: 'BookOpen', color: '#f59e0b', description: 'Estratégias utilizadas por quem já entende o jogo.' },
  { id: 'cursos', name: 'Cursos e Mentoria', order: 4, active: true, image: '', icon: 'GraduationCap', color: '#10b981', description: 'Aprenda o processo completo com orientação prática.' },
];

export const heroBanners: HeroBanner[] = [
  { id: '1', image: '', title: 'C4SH STORE', subtitle: 'Acesso direto a métodos, infos e estratégias do mercado black.', link: '#loja', active: true, order: 1 },
  { id: '2', image: '', title: 'Operação Consolidada', subtitle: 'Mais de 10 mil vendas realizadas e anos de experiência no mercado.', link: '#loja', active: true, order: 2 },
  { id: '3', image: '', title: 'Resultados Reais', subtitle: 'Conteúdo e métodos utilizados por quem realmente entende do mercado.', link: '/referencias', active: true, order: 3 },
];

export const heroButtons: HeroButton[] = [
  { id: '1', label: 'Entrar no Grupo VIP', link: 'https://chat.whatsapp.com/example', active: true, variant: 'primary' },
  { id: '2', label: 'Ver Referências', link: '/referencias', active: true, variant: 'secondary' },
];

export const products: Product[] = [
  {
    id: '1', name: 'Serviço Gold', slug: 'servico-gold', description: 'Acesso completo ao método exclusivo', fullDescription: 'Tenha acesso completo ao nosso método exclusivo que já transformou a vida de centenas de clientes.', price: 197, image: '', categoryId: 'infos', featured: true, bestSeller: true, status: 'active', badge: 'best_seller', benefits: ['Acesso vitalício', 'Suporte prioritário', 'Atualizações gratuitas'],
  },
  {
    id: '2', name: 'Pacote Diamante', slug: 'pacote-diamante', description: 'O pacote mais completo disponível', fullDescription: 'Nosso pacote mais completo com todos os recursos premium.', price: 497, image: '', categoryId: 'metodos', featured: true, status: 'active', badge: 'premium', benefits: ['Todos os recursos', 'Suporte 24h', 'Garantia de resultados'],
  },
  {
    id: '3', name: 'Método Express', slug: 'metodo-express', description: 'Resultados rápidos garantidos', fullDescription: 'Para quem quer resultados imediatos.', price: 97, image: '', categoryId: 'metodos', bestSeller: true, status: 'active', badge: 'fast', benefits: ['Resultados rápidos', 'Método testado', 'Fácil de aplicar'],
  },
  {
    id: '4', name: 'E-book Exclusivo', slug: 'e-book-exclusivo', description: 'Guia completo em formato digital', fullDescription: 'E-book com mais de 200 páginas de conteúdo exclusivo.', price: 47, image: '', categoryId: 'infos', promotion: true, promotionPrice: 29, status: 'active', badge: 'recommended', benefits: ['200+ páginas', 'Conteúdo exclusivo', 'Download imediato'],
  },
  {
    id: '5', name: 'Mentoria VIP', slug: 'mentoria-vip', description: 'Acompanhamento personalizado', fullDescription: 'Mentoria individual com acompanhamento personalizado por 30 dias.', price: 997, image: '', categoryId: 'cursos', featured: true, status: 'active', badge: 'premium', benefits: ['30 dias de mentoria', 'Individual e personalizado', 'Resultados garantidos'],
  },
  {
    id: '6', name: 'Recarga Premium', slug: 'recarga-premium', description: 'Recarga instantânea com bônus', fullDescription: 'Recarga para jogos com bônus exclusivo.', price: 50, image: '', categoryId: 'recargas', bestSeller: true, status: 'active', badge: 'fast', benefits: ['Entrega imediata', 'Bônus exclusivo', 'Suporte rápido'],
  },
];

export const methods: Method[] = [
  { id: '1', name: 'Método Alpha', description: 'Nosso método principal com maior taxa de sucesso.', banner: '', status: 'active', linkedProductId: '1' },
  { id: '2', name: 'Método Beta', description: 'Alternativa rápida para resultados em curto prazo.', banner: '', status: 'active', linkedProductId: '3' },
  { id: '3', name: 'Método Gamma', description: 'Novo método em fase final de testes.', banner: '', status: 'coming_soon' },
  { id: '4', name: 'Método Delta', description: 'Temporariamente indisponível para manutenção.', banner: '', status: 'unavailable' },
];

export const references: Reference[] = [
  { id: '1', image: '', comment: 'Entrega rápida e organizada. Recomendo demais.', shortText: 'Cliente C4SH', date: '2025-03-10', active: true },
  { id: '2', image: '', comment: 'Funcionou perfeitamente. Processo simples e direto.', shortText: 'Cliente satisfeito', date: '2025-03-09', active: true },
  { id: '3', image: '', comment: 'Recomendo para quem quer algo direto e confiável.', shortText: 'Compra confirmada', date: '2025-03-08', active: true },
  { id: '4', image: '', comment: 'Já é minha terceira compra. Sempre entregam com agilidade.', shortText: 'Cliente recorrente', date: '2025-03-07', active: true },
  { id: '5', image: '', comment: 'Acesso direto sem enrolação. Operação séria.', shortText: 'Resultado real', date: '2025-03-06', active: true },
];

export const orders: Order[] = [
  { id: 'PED001', productId: '1', productName: 'Serviço Gold', value: 197, customerName: 'João Silva', customerPhone: '11999999999', date: '2025-03-12', status: 'completed' },
  { id: 'PED002', productId: '2', productName: 'Pacote Diamante', value: 497, customerName: 'Maria Santos', customerPhone: '11988888888', date: '2025-03-12', status: 'paid' },
  { id: 'PED003', productId: '3', productName: 'Método Express', value: 97, customerName: 'Pedro Costa', customerPhone: '11977777777', date: '2025-03-11', status: 'in_progress' },
  { id: 'PED004', productId: '4', productName: 'E-book Exclusivo', value: 29, customerName: 'Ana Oliveira', customerPhone: '11966666666', date: '2025-03-11', status: 'new' },
];

export const activities: Activity[] = [
  { id: '1', message: 'adquiriu acesso recentemente', date: '2025-03-12', active: true, showAsNotification: true, displayName: 'M**rio', interval: 35, duration: 6 },
  { id: '2', message: 'finalizou um pedido', date: '2025-03-12', active: true, showAsNotification: true, displayName: 'An***a', interval: 45, duration: 6 },
  { id: '3', message: 'acessou este método', date: '2025-03-11', active: true, showAsNotification: true, displayName: 'Jo**o', interval: 55, duration: 6 },
  { id: '4', message: 'Pedido confirmado para um cliente', date: '2025-03-11', active: true, showAsNotification: false },
];

export const defaultSettings: Settings = {
  purchaseMode: 'manual',
  pixEnabled: false,
  whatsappNumber: '5511999999999',
  vipGroupLink: 'https://chat.whatsapp.com/example',
  mainBanner: '',
  heroAutoplay: true,
  autoplayInterval: 5,
  brand: {
    brandName: 'C4SH STORE',
    slogan: 'Operação consolidada no mercado black',
    logoUrl: '',
    mascotUrl: '',
    logoAnimation: true,
  },
  referenceChannel: {
    channelLink: 'https://t.me/c4shstore',
    pageTitle: 'Canal de Referências C4SH STORE',
    pageSubtitle: 'Resultados reais, entregas confirmadas e feedbacks de clientes da operação.',
    pageSupportText: 'Veja algumas referências abaixo. Para acompanhar todas as atualizações, entre no canal oficial de referências.',
    ctaButtonText: 'Entrar no Canal de Referências',
    ctaFinalText: 'As referências completas e atualizações diárias estão disponíveis no canal oficial da C4SH STORE.',
    displayCount: 8,
  },
  authorityStats: [
    { value: 10000, suffix: '+', label: 'Vendas realizadas', format: true },
    { value: 10, suffix: '+ anos', label: 'No mercado', format: false },
    { value: 3000, suffix: '+', label: 'Clientes atendidos', format: true },
    { value: 1200, suffix: '+', label: 'Referências reais', format: true },
  ],
  trustBarItems: [
    { text: 'Entrega rápida' },
    { text: 'Pagamento via Pix' },
    { text: 'Atendimento confiável' },
    { text: 'Processo seguro' },
    { text: 'Clientes satisfeitos' },
    { text: 'Pedido direto no site' },
  ],
  footerText: 'Operação consolidada no mercado black com milhares de clientes atendidos. Processo simples, direto e confiável.',
  socialProofNames: [
    'Jo** de SP', 'An** de RJ', 'Ca** de MG', 'Lu** de PR', 'Ma** de SC',
    'Fe** de BA', 'Gu** de RS', 'Ra** de PE', 'Da** de CE', 'Br** de GO',
    'Pa** de DF', 'Vi** de ES', 'Th** de PA', 'Le** de AM', 'Is** de MT',
  ],
  checkoutTexts: {
    waitingTitle: 'Aguardando pagamento...',
    waitingSubtitle: 'Após realizar o pagamento, a confirmação pode levar alguns segundos.',
    urgencyMessage: '⚠️ Restam poucos minutos para concluir o pagamento',
    centVariationNote: 'O valor do Pix pode variar alguns centavos automaticamente para identificação do pagamento.',
    paymentSecureText: 'Pagamento seguro via Pix',
    gatewayAlertText: 'Alguns bancos podem exibir alertas automáticos ao pagar por gateway',
    transferAnywayText: 'Caso apareça a opção, você pode tocar em "Transferir mesmo assim"',
    guidanceTitle: 'Problemas para pagar?',
    guidanceDescription: 'Alguns bancos podem exibir alertas automáticos de segurança ao pagar via gateway Pix. Isso depende do banco do cliente e não significa que exista problema no pedido.',
    guidanceBlockedText: 'Se aparecer alguma mensagem de bloqueio ou alerta, tente as opções abaixo:',
    guidanceTip1: 'Toque em "Transferir mesmo assim", caso o aplicativo do banco permita continuar',
    guidanceTip2: 'Copie o código Pix e pague manualmente pelo aplicativo do banco',
    guidanceTip3: 'Tente realizar o pagamento por outro banco — alguns aprovam normalmente quando outros bloqueiam',
    guidanceSupportText: 'Se após tentar essas opções o pagamento ainda não funcionar, fale com nosso suporte.',
    nudgeTitle: 'Seu banco está dificultando o pagamento?',
    nudgeTip1: 'Toque em "Transferir mesmo assim"',
    nudgeTip2: 'Pague usando outro banco',
    nudgeTip3: 'Copie o código Pix manualmente',
    paidTitle: 'Pagamento confirmado!',
    paidRedirectText: 'Redirecionando para atendimento...',
    expiredTitle: 'Pix expirado',
    expiredText: 'O tempo para pagamento esgotou.',
    pixTimerMinutes: 10,
    pixUrgencyMinutes: 3,
  },
  fakeReviews: [
    { name: 'L**cas', text: 'Entrega rápida e funciona perfeitamente. Recomendo!', rating: 5, time: 'há 2 dias' },
    { name: 'An**a', text: 'Superou minhas expectativas. Processo simples e direto.', rating: 5, time: 'há 4 dias' },
    { name: 'R**ael', text: 'Já é minha segunda compra. Sempre entregam com qualidade.', rating: 5, time: 'há 1 semana' },
    { name: 'M**ia', text: 'Atendimento excelente e resultado garantido.', rating: 5, time: 'há 1 semana' },
  ],
  storeMode: 'online',
  storeModeMessage: '',
  maintenanceMode: false,
  maintenanceMessage: '🔧 Estamos em manutenção. Voltamos em breve!',
  showTopNotification: false,
  topNotificationText: '',
  telegramLink: '',
  instagramLink: '',
  colors: {
    primaryHue: 43,
    primarySaturation: 74,
    primaryLightness: 49,
    accentHue: 43,
    accentSaturation: 74,
    accentLightness: 49,
  },
};
