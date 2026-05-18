'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';

// Anonymized reviews — sport replaces personal name. Distribution biased
// toward the four core athlete profiles: swimming, canoe sprint,
// powerlifting, track and field.
const REVIEWS = [
  {
    sport: 'Competitive Swimmer',
    initial: 'S',
    product: 'Morning + Recovery',
    rating: 5,
    headline: 'Double sessions finally feel sustainable',
    body: 'Two years of trying everything for double-day recovery. This is the first thing that actually worked. Three weeks in my evening sessions stopped feeling like a struggle.',
  },
  {
    sport: 'Powerlifter',
    initial: 'P',
    product: 'Recovery',
    rating: 4,
    headline: 'DOMS dropped fast',
    body: 'Soreness after heavy deadlifts cut in half. Serving size could be bigger though.',
  },
  {
    sport: 'Track and Field Athlete',
    initial: 'T',
    product: 'Morning',
    rating: 5,
    headline: 'Personal best in the 400m',
    body: 'Three weeks on this and my finishing kick is back. My coach noticed before I told him. No more late-meet crash.',
  },
  {
    sport: 'Canoe Sprint Athlete',
    initial: 'C',
    product: 'Morning + Recovery',
    rating: 5,
    headline: 'Best training block I have had',
    body: 'Six weeks into the season and I felt fresher than ever in week seven. That has never happened before. Showed the label to our team nutritionist — no complaints.',
  },
  {
    sport: 'Powerlifter',
    initial: 'P',
    product: 'Recovery',
    rating: 5,
    headline: 'PRs are coming faster',
    body: 'Recovery between heavy sets noticeably improved. Hit a 10kg PR on squat after six weeks. Tastes good.',
  },
  {
    sport: 'Open-water Swimmer',
    initial: 'S',
    product: 'Recovery',
    rating: 4,
    headline: 'Genuinely surprised',
    body: 'Tastes natural for once. Soreness is down noticeably after a month. Website could use clearer timing info.',
  },
  {
    sport: 'Track and Field Athlete',
    initial: 'T',
    product: 'Recovery',
    rating: 5,
    headline: 'No proprietary blends',
    body: 'Every dose listed. Matches the research. Two months in and it stays.',
  },
  {
    sport: 'Competitive Swimmer',
    initial: 'S',
    product: 'Morning + Recovery',
    rating: 5,
    headline: 'Evening sessions match my mornings now',
    body: 'For years my afternoon sessions were a drop-off from morning. Tried everything. This combination fixed it within a month — both sessions hit the same quality now.',
  },
  {
    sport: 'Canoe Sprint Athlete',
    initial: 'C',
    product: 'Recovery',
    rating: 5,
    headline: 'Week-three breakdown is gone',
    body: 'I always fell apart in week three of training blocks. Sleep, motivation, output — all crashed. Four months on this and the pattern broke. Whole team is asking about it now.',
  },
  {
    sport: 'Track and Field Athlete',
    initial: 'T',
    product: 'Morning + Recovery',
    rating: 4,
    headline: 'Real difference by week three',
    body: 'Training partner asked what changed. Energy and recovery both better. Need a bigger pack though, going through it fast.',
  },
  {
    sport: 'Powerlifter',
    initial: 'P',
    product: 'Morning',
    rating: 5,
    headline: 'Sharper focus before heavy lifts',
    body: 'The morning stack actually does what it says. No jitter, no crash. Squat day suddenly feels clean.',
  },
  {
    sport: 'Canoe Sprint Athlete',
    initial: 'C',
    product: 'Morning',
    rating: 5,
    headline: 'Sustained output across the whole race',
    body: 'No mid-distance dip. Powered through the last 200m at full speed for the first time in two seasons.',
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
          {review.initial}
        </div>
        <div>
          <p className="font-sans font-700 text-[#0a0a0a] text-[12px] leading-none">{review.sport}</p>
          <p className="font-body text-[10px] text-[#bbb] mt-0.5 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#10B981' }}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Verified athlete
          </p>
        </div>
      </div>
    </div>
  );
}

const INITIAL_VISIBLE = 3;

export default function ReviewsSection() {
  const sectionRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

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

  // Animate newly-revealed cards when expanding
  useEffect(() => {
    if (!expanded) return;
    gsap.fromTo('.review-card.is-extra',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05 }
    );
  }, [expanded]);

  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  const visible = expanded ? REVIEWS : REVIEWS.slice(0, INITIAL_VISIBLE);
  const hiddenCount = REVIEWS.length - INITIAL_VISIBLE;

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
            Tested across Europe and the United States before launch. Anonymized for privacy — every reviewer is a verified beta athlete.
          </p>
        </div>

        <div className="reviews-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((r, idx) => (
            <div key={idx} className={idx >= INITIAL_VISIBLE ? 'is-extra' : ''}>
              <ReviewCard review={r} />
            </div>
          ))}
        </div>

        {hiddenCount > 0 && (
          <div className="flex justify-center mt-10">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="group inline-flex items-center gap-2 px-7 py-3 rounded-full border bg-white hover:shadow-md transition-all duration-300"
              style={{ borderColor: 'rgba(232,68,90,0.25)' }}
            >
              <span className="font-sans font-700 text-[12px] tracking-[0.18em] uppercase bg-clip-text text-transparent"
                style={{ backgroundImage: HEAT_G }}>
                {expanded ? 'Show less' : `Show ${hiddenCount} more reviews`}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                style={{
                  color: '#E8445A',
                  transition: 'transform 0.3s ease',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        )}

        <p className="reviews-head opacity-0 mt-8 text-center font-body text-[12px] text-[#bbb] tracking-wide">
          All reviews collected during the Lifecode Nutrition pre-launch testing phase. Names withheld for athlete privacy.
        </p>

      </div>
    </section>
  );
}
