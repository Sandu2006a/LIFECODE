'use client';

/**
 * ProductCanvas — Timeline:
 *
 *   0% ──── 22%   Canvas shrinks from full-screen → ~56 % (box first).
 *
 *  22% ──── 82%   Video scrubs. Three phase overlays appear across equal windows.
 *
 *  72% ──── 92%   Three product cards rise in, staggered. New editorial design.
 *
 * Section height: 680 vh
 */

import { useEffect, useRef } from 'react';
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ─── Scroll thresholds ─────────────────────────────────────────── */
const SHRINK_S     = 0.00;   // shrink starts immediately
const SHRINK_E     = 0.22;   // fully shrunk
const VIDEO_S      = 0.22;   // video starts scrubbing
const VIDEO_E      = 0.82;   // video fully done
const PHASE_WIN    = (VIDEO_E - VIDEO_S) / 3;
const CARDS_S      = 0.72;
const CARDS_E      = 0.92;
const CARD_STAGGER = 0.05;
const FADE         = 0.035;

/* ─── Phase overlay data ────────────────────────────────────────── */
const PHASES = [
  {
    id: 'morning', number: '01', title: 'Morning Mix', tagline: 'Activate.',
    body: 'Precision-dosed micronutrients calibrated to your circadian rhythm. Activates cellular respiration and metabolic priming at the molecular level.',
    range: [VIDEO_S, VIDEO_S + PHASE_WIN], align: 'left',
  },
  {
    id: 'training', number: '02', title: 'Training Gel', tagline: 'Perform.',
    body: 'Adaptive energy delivery engineered for peak performance windows. Sustains ATP synthesis during maximum output without metabolic debt.',
    range: [VIDEO_S + PHASE_WIN, VIDEO_S + PHASE_WIN * 2], align: 'right',
  },
  {
    id: 'recovery', number: '03', title: 'Recovery Salts', tagline: 'Rebuild.',
    body: 'Electrolyte matrix with targeted amino acid complexes. Initiates cellular repair, deep rehydration, and anabolic recovery at the tissue level.',
    range: [VIDEO_S + PHASE_WIN * 2, VIDEO_E], align: 'left',
  },
];

/* ─── Product card data (English, full) ─────────────────────────── */
const PRODUCTS = [
  {
    id: 'morning', phase: '01', title: 'Morning Mix',
    groups: [
      {
        label: 'Vitamins',
        items: ['Vitamin D3  ·  5 000 IU', 'Vitamin K2 MK-7  ·  200 mcg', 'B-Complex Full Spectrum', 'Vitamin C Buffered  ·  500 mg'],
      },
      {
        label: 'Minerals',
        items: ['Zinc Bisglycinate  ·  25 mg', 'Magnesium Malate  ·  300 mg', 'Calcium Citrate  ·  500 mg'],
      },
    ],
  },
  {
    id: 'training', phase: '02', title: 'Training Gel',
    groups: [
      {
        label: 'Energy Gels',
        items: ['Carbohydrate Matrix  ·  40 g', 'Isotonic Gel Formula', 'Fast-Release Energy Complex'],
      },
      {
        label: 'Performance',
        items: ['Beta-Alanine  ·  3.2 g', 'L-Carnitine L-Tartrate  ·  2 g', 'Creatine Monohydrate  ·  5 g'],
      },
    ],
  },
  {
    id: 'recovery', phase: '03', title: 'Recovery Salts',
    groups: [
      {
        label: 'Recovery Stack',
        items: ['Magnesium Glycinate  ·  400 mg', 'L-Theanine  ·  200 mg', 'Ashwagandha KSM-66  ·  600 mg', 'Electrolyte Complex'],
      },
    ],
  },
];

/* ─── Helpers ───────────────────────────────────────────────────── */
function drawCover(ctx, video, cw, ch) {
  const vw = video.videoWidth  || cw;
  const vh = video.videoHeight || ch;
  const vR = vw / vh;
  const cR = cw / ch;
  let sw, sh, sx, sy;
  if (vR > cR) { sh = vh; sw = sh * cR; sx = (vw - sw) / 2; sy = 0; }
  else         { sw = vw; sh = sw / cR; sx = 0; sy = (vh - sh) / 2; }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function ProductCanvas() {
  const outerRef      = useRef(null);
  const canvasWrapRef = useRef(null);
  const canvasRef     = useRef(null);
  const videoRef      = useRef(null);
  const progressRef   = useRef(null);
  const phaseRefs     = useRef([]);
  const cardRefs      = useRef([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d', { alpha: false });
    let pendingSeek  = false;
    let lastSeekTime = -1;
    const SEEK_THR   = 0.033;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (video.readyState >= 2) drawCover(ctx, video, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const onSeeked = () => { pendingSeek = false; drawCover(ctx, video, canvas.width, canvas.height); };
    video.addEventListener('seeked', onSeeked);

    const onMeta  = () => { video.currentTime = 0; };
    video.addEventListener('loadedmetadata', onMeta);

    const st = ScrollTrigger.create({
      trigger: outerRef.current,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   0.7,
      onUpdate: (self) => {
        const p = self.progress;

        /* ── Canvas shrink: 0 % → 22 % ────────────────────────── */
        const shrinkRaw = Math.max(0, Math.min(1, (p - SHRINK_S) / (SHRINK_E - SHRINK_S)));
        const shrinkE   = easeInOut(shrinkRaw);

        /* ── Video scrub: 22 % → 82 % ──────────────────────────── */
        if (p >= VIDEO_S) {
          const videoP     = Math.min((p - VIDEO_S) / (VIDEO_E - VIDEO_S), 1);
          const targetTime = videoP * (video.duration || 0);
          if (!pendingSeek && Math.abs(targetTime - lastSeekTime) > SEEK_THR) {
            pendingSeek = true; lastSeekTime = targetTime;
            video.currentTime = targetTime;
          }
        }
        gsap.set(canvasWrapRef.current, {
          scale:        1 - shrinkE * 0.44,
          borderRadius: shrinkE * 22,
        });

        /* ── Progress bar ───────────────────────────────────────── */
        if (progressRef.current) {
          gsap.set(progressRef.current, { scaleX: p, transformOrigin: 'left' });
        }

        /* ── Phase overlays ─────────────────────────────────────── */
        PHASES.forEach((phase, i) => {
          const el = phaseRefs.current[i];
          if (!el) return;
          const [s, e] = phase.range;
          let opacity = 0, y = 0;
          if      (p >= s + FADE && p < e - FADE) { opacity = 1; }
          else if (p >= s        && p < s + FADE) { const t = (p - s) / FADE; opacity = t; y = (1 - t) * 22; }
          else if (p >= e - FADE && p < e)        { const t = (e - p) / FADE; opacity = t; y = (1 - t) * -14; }
          gsap.set(el, { opacity, y });
        });

        /* ── Cards: staggered rise 74 % → 94 % ─────────────────── */
        PRODUCTS.forEach((_, i) => {
          const el = cardRefs.current[i];
          if (!el) return;
          const cardStart = CARDS_S + i * CARD_STAGGER;
          const rawP      = Math.max(0, Math.min(1, (p - cardStart) / (CARDS_E - CARDS_S)));
          gsap.set(el, { opacity: easeInOut(rawP), y: (1 - easeInOut(rawP)) * 70 });
        });
      },
    });

    gsap.fromTo(
      outerRef.current.querySelector('.product-eyebrow'),
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: outerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
      }
    );

    return () => {
      st.kill();
      window.removeEventListener('resize', resize);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  return (
    <section ref={outerRef} id="product" className="relative" style={{ height: '680vh' }}>

      <div className="sticky top-0 h-screen w-full bg-lc-black flex items-center justify-center overflow-hidden">

        {/* Hidden video */}
        <video ref={videoRef} src="/product.mp4" preload="auto" muted playsInline
          className="absolute pointer-events-none opacity-0" style={{ width: 1, height: 1, zIndex: -1 }} />

        {/* Canvas wrapper — GSAP scales this */}
        <div ref={canvasWrapRef} className="absolute inset-0 overflow-hidden" style={{ willChange: 'transform' }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: 'block' }} />
          <div className="pointer-events-none absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 28%, transparent 65%, rgba(0,0,0,0.7) 100%)',
          }} />
        </div>

        {/* Eyebrow */}
        <div className="product-eyebrow absolute top-8 left-8 md:top-12 md:left-16 z-20 opacity-0">
          <p className="font-body text-xs tracking-widest2 text-lc-dim uppercase">The Product</p>
        </div>

        {/* ── Phase overlays ────────────────────────────────────── */}
        {PHASES.map((phase, i) => (
          <div
            key={phase.id}
            ref={(el) => (phaseRefs.current[i] = el)}
            className={`
              phase-block pointer-events-none
              absolute top-[42%] -translate-y-1/2 max-w-sm z-20
              ${phase.align === 'left' ? 'left-8 md:left-20' : 'right-8 md:right-20 text-right'}
            `}
          >
            <span className="font-body text-xs tracking-widest2 text-lc-dim uppercase block mb-4">
              Phase {phase.number}
            </span>
            <p className="font-sans font-700 text-white text-[clamp(2.6rem,5.5vw,5.5rem)] tracking-tight leading-none mb-4">
              {phase.tagline}
            </p>
            <h3 className="font-sans font-600 text-lc-silver text-[clamp(1rem,1.8vw,1.5rem)] tracking-tight mb-4">
              {phase.title}
            </h3>
            <div className={`h-px bg-lc-silver/30 mb-4 ${phase.align === 'right' ? 'ml-auto' : ''}`} style={{ width: 48 }} />
            <p className="font-body font-300 text-lc-dim text-sm leading-loose tracking-wide">{phase.body}</p>
          </div>
        ))}

        {/* ── Product cards — editorial spec-sheet design ────────── */}
        <div className="absolute bottom-8 left-0 right-0 z-30 px-6 md:px-14">
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">

            {PRODUCTS.map((product, i) => (
              <div
                key={product.id}
                ref={(el) => (cardRefs.current[i] = el)}
                className="relative overflow-hidden"
                style={{ opacity: 0 }}
              >
                {/* ── Gradient top accent bar ─────────────────── */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: 'linear-gradient(to right, transparent, rgba(229,229,229,0.4) 40%, rgba(229,229,229,0.4) 60%, transparent)',
                  }}
                />

                {/* ── Watermark phase number ───────────────────── */}
                <span
                  className="absolute top-2 right-3 font-sans font-700 text-white/[0.04] select-none pointer-events-none leading-none"
                  style={{ fontSize: 'clamp(4rem, 8vw, 7rem)' }}
                  aria-hidden="true"
                >
                  {product.phase}
                </span>

                {/* ── Card body ────────────────────────────────── */}
                <div
                  className="relative rounded-2xl px-5 pt-5 pb-6"
                  style={{ background: 'linear-gradient(145deg, rgba(18,18,18,0.95) 0%, rgba(8,8,8,0.98) 100%)' }}
                >
                  {/* Phase label + title */}
                  <div className="mb-4">
                    <span className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase block mb-1">
                      Phase {product.phase}
                    </span>
                    <h4 className="font-sans font-600 text-white tracking-tight leading-snug"
                        style={{ fontSize: 'clamp(0.8rem, 1.2vw, 1rem)' }}>
                      {product.title}
                    </h4>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-gradient-to-r from-lc-line via-lc-silver/15 to-lc-line mb-4" />

                  {/* Ingredient groups */}
                  <div className="space-y-4">
                    {product.groups.map((group, gi) => (
                      <div key={group.label}>
                        {/* Group header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-3 h-px bg-lc-silver/30" />
                          <p className="font-body text-[8.5px] tracking-widest2 text-lc-dim uppercase">
                            {group.label}
                          </p>
                        </div>

                        {/* Items */}
                        <ul className="space-y-1.5 pl-1">
                          {group.items.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <svg className="mt-[4px] flex-shrink-0 opacity-40" width="6" height="6" viewBox="0 0 6 6" fill="none">
                                <rect x="1" y="1" width="4" height="4" stroke="#E5E5E5" strokeWidth="0.8"/>
                              </svg>
                              <span className="font-body font-300 text-lc-silver/75 leading-tight"
                                    style={{ fontSize: '10.5px', letterSpacing: '0.02em' }}>
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Subtle separator between groups */}
                        {gi < product.groups.length - 1 && (
                          <div className="mt-3 w-full h-px bg-lc-line/60" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-lc-line overflow-hidden z-40">
          <div ref={progressRef} className="absolute inset-0 bg-lc-silver/50"
               style={{ transformOrigin: 'left', transform: 'scaleX(0)' }} />
        </div>

      </div>
    </section>
  );
}
