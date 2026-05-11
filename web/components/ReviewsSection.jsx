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
    headline: 'Recovery Pack after double sessions is on another level',
    body: 'Tested both products for six weeks alongside my regular training block. Morning Pak gives clean, stable energy without the spike I used to get from pre-workout. But the Recovery Pack is what genuinely changed things — after high-intensity double days the difference in how my legs felt the next morning was noticeable from week two. I was sceptical at first because I had tried similar products before with zero results. This is different. The label is fully transparent which for me is non-negotiable.',
  },
  {
    name: 'Lukas Berger',
    role: 'CrossFit Athlete',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Sceptical for two months. Now I will not train without it.',
    body: 'A teammate kept pushing me to try this and I kept saying no. Finally ordered after he showed me the ingredient panel. Natural flavours, no artificial aftertaste — that alone was unexpected. Recovery speed after high-volume weeks improved noticeably. The only thing I would change is more flavour variety.',
  },
  {
    name: 'Tobias Schneider',
    role: 'Marathon Runner',
    product: 'Morning Pak',
    rating: 5,
    headline: 'Finally built for endurance, not just the gym',
    body: 'Seven years running competitively and I tried dozens of morning formulas. Most are built for gym-goers. The adaptogens and B-complex combination in Morning Pak keeps my energy stable through long runs without jitteriness. I noticed a real difference in sustained focus from week two. My coach asked what I changed. The only small downside is the packaging — I wish it came in a larger monthly supply.',
  },
  {
    name: 'Charlotte Davies',
    role: 'Fitness Athlete',
    product: 'Recovery Pack',
    rating: 4,
    headline: 'The taste sets it apart. Results confirmed it.',
    body: 'Did not expect a recovery product to taste this good. Natural flavours, no chemical aftertaste. After four weeks of intense training my recovery improved visibly and muscle soreness the day after is noticeably reduced. Would give five stars but I wish there was more information on the website about exact timing recommendations.',
  },
  {
    name: 'Pieter van den Berg',
    role: 'Amateur Cyclist and Entrepreneur',
    product: 'Morning Pak',
    rating: 5,
    headline: 'First supplement I kept past 30 days without thinking about it',
    body: 'I drop most supplements after a month because I never feel the difference. Morning Pak is the first exception. Mental clarity before 6am training is real. Sustained energy through the morning without a crash. Simple, clean, effective. Nothing more to add.',
  },
  {
    name: 'Bogdan Rusu',
    role: 'Semi-pro Football Player',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Recovery after match days changed completely',
    body: 'Two matches a week plus training sessions. I introduced the Recovery Pack before a heavy three-week block and the difference in accumulated fatigue compared to previous seasons was clear. Less soreness, better sleep, sharper in morning sessions. Morning Pak on match days gives a consistent start without overstimulation. Best combination I have tested in five years of playing semi-professionally. Highly recommend for anyone with a high weekly match load.',
  },
  {
    name: 'Sofie Leclercq',
    role: 'Triathlete',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Taste kept me coming back. Results made me stay.',
    body: 'Started it because a training partner said it tasted good. She was right — real fruit flavour, not synthetic. Over six weeks of tri training my legs were ready faster between sessions. That is the only metric that matters for me.',
  },
  {
    name: 'Tyler Rhodes',
    role: 'Amateur Powerlifter',
    product: 'Recovery Pack',
    rating: 4,
    headline: 'DOMS after maximal efforts almost gone',
    body: 'Squatting and deadlifting four times a week means constant soreness was just part of life. After five weeks with Recovery Pack that changed significantly. The EAA, creatine and HMB combination is dosed correctly — you can verify it yourself on the label. I dock one star because for bigger athletes the serving size could be larger. Everything else is exactly what it should be.',
  },
  {
    name: 'Markus Hoffmann',
    role: 'Gym Athlete',
    product: 'Morning Pak + Recovery Pack',
    rating: 4,
    headline: 'Taste surprised me. Results followed four weeks later.',
    body: 'Both products have a clean, natural flavour you actually look forward to — no artificial sweetener aftertaste which was a problem with everything I tried before. After four weeks my morning energy improved and recovery between heavy days got better. I already recommended it to three people at my gym. The one thing missing is a clearer guide on how to stack both products around training.',
  },
  {
    name: 'Katarzyna Nowak',
    role: 'Fitness Athlete and Mother of Two',
    product: 'Morning Pak',
    rating: 5,
    headline: 'Training four times a week as a mother — this makes it sustainable',
    body: 'Small training windows, full-time job, two kids. Recovery has to be efficient or it does not happen. Morning Pak three months in and I stopped needing a second coffee before my 6am sessions by week three. The ingredient transparency was what convinced me to try it — I needed to know exactly what I was putting in my body. It does what it says on the label.',
  },
  {
    name: 'Brandon Wells',
    role: 'Semi-pro Football Player',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'This is what team nutrition should look like',
    body: 'Two sessions a day during pre-season is where most players break down. Six weeks into camp using both products and the difference heading into week seven versus previous seasons was significant. Less accumulated fatigue. Better sleep quality. Sharper mentally in morning film sessions. Showed the label to our nutrition staff. No complaints on the formulation. The only thing I would like is a team discount option.',
  },
  {
    name: 'Lars Eriksson',
    role: 'Competitive Swimmer',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Two products that actually complement each other',
    body: 'Morning Pak sets up the day. Recovery Pack closes it. That is the logic and it works. Training twice a day during peak season this combination kept my energy more consistent than anything I tested before. Hard evening sessions recovered faster. Transparent dosing throughout.',
  },
  {
    name: 'Sarah Mitchell',
    role: 'Fitness Coach',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Tested personally before recommending to every client',
    body: 'Seven weeks of personal testing before I recommended anything to clients. Morning Pak gives sustained energy without the nervous edge I got from other formulas. Recovery Pack after intense sessions is in a completely different category from the market standard. Clinical doses visible on the label — that is the only sign of a serious brand I accept. The natural taste is a small detail that makes a daily difference. I now recommend both to all my athletes training at higher intensities.',
  },
  {
    name: 'Caitlin Park',
    role: 'Track and Field Athlete',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'No fillers, no proprietary blends. Finally.',
    body: 'Every ingredient listed with its exact dose. Everything matches what the research supports. Natural flavour is genuinely good. Two months in and it stays in my protocol. Short review because there is not much to complain about.',
  },
  {
    name: 'Oliver Bennett',
    role: 'Competitive Rower',
    product: 'Morning Pak + Recovery Pack',
    rating: 4,
    headline: 'Solid results by week three. Worth the commitment.',
    body: 'High aerobic and upper body demands daily from rowing. Gave both products a full month before judging — that is the only fair way to test supplements. By week three the difference in morning energy and post-session recovery was noticeable enough that my training partner asked what changed. The taste of both is clean and natural. My only note is that I would like to see a larger pack size for the Recovery Pack — going through it quickly during heavy training periods.',
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
    <div className="review-card opacity-0 flex flex-col gap-4 rounded-2xl p-6 bg-white border border-[#f0e8ff] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <Stars rating={review.rating} />
        <span className="font-body text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFF3EC, #FAF0FF)', color: '#E8445A', border: '1px solid rgba(232,68,90,0.12)' }}>
          {review.product}
        </span>
      </div>
      <h3 className="font-sans font-700 text-[#0a0a0a] text-[15px] leading-snug">
        &ldquo;{review.headline}&rdquo;
      </h3>
      <p className="font-body font-300 text-[#666] text-[13px] leading-relaxed flex-1">
        {review.body}
      </p>
      <div className="flex items-center gap-3 pt-3 border-t border-[#f5f5f5]">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-sans font-700 text-[13px] flex-shrink-0"
          style={{ background: BOX_G }}>
          {review.name.charAt(0)}
        </div>
        <div>
          <p className="font-sans font-700 text-[#0a0a0a] text-[13px]">{review.name}</p>
          <p className="font-body text-[11px] text-[#aaa] mt-0.5">{review.role}</p>
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

        <div className="reviews-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
