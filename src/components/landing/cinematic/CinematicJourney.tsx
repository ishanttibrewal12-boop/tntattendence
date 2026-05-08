import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import companyLogo from '@/assets/tibrewal-logo.png';
import './cinematic.css';

gsap.registerPlugin(ScrollTrigger);

const SECTIONS = [
  { id: 'cin-hero',      label: 'Home' },
  { id: 'cin-mining',    label: 'Mining' },
  { id: 'cin-crushing',  label: 'Crushing' },
  { id: 'cin-petroleum', label: 'Petroleum' },
  { id: 'cin-tyres',     label: 'Tyres' },
  { id: 'cin-agro',      label: 'Agro' },
];

const isTouchOnly = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches;

const CinematicJourney = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLLIElement[]>([]);
  const dotsRef = useRef<HTMLButtonElement[]>([]);

  // Custom cursor (desktop only)
  useEffect(() => {
    if (isTouchOnly()) return;
    const root = rootRef.current;
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!root || !cursor || !ring) return;

    root.classList.add('cursor-hidden');
    let mouseX = -100, mouseY = -100, ringX = -100, ringY = -100;
    let inside = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX; mouseY = e.clientY;
      gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.08, overwrite: true });
      if (!inside) {
        inside = true;
        gsap.to([cursor, ring], { autoAlpha: 1, duration: 0.2 });
      }
    };
    const onLeave = () => {
      inside = false;
      gsap.to([cursor, ring], { autoAlpha: 0, duration: 0.2 });
    };

    gsap.set([cursor, ring], { autoAlpha: 0 });
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    const tick = () => {
      ringX += (mouseX - ringX) * 0.14;
      ringY += (mouseY - ringY) * 0.14;
      gsap.set(ring, { x: ringX, y: ringY });
    };
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      gsap.ticker.remove(tick);
      root.classList.remove('cursor-hidden');
    };
  }, []);

  // Scroll progress + journey dots active state
  useEffect(() => {
    const root = rootRef.current;
    const progress = progressRef.current;
    if (!root || !progress) return;

    const ctx = gsap.context(() => {
      gsap.to(progress, {
        width: '100%',
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });

      SECTIONS.forEach((s, i) => {
        ScrollTrigger.create({
          trigger: '#' + s.id,
          start: 'top 55%',
          end: 'bottom 45%',
          onEnter: () => setActive(i),
          onEnterBack: () => setActive(i),
        });
      });

      const setActive = (i: number) => {
        dotsRef.current.forEach((d, j) => d?.classList.toggle('active', j === i));
        navItemsRef.current.forEach((n, j) => n?.classList.toggle('active', j === i));
      };
    }, root);

    return () => ctx.revert();
  }, []);

  // Hero entrance + parallax + rock particles
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.cin-hero-eyebrow', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
        .fromTo('.cin-hero-title .l1', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.4')
        .fromTo('.cin-hero-title .l2', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo('.cin-hero-title .l3', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo('.cin-hero-sub',       { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo('.cin-scroll-indicator', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');

      // Rock particles
      const hero = root.querySelector('.cin-hero') as HTMLElement | null;
      if (hero) {
        for (let i = 0; i < 18; i++) {
          const p = document.createElement('div');
          p.className = 'cin-rock-particle';
          const size = Math.random() * 7 + 3;
          p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;`;
          hero.appendChild(p);
          gsap.to(p, {
            opacity: Math.random() * 0.5 + 0.1,
            y: `-=${Math.random() * 90 + 40}`,
            x: `+=${(Math.random()-0.5)*60}`,
            duration: Math.random() * 4 + 3,
            repeat: -1,
            yoyo: true,
            delay: Math.random() * 3,
            ease: 'sine.inOut',
          });
        }
      }

      // Hero parallax mountains
      gsap.to('.cin-mountain-scene', {
        y: 120, ease: 'none',
        scrollTrigger: { trigger: '.cin-hero', start: 'top top', end: 'bottom top', scrub: 1 },
      });

      // Section reveal animation for each vertical
      ['cin-mining', 'cin-crushing', 'cin-petroleum', 'cin-tyres', 'cin-agro'].forEach((id) => {
        const sel = `#${id} `;
        const stl = gsap.timeline({
          scrollTrigger: { trigger: '#' + id, start: 'top 65%', toggleActions: 'play none none reverse' },
        });
        stl
          .fromTo(sel + '.cin-label',  { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.6 })
          .fromTo(sel + '.cin-title',  { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
          .fromTo(sel + '.cin-desc',   { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
          .fromTo(sel + '.cin-visual', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.4)' }, '-=0.6');
      });

      // Counters
      const animateCounters = (sectionEl: Element) => {
        sectionEl.querySelectorAll<HTMLElement>('.cin-stat-num[data-target]').forEach((el) => {
          const target = parseInt(el.dataset.target || '0', 10);
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 2, ease: 'power2.out',
            onUpdate: () => { el.textContent = Math.floor(obj.v).toLocaleString('en-IN'); },
          });
        });
      };
      SECTIONS.slice(1).forEach((s) => {
        ScrollTrigger.create({
          trigger: '#' + s.id, start: 'top 60%', once: true,
          onEnter: () => {
            const el = document.getElementById(s.id);
            if (el) animateCounters(el);
          },
        });
      });

      // Excavator boom
      gsap.to('#cinExcBoom', { rotation: 8, transformOrigin: '155px 195px', duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('#cinExcStick', { rotation: -10, transformOrigin: '230px 140px', duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('#cinExcBucket', { rotation: 15, transformOrigin: '275px 190px', duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('#cinDustArea', { opacity: 1, scale: 1.3, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: 'center center' });

      // Crusher
      gsap.to('#cinMovingJaw', { x: 5, scaleX: 0.92, transformOrigin: 'top center', duration: 0.3, repeat: -1, yoyo: true, ease: 'power2.inOut' });
      gsap.to('#cinFlywheel', { rotation: 360, transformOrigin: '300px 170px', duration: 0.8, repeat: -1, ease: 'none' });
      gsap.fromTo('#cinInputRock', { y: 0, opacity: 0.95 }, { y: 160, opacity: 0, duration: 1.5, repeat: -1, ease: 'power1.in' });
      gsap.to('#cinOutputStones', { x: 60, duration: 2, repeat: -1, ease: 'none', modifiers: { x: gsap.utils.unitize((x) => parseFloat(x) % 120) } });

      // Petroleum: pump glow + nozzle
      gsap.to('#cinFuelGlow', { scale: 1.3, opacity: 1, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: 'center center' });
      gsap.to('#cinFuelDrop', { y: 50, opacity: 0, duration: 1.2, repeat: -1, ease: 'power1.in' });

      // Tyres: rotating wheels
      gsap.to('#cinTyreA', { rotation: 360, transformOrigin: 'center center', duration: 4, repeat: -1, ease: 'none' });
      gsap.to('#cinTyreB', { rotation: -360, transformOrigin: 'center center', duration: 6, repeat: -1, ease: 'none' });
      gsap.to('#cinTyreC', { rotation: 360, transformOrigin: 'center center', duration: 8, repeat: -1, ease: 'none' });

      // Agro: growing wheat / sun
      gsap.fromTo('#cinSun', { scale: 0.9 }, { scale: 1.05, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: 'center center' });
      gsap.to('.cin-wheat-stalk', { rotation: 4, transformOrigin: 'bottom center', duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.15, from: 'random' } });
    }, root);

    return () => ctx.revert();
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const setNavRef = (i: number) => (el: HTMLLIElement | null) => { if (el) navItemsRef.current[i] = el; };
  const setDotRef = (i: number) => (el: HTMLButtonElement | null) => { if (el) dotsRef.current[i] = el; };

  return (
    <div ref={rootRef} className="cinematic-scope relative">
      {/* cursor */}
      <div ref={cursorRef} className="cin-cursor" aria-hidden />
      <div ref={ringRef} className="cin-cursor-ring" aria-hidden />

      {/* progress */}
      <div ref={progressRef} className="cin-progress" aria-hidden />

      {/* journey dots */}
      <div className="cin-journey" role="navigation" aria-label="Section progress">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            ref={setDotRef(i)}
            className={`cin-jdot ${i === 0 ? 'active' : ''}`}
            onClick={() => goTo(s.id)}
            aria-label={s.label}
          />
        ))}
      </div>

      {/* top nav */}
      <nav className="cin-nav">
        <button onClick={() => goTo('cin-hero')} className="cin-nav-logo bg-transparent border-0">
          <img src={companyLogo} alt="Tibrewal Group" />
          <span>Tibrewal<span className="ore"> Group</span></span>
        </button>
        <ul>
          {SECTIONS.map((s, i) => (
            <li
              key={s.id}
              ref={setNavRef(i)}
              className={i === 0 ? 'active' : ''}
              onClick={() => goTo(s.id)}
            >
              {s.label}
            </li>
          ))}
        </ul>
      </nav>

      {/* ============== HERO ============== */}
      <section id="cin-hero" className="cin-section cin-hero">
        <div className="cin-hero-bg" aria-hidden />
        <svg className="cin-mountain-scene" viewBox="0 0 1440 400" preserveAspectRatio="none"
             style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' }} aria-hidden>
          <polygon points="0,400 200,80 400,400" fill="#1a1008" opacity="0.6"/>
          <polygon points="250,400 550,40 850,400" fill="#1e1409" opacity="0.8"/>
          <polygon points="600,400 900,60 1200,400" fill="#221808" opacity="0.7"/>
          <polygon points="900,400 1150,100 1440,400" fill="#1a1008" opacity="0.6"/>
          <polygon points="0,400 100,200 300,400" fill="#2a1c0a"/>
          <polygon points="200,400 450,120 700,400" fill="#2e1e0c" stroke="rgba(200,120,42,0.1)" strokeWidth="1"/>
          <polygon points="550,400 800,140 1100,400" fill="#2a1c0a"/>
          <polygon points="850,400 1100,160 1440,400" fill="#2e1e0c"/>
          <rect x="0" y="340" width="1440" height="60" fill="#1a1008"/>
          <path d="M400 200 Q450 180 500 200 Q540 215 560 190" fill="none" stroke="rgba(200,120,42,0.3)" strokeWidth="2"/>
          <path d="M700 160 Q750 140 790 165 Q820 180 840 155" fill="none" stroke="rgba(200,120,42,0.25)" strokeWidth="1.5"/>
        </svg>

        <div className="relative z-[2]">
          <div className="cin-hero-eyebrow">From Earth to Elevation · Est. 2013</div>
          <h1 className="cin-hero-title">
            <span className="l1">TIBREWAL</span>
            <span className="l2">GROUP</span>
            <span className="l3">INDUSTRIES</span>
          </h1>
          <p className="cin-hero-sub">Mining · Crushing · Petroleum · Tyres · Agro · Ventures</p>
        </div>

        <div className="cin-scroll-indicator">
          <div className="cin-scroll-line" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ============== MINING (Step 01) ============== */}
      <section id="cin-mining" className="cin-section cin-mining">
        <div className="cin-section-num">01</div>
        <div className="cin-grid">
          <div>
            <div className="cin-tag"><span className="cin-tag-dot" /> Tibrewal Mines &amp; Minerals Pvt. Ltd.</div>
            <div className="cin-label">Step 01</div>
            <h2 className="cin-title">RAW <span className="accent">MINING</span></h2>
            <p className="cin-desc">
              Extracting Jharkhand&rsquo;s finest aggregates from open-cast quarries. Precision excavation,
              compliant operations, and a relentless focus on quality at the source.
            </p>
            <div className="cin-stats">
              <div>
                <div className="cin-stat-num" data-target="13">0</div>
                <div className="cin-stat-label">Years Experience</div>
              </div>
              <div>
                <div className="cin-stat-num" data-target="100">0</div>
                <div className="cin-stat-label">% Compliance</div>
              </div>
            </div>
          </div>

          <div className="cin-visual">
            <svg viewBox="0 0 360 360" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              <rect x="0" y="220" width="360" height="140" fill="#1a1008"/>
              <rect x="0" y="230" width="360" height="8" fill="rgba(200,120,42,0.15)"/>
              <rect x="0" y="260" width="360" height="6" fill="rgba(200,120,42,0.1)"/>
              <ellipse cx="150" cy="265" rx="40" ry="18" fill="rgba(200,120,42,0.4)"/>
              <ellipse cx="230" cy="280" rx="30" ry="14" fill="rgba(200,120,42,0.3)"/>
              <ellipse cx="80" cy="290" rx="25" ry="12" fill="rgba(200,120,42,0.25)"/>
              <g>
                <ellipse cx="120" cy="228" rx="55" ry="10" fill="#2a2018"/>
                <rect x="68" y="218" width="104" height="10" fill="#3a3028" rx="5"/>
                <rect x="78" y="190" width="84" height="35" fill="#3d2b1a" rx="3"/>
                <rect x="90" y="168" width="52" height="28" fill="#4a3520" rx="2"/>
                <rect x="96" y="173" width="18" height="12" fill="rgba(120,180,220,0.4)" rx="1"/>
                <g id="cinExcBoom">
                  <line x1="155" y1="195" x2="230" y2="140" stroke="#5a4030" strokeWidth="14" strokeLinecap="round"/>
                  <g id="cinExcStick">
                    <line x1="230" y1="140" x2="275" y2="190" stroke="#4a3525" strokeWidth="10" strokeLinecap="round"/>
                    <g id="cinExcBucket">
                      <path d="M270 188 L290 178 L300 200 L278 210 Z" fill="#5a4030" stroke="#3a2818" strokeWidth="1.5"/>
                      <line x1="278" y1="210" x2="274" y2="220" stroke="#4a3525" strokeWidth="3"/>
                      <line x1="286" y1="213" x2="283" y2="223" stroke="#4a3525" strokeWidth="3"/>
                      <line x1="294" y1="208" x2="292" y2="218" stroke="#4a3525" strokeWidth="3"/>
                    </g>
                  </g>
                </g>
              </g>
              <g>
                <ellipse cx="290" cy="228" rx="50" ry="15" fill="#2a1c0a"/>
                <ellipse cx="295" cy="222" rx="30" ry="10" fill="#3a2a15"/>
                <ellipse cx="278" cy="220" rx="18" ry="8" fill="#4a3820"/>
                <ellipse cx="310" cy="219" rx="15" ry="7" fill="#3a2a15"/>
                <ellipse cx="285" cy="220" rx="5" ry="3" fill="rgba(200,120,42,0.7)"/>
                <ellipse cx="305" cy="218" rx="4" ry="2" fill="rgba(200,120,42,0.6)"/>
              </g>
              <g id="cinDustArea" opacity="0">
                <ellipse cx="280" cy="225" rx="70" ry="20" fill="rgba(180,140,80,0.18)"/>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* ============== CRUSHING (Step 02) ============== */}
      <section id="cin-crushing" className="cin-section cin-crushing">
        <div className="cin-section-num">02</div>
        <div className="cin-grid">
          <div className="cin-visual order-2 md:order-1">
            <svg viewBox="0 0 360 380" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="cinMetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5a5048"/>
                  <stop offset="100%" stopColor="#2a2520"/>
                </linearGradient>
              </defs>
              <rect x="60" y="240" width="240" height="100" fill="url(#cinMetalGrad)" rx="4"/>
              <rect x="200" y="330" width="160" height="16" fill="#3a3028" rx="8"/>
              <ellipse cx="200" cy="338" rx="10" ry="8" fill="#2a2018"/>
              <ellipse cx="360" cy="338" rx="10" ry="8" fill="#2a2018"/>
              <g>
                <path d="M100 100 L260 100 L270 240 L90 240 Z" fill="#3d3530" stroke="#5a5048" strokeWidth="2"/>
                <g fill="#2a2820">
                  {[93,118,143,168,193,218,243].map((x) => (
                    <rect key={x} x={x} y="228" width="18" height="16" rx="1"/>
                  ))}
                </g>
                <g id="cinMovingJaw">
                  <path d="M120 105 L240 105 L250 230 L110 230 Z" fill="#4a4038" stroke="#6a6055" strokeWidth="1.5"/>
                  <g fill="#3a3828">
                    {[113,136,159,182,205,228].map((x) => (
                      <rect key={x} x={x} y="218" width="16" height="14" rx="1"/>
                    ))}
                  </g>
                </g>
                <path d="M80 50 L280 50 L260 100 L100 100 Z" fill="#4a4035" stroke="#6a6050" strokeWidth="2"/>
                <rect x="80" y="38" width="200" height="15" fill="#5a5040" rx="2"/>
                <g id="cinInputRock">
                  <polygon points="160,60 180,55 190,70 175,80 155,75" fill="#6a5840"/>
                  <polygon points="180,58 200,52 208,66 195,76 178,72" fill="#7a6848" opacity="0.85"/>
                </g>
              </g>
              <circle id="cinFlywheel" cx="300" cy="170" r="36" fill="#3a3028" stroke="#5a5040" strokeWidth="3"/>
              <circle cx="300" cy="170" r="10" fill="#2a2018"/>
              <line x1="300" y1="134" x2="300" y2="170" stroke="#6a6050" strokeWidth="4"/>
              <line x1="300" y1="170" x2="336" y2="170" stroke="#6a6050" strokeWidth="4"/>
              <g id="cinOutputStones">
                <rect x="215" y="325" width="12" height="9" fill="#7a6850" rx="2" opacity="0.85"/>
                <rect x="235" y="326" width="9"  height="8" fill="#6a5840" rx="2" opacity="0.75"/>
                <rect x="252" y="324" width="11" height="10" fill="#8a7860" rx="2" opacity="0.85"/>
                <rect x="270" y="325" width="8"  height="9" fill="#7a6850" rx="2" opacity="0.75"/>
                <rect x="285" y="326" width="10" height="8" fill="#6a5840" rx="2" opacity="0.85"/>
              </g>
            </svg>
          </div>
          <div className="order-1 md:order-2">
            <div className="cin-tag"><span className="cin-tag-dot" /> Stone Crushing Unit</div>
            <div className="cin-label">Step 02</div>
            <h2 className="cin-title">STONE <span className="accent-amber">CRUSHING</span></h2>
            <p className="cin-desc">
              High-throughput jaw and cone crushers reduce raw rock into precisely graded aggregate —
              from coarse gravel to fine construction sand, engineered to spec.
            </p>
            <div className="cin-stats">
              <div>
                <div className="cin-stat-num" data-target="13">0</div>
                <div className="cin-stat-label">Years In Operation</div>
              </div>
              <div>
                <div className="cin-stat-num" data-target="6">0</div>
                <div className="cin-stat-label">Grade Sizes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PETROLEUM (Step 03) ============== */}
      <section id="cin-petroleum" className="cin-section cin-petroleum">
        <div className="cin-section-num">03</div>
        <div className="cin-grid">
          <div>
            <div className="cin-tag"><span className="cin-tag-dot" /> Jai Shree Shyam Petroleum · Bharat Petroleum</div>
            <div className="cin-label">Step 03</div>
            <h2 className="cin-title">FUEL <span className="accent-amber">DELIVERED</span></h2>
            <p className="cin-desc">
              Authorised Bharat Petroleum retail outlet operating round the clock. Diesel, petrol, and
              lubricants — accurate metering, clean fuel, and trusted service across every shift.
            </p>
            <div className="cin-stats">
              <div>
                <div className="cin-stat-num" data-target="24">0</div>
                <div className="cin-stat-label">x7 Operations</div>
              </div>
              <div>
                <div className="cin-stat-num" data-target="100">0</div>
                <div className="cin-stat-label">% BP Authorised</div>
              </div>
            </div>
          </div>
          <div className="cin-visual">
            <svg viewBox="0 0 360 380" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              <circle id="cinFuelGlow" cx="180" cy="220" r="90"
                      fill="rgba(232,19,42,0.18)" />
              {/* canopy */}
              <rect x="40" y="80" width="280" height="22" fill="#0a3a1f" rx="3"/>
              <rect x="40" y="100" width="280" height="6" fill="#cfa030"/>
              <rect x="50" y="106" width="260" height="3" fill="#e8132a"/>
              <rect x="55" y="108" width="60" height="3" fill="#009b4e"/>
              {/* poles */}
              <rect x="60" y="100" width="6" height="180" fill="#2a2820"/>
              <rect x="294" y="100" width="6" height="180" fill="#2a2820"/>
              {/* pump unit */}
              <rect x="130" y="170" width="100" height="120" fill="#2a2520" rx="6"/>
              <rect x="138" y="180" width="84" height="34" fill="#0d0d0d" rx="3"/>
              <text x="180" y="198" textAnchor="middle"
                    fontFamily="'Barlow Condensed',sans-serif" fontSize="11" fill="#ffcc00" letterSpacing="1">DIESEL</text>
              <text x="180" y="210" textAnchor="middle"
                    fontFamily="'Barlow Condensed',sans-serif" fontSize="9" fill="#00ff80" letterSpacing="1">PETROL</text>
              <rect x="148" y="222" width="64" height="46" fill="#1a1815" rx="2"/>
              {/* nozzle hose */}
              <path d="M225 230 Q260 250 270 290" stroke="#2a2520" strokeWidth="6" fill="none" strokeLinecap="round"/>
              <rect x="262" y="288" width="20" height="10" fill="#3a3028" rx="2"/>
              <circle id="cinFuelDrop" cx="272" cy="302" r="3" fill="#e8a040"/>
              {/* ground */}
              <rect x="0" y="290" width="360" height="90" fill="#0d0d0d"/>
              <rect x="0" y="298" width="360" height="2" fill="rgba(255,204,0,0.35)"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ============== TYRES (Step 04) ============== */}
      <section id="cin-tyres" className="cin-section cin-tyres">
        <div className="cin-section-num">04</div>
        <div className="cin-grid">
          <div className="cin-visual order-2 md:order-1">
            <svg viewBox="0 0 360 360" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              {/* shop floor */}
              <rect x="0" y="280" width="360" height="80" fill="#0a1218"/>
              {/* tyre A */}
              <g id="cinTyreA" transform="translate(100 180)">
                <circle r="62" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="6"/>
                <circle r="28" fill="#1a1f26"/>
                {Array.from({ length: 10 }).map((_, i) => {
                  const a = (i / 10) * Math.PI * 2;
                  return <rect key={i} x={Math.cos(a)*52 - 4} y={Math.sin(a)*52 - 8} width="8" height="16" fill="#2a2a2a" transform={`rotate(${(i*36)} ${Math.cos(a)*52} ${Math.sin(a)*52})`}/>;
                })}
                <circle r="6" fill="#7fb3d0"/>
              </g>
              {/* tyre B (smaller, behind) */}
              <g id="cinTyreB" transform="translate(240 140)">
                <circle r="48" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="5"/>
                <circle r="20" fill="#1a1f26"/>
                {Array.from({ length: 8 }).map((_, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  return <rect key={i} x={Math.cos(a)*38 - 3} y={Math.sin(a)*38 - 6} width="6" height="12" fill="#2a2a2a" />;
                })}
              </g>
              {/* tyre C */}
              <g id="cinTyreC" transform="translate(280 240)">
                <circle r="38" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="4"/>
                <circle r="14" fill="#1a1f26"/>
                {Array.from({ length: 6 }).map((_, i) => {
                  const a = (i / 6) * Math.PI * 2;
                  return <rect key={i} x={Math.cos(a)*30 - 2} y={Math.sin(a)*30 - 5} width="4" height="10" fill="#2a2a2a" />;
                })}
              </g>
              {/* shadow */}
              <ellipse cx="180" cy="290" rx="170" ry="6" fill="rgba(0,0,0,0.4)"/>
            </svg>
          </div>
          <div className="order-1 md:order-2">
            <div className="cin-tag"><span className="cin-tag-dot" /> Tyres &amp; Office</div>
            <div className="cin-label">Step 04</div>
            <h2 className="cin-title">TYRE <span className="accent-sky">TRADING</span></h2>
            <p className="cin-desc">
              Trusted dealership for commercial and passenger tyres — from heavy-haul radials to fleet
              service. Stocked, certified, and fitted by an experienced team.
            </p>
            <div className="cin-stats">
              <div>
                <div className="cin-stat-num" data-target="13">0</div>
                <div className="cin-stat-label">Years Trusted</div>
              </div>
              <div>
                <div className="cin-stat-num" data-target="100">0</div>
                <div className="cin-stat-label">% Genuine Stock</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== AGRO (Step 05) ============== */}
      <section id="cin-agro" className="cin-section cin-agro">
        <div className="cin-section-num" style={{ color: 'rgba(76,175,128,0.06)' }}>05</div>
        <div className="cin-grid">
          <div>
            <div className="cin-tag" style={{ background: 'rgba(76,175,128,0.1)', borderColor: 'rgba(76,175,128,0.3)', color: '#4caf80' }}>
              <span className="cin-tag-dot" style={{ background: '#4caf80' }} /> Agro &amp; Food Processing
            </div>
            <div className="cin-label" style={{ color: '#4caf80' }}>Step 05</div>
            <h2 className="cin-title">AGRO <span className="accent-green">PROCESSING</span></h2>
            <p className="cin-desc">
              From farm to factory — agro-food processing operations supporting local growers and
              delivering quality output to regional markets.
            </p>
            <div className="cin-stats">
              <div>
                <div className="cin-stat-num" data-target="13" style={{ color: '#4caf80' }}>0</div>
                <div className="cin-stat-label">Years Strong</div>
              </div>
              <div>
                <div className="cin-stat-num" data-target="100" style={{ color: '#4caf80' }}>0</div>
                <div className="cin-stat-label">% Local Sourcing</div>
              </div>
            </div>
          </div>
          <div className="cin-visual">
            <svg viewBox="0 0 360 360" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              {/* sky */}
              <rect x="0" y="0" width="360" height="220" fill="#0d1510"/>
              <circle id="cinSun" cx="280" cy="80" r="34" fill="rgba(232,160,64,0.45)"/>
              <circle cx="280" cy="80" r="20" fill="rgba(255,210,120,0.55)"/>
              {/* hills */}
              <path d="M0 230 Q90 180 180 220 T 360 215 L360 280 L0 280 Z" fill="#1a2a18"/>
              {/* ground */}
              <rect x="0" y="270" width="360" height="90" fill="#0d1810"/>
              {/* wheat field */}
              {Array.from({ length: 14 }).map((_, i) => {
                const x = 30 + i * 22;
                return (
                  <g key={i} className="cin-wheat-stalk" transform={`translate(${x} 275)`}>
                    <line x1="0" y1="0" x2="0" y2="-60" stroke="#a08840" strokeWidth="2"/>
                    <ellipse cx="0" cy="-65" rx="5" ry="12" fill="#cfa848"/>
                    <ellipse cx="-4" cy="-55" rx="3" ry="6" fill="#b89438"/>
                    <ellipse cx="4" cy="-55" rx="3" ry="6" fill="#b89438"/>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      <div className="cinematic-bottom-fade" aria-hidden />
    </div>
  );
};

export default CinematicJourney;
