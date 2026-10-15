'use client';

import { Component, Suspense, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import useReducedMotion from '../lib/useHydratedReducedMotion';
import { JOURNEY_HEIGHT_VH, getStoryProgress, getScrollProgress } from '../lib/journeyMotion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

const PizzaScene = dynamic(() => import('./PizzaScene'), { ssr: false, loading: () => <div className="scene-loading"><span/>WARMING UP THE OVEN</div> });
const stages = [
  { label: 'The dough', title: <>Patience.<br/><em>Perfected.</em></>, detail: 'Flour, water, and the luxury of time. Forty-eight hours of slow fermentation for a crust with character.', number: '01', stat: '48 HOURS', statLabel: 'NOT A MINUTE RUSHED', object: '01 / THE FOUNDATION' },
  { label: 'The ingredients', title: <>Pure ingredients.<br/><em>Bold intentions.</em></>, detail: 'Rich San Marzano tomatoes. Fior di latte that melts like a dream. Basil, torn fresh. Every ingredient earns its place.', number: '02', stat: 'NO SHORTCUTS', statLabel: 'ONLY THE GOOD STUFF', object: '02 / THE COMPOSITION' },
  { label: 'The fire', title: <>Born in<br/><em>the fire.</em></>, detail: 'A fierce wood-fired oven transforms slow craft into a blistered crust, molten centre, and unmistakable first bite.', number: '03', stat: '450°C', statLabel: 'NINETY SECONDS. ALL THE DIFFERENCE.', object: '03 / THE TRANSFORMATION' },
  { label: 'The signature', title: <>The final<br/><em>signature.</em></>, detail: 'From the oven to our signature box. Carefully packed, beautifully presented, with every bit of warmth kept inside.', number: '04', stat: 'PIZZA TERIA', statLabel: 'A GOOD THING, BEAUTIFULLY WRAPPED.', object: '04 / THE PRESENTATION' },
  { label: 'Your table', title: <>Your table.<br/><em>Our pleasure.</em></>, detail: 'The craft is ours. The moment is yours. Open the box, gather your people, and make a ritual of the first slice.', number: '05', stat: 'BUON APPETITO', statLabel: 'YOUR EVENING, ELEVATED.', object: '05 / THE ARRIVAL' },
];

class SceneBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <div className="scene-fallback"><img src="/images/pizza-signature.webp" alt="Pizza Teria signature Margherita"/><p>Crafted in fire. Finished with soul.</p></div> : this.props.children; }
}

export default function PizzaJourney() {
  const target = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] });
  const storyProgress = useTransform(scrollYProgress, getStoryProgress);
  const [active, setActive] = useState(0);
  const lastStage = useRef(0);
  const [sceneActive, setSceneActive] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setSceneActive(entry.isIntersecting), { rootMargin: '200px 0px' });
    if (target.current) observer.observe(target.current);
    return () => observer.disconnect();
  }, []);
  useMotionValueEvent(storyProgress, 'change', progress => {
    const next = progress < .16 ? 0 : progress < .33 ? 1 : progress < .5 ? 2 : progress < .77 ? 3 : 4;
    if (next !== lastStage.current) {
      lastStage.current = next;
      setActive(next);
    }
  });
  const stage = stages[active];
  function jump(index) {
    const positions = [0, .22, .4, .65, .94];
    if (!target.current) return;
    const top = target.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (target.current.offsetHeight - window.innerHeight) * getScrollProgress(positions[index]), behavior: reduce ? 'instant' : 'smooth' });
  }
  return <section id="journey" className="journey" style={{ height: `${JOURNEY_HEIGHT_VH}vh` }} ref={target} aria-label="The pizza journey, an interactive 3D scroll experience">
    <div className="journey-sticky">
      <div className="journey-ambient" aria-hidden="true"/>
      <div className="journey-header"><span className="eyebrow"><span className="tiny-dot"/> THE ART BEHIND THE OBSESSION</span><span className="journey-hint">FIVE CHAPTERS. ONE PERFECT PIZZA. <ArrowDown size={14}/></span></div>
      <div className="journey-copy"><span className="journey-kicker">THE PIZZA TERIA RITUAL <span>/{stage.number}</span></span><AnimatePresence initial={false} mode="sync"><motion.div key={stage.number} initial={{ opacity: 0, y: reduce ? 0 : 18, filter: reduce ? 'none' : 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }} transition={{ duration: .45, ease: [.22, 1, .36, 1] }}><h2>{stage.title}</h2><p>{stage.detail}</p><div className="journey-stat"><strong>{stage.stat}</strong><span>{stage.statLabel}</span></div></motion.div></AnimatePresence></div>
      <div className="journey-scene"><SceneBoundary><Suspense fallback={<div className="scene-loading">WARMING UP THE OVEN</div>}><PizzaScene progressSource={storyProgress} active={sceneActive} reducedMotion={!!reduce}/></Suspense></SceneBoundary></div>
      <span className="journey-giant-number" aria-hidden="true">{stage.number}</span>
      <span className="journey-object-label">{stage.object}</span>
      <div className="journey-bottom"><div className="journey-timeline" aria-label="Pizza journey stages">{stages.map((step, index) => <button key={step.number} onClick={() => jump(index)} className={active === index ? 'active' : active > index ? 'completed' : ''} aria-current={active === index ? 'step' : undefined}><span className="timeline-number">{step.number}</span><span>{step.label}</span><i/></button>)}</div><span className="journey-scroll-note">THE CRAFT UNFOLDS AS YOU SCROLL. <ArrowDown size={14}/></span></div>
      <motion.div className="journey-progress" style={{ scaleX: scrollYProgress }}/>
    </div>
  </section>;
}
