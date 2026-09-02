import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { products as seed, Product } from './data/products';
import { categories } from './data/categories';
import { siteConfig, whatsappLink, isBackendConfigured } from './lib/config';
import { createOrderPdf, downloadPdf } from './lib/orderPdf';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const money = (n: number) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);

type Lang = 'es' | 'en';
type P = Product & { active?: boolean };
type Item = { p: P; qty: number; customization?: string };
type Review = { id: string; name: string; business: string; comment: string; avatar: string };

const siteBase = import.meta.env.BASE_URL;
const logoSrc = `${siteBase}brand/tapless.ec.png`;
const wa = whatsappLink();
const active = (p: P) => p.active !== false && p.stock > 0;

const copy = {
  es: {
    products: 'Productos',
    reviews: 'Opiniones',
    faq: 'Dudas frecuentes',
    contact: 'Hablemos',
    cart: 'Carrito',
    hero: 'Convierte cada visita en una reseña.',
    text: 'La forma más sencilla de pedir feedback y hacer que tu negocio se vea tan bien como trabaja.',
    cta: 'Descubre la colección',
  },
  en: {
    products: 'Products',
    reviews: 'Reviews',
    faq: 'FAQ',
    contact: 'Let’s talk',
    cart: 'Cart',
    hero: 'Turn every visit into a review.',
    text: 'The simple way to ask for feedback and help your business look as good as it works.',
    cta: 'Explore the collection',
  },
};

async function backend() {
  if (!isBackendConfigured) return null;
  const response = await fetch(
    `${siteConfig.supabaseUrl}/rest/v1/products?select=*&active=eq.true&stock=gt.0&order=created_at.asc`,
    {
      headers: {
        apikey: siteConfig.supabaseAnonKey,
        Authorization: `Bearer ${siteConfig.supabaseAnonKey}`,
      },
    },
  );
  if (!response.ok) throw Error('catalog');
  return (await response.json()).map((p: any) => ({
    ...p,
    compareAtPrice: p.compare_at_price,
    shortDescription: p.short_description,
    isNew: p.is_new,
    onSale: p.on_sale,
  }));
}

function useCatalog() {
  const [items, setItems] = useState<P[]>(() => {
    try {
      const saved = localStorage.getItem('tapless-products');
      const version = localStorage.getItem('tapless-catalog-version');
      const parsed = saved ? JSON.parse(saved) : null;

      // Version 3 fixes the old local migration that accidentally kept only one product.
      if (version !== '3' || !Array.isArray(parsed) || parsed.length < 2) {
        localStorage.setItem('tapless-catalog-version', '3');
        return seed.slice();
      }
      return parsed;
    } catch {
      return seed.slice();
    }
  });
  const [loading, setLoading] = useState(isBackendConfigured);
  const [error, setError] = useState('');

  useEffect(() => {
    let gone = false;
    backend()
      .then((next) => {
        if (!gone && next) setItems(next);
      })
      .catch(() => !gone && setError('No se pudo cargar el catálogo actualizado.'))
      .finally(() => !gone && setLoading(false));
    return () => {
      gone = true;
    };
  }, []);

  useEffect(() => {
    if (!isBackendConfigured) localStorage.setItem('tapless-products', JSON.stringify(items));
  }, [items]);

  return { items, setItems, loading, error };
}

function usePageMotion<T extends HTMLElement>(dependencies: React.DependencyList = []) {
  const root = useRef<T>(null);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      const heroIntro = gsap.utils.toArray<HTMLElement>('.hero-kicker, .hero-copy h1, .hero-copy > p, .hero-actions, .hero-proof', node);
      const heroVisual = gsap.utils.toArray<HTMLElement>('.hero-product, .hero-float', node);
      const pageIntro = gsap.utils.toArray<HTMLElement>('.page-kicker, .standalone-hero h1, .standalone-hero > p, .page-actions, .page-stat', node);
      if (heroIntro.length) gsap.fromTo(heroIntro, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.07, ease: 'power3.out', delay: 0.1 });
      if (heroVisual.length) gsap.fromTo(heroVisual, { y: 28, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.25 });
      if (pageIntro.length) gsap.fromTo(pageIntro, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.08, ease: 'power3.out', delay: 0.08 });

      gsap.utils.toArray<HTMLElement>('.js-reveal').forEach((element) => {
        gsap.fromTo(
          element,
          { y: 34, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 88%', once: true },
          },
        );
      });

      const heroProduct = node.querySelector<HTMLElement>('.hero-product');
      if (heroProduct) gsap.to(heroProduct, { y: -10, duration: 3.4, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.4 });
    }, node);

    return () => context.revert();
  }, dependencies);

  return root;
}

function RouteMotion() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

function Instagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function TikTok() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 4c.4 2.3 1.7 3.8 4 4.1v3.1c-1.5 0-2.9-.5-4-1.3v6.1a5.1 5.1 0 1 1-4.4-5.1v3.2a2 2 0 1 0 1.3 1.9V4H15Z" fill="currentColor" />
    </svg>
  );
}

function WhatsApp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.3 5.1c.4-.5 1.1-.6 1.6-.2l2 1.5c.5.4.6 1.1.3 1.6l-.9 1.3c.8 1.6 2.1 2.9 3.7 3.7l1.3-.9c.5-.3 1.2-.2 1.6.3l1.5 2c.4.5.3 1.2-.2 1.6l-1 .8c-.7.5-1.6.7-2.4.4-2.4-.9-4.6-2.3-6.4-4.1S6 10.2 5.1 7.8c-.3-.8-.1-1.7.4-2.4l.8-1Z" fill="currentColor" />
    </svg>
  );
}

function Header({ count, lang, setLang, onSearch, onCartOpen }: { count: number; lang: Lang; setLang: (x: Lang) => void; onSearch: () => void; onCartOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const t = copy[lang];
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      <div className="announcement">
        <span>PLACAS NFC PARA NEGOCIOS QUE QUIEREN CRECER</span>
        <span className="announcement-detail">Envío gratis desde $80 <span>·</span> Atención personalizada</span>
      </div>
      <header className={isHome ? 'header header-dark' : 'header'}>
        <div className="nav wrap">
          <Link to="/" className="brand" onClick={() => setOpen(false)} aria-label="tapless.ec"><img src={logoSrc} alt="tapless.ec" /></Link>
          <nav className={open ? 'open' : ''} aria-label="Navegación principal">
            <Link to="/productos" onClick={() => setOpen(false)}>{t.products}</Link>
            <Link to="/como-funciona" onClick={() => setOpen(false)}>Cómo funciona</Link>
            <Link to="/opiniones" onClick={() => setOpen(false)}>{t.reviews}</Link>
            <Link to="/faq" onClick={() => setOpen(false)}>{t.faq}</Link>
          </nav>
          <div className="nav-actions">
            <button className="lang" onClick={() => setLang(lang === 'es' ? 'en' : 'es')} aria-label="Cambiar idioma">{lang === 'es' ? 'EN' : 'ES'}</button>
            <button className="nav-search" onClick={onSearch} aria-label="Buscar productos"><Search size={18} /></button>
            <Link to="/carrito" className="bag" aria-label={t.cart} onClick={(event) => { event.preventDefault(); onCartOpen(); }}><ShoppingBag size={18} />{count > 0 && <b>{count}</b>}</Link>
            <a className="nav-talk" href={wa}>{t.contact}<ArrowRight size={14} /></a>
            <button className="mobile-menu" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
      </header>
    </>
  );
}

function SearchModal({ open, items, onClose, onQuickAdd }: { open: boolean; items: P[]; onClose: () => void; onQuickAdd: (p: P) => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const results = items.filter((item) => `${item.name} ${item.shortDescription}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="search-modal" role="dialog" aria-modal="true" aria-labelledby="search-title"><div className="modal-head"><div><span className="eyebrow">Explora Tapless</span><h2 id="search-title">¿Qué estás buscando?</h2></div><button className="modal-close" onClick={onClose} aria-label="Cerrar búsqueda"><X size={18} /></button></div><label className="modal-search"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca por producto, pack o uso..." /></label><div className="search-result-count">{query ? `${results.length} resultados` : 'Colección destacada'}</div><div className="search-results">{results.length ? results.map((item) => <div className="search-result" key={item.id}><Link to={`/producto/${item.slug}`} onClick={onClose}><img src={item.images[0]} alt="" /><span><strong>{item.name}</strong><small>{item.shortDescription}</small></span></Link><div><b>{money(item.price)}</b><button onClick={() => { onQuickAdd(item); onClose(); }}>Añadir <Plus size={13} /></button></div></div>) : <div className="search-empty"><Search size={19} /><p>No encontramos coincidencias. Prueba con otra palabra.</p></div>}</div><Link to="/productos" className="modal-all" onClick={onClose}>Ver toda la colección <ArrowRight size={15} /></Link></section></div>;
}

function CartDrawer({ open, cart, setCart, onClose }: { open: boolean; cart: Item[]; setCart: React.Dispatch<React.SetStateAction<Item[]>>; onClose: () => void }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.classList.add('drawer-open');
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.classList.remove('drawer-open'); window.removeEventListener('keydown', onKeyDown); };
  }, [open, onClose]);

  if (!open) return null;
  const subtotal = cart.reduce((sum, item) => sum + item.p.price * item.qty, 0);
  const shipping = subtotal >= 80 ? 0 : 8;
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  return <div className="drawer-shell" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><div className="drawer-head"><div><span className="eyebrow">Tu selección</span><h2 id="drawer-title">Carrito <small>{count}</small></h2></div><button className="modal-close" onClick={onClose} aria-label="Cerrar carrito"><X size={18} /></button></div>{cart.length ? <><div className="drawer-items">{cart.map((item) => <div className="drawer-item" key={`${item.p.id}-${item.customization}`}><img src={item.p.images[0]} alt={item.p.name} /><div><h3>{item.p.name}</h3><p>{money(item.p.price)}</p>{item.customization && <small>{item.customization}</small>}<div className="drawer-item-bottom"><div className="quantity"><button aria-label="Restar" onClick={() => setCart((current) => current.map((line) => line.p.id === item.p.id && line.customization === item.customization ? { ...line, qty: Math.max(1, line.qty - 1) } : line))}><Minus size={12} /></button><span>{item.qty}</span><button aria-label="Sumar" onClick={() => setCart((current) => current.map((line) => line.p.id === item.p.id && line.customization === item.customization ? { ...line, qty: Math.min(line.p.stock, line.qty + 1) } : line))}><Plus size={12} /></button></div><button className="drawer-remove" onClick={() => setCart((current) => current.filter((line) => !(line.p.id === item.p.id && line.customization === item.customization)))}>Eliminar</button></div></div><strong>{money(item.p.price * item.qty)}</strong></div>)}</div><div className="drawer-footer"><div className="drawer-shipping"><span>{shipping ? `Envío ${money(shipping)}` : 'Envío gratis'}</span><span>Subtotal {money(subtotal)}</span></div><div className="drawer-total"><span>Total estimado</span><strong>{money(subtotal + shipping)}</strong></div><Link to="/carrito" className="button dark drawer-checkout" onClick={onClose}>Ir al carrito <ArrowRight size={16} /></Link><small>El pago y la coordinación se confirman por WhatsApp.</small></div></> : <div className="drawer-empty"><div className="empty-bag"><ShoppingBag size={22} /></div><h3>Tu carrito está vacío</h3><p>Encuentra una pieza que haga más fácil pedir opiniones.</p><Link to="/productos" className="button dark" onClick={onClose}>Ver productos <ArrowRight size={15} /></Link></div>}</aside></div>;
}

function Footer() {
  return (
    <footer>
      <div className="wrap footer-main">
        <div className="footer-intro"><Link to="/" className="brand" aria-label="tapless.ec"><img src={logoSrc} alt="tapless.ec" /></Link><p>Pequeños puntos de contacto.<br />Grandes señales de confianza.</p><a className="footer-cta" href={wa}>Hablar con Tapless <ArrowRight size={15} /></a></div>
        <div className="footer-links"><div><strong>Explorar</strong><Link to="/productos">Productos</Link><Link to="/como-funciona">Cómo funciona</Link><Link to="/opiniones">Opiniones</Link><Link to="/faq">Dudas frecuentes</Link></div><div><strong>Ayuda</strong><a href={wa}>WhatsApp</a><Link to="/politica-privacidad">Privacidad</Link><Link to="/terminos">Términos</Link></div><div><strong>Social</strong><a href="https://instagram.com/tapless.ec" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.tiktok.com/@tapless.ec" target="_blank" rel="noreferrer">TikTok</a></div></div>
      </div>
      <div className="wrap footer-bottom"><div className="socials"><a href="https://instagram.com/tapless.ec" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a><a href="https://www.tiktok.com/@tapless.ec" target="_blank" rel="noreferrer" aria-label="TikTok"><TikTok /></a><a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsApp /></a></div><span>© 2026 Tapless · Ecuador</span><span>Hecho para negocios reales</span></div>
    </footer>
  );
}

function Card({ p, onQuickAdd }: { p: P; onQuickAdd?: (p: P) => void }) {
  const [liked, setLiked] = useState(false);
  return <article className="product-card"><Link to={`/producto/${p.slug}`} className="product-card-link"><div className="product-image"><div className="product-image-top"><span>{p.isNew ? 'Nuevo' : p.onSale ? 'Favorito' : 'NFC ready'}</span><button className={liked ? 'liked' : ''} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setLiked(!liked); }} aria-label={liked ? 'Quitar de favoritos' : 'Añadir a favoritos'}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /></button></div><img src={p.images[0]} alt={p.name} /><span className="product-index">{p.sku}</span></div><div className="card-copy"><div><h3>{p.name}</h3><p>{p.shortDescription}</p></div><div className="price-wrap"><div className="price">{money(p.price)}</div>{p.compareAtPrice && <del>{money(p.compareAtPrice)}</del>}</div></div></Link>{onQuickAdd && <button className="quick-add" onClick={() => onQuickAdd(p)}>Añadir al carrito <Plus size={14} /></button>}</article>;
}

function Grid({ items, onQuickAdd }: { items: P[]; onQuickAdd?: (p: P) => void }) {
  return <div className="product-grid">{items.map((p) => <Card key={p.id} p={p} onQuickAdd={onQuickAdd} />)}</div>;
}

function TrustStrip() {
  return <section className="trust-strip"><div className="wrap trust-grid"><div><span className="trust-mark">01</span><div><strong>Sin apps</strong><small>Funciona al instante</small></div></div><div><span className="trust-mark">02</span><div><strong>Sin baterías</strong><small>Tecnología NFC</small></div></div><div><span className="trust-mark">03</span><div><strong>Listo para crecer</strong><small>Enlace actualizable</small></div></div><div className="trust-rating"><span>★★★★★</span><div><strong>Más confianza</strong><small>Empieza con una acción simple</small></div></div></div></section>;
}

function HowItWorks() {
  const steps = [['01', 'Acerca tu teléfono', 'Tu cliente toca la placa con su móvil.'], ['02', 'Se abre tu enlace', 'La experiencia empieza sin apps ni QR.'], ['03', 'Comparte su opinión', 'Más feedback para seguir creciendo.']];
  return <section className="how wrap js-reveal" id="como-funciona"><div className="section-label-row"><span className="eyebrow">Cómo funciona</span><span className="section-note">Un gesto que se recuerda</span></div><div className="how-grid"><div className="how-heading"><h2>Menos fricción.<br /><i>Más conexión.</i></h2><p>Diseñamos cada pieza para que pedir una reseña sea una extensión natural de la experiencia de tu negocio.</p><Link to="/productos" className="text-link">Ver opciones <ArrowRight size={16} /></Link></div><div className="step-list">{steps.map(([number, title, text]) => <div className="step-row" key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight size={16} /></div>)}</div></div></section>;
}

function Reviews() {
  const defaults: Review[] = [{ id: '1', name: 'María', business: 'Café Central', comment: 'Desde que pusimos tapless.ec en la barra, las reseñas empezaron a llegar solas.', avatar: 'MC' }, { id: '2', name: 'Javier', business: 'Estudio Norte', comment: 'La configuración fue rapidísima y nuestros clientes lo entienden al instante.', avatar: 'EN' }, { id: '3', name: 'Casa Nómada', business: 'Empresa', comment: 'Una herramienta pequeña que ha cambiado cómo crece nuestro negocio.', avatar: 'CN' }];
  const [reviews] = useState<Review[]>(() => { try { return JSON.parse(localStorage.getItem('tapless-reviews') || 'null') || defaults; } catch { return defaults; } });
  const [index, setIndex] = useState(0);
  const review = reviews[index] || defaults[0];
  useEffect(() => { if (reviews.length < 2) return undefined; const timer = window.setInterval(() => setIndex((current) => (current + 1) % reviews.length), 5000); return () => window.clearInterval(timer); }, [reviews.length]);
  return <section className="reviews wrap js-reveal" id="opiniones"><div className="section-label-row"><div><span className="eyebrow">Opiniones reales</span><h2>Lo dicen quienes <i>crecen.</i></h2></div><div className="review-controls"><button aria-label="Anterior" onClick={() => setIndex((index + reviews.length - 1) % reviews.length)}><ChevronLeft size={17} /></button><button aria-label="Siguiente" onClick={() => setIndex((index + 1) % reviews.length)}><ChevronRight size={17} /></button></div></div><div className="review-card"><div className="review-avatar">{review.avatar}</div><div className="stars">★★★★★</div><blockquote>“{review.comment}”</blockquote><p>{review.name} · {review.business}</p><div className="review-dots">{reviews.map((item, itemIndex) => <button aria-label={`Opinión ${itemIndex + 1}`} className={itemIndex === index ? 'active' : ''} onClick={() => setIndex(itemIndex)} key={item.id} />)}</div></div></section>;
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const questions = [['¿Cómo funcionan las placas NFC?', 'El cliente acerca su teléfono a la placa, se abre el enlace de reseñas de tu negocio y puede dejar su opinión en pocos segundos.'], ['¿Funcionan con cualquier teléfono?', 'Sí. Funcionan con teléfonos modernos Android y iPhone.'], ['¿Puedo cambiar de plataforma?', 'Sí. Podemos actualizar el destino de tu placa.'], ['¿Cuánto tarda en llegar?', 'Coordinamos la producción y entrega contigo por WhatsApp según tu ubicación.']];
  return <section className="faq wrap js-reveal" id="faq"><div className="faq-heading"><span className="eyebrow">Dudas frecuentes</span><h2>Todo claro, <i>desde el principio.</i></h2><p>Si todavía tienes una pregunta, escríbenos y te ayudamos a elegir.</p><a href={wa} className="text-link">Hablar con nosotros <ArrowRight size={16} /></a></div><div className="faq-list">{questions.map(([question, answer], index) => <div className={`faq-item ${open === index ? 'open' : ''}`} key={question}><button onClick={() => setOpen(open === index ? null : index)}><span>{question}</span><Plus size={18} /></button><div className="faq-answer"><p>{answer}</p></div></div>)}</div></section>;
}

function Home({ items, lang, onQuickAdd }: { items: P[]; lang: Lang; onQuickAdd: (p: P) => void }) {
  const motionRoot = usePageMotion<HTMLDivElement>([items.length]);
  const t = copy[lang];
  const heroProduct = items.find((item) => item.featured) || items[0];
  const featured = items.filter((item) => item.featured).slice(0, 4);
  return <div ref={motionRoot} className="home-page">
    {heroProduct ? <section className="hero hero-futuristic">
      <div className="hero-copy">
        <div className="hero-kicker"><span className="eyebrow">Tapless OS · 2026</span><span className="hero-counter">NFC / Ecuador <span>↗</span></span></div>
        <div className="hero-overline"><span className="live-dot" /> PRODUCTO DE CONTACTO INTELIGENTE</div>
        <h1>{lang === 'es' ? <>Haz que cada<br /><i>visita cuente.</i></> : <>Make every<br /><i>moment count.</i></>}</h1>
        <p>{t.text}</p>
        <div className="hero-actions"><Link className="button dark" to={`/producto/${heroProduct.slug}`}>{t.cta}<ArrowRight size={17} /></Link><Link className="hero-secondary" to="/como-funciona">Ver cómo funciona <span>↓</span></Link></div>
        <div className="hero-proof"><span className="proof-stars">★★★★★</span><span>Una señal simple para negocios memorables</span></div>
      </div>
      <div className="hero-stage">
        <div className="hero-stage-glow" />
        <div className="hero-grid-lines" />
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <div className="hero-product"><img src={heroProduct.images[0]} alt={heroProduct.name} /></div>
        <div className="hero-float hero-float-top"><Sparkles size={16} /><div><strong>Listo en segundos</strong><small>Sin apps · sin batería</small></div></div>
        <div className="hero-float hero-float-bottom"><span className="nfc-symbol">⌁</span><div><strong>Toca. Opina. Crece.</strong><small>{heroProduct.name}</small></div></div>
        <div className="hero-signal"><span /><span /><span /></div>
        <span className="hero-stage-code">TAPLESS / 001 · LIVE</span>
      </div>
    </section> : <section className="empty catalog-empty"><h1>Catálogo en actualización</h1></section>}
    <TrustStrip />
    <section className="featured section wrap js-reveal" id="productos"><div className="section-label-row"><div><span className="eyebrow">La colección</span><h2>Una placa. <i>Más confianza.</i></h2></div><Link to="/productos" className="text-link">Ver todos los productos <ArrowRight size={16} /></Link></div>{featured.length ? <Grid items={featured} onQuickAdd={onQuickAdd} /> : <div className="empty">No hay productos activos disponibles.</div>}</section>
    <section className="future-showcase wrap js-reveal"><div className="future-copy"><span className="eyebrow">La tecnología desaparece</span><h2>Todo lo que necesitas.<br /><i>Nada que explicar.</i></h2><p>Diseñamos el recorrido completo: una pieza que se ve bien, un enlace que abre al instante y un pedido que se coordina contigo.</p><div className="future-pills"><span>01 · NFC</span><span>02 · Sin apps</span><span>03 · Siempre activo</span></div><Link to="/como-funciona" className="text-link light-link">Conoce la experiencia <ArrowRight size={16} /></Link></div><div className="future-console"><div className="console-head"><span><i className="live-dot" /> SIGNAL / ACTIVE</span><span>NO BATTERY</span></div><div className="console-grid"><div className="console-radar"><span className="radar-ring radar-ring-one" /><span className="radar-ring radar-ring-two" /><span className="radar-core">⌁</span><i className="radar-sweep" /></div><div className="console-data"><small>NFC SYSTEM</small><strong>+∞</strong><span>posibilidades<br />para tu negocio</span></div></div><div className="console-foot"><span>tapless.ec</span><span>ECU / 593</span><span>READY TO GROW ↗</span></div></div></section>
    <section className="dark-banner wrap js-reveal"><div className="dark-banner-copy"><span className="eyebrow">Hecho para el mundo real</span><h2>Tu negocio ya tiene<br /><i>una historia.</i></h2><p>Haz que sea fácil para tus clientes contarla. Una pieza bella, un toque y la conversación sigue.</p><a href={wa} className="button light">Hablemos <ArrowRight size={17} /></a></div><div className="dark-banner-art"><span>01</span><div className="signal-ring" aria-hidden="true" /><img className="banner-logo" src={logoSrc} alt="tapless.ec" /><small>TECNOLOGÍA NFC · SIN BATERÍA</small></div></section>
    <HowItWorks /><Reviews /><section className="manifesto wrap js-reveal"><Sparkles size={23} /><h2>Pequeños gestos.<br /><i>Grandes señales.</i></h2><p>Una acción sencilla para que más personas conozcan tu negocio.</p><a href={wa} className="button light">Hablar por WhatsApp <ArrowRight size={17} /></a></section>
  </div>;
}

function HowPage() {
  const root = usePageMotion<HTMLDivElement>();
  const steps = [['01', 'Toca', 'Tu cliente acerca su teléfono a la placa.'], ['02', 'Descubre', 'El enlace correcto se abre al instante.'], ['03', 'Comparte', 'Una opinión que ayuda a tu negocio a crecer.']];
  return <main ref={root} className="dedicated-page page-motion"><section className="standalone-hero wrap"><div><span className="eyebrow page-kicker">La experiencia Tapless</span><h1>Un gesto pequeño.<br /><i>Se siente grande.</i></h1><p>Una experiencia directa, sin descargas y sin interrumpir el momento que estás construyendo con tus clientes.</p><div className="page-actions"><Link to="/productos" className="button dark">Ver la colección <ArrowRight size={16} /></Link><span className="page-stat"><strong>0</strong><small>apps necesarias</small></span></div></div><div className="standalone-visual"><div className="visual-core">NFC</div><span>ACERCA<br />TU TELÉFONO</span><small>TAPLESS / 02</small></div></section><section className="dedicated-flow wrap js-reveal"><div className="section-label-row"><div><span className="eyebrow">Así de sencillo</span><h2>La tecnología<br /><i>desaparece.</i></h2></div><p>Solo queda la conversación entre tu negocio y la persona que acaba de vivirlo.</p></div><div className="flow-cards">{steps.map(([number, title, text]) => <div className="flow-card" key={number}><span>{number}</span><div className="flow-icon">{title === 'Toca' ? '⌁' : title === 'Descubre' ? '↗' : '★'}</div><h3>{title}</h3><p>{text}</p></div>)}</div></section><section className="dedicated-callout wrap js-reveal"><span className="eyebrow">Para cada punto de contacto</span><h2>Tu barra. Tu mesa. Tu recepción.<br /><i>Tu manera de hacer las cosas.</i></h2><Link to="/productos" className="text-link">Encuentra tu pieza <ArrowRight size={16} /></Link></section></main>;
}

function ReviewsPage() {
  const root = usePageMotion<HTMLDivElement>();
  return <main ref={root} className="dedicated-page page-motion"><section className="standalone-hero review-standalone wrap"><div><span className="eyebrow page-kicker">Prueba social, hecha humana</span><h1>La confianza<br /><i>se comparte.</i></h1><p>Cuando la experiencia es buena, contarlo también debería serlo. Tapless hace que ese momento sea fácil.</p></div><div className="review-stat-board"><div><strong>★★★★★</strong><span>Opiniones que empiezan con un toque</span></div><div><strong>01</strong><span>pieza para cada negocio</span></div></div></section><Reviews /><section className="quote-grid wrap js-reveal"><div><span className="eyebrow">La idea detrás</span><h2>Diseñado para que<br /><i>te elijan otra vez.</i></h2></div><p>No medimos la confianza en botones. La diseñamos en cada detalle: una pieza que se entiende, una acción que fluye y una experiencia que se queda.</p></section></main>;
}

function FAQPage() {
  const root = usePageMotion<HTMLDivElement>();
  return <main ref={root} className="dedicated-page page-motion"><section className="standalone-hero faq-standalone wrap"><div><span className="eyebrow page-kicker">Centro de ayuda</span><h1>Preguntas claras.<br /><i>Decisiones fáciles.</i></h1><p>Todo lo que necesitas saber antes de elegir la pieza que acompañará a tu negocio.</p><a href={wa} className="text-link">¿No encuentras lo que buscas? <ArrowRight size={16} /></a></div><div className="faq-symbol"><span>?</span><small>TAPLESS / HELP</small></div></section><FAQ /><section className="support-card wrap js-reveal"><div><span className="eyebrow">¿Hablamos?</span><h2>Tu pregunta merece<br /><i>una respuesta.</i></h2></div><a className="button light" href={wa}>Escribir por WhatsApp <ArrowRight size={16} /></a></section></main>;
}

function Listing({ items, category, onQuickAdd }: { items: P[]; category?: string; onQuickAdd: (p: P) => void }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const filtered = useMemo(() => { const result = items.filter((p) => (!category || p.category === category) && `${p.name} ${p.shortDescription}`.toLowerCase().includes(query.toLowerCase())); if (sort === 'price') return [...result].sort((a, b) => a.price - b.price); if (sort === 'price-desc') return [...result].sort((a, b) => b.price - a.price); return result; }, [items, category, query, sort]);
  const root = usePageMotion<HTMLDivElement>([category, query, sort]);
  return <main ref={root} className="wrap listing page-motion"><div className="listing-hero"><div><span className="eyebrow">Colección tapless.ec</span><h1>{category ? categories.find((c) => c.slug === category)?.name : <>Diseñadas para<br /><i>ser recordadas.</i></>}</h1></div><p>Productos NFC claros, bonitos y fáciles de usar. Encuentra la pieza que mejor acompaña a tu negocio.</p></div><div className="category-tabs"><Link className={!category ? 'active' : ''} to="/productos">Todo</Link>{categories.map((item) => <Link className={category === item.slug ? 'active' : ''} to={`/categoria/${item.slug}`} key={item.id}>{item.name}</Link>)}</div><div className="toolbar"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar productos..." /></label><div className="toolbar-sort"><SlidersHorizontal size={16} /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Destacados</option><option value="price">Precio: menor</option><option value="price-desc">Precio: mayor</option></select></div></div><div className="results-line"><span>{filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}</span><span>Envío gratis desde $80</span></div>{filtered.length ? <Grid items={filtered} onQuickAdd={onQuickAdd} /> : <div className="empty"><h2>No encontramos ese producto</h2><p>Prueba otra búsqueda o explora toda la colección.</p><Link to="/productos" className="button dark">Ver colección completa</Link></div>}</main>;
}

function CategoryRoute({ items, onQuickAdd }: { items: P[]; onQuickAdd: (p: P) => void }) {
  const { slug } = useParams();
  return <Listing items={items} category={slug} onQuickAdd={onQuickAdd} />;
}

function Detail({ items, onAdd, cartCount, cartTotal }: { items: P[]; onAdd: (p: P, q: number, c: string) => void; cartCount: number; cartTotal: number }) {
  const { slug } = useParams();
  const product = items.find((item) => item.slug === slug);
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  useEffect(() => { setQuantity(1); setCustomization(''); setImageIndex(0); }, [slug]);
  if (!product) return <main className="wrap empty listing"><h1>Producto no disponible</h1><Link to="/productos" className="button dark">Ver productos</Link></main>;
  return <main className="wrap detail page-motion"><div className="gallery"><div className="main-img"><img src={product.images[imageIndex]} alt={product.name} /><span className="image-caption">TAPLESS.EC · NFC / {product.sku}</span></div><div className="thumbs">{product.images.map((image, index) => <button className={index === imageIndex ? 'selected' : ''} onClick={() => setImageIndex(index)} key={image}><img src={image} alt={`${product.name} vista ${index + 1}`} /></button>)}</div></div><div className="detail-copy"><div className="detail-topline"><span className="eyebrow">{product.category} · {product.sku}</span><span className="detail-availability"><span className="dot" /> En stock</span></div><h1>{product.name}</h1><p className="lead">{product.description}</p><div className="detail-price">{money(product.price)} {product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}</div><p className="price-note">Envío gratis en pedidos desde $80</p>{cartCount > 0 && <Link to="/carrito" className="detail-cart-total"><span>Tu selección · {cartCount} {cartCount === 1 ? 'pieza' : 'piezas'}</span><strong>{money(cartTotal)} <ArrowRight size={15} /></strong></Link>}<label className="customization-field"><span>Personaliza tu placa <em>Opcional</em></span><input value={customization} onChange={(event) => setCustomization(event.target.value)} placeholder="Ej. Tu negocio · Google Reviews" /></label><div className="purchase"><div className="quantity"><button aria-label="Restar" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button aria-label="Sumar" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Plus size={15} /></button></div><button className="button dark add" onClick={() => onAdd(product, quantity, customization)}>Añadir al carrito <ShoppingBag size={17} /></button></div><div className="feature-list">{product.features.map((feature) => <div key={feature}><Check size={17} /><span>{feature}</span></div>)}</div><details open><summary>Especificaciones <ChevronDown size={17} /></summary>{Object.entries(product.specifications).map(([key, value]) => <div className="spec" key={key}><span>{key}</span><b>{value}</b></div>)}</details></div></main>;
}

function Cart({ cart, setCart }: { cart: Item[]; setCart: React.Dispatch<React.SetStateAction<Item[]>> }) {
  const subtotal = cart.reduce((sum, item) => sum + item.p.price * item.qty, 0);
  const shipping = subtotal >= 80 ? 0 : 8;
  const remaining = Math.max(0, 80 - subtotal);
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [location, setLocation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfNotice, setPdfNotice] = useState('');
  const root = usePageMotion<HTMLDivElement>([cart.length]);
  const go = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setPdfNotice('');
    const orderId = `TP-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    const productLines = cart.map((item, index) => [`${index + 1}. ${item.p.name}`, `   Cantidad: ${item.qty}`, `   Personalización: ${item.customization || 'Sin personalización'}`, `   Importe: ${money(item.p.price * item.qty)}`].join('\n')).join('\n\n');
    const message = `*TAPLESS.EC · PEDIDO NUEVO* 👋\n\nHola equipo Tapless, quiero confirmar mi pedido:\n\n*PRODUCTOS*\n${productLines}\n\n*RESUMEN*\nSubtotal: ${money(subtotal)}\nEnvío: ${shipping ? money(shipping) : 'Gratis'}\nTotal: ${money(subtotal + shipping)}\n\n*DATOS DE ENTREGA*\nNombre: ${name}\nNegocio: ${business}\nUbicación: ${location}\n\nOrden: ${orderId}\nEnviado desde tapless.ec.`;
    try {
      const generated = await createOrderPdf({ orderId, date: new Intl.DateTimeFormat('es-EC', { dateStyle: 'long' }).format(new Date()), customer: name, business, location, lines: cart.map((item) => ({ name: item.p.name, qty: item.qty, customization: item.customization || '', amount: money(item.p.price * item.qty) })), subtotal: money(subtotal), shipping: shipping ? money(shipping) : 'Gratis', total: money(subtotal + shipping) });
      const file = new File([generated.blob], generated.filename, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Pedido ${orderId} · Tapless`, text: message });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        }
      }
      downloadPdf(generated.blob, generated.filename);
      window.location.href = whatsappLink(`${message}\n\nComprobante generado: ${generated.filename}\nEl archivo se descargó para adjuntarlo en este chat.`);
    } catch {
      setPdfNotice('No pudimos generar el comprobante. Intenta nuevamente o escríbenos directamente.');
    } finally {
      setIsGenerating(false);
    }
  };
  return <main ref={root} className="wrap cart-page page-motion"><div className="cart-heading"><div><span className="eyebrow">Tu selección</span><h1>Carrito</h1></div>{cart.length > 0 && <span className="cart-count-label">{cart.reduce((sum, item) => sum + item.qty, 0)} piezas</span>}</div>{!cart.length ? <div className="empty cart-empty"><div className="empty-bag"><ShoppingBag size={25} /></div><h2>Tu carrito está vacío</h2><p>Las piezas bonitas para tu negocio están a un toque de distancia.</p><Link to="/productos" className="button dark">Explorar productos <ArrowRight size={16} /></Link></div> : <div className="cart-layout"><div className="cart-items"><div className="cart-items-head"><span>Producto</span><span>Total</span></div>{cart.map((item) => <div className="cart-item" key={`${item.p.id}-${item.customization}`}><img src={item.p.images[0]} alt={item.p.name} /><div className="cart-item-copy"><h3>{item.p.name}</h3><p>{money(item.p.price)} por pieza</p>{item.customization && <small className="cart-customization">Personalización: {item.customization}</small>}<div className="quantity"><button aria-label="Restar" onClick={() => setCart((current) => current.map((line) => line.p.id === item.p.id && line.customization === item.customization ? { ...line, qty: Math.max(1, line.qty - 1) } : line))}><Minus size={14} /></button><span>{item.qty}</span><button aria-label="Sumar" onClick={() => setCart((current) => current.map((line) => line.p.id === item.p.id && line.customization === item.customization ? { ...line, qty: Math.min(line.p.stock, line.qty + 1) } : line))}><Plus size={14} /></button></div></div><strong className="cart-line-total">{money(item.p.price * item.qty)}</strong><button className="icon-button" aria-label={`Eliminar ${item.p.name}`} onClick={() => setCart((current) => current.filter((line) => !(line.p.id === item.p.id && line.customization === item.customization)))}><Trash2 size={17} /></button></div>)}</div><form className="summary" onSubmit={(event) => { event.preventDefault(); void go(); }}><div className="summary-kicker"><span>Resumen del pedido</span><span className="summary-lock">Seguro y simple</span></div><h2>Ya casi es tuyo.</h2>{remaining > 0 ? <div className="shipping-progress"><div><span>Te faltan {money(remaining)} para envío gratis</span><b>{Math.min(100, subtotal / 80 * 100).toFixed(0)}%</b></div><span className="progress-track"><i style={{ width: `${Math.min(100, subtotal / 80 * 100)}%` }} /></span></div> : <div className="free-shipping"><Check size={15} /> Tu pedido tiene envío gratis</div>}<div className="summary-lines"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Envío</span><b>{shipping ? money(shipping) : 'Gratis'}</b></div><hr /><div className="total"><span>Total</span><b>{money(subtotal + shipping)}</b></div></div><label className="location-field">Nombre del cliente<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label className="location-field">Nombre del negocio<input value={business} onChange={(event) => setBusiness(event.target.value)} required /></label><label className="location-field">Ubicación del negocio<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Dirección o referencia" required /></label><button className="button dark checkout" disabled={!name.trim() || !business.trim() || !location.trim() || isGenerating}>{isGenerating ? 'Preparando comprobante...' : 'Generar PDF y enviar a WhatsApp'} <ArrowRight size={17} /></button>{pdfNotice && <small className="pdf-note">{pdfNotice}</small>}<small>Generamos tu comprobante con logo. En móvil podrás compartir el PDF directamente por WhatsApp; en otros navegadores se descargará y abrirá el chat.</small></form></div>}</main>;
}

function Admin({ items, setItems }: { items: P[]; setItems: React.Dispatch<React.SetStateAction<P[]>> }) {
  const [logged, setLogged] = useState(() => sessionStorage.getItem('tapgo-admin-session') === '1');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  if (!logged) return <main className="auth-page"><form className="auth-card" onSubmit={(event) => { event.preventDefault(); if (user === 'rmerchan' && password === '12345678') { sessionStorage.setItem('tapgo-admin-session', '1'); setLogged(true); } else setError('Usuario o contraseña incorrectos'); }}><div className="brand"><img src={logoSrc} alt="tapless.ec" /></div><span className="eyebrow">Panel privado</span><h1>Bienvenido de vuelta.</h1><p>Gestiona tu colección desde un solo lugar.</p><input placeholder="Usuario" value={user} onChange={(event) => setUser(event.target.value)} required /><input type="password" placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required />{error && <small className="auth-error">{error}</small>}<button className="button dark">Entrar al dashboard <ArrowRight size={16} /></button></form></main>;
  const add = () => { const base = items[0] || seed[0]; const timestamp = Date.now(); setItems((current) => [{ ...base, id: `prd-${timestamp}`, name: 'Nueva placa NFC', slug: `nueva-placa-${timestamp}`, sku: `TAP-${timestamp}`, active: true }, ...current]); };
  const visibleRows = items.filter((item) => `${item.name} ${item.sku}`.toLowerCase().includes(query.toLowerCase()));
  const lowStock = items.filter((item) => item.stock <= 5 && item.active !== false).length;
  const inventory = items.reduce((sum, item) => sum + item.stock, 0);
  return <main className="wrap admin page-motion"><div className="admin-head"><div><span className="eyebrow">tapless.ec · CMS local</span><h1>Tu colección,<br /><i>en movimiento.</i></h1><p>{isBackendConfigured ? 'Catálogo conectado al backend.' : 'Modo local: los cambios se guardan en este dispositivo.'}</p></div><div className="admin-actions"><button className="button dark" onClick={add}><Plus size={16} /> Nueva placa</button><button className="button subtle" onClick={() => { sessionStorage.removeItem('tapgo-admin-session'); setLogged(false); }}>Salir</button></div></div><div className="dashboard-grid"><div className="dashboard-card dashboard-primary"><span>Productos visibles</span><strong>{items.filter(active).length}</strong><small>de {items.length} registrados</small><div className="dashboard-line"><i style={{ width: `${items.length ? items.filter(active).length / items.length * 100 : 0}%` }} /></div></div><div className="dashboard-card"><span>Unidades en inventario</span><strong>{inventory}</strong><small>Disponibilidad actual</small></div><div className="dashboard-card"><span>Stock por revisar</span><strong>{lowStock}</strong><small>{lowStock ? 'Revisa los productos destacados' : 'Todo en orden'}</small></div><div className="dashboard-card dashboard-status"><span>Estado del catálogo</span><strong><i /> Operativo</strong><small>Sincronización activa</small></div></div><div className="admin-toolbar"><div><span className="eyebrow">Gestión de productos</span><h2>Inventario</h2></div><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o SKU" /></label></div><div className="admin-table"><div className="table-head"><span>Producto</span><span>SKU</span><span>Precio</span><span>Stock</span><span>Estado</span><span /></div>{visibleRows.map((item) => <div className="table-row" key={item.id}><span className="table-product"><img src={item.images[0]} alt="" /><b>{item.name}</b></span><span>{item.sku}</span><span>{money(item.price)}</span><span>{item.stock}</span><button className={active(item) ? 'pill green' : 'pill red'} onClick={() => setItems((current) => current.map((row) => row.id === item.id ? { ...row, active: !active(row) } : row))}>{active(item) ? 'Activo' : 'Inactivo'}</button><button className="icon-button" aria-label={`Eliminar ${item.name}`} onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}><Trash2 size={16} /></button></div>)}</div></main>;
}

function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy';
  return <main className="wrap listing legal-page"><span className="eyebrow">tapless.ec</span><h1>{privacy ? 'Política de privacidad' : 'Términos y condiciones'}</h1>{privacy ? <><p>Esta política explica cómo Tapless trata la información necesaria para vender placas y productos NFC personalizados para negocios.</p><h2>Información recopilada</h2><p>Podemos recibir nombre, teléfono o WhatsApp, correo electrónico cuando se proporcione, negocio, ubicación o dirección, personalización, pedido y datos técnicos básicos del navegador.</p><h2>Uso</h2><p>Usamos la información para atender consultas, preparar y personalizar pedidos, coordinar pagos y entregas, confirmar por WhatsApp y brindar soporte.</p><h2>Proveedores</h2><p>Podremos compartir solo lo indispensable con proveedores de pago, logística, mensajería, alojamiento o tecnología que participen en el servicio. No vendemos datos personales.</p><h2>Cookies y almacenamiento</h2><p>El sitio usa almacenamiento local para conservar carrito y preferencias. No se deben habilitar servicios externos adicionales sin configurarlos y revisarlos.</p></> : <><p>Estos términos regulan la compra de placas y productos NFC físicos personalizados ofrecidos por Tapless.</p><h2>Producto y personalización</h2><p>El cliente debe revisar nombres, enlaces, teléfonos y demás datos antes de confirmar. La información incorrecta entregada por el cliente puede requerir una nueva producción.</p><h2>Pedido y pago</h2><p>El cliente selecciona, personaliza y envía el pedido por WhatsApp. La compra se confirma cuando Tapless valida disponibilidad, precio, pago y datos.</p><h2>Envío</h2><p>La ubicación del negocio debe ser clara. Los tiempos y costos dependen de la ubicación y logística.</p><h2>Cambios y devoluciones</h2><p>Los cambios o cancelaciones pueden no ser posibles una vez iniciada la producción personalizada. Los defectos o errores atribuibles a Tapless se revisarán para coordinar una solución.</p></>}</main>;
}

function App() {
  const { items, setItems, loading, error } = useCatalog();
  const [cart, setCart] = useState<Item[]>(() => { try { return JSON.parse(localStorage.getItem('tapless-cart') || '[]'); } catch { return []; } });
  const [lang, setLang] = useState<Lang>('es');
  const [toast, setToast] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => localStorage.setItem('tapless-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);
  const add = (product: P, quantity: number, customization: string) => { setCart((current) => { const existing = current.find((item) => item.p.id === product.id && item.customization === customization); return existing ? current.map((item) => item.p.id === product.id && item.customization === customization ? { ...item, qty: Math.min(product.stock, item.qty + quantity) } : item) : [...current, { p: product, qty: quantity, customization }]; }); setToast(`${product.name} añadido al carrito`); if (toastTimer.current) window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(''), 2800); };
  const visible = items.filter(active);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.p.price * item.qty, 0);
  return <><RouteMotion /><Header count={count} lang={lang} setLang={setLang} onSearch={() => setSearchOpen(true)} onCartOpen={() => setCartOpen(true)} />{error && <div className="catalog-notice">{error}</div>}{loading ? <main className="empty listing"><p>Cargando catálogo…</p></main> : <Routes><Route path="/" element={<><Home items={visible} lang={lang} onQuickAdd={(product) => add(product, 1, '')} /><FAQ /><a className="whatsapp-float" href={wa} aria-label="WhatsApp"><WhatsApp /></a></>} /><Route path="/productos" element={<Listing items={visible} onQuickAdd={(product) => add(product, 1, '')} />} /><Route path="/categoria/:slug" element={<CategoryRoute items={visible} onQuickAdd={(product) => add(product, 1, '')} />} /><Route path="/como-funciona" element={<HowPage />} /><Route path="/opiniones" element={<ReviewsPage />} /><Route path="/faq" element={<FAQPage />} /><Route path="/producto/:slug" element={<Detail items={visible} onAdd={add} cartCount={count} cartTotal={total} />} /><Route path="/carrito" element={<Cart cart={cart} setCart={setCart} />} /><Route path="/admin/*" element={<Admin items={items} setItems={setItems} />} /><Route path="/politica-privacidad" element={<Legal kind="privacy" />} /><Route path="/terminos" element={<Legal kind="terms" />} /></Routes>}{<Footer />}{toast && <div className="toast" role="status"><Check size={16} />{toast}<Link to="/carrito">Ver carrito</Link></div>}<SearchModal open={searchOpen} items={visible} onClose={() => setSearchOpen(false)} onQuickAdd={(product) => add(product, 1, '')} /><CartDrawer open={cartOpen} cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} /></>;
}

createRoot(document.getElementById('root')!).render(<BrowserRouter basename={window.location.pathname.startsWith('/Web_Tag') ? '/Web_Tag' : ''}><App /></BrowserRouter>);
