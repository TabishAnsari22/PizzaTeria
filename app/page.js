'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useScroll, useTransform, AnimatePresence } from 'motion/react';
import useReducedMotion from '../lib/useHydratedReducedMotion';
import { ArrowUpRight, ArrowDown, ArrowRight, Plus, Minus, X, ShoppingBag, Menu, Flame, Leaf, Clock3, Check, Play, ChevronRight } from 'lucide-react';
import PizzaJourney from '../components/PizzaJourney';

const pizzas = [
  { id: 'margherita', image: '/images/pizza-signature.webp', name: 'The Margherita', note: 'THE ONE THAT STARTED IT ALL', description: 'San Marzano tomato, fior di latte, fresh basil, extra virgin olive oil.', price: 1450, type: 'Classics', className: 'margherita', tag: 'The original' },
  { id: 'diavola', image: '/images/pizza-diavola.webp', name: 'Hot Honey Diavola', note: 'A LITTLE SWEET. A LITTLE HEAT.', description: 'Spicy pepperoni, mozzarella, chilli flakes, a drizzle of hot honey.', price: 1850, type: 'Signatures', className: 'diavola', tag: 'A little heat' },
  { id: 'verde', image: '/images/pizza-verde.webp', name: 'The Garden Party', note: 'STRAIGHT FROM THE GOOD EARTH', description: 'Basil pesto, roasted peppers, creamy burrata, rocket, parmesan.', price: 1750, type: 'Vegetarian', className: 'verde', tag: 'Plant powered' },
  { id: 'tartufo', image: '/images/pizza-tartufo.webp', name: 'Midnight Tartufo', note: 'YOUR NEW EVENING RITUAL', description: 'Wild mushrooms, truffle cream, fior di latte, fresh thyme.', price: 2150, type: 'Signatures', className: 'tartufo', tag: 'Something special' },
];

const formatPrice = (price) => `Rs. ${price.toLocaleString('en-PK')}`;
const ease = [0.22, 1, 0.36, 1];

function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={{ opacity: 0, y: reduce ? 0 : 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-35px' }} transition={{ duration: reduce ? 0 : .8, delay: reduce ? 0 : delay, ease }}>{children}</motion.div>;
}

function Brand({ light = false, onClick }) {
  return <a href="#" onClick={onClick} aria-label="Pizza Teria home" className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark"><Flame size={27} strokeWidth={1.4}/></span><span className="brand-copy"><strong>PIZZA</strong><strong>TERIA</strong></span><span className="brand-dot">®</span></a>;
}

function Basil({ className = '' }) {
  return <svg className={className} viewBox="0 0 100 120" aria-hidden="true"><defs><linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#659548"/><stop offset=".5" stopColor="#315c2e"/><stop offset="1" stopColor="#102c1b"/></linearGradient></defs><path d="M49 108C-15 70 15 14 77 5c23 52 10 83-28 103Z" fill="url(#leaf)"/><path d="M45 115 69 26M53 82 30 57M58 63l22-15M62 47 48 28" fill="none" stroke="#93ad70" strokeWidth="1.5" opacity=".55"/></svg>;
}

function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 135]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-12, reduce ? -12 : 24]);
  const orbit = useTransform(scrollYProgress, [0, 1], [-20, reduce ? -20 : 40]);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const tiltX = useSpring(pointerY, { stiffness: 95, damping: 24 });
  const tiltY = useSpring(pointerX, { stiffness: 95, damping: 24 });
  const move = event => {
    if (reduce || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - .5) * 14);
    pointerY.set(-((event.clientY - bounds.top) / bounds.height - .5) * 12);
  };
  return <section className="hero" ref={ref} aria-labelledby="hero-heading">
    <div className="hero-topline"><span className="eyebrow"><span className="tiny-dot"/> THE ART OF A PERFECT PIZZA</span><span className="hero-location">SLOW CRAFT. BOLD CHARACTER.</span></div>
    <div className="hero-grid">
      <motion.div className="hero-editorial" initial={{ opacity: 0, y: reduce ? 0 : 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 1.1, ease }}>
        <span className="eyebrow hero-kicker">CRAFTED IN FIRE. FINISHED WITH SOUL.</span>
        <h1 id="hero-heading">Fire. Flour.<br/><em>Obsession.</em></h1>
        <p className="hero-description">A blistered crust. A molten centre. A moment<br className="desktop-break"/> worth slowing down for. This is Pizza Teria.</p>
        <div className="hero-actions"><a className="button button-red" href="#menu">Explore the menu <ArrowUpRight size={17}/></a><a className="hero-story-link" href="#journey"><span><Play size={11} fill="currentColor"/></span>Watch the craft</a></div>
        <div className="hero-mini-facts"><div><strong>48<span>H</span></strong><span>SLOW FERMENTATION</span></div><div><strong>450<span>°C</span></strong><span>WOOD-FIRED PERFECTION</span></div><div><strong>100<span>%</span></strong><span>PURE OBSESSION</span></div></div>
      </motion.div>
      <div className="hero-art" onPointerMove={move} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
        <div className="pizza-aura"/>
        <motion.div className="hero-orbit orbit-one" style={{ rotate: orbit }}/><div className="hero-orbit orbit-two"/>
        <motion.div className="hero-pizza-wrap" style={{ y, rotateZ: rotate, rotateX: tiltX, rotateY: tiltY }} initial={{ opacity: 0, scale: .86 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, delay: .12, ease }}>
          <img className="hero-pizza" src="/images/pizza-signature.webp" alt="Pizza Teria signature Margherita, with a charred artisan crust, molten mozzarella, rich tomato and fresh basil" fetchPriority="high" width="1254" height="1254"/>
        </motion.div>
        <Basil className="floating-basil basil-one"/><Basil className="floating-basil basil-two"/>
        <div className="hero-seal" aria-label="Handcrafted, never ordinary"><svg viewBox="0 0 120 120" className="seal-ring"><defs><path id="seal-circle" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/></defs><text><textPath href="#seal-circle" textLength="275">HANDCRAFTED · NEVER ORDINARY · </textPath></text></svg><Flame size={29} strokeWidth={1}/></div>
        <div className="hero-floating-note"><span>01 / THE HOUSE SIGNATURE</span><strong>Margherita, perfected.</strong><span className="hero-note-line"/></div>
      </div>
    </div>
    <div className="hero-bottom"><span>FIRE IS OUR SIGNATURE.</span><a href="#journey" className="scroll-cue"><span>SCROLL TO EXPERIENCE</span><span className="round-arrow"><ArrowDown size={17}/></span></a><span className="hero-edition">THE PIZZA TERIA COLLECTION <span>01 — 04</span></span></div>
    <span className="hero-big-type" aria-hidden="true">PIZZA TERIA</span>
  </section>;
}

function Cart({ items, onClose, onUpdate, onClear }) {
  const closeRef = useRef(null);
  const [checkout, setCheckout] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  useEffect(() => {
    const before = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const keyHandler = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const elements = [...document.querySelectorAll('.cart-panel button, .cart-panel input, .cart-panel textarea, .cart-panel a')].filter(el => !el.disabled);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', keyHandler); before?.focus(); };
  }, [onClose]);
  function submit(event) { event.preventDefault(); setOrdered(true); onClear(); }
  return <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <button className="cart-backdrop" onClick={onClose} aria-label="Close your bag"/>
    <motion.aside className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-heading" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: .4, ease }}>
      <div className="cart-top"><span className="eyebrow">A LITTLE HAPPINESS, TO GO</span><button className="icon-button" ref={closeRef} aria-label="Close bag" onClick={onClose}><X/></button></div>
      <h2 id="cart-heading">{ordered ? 'Good things are coming.' : checkout ? 'Your happy place.' : 'Your pizza bag.'}</h2>
      {ordered ? <div className="order-success"><span className="success-mark"><Check size={34}/></span><h3>That’s amore.</h3><p>Your demo order is complete. This preview doesn’t send a real order or take payment.</p><button className="button button-red" onClick={onClose}>Keep exploring <ArrowUpRight size={18}/></button></div> : items.length === 0 ? <div className="cart-empty"><ShoppingBag size={50} strokeWidth={1}/><p>A little empty. A lot of potential.</p><button className="button button-red" onClick={onClose}>Find your pizza <ArrowUpRight size={18}/></button></div> : <>
        <div className="cart-items">{items.map(item => <div className="cart-item" key={item.id}><div className={`cart-item-image ${item.className}`}><img src={item.image} alt="" width="90" height="90"/></div><div className="cart-item-info"><h3>{item.name}</h3><p>{formatPrice(item.price)}</p><div className="quantity"><button aria-label={`Remove one ${item.name}`} onClick={() => onUpdate(item.id, -1)}><Minus size={13}/></button><span>{item.quantity}</span><button aria-label={`Add one ${item.name}`} onClick={() => onUpdate(item.id, 1)}><Plus size={13}/></button></div></div><strong>{formatPrice(item.quantity * item.price)}</strong></div>)}</div>
        {checkout && <form id="checkout-form" className="checkout-form" onSubmit={submit}><label>Your name<input name="name" autoComplete="name" placeholder="A name for your order" required/></label><label>Phone number<input type="tel" name="phone" autoComplete="tel" placeholder="03XX XXXXXXX" pattern="[0-9+ ]{7,20}" required/></label><label>Delivery address<textarea name="address" autoComplete="street-address" placeholder="Where should the good stuff go?" minLength={10} required rows={3}/></label><p className="demo-note">Demo checkout · no payment or real delivery.</p></form>}
        <div className="cart-summary"><div><span>Subtotal</span><strong>{formatPrice(total)}</strong></div><p>Delivery calculated when ordering. All pizzas are 12 inches.</p>{checkout ? <button type="submit" form="checkout-form" className="button button-red">Place demo order <ArrowRight size={18}/></button> : <button className="button button-red" onClick={() => setCheckout(true)}>Let’s make it happen <ArrowRight size={18}/></button>}{checkout && <button className="back-to-bag" onClick={() => setCheckout(false)}>Back to bag</button>}</div>
      </>}
    </motion.aside>
  </motion.div>;
}

export default function Home() {
  const [filter, setFilter] = useState('All pizzas');
  const [items, setItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const closeCart = useCallback(() => setCartOpen(false), []);
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem('pizza-teria-bag') || '[]'); if (Array.isArray(saved)) setItems(saved.filter(item => pizzas.some(pizza => pizza.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0).map(item => ({ ...pizzas.find(pizza => pizza.id === item.id), quantity: Math.min(item.quantity, 50) }))); } catch {} setHydrated(true); }, []);
  useEffect(() => { if (hydrated) { try { localStorage.setItem('pizza-teria-bag', JSON.stringify(items)); } catch {} } }, [items, hydrated]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2600); return () => clearTimeout(timer); }, [toast]);
  function add(pizza) { setItems(previous => { const found = previous.find(item => item.id === pizza.id); return found ? previous.map(item => item.id === pizza.id ? { ...item, quantity: Math.min(item.quantity + 1, 50) } : item) : [...previous, { ...pizza, quantity: 1 }]; }); setToast(`${pizza.name} added to your bag`); }
  function update(id, difference) { setItems(previous => previous.map(item => item.id === id ? { ...item, quantity: Math.min(item.quantity + difference, 50) } : item).filter(item => item.quantity > 0)); }
  return <>
    <header className="site-header"><div className="nav-shell"><Brand onClick={() => setMobileOpen(false)}/><nav className="desktop-nav" aria-label="Main navigation"><a href="#menu">The menu</a><a href="#journey">The good process</a><a href="#our-story">Our kind of pizza</a></nav><div className="nav-actions"><a href="#menu" className="nav-order">Let’s eat <ArrowUpRight size={15}/></a><button className="bag-button" aria-label={`Open bag, ${count} items`} onClick={() => setCartOpen(true)}><ShoppingBag size={18}/><span>{count.toString().padStart(2, '0')}</span></button><button className="mobile-menu-button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={23}/> : <Menu size={23}/>}</button></div></div><AnimatePresence>{mobileOpen && <motion.nav className="mobile-nav" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} aria-label="Mobile navigation">{[['The menu', '#menu'], ['The good process', '#journey'], ['Our kind of pizza', '#our-story']].map(([text, href]) => <a href={href} key={href} onClick={() => setMobileOpen(false)}>{text}<ArrowUpRight size={20}/></a>)}</motion.nav>}</AnimatePresence></header>
    <main>
      <Hero/>
      <div className="values-strip"><span><Clock3 size={17}/>48-hour fermented dough</span><i>✳</i><span><Flame size={19}/>Wood-fired at 450°C</span><i>✳</i><span><Leaf size={17}/>The freshest good stuff</span><i>✳</i><span>Made by hand. Always.</span></div>
      <PizzaJourney/>
      <section className="menu-section section-pad" id="menu" aria-labelledby="menu-heading"><Reveal><div className="section-heading"><div><span className="eyebrow">THE PIZZA TERIA COLLECTION</span><h2 id="menu-heading">The house<br/><em>signatures.</em></h2></div><p>A few favourites. A whole lot of character.<br/>Every pizza starts with slow dough and ends<br className="desktop-break"/> with something worth sharing.</p></div></Reveal>
        <div className="menu-toolbar"><div className="menu-filters" role="group" aria-label="Filter pizzas">{['All pizzas', 'Classics', 'Signatures', 'Vegetarian'].map(option => <button key={option} className={option === filter ? 'active' : ''} aria-pressed={option === filter} onClick={() => setFilter(option)}>{option}</button>)}</div><span className="menu-size">12” OF PURE JOY <span>↗</span></span></div>
        <motion.div className="pizza-grid" layout>{pizzas.filter(pizza => filter === 'All pizzas' || pizza.type === filter).map((pizza, i) => <motion.article className="pizza-card" key={pizza.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, delay: i * .06 }}><div className={`pizza-card-visual ${pizza.className}`}><span className="pizza-tag">{pizza.tag}</span><img src={pizza.image} alt={`${pizza.name}, 12-inch wood-fired pizza`} loading="lazy" width="600" height="600"/><button className="add-pizza" aria-label={`Add ${pizza.name} to bag`} onClick={() => add(pizza)}><Plus size={21}/></button></div><div className="pizza-card-title"><h3>{pizza.name}</h3><span>{formatPrice(pizza.price)}</span></div><p>{pizza.description}</p><span className="pizza-note">{pizza.note}</span></motion.article>)}</motion.div>
        <p className="menu-footnote"><Leaf size={14}/> Good ingredients, no shortcuts. Ask us about allergens before placing a real order.</p>
      </section>
      <section className="story-section" id="our-story" aria-labelledby="story-heading"><div className="story-image"><img src="/images/forno-kitchen.webp" alt="A pizzaiolo hand-stretching fresh pizza dough in a warm wood-fired kitchen" loading="lazy" width="1536" height="1024"/><span className="image-caption">A LITTLE FLOUR. A LITTLE FIRE. A LOT OF HEART.</span></div><div className="story-content"><Reveal><span className="eyebrow">SOME THINGS ARE WORTH THE WAIT</span><h2 id="story-heading">Fast isn’t<br/>our <em>secret<br/>ingredient.</em></h2><p>We believe the best things in life take their time. So our dough rests for 48 hours. Our hands do the stretching. And our wood-fired oven does a little magic.</p><p>No overthinking. Just honest ingredients, a beautifully blistered crust, and that first bite you wish would last a little longer.</p><a className="text-link" href="#journey">Meet your pizza’s journey <ArrowUpRight size={17}/></a><span className="story-signature">With fire. Pizza Teria.</span></Reveal></div></section>
      <section className="manifesto section-pad"><Reveal><span className="eyebrow">OUR VERY SIMPLE PHILOSOPHY</span><h2>Life’s too short for<br/><span>ordinary</span> <em>pizza.</em></h2><div className="manifesto-details"><p>For the long lunches. The late nights.<br/>The “just one more slice” kind of people.</p><a className="button button-red" href="#menu">Make it a pizza night <ArrowUpRight size={18}/></a></div></Reveal><span className="manifesto-star" aria-hidden="true">✳</span></section>
      <footer className="site-footer"><div className="footer-top"><Brand light/><p>A little Italian soul.<br/>Delivered to your happy place.</p><div><span className="eyebrow">COME HUNGRY. LEAVE HAPPY.</span><a href="#menu">Find your next favourite <ArrowUpRight size={17}/></a></div><a href="#" className="back-top" aria-label="Back to top"><ArrowDown size={19}/></a></div><div className="footer-wordmark" aria-hidden="true">pizza teria.</div><div className="footer-bottom"><span>© {new Date().getFullYear()} PIZZA TERIA. Crafted in fire.</span><span>AN INDEPENDENT PIZZA CONCEPT</span><a href="#menu">Pizza is always a good idea. <span>↗</span></a></div></footer>
    </main>
    <AnimatePresence>{toast && <motion.div role="status" className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}><Check size={17}/>{toast}<button onClick={() => { setCartOpen(true); setToast(''); }}>View bag <ChevronRight size={15}/></button></motion.div>}</AnimatePresence>
    <AnimatePresence>{cartOpen && <Cart items={items} onClose={closeCart} onUpdate={update} onClear={() => setItems([])}/>}</AnimatePresence>
  </>;
}
