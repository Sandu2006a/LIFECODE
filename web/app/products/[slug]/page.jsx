'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PRODUCTS_DATA } from '@/lib/products';

const THEMES = {
  morning: {
    gradient: 'linear-gradient(135deg, #FFD54F 0%, #FF8A00 45%, #C62828 100%)',
    light:    'linear-gradient(180deg, #FFF8E8 0%, #ffffff 100%)',
    bgLight:  '#FFF8E8',
    image:    '/Morning_deschis.png',
    label:    'AM',
  },
  recovery: {
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #1D4ED8 100%)',
    light:    'linear-gradient(180deg, #F3EEFF 0%, #ffffff 100%)',
    bgLight:  '#F3EEFF',
    image:    '/Recov_deschis.png',
    label:    'PM',
  },
};

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
  </svg>
);

function IngredientCard({ ingredient, gradient, index }) {
  const [open, setOpen] = useState(false);
  const bodyRef  = useRef(null);
  const innerRef = useRef(null);

  const toggle = () => {
    if (!bodyRef.current || !innerRef.current) return;
    if (!open) {
      gsap.fromTo(bodyRef.current,
        { height: 0, opacity: 0 },
        { height: innerRef.current.offsetHeight, opacity: 1, duration: 0.45, ease: 'power3.inOut' }
      );
    } else {
      gsap.to(bodyRef.current, { height: 0, opacity: 0, duration: 0.35, ease: 'power3.inOut' });
    }
    setOpen(v => !v);
  };

  return (
    <div
      className="ingredient-card opacity-0 transition-shadow duration-300 hover:shadow-md"
      style={{
        padding: open ? '1.5px' : '1px',
        borderRadius: '16px',
        background: open ? gradient : '#f0f0f0',
        transition: 'background 0.3s, padding 0.3s',
      }}
    >
      <div className="bg-white" style={{ borderRadius: open ? '14.5px' : '15px' }}>
        <button
          onClick={toggle}
          className="w-full flex items-start justify-between gap-4 p-5 md:p-6 text-left"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="font-body text-[8px] tracking-widest3 uppercase bg-clip-text text-transparent"
                style={{ backgroundImage: gradient }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="font-sans font-600 text-[#222] text-base tracking-tight">{ingredient.name}</h3>
            <p className="font-body text-[10px] tracking-wide text-[#aaa] mt-0.5">{ingredient.form} · {ingredient.dose}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-1">
            <span className="hidden sm:block font-sans font-600 text-sm bg-clip-text text-transparent tabular-nums"
              style={{ backgroundImage: gradient }}>
              {ingredient.dose}
            </span>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: open ? gradient : '#f5f5f5',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }}>
                <path d="M1 3.5l3 3 3-3" stroke={open ? '#fff' : '#aaa'} strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </button>

        <div ref={bodyRef} style={{ height: 0, opacity: 0, overflow: 'hidden' }}>
          <div ref={innerRef} className="px-5 md:px-6 pb-5 md:pb-6">
            <div className="border-t border-[#f5f5f5] pt-4">
              <div className="flex gap-4 md:gap-5">
                {ingredient.image && (
                  <div className="flex-shrink-0 self-start">
                    <div style={{ padding: '2px', borderRadius: '16px', background: gradient }}>
                      <div className="bg-white overflow-hidden flex items-center justify-center"
                        style={{ borderRadius: '14px', width: 80, height: 80 }}>
                        <img
                          src={ingredient.image}
                          alt={ingredient.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-600 text-[11px] tracking-widest uppercase mb-3 bg-clip-text text-transparent"
                    style={{ backgroundImage: gradient }}>
                    {ingredient.what}
                  </p>
                  <p className="font-body font-300 text-[#777] text-sm leading-loose">{ingredient.why}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug }  = useParams();
  const router    = useRouter();
  const product   = PRODUCTS_DATA[slug];
  const theme     = THEMES[slug] || THEMES.morning;

  useEffect(() => {
    if (!product) return;
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.pd-el',
      { opacity: 0, y: 48 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }
    ).fromTo('.pd-img',
      { opacity: 0, scale: 0.93 },
      { opacity: 1, scale: 1, duration: 1.2, ease: 'power4.out' },
      '-=0.7'
    );

    gsap.fromTo('.ingredient-card',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.04,
        scrollTrigger: { trigger: '.ingredients-grid', start: 'top 95%' } }
    );
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-[#888] mb-6">Product not found.</p>
          <Link href="/" className="font-body text-xs tracking-widest uppercase text-[#333] hover:text-[#111] transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-body">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-16 py-5 border-b border-[#f0f0f0] bg-white/95 backdrop-blur-md">
        <button onClick={() => router.back()}
          className="flex items-center gap-3 text-[#888] hover:text-[#222] transition-colors duration-300">
          <ArrowLeftIcon />
          <span className="font-body text-xs tracking-widest uppercase">Back</span>
        </button>
        <Link href="/" className="font-sans font-700 text-sm tracking-[0.3em] text-[#111] uppercase select-none">
          LIFECODE
        </Link>
        <span
          className="font-body text-[9px] tracking-widest3 uppercase px-3 py-1 rounded-full text-white"
          style={{ background: theme.gradient }}
        >
          {theme.label}
        </span>
      </nav>

      {/* Hero */}
      <div className="pt-24 overflow-hidden" style={{ background: theme.light }}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 items-end pt-14 md:pt-20">

            {/* Text */}
            <div className="pb-14 md:pb-20 flex flex-col gap-7">
              <div className="pd-el opacity-0">
                <span
                  className="inline-block font-body text-[9px] tracking-widest3 uppercase px-3 py-1 rounded-full text-white mb-6"
                  style={{ background: theme.gradient }}
                >
                  {theme.label} · {product.title}
                </span>
                <h1
                  className="font-sans font-700 leading-[0.88] tracking-tight bg-clip-text text-transparent"
                  style={{ fontSize: 'clamp(3rem, 7vw, 7.5rem)', backgroundImage: theme.gradient }}
                >
                  {product.title.replace(' ', '\n').split('\n').map((w, i) => (
                    <span key={i}>{w}{i === 0 ? <br/> : ''}</span>
                  ))}
                </h1>
              </div>

              <div className="pd-el opacity-0">
                <p
                  className="font-sans font-600 text-2xl md:text-3xl tracking-tight mb-4 bg-clip-text text-transparent"
                  style={{ backgroundImage: theme.gradient, opacity: 0.5 }}
                >
                  {product.tagline}
                </p>
                <p className="font-body font-300 text-[#888] text-sm md:text-base leading-loose max-w-md">
                  {product.longDesc}
                </p>
              </div>

              <div className="pd-el flex flex-wrap items-center gap-6 opacity-0">
                {[
                  [String(product.ingredients.length), 'Active Ingredients'],
                  ['0', 'Fillers'],
                  ['100%', 'Declared'],
                ].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <p className="font-sans font-700 text-3xl leading-none bg-clip-text text-transparent"
                      style={{ backgroundImage: theme.gradient }}>{v}</p>
                    <p className="font-body text-[9px] tracking-widest text-[#bbb] uppercase mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image with gradient border */}
            <div className="pd-img opacity-0 flex items-end justify-center pb-0">
              <div className="relative w-full max-w-[400px] mx-auto">
                <div className="absolute inset-0 blur-3xl opacity-20 scale-95 pointer-events-none rounded-[28px]"
                  style={{ background: theme.gradient }} />
                <div style={{ padding: '3px', borderRadius: '28px', background: theme.gradient }}>
                  <div className="bg-white overflow-hidden" style={{ borderRadius: '25px' }}>
                    <Image
                      src={theme.image}
                      alt={product.title}
                      width={800}
                      height={960}
                      className="w-full h-auto object-contain p-6 md:p-10"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-20 md:py-28">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-5 h-[1.5px]" style={{ background: theme.gradient }} />
              <span className="font-body text-[9px] tracking-widest3 uppercase bg-clip-text text-transparent"
                style={{ backgroundImage: theme.gradient }}>
                Full Formula
              </span>
            </div>
            <h2 className="font-sans font-700 text-[#111] tracking-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}>
              Every ingredient.<br />Every reason.
            </h2>
          </div>
          <p className="font-body font-300 text-[#aaa] text-sm leading-loose max-w-xs self-end pb-1">
            Tap any compound to reveal the clinical rationale.
          </p>
        </div>

        <div className="ingredients-grid grid grid-cols-1 md:grid-cols-2 gap-3">
          {product.ingredients.map((ing, i) => (
            <IngredientCard key={ing.name} ingredient={ing} gradient={theme.gradient} index={i} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 md:py-28 px-6 md:px-16" style={{ background: theme.light }}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          <div>
            <span className="font-body text-[9px] tracking-widest3 uppercase bg-clip-text text-transparent block mb-4"
              style={{ backgroundImage: theme.gradient }}>
              Your Protocol
            </span>
            <h3 className="font-sans font-700 text-[#111] tracking-tight"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 3rem)' }}>
              Ready to start?
            </h3>
            <p className="font-body font-300 text-[#888] text-sm leading-loose mt-3 max-w-sm">
              Create your ecosystem and get a protocol tailored to your biology.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-4 px-10 py-4 rounded-full text-white font-sans font-600 text-sm tracking-widest uppercase hover:opacity-88 transition-opacity duration-300 group shrink-0"
            style={{ background: theme.gradient }}
          >
            <span>Create Your Ecosystem</span>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        </div>
      </div>

    </div>
  );
}
