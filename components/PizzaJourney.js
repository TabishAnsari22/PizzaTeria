'use client';

import { Component, Suspense, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

const PizzaScene = dynamic(() => import('./PizzaScene'), { ssr: false, loading: () => <div className="scene-loading"><span/>WARMING UP THE OVEN</div> });
const stages = [
  { label: 'The foundation', title: <>Great things<br/>start <em>slow.</em></>, detail: 'Flour. Water. A pinch of patience. Our dough takes 48 hours to find its light, airy soul.', number: '01', stat: '48 HOURS', statLabel: 'TO MAKE THE PERFECT DOUGH' },
  { label: 'The good stuff', title: <>Simple things.<br/><em>Beautifully done.</em></>, detail: 'Sweet tomatoes, milky mozzarella, fragrant basil. Nothing to hide. Everything to love.', number: '02', stat: '100% HEART', statLabel: 'IN EVERY SINGLE INGREDIENT' },
  { label: 'A little fire', title: <>Into the fire.<br/>Out comes <em>magic.</em></>, detail: 'A fiercely hot oven. A beautifully blistered crust. Just 90 seconds to bring it all together.', number: '03', stat: '450°C', statLabel: 'A LITTLE HEAT GOES A LONG WAY' },
  { label: 'Wrapped in love', title: <>Goodness.<br/><em>All boxed up.</em></>, detail: 'Fresh from the flames, tucked into its little home. Keeping every bit of the good stuff inside.', number: '04', stat: 'FRESH & WARM', statLabel: 'PACKED WITH A LITTLE AMORE' },
  { label: 'Your happy place', title: <>From our oven.<br/>To <em>your door.</em></>, detail: 'The best part of the journey? When you open the box. Gather your favourite people. Dig in.', number: '05', stat: 'BUON APPETITO', statLabel: 'YOUR GOOD MOMENT STARTS HERE' },
];

class SceneBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <div className="scene-fallback"><img src="/images/pizza-hero.webp" alt="Handcrafted Margherita pizza"/><p>Handcrafted. Wood-fired. Delivered with love.</p></div> : this.props.children; }
}

export default function PizzaJourney() {
  const target = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] });
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', value => setProgress(value));
  const active = progress < .16 ? 0 : progress < .33 ? 1 : progress < .5 ? 2 : progress < .77 ? 3 : 4;
  const stage = stages[active];
  function jump(index) {
    const positions = [0, .22, .4, .65, .94];
    if (!target.current) return;
    const top = target.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (target.current.offsetHeight - window.innerHeight) * positions[index], behavior: reduce ? 'instant' : 'smooth' });
  }
  return <section id="journey" className="journey" ref={target} aria-label="The pizza journey, an interactive 3D scroll experience">
    <div className="journey-sticky">
      <div className="journey-header"><span className="eyebrow"><span className="tiny-dot"/> FROM FLOUR TO FRONT DOOR</span><span className="journey-hint">A GOOD PIZZA HAS A GOOD STORY <ArrowDown size={14}/></span></div>
      <div className="journey-copy"><span className="journey-kicker">THE GOOD PROCESS <span>/{stage.number}</span></span><AnimatePresence initial={false} mode="sync"><motion.div key={stage.number} initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }} transition={{ duration: .3 }}><h2>{stage.title}</h2><p>{stage.detail}</p><div className="journey-stat"><strong>{stage.stat}</strong><span>{stage.statLabel}</span></div></motion.div></AnimatePresence></div>
      <div className="journey-scene"><SceneBoundary><Suspense fallback={<div className="scene-loading">WARMING UP THE OVEN</div>}><PizzaScene progress={progress} reducedMotion={!!reduce}/></Suspense></SceneBoundary></div>
      <span className="journey-giant-number" aria-hidden="true">{stage.number}</span>
      <div className="journey-bottom"><div className="journey-timeline" aria-label="Pizza journey stages">{stages.map((step, index) => <button key={step.number} onClick={() => jump(index)} className={active === index ? 'active' : active > index ? 'completed' : ''} aria-current={active === index ? 'step' : undefined}><span className="timeline-number">{step.number}</span><span>{step.label}</span><i/></button>)}</div><span className="journey-scroll-note">KEEP SCROLLING. IT GETS GOOD. <ArrowDown size={14}/></span></div>
      <motion.div className="journey-progress" style={{ scaleX: scrollYProgress }}/>
    </div>
  </section>;
}
