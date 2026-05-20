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
    image:    '/code-charge-sachet.png',
    label:    'AM',
  },
  recovery: {
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #1D4ED8 100%)',
    light:    'linear-gradient(180deg, #F3EEFF 0%, #ffffff 100%)',
    bgLight:  '#F3EEFF',
    image:    '/code-rebuild-sachet.png',
    label:    'PM',
  },
};

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
  </svg>
);

function IngredientCard({ ingredient, gradient, index }) {
  return (
    <div className="ingredient-card opacity-0 flex items-center gap-4 px-4 md:px-5 py-4 bg-white border border-[#f0f0f0] rounded-xl hover:border-[#e0d8f0] hover:shadow-sm transition-all duration-200">
      {/* Icon */}
      {ingredient.image ? (
        <div className="flex-shrink-0">
          <div style={{ padding: '2px', borderRadius: '14px', background: gradient }}>
            <div className="bg-white overflow-hidden flex items-center justify-center"
              style={{ borderRadius: '12px', width: 48, height: 48 }}>
              <img src={ingredient.image} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-sans font-700 text-white text-[15px]"
          style={{ background: gradient }}>
          {String(index + 1).padStart(2, '0')}
        </div>
      )}

      {/* Name + Purpose */}
      <div className="flex-1 min-w-0">
        <h3 className="font-sans font-700 text-[#0a0a0a] text-[14px] md:text-[15px] tracking-tight leading-tight truncate">
          {ingredient.name}
        </h3>
        <p className="font-body text-[11px] md:text-[12px] text-[#888] leading-snug mt-0.5 line-clamp-1">
          {ingredient.what}
        </p>
      </div>

      {/* Dose */}
      <div className="flex-shrink-0 text-right">
        <p className="font-sans font-700 text-[15px] md:text-[17px] tabular-nums bg-clip-text text-transparent"
          style={{ backgroundImage: gradient }}>
          {ingredient.dose}
        </p>
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

      {/* Compact hero + ingredients on one page */}
      <div className="pt-20" style={{ background: theme.light }}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-14">

          {/* Top: image + title side by side */}
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-12 items-center mb-10">

            {/* Small image */}
            <div className="pd-img opacity-0 mx-auto md:mx-0">
              <div className="relative w-full max-w-[260px]">
                <div className="absolute inset-0 blur-2xl opacity-20 scale-90 pointer-events-none rounded-[20px]"
                  style={{ background: theme.gradient }} />
                <div style={{ padding: '2px', borderRadius: '20px', background: theme.gradient }}>
                  <div className="bg-white overflow-hidden" style={{ borderRadius: '18px' }}>
                    <Image
                      src={theme.image}
                      alt={product.title}
                      width={520}
                      height={620}
                      className="w-full h-auto object-contain p-4"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Title + description */}
            <div className="flex flex-col gap-4">
              <div className="pd-el opacity-0">
                <span
                  className="inline-block font-body text-[9px] tracking-widest3 uppercase px-3 py-1 rounded-full text-white mb-3"
                  style={{ background: theme.gradient }}
                >
                  {theme.label} · {product.title}
                </span>
                <h1
                  className="font-sans font-700 leading-[0.95] tracking-tight bg-clip-text text-transparent"
                  style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.6rem)', backgroundImage: theme.gradient }}
                >
                  {product.title}
                </h1>
              </div>
              <div className="pd-el opacity-0">
                <p className="font-body font-300 text-[#666] text-[13px] md:text-[14px] leading-relaxed max-w-xl">
                  {product.longDesc}
                </p>
              </div>
              <div className="pd-el flex flex-wrap items-center gap-5 opacity-0 pt-2">
                {[
                  [String(product.ingredients.length), 'Ingredients'],
                  ['0', 'Fillers'],
                  ['100%', 'Declared'],
                ].map(([v, l]) => (
                  <div key={l}>
                    <p className="font-sans font-700 text-2xl leading-none bg-clip-text text-transparent"
                      style={{ backgroundImage: theme.gradient }}>{v}</p>
                    <p className="font-body text-[9px] tracking-widest text-[#999] uppercase mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients table */}
          <div className="pd-el opacity-0">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-5 h-[1.5px]" style={{ background: theme.gradient }} />
              <span className="font-body text-[10px] tracking-widest3 uppercase font-700 bg-clip-text text-transparent"
                style={{ backgroundImage: theme.gradient }}>
                Full Formula · {product.ingredients.length} ingredients
              </span>
            </div>
            <div className="ingredients-grid grid grid-cols-1 lg:grid-cols-2 gap-2">
              {product.ingredients.map((ing, i) => (
                <IngredientCard key={ing.name} ingredient={ing} gradient={theme.gradient} index={i} />
              ))}
            </div>
          </div>

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
