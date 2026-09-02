export const siteConfig = {
  name: import.meta.env.VITE_SITE_NAME || 'tapless.ec',
  url: import.meta.env.VITE_SITE_URL || window.location.origin,
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '593992678401',
  paymentProvider: import.meta.env.VITE_PAYMENT_PROVIDER || 'demo',
  paymentCheckoutUrl: import.meta.env.VITE_PAYMENT_CHECKOUT_URL || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
} as const;

export const whatsappLink = (message = 'Hola Tapless.ec 👋 Quiero conocer las placas NFC para mi negocio.') =>
  `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const isBackendConfigured = Boolean(siteConfig.supabaseUrl && siteConfig.supabaseAnonKey);
