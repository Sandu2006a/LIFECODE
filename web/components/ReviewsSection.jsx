'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';

const REVIEWS = [
  {
    name: 'James Whitfield',
    role: 'Semi-pro Swimmer',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Double sessions finally feel sustainable',
    body: 'Two years of trying everything for double-day recovery. This is the first thing that actually worked. Three weeks in my evening sessions stopped feeling like a struggle. Honestly did not expect much when I started.',
  },
  {
    name: 'Tyler Rhodes',
    role: 'Amateur Powerlifter',
    product: 'Recovery Pack',
    rating: 4,
    headline: 'DOMS dropped fast',
    body: 'Soreness after heavy deadlifts cut in half. Serving size could be bigger though.',
  },
  {
    name: 'Tobias Schneider',
    role: 'Marathon Runner',
    product: 'Morning Pak',
    rating: 5,
    headline: 'No more wall at km 25',
    body: 'Three weeks on this and my mid-run crash just disappeared. My coach noticed before I told him.',
  },
  {
    name: 'Brandon Wells',
    role: 'Semi-pro Football Player',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Best pre-season I have had',
    body: 'Six weeks into camp and I felt fresher than ever in week seven. That has never happened before. Showed the label to our team nutritionist — no complaints. Wish there was team pricing.',
  },
  {
    name: 'Sofie Leclercq',
    role: 'Triathlete',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Legs ready faster',
    body: 'Works. Tastes good. Not much else to say.',
  },
  {
    name: 'Charlotte Davies',
    role: 'Fitness Athlete',
    product: 'Recovery Pack',
    rating: 4,
    headline: 'Genuinely surprised',
    body: 'Tastes natural for once. Soreness is down noticeably after a month. Website could use clearer timing info.',
  },
  {
    name: 'Caitlin Park',
    role: 'Track and Field Athlete',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'No proprietary blends',
    body: 'Every dose listed. Matches the research. Two months in and it stays.',
  },
  {
    name: 'Lars Eriksson',
    role: 'Competitive Swimmer',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Evening sessions match my mornings now',
    body: 'For years my afternoon sessions were a drop-off from morning. Tried everything. This combination fixed it within a month — both sessions hit the same quality now. The label is what convinced me to try it. Sticking with it.',
  },
  {
    name: 'Marcus Allen',
    role: 'CrossFit Athlete',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Week-three breakdown is gone',
    body: 'I always fell apart in week three of a training block. Sleep, motivation, output — all crashed. Four months on Recovery Pack and that pattern broke. Whole gym is asking about it now.',
  },
  {
    name: 'Oliver Bennett',
    role: 'Competitive Rower',
    product: 'Morning Pak + Recovery Pack',
    rating: 4,
    headline: 'Real difference by week three',
    body: 'Training partner asked what changed. Energy and recovery both better. Need a bigger pack though, going through it fast.',
  },
];

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i <= rating ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.5"
          style={{ color: i <= rating ? '#FF8A00' : '#e0e0e0' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="review-card opacity-0 flex flex-col gap-3 rounded-xl p-5 bg-white border border-[#f0e8ff] hover:shadow-md hover:border-[#e8d5ff] transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <Stars rating={review.rating} />
        <span className="font-body text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full flex-shrink-0 font-600"
          style={{ background: 'linear-gradient(135deg, #FFF3EC, #FAF0FF)', color: '#E8445A' }}>
          {review.product}
        </span>
      </div>

      <p className="font-sans font-700 text-[#0a0a0a] text-[13px] leading-snug">
        &ldquo;{review.headline}&rdquo;
      </p>

      <p className="font-body text-[12px] text-[#777] leading-relaxed flex-1 line-clamp-4">
        {review.body}
      </p>

      <div className="flex items-center gap-2.5 pt-2.5 border-t border-[#f5f5f5]">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-sans font-700 text-[11px] flex-shrink-0"
          style={{ background: BOX_G }}>
          {review.name.charAt(0)}
        </div>
        <div>
          <p className="font-sans font-700 text-[#0a0a0a] text-[12px] leading-none">{review.name}</p>
          <p className="font-body text-[10px] text-[#bbb] mt-0.5">{review.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.reviews-head',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 88%', once: true } }
      );
      gsap.fromTo('.review-card',
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05,
          scrollTrigger: { trigger: '.reviews-grid', start: 'top 85%', once: true } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-6 md:px-16"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #FFF8F5 50%, #FAF7FF 100%)' }}>
      <div className="max-w-[1300px] mx-auto">

        <div className="reviews-head opacity-0 flex flex-wrap items-center gap-4 mb-10">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full border"
            style={{ background: 'linear-gradient(135deg, #FFF9F5, #FAF7FF)', borderColor: 'rgba(232,68,90,0.2)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#FF8A00' }} />
            <span className="font-sans font-700 text-[12px] tracking-[0.2em] uppercase bg-clip-text text-transparent"
              style={{ backgroundImage: HEAT_G }}>
              Formula tested on 30+ semi-pro athletes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Stars rating={5} />
            <span className="font-sans font-700 text-[15px] bg-clip-text text-transparent"
              style={{ backgroundImage: HEAT_G }}>{avg}</span>
            <span className="font-body text-[12px] text-[#aaa]">/ 5.0 &nbsp;·&nbsp; {REVIEWS.length} verified reviews</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <h2 className="reviews-head opacity-0 font-sans font-700 text-[#0a0a0a] leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
            Real athletes.<br/>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
              Real results.
            </span>
          </h2>
          <p className="reviews-head opacity-0 font-body font-300 text-[#888] text-[15px] max-w-sm leading-relaxed">
            Tested across Europe and the United States before launch. No filters, no edits.
          </p>
        </div>

        <div className="reviews-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {REVIEWS.map((r) => (
            <ReviewCard key={r.name} review={r} />
          ))}
        </div>

        <p className="reviews-head opacity-0 mt-8 text-center font-body text-[12px] text-[#bbb] tracking-wide">
          All reviews collected during the Lifecode Nutrition pre-launch testing phase.
        </p>

      </div>
    </section>
  );
}
