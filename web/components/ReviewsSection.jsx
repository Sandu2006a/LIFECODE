'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';

const REVIEWS = [
  {
    name: 'Andrei Moldovan',
    role: 'Semi-pro Swimmer — Cluj-Napoca, Romania',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Recovery Pack after hard sessions is on another level',
    body: 'Tested both products for six weeks. Morning Pak gives clean, stable energy. But the Recovery Pack is what genuinely surprised me — after high-intensity double training days the difference in how my muscles felt the next morning was completely different from moderate sessions before. No more waking up dreading the next workout.',
  },
  {
    name: 'Jake Morrison',
    role: 'CrossFit Athlete — Austin, Texas, USA',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Best recovery product I have used in 6 years of CrossFit',
    body: 'Six years of CrossFit and I have tried everything on the market. Most recovery products are either underdosed or taste terrible. The Recovery Pack hits both — clinical doses you can actually verify on the label, and a natural taste that does not make you want to skip it. After four weeks of high-intensity blocks my soreness is down and my output in next-day sessions went up noticeably.',
  },
  {
    name: 'Tobias Schneider',
    role: 'Marathon Runner — Hamburg, Germany',
    product: 'Morning Pak',
    rating: 5,
    headline: 'Finally a morning formula built for endurance athletes',
    body: 'Running competitively for seven years, I tried dozens of morning formulas. Most are built for gym-goers, not endurance athletes. The Morning Pak is different — adaptogens and B-complex combination keeps energy stable through long runs without jitteriness. Noticed a difference in sustained focus from week two. My coach asked what I had changed.',
  },
  {
    name: 'Megan Calloway',
    role: 'Competitive Cyclist — Denver, Colorado, USA',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Using both for 8 weeks — my numbers improved',
    body: 'I track everything — power output, HRV, recovery scores. After eight weeks using Morning Pak and Recovery Pack together, my average HRV improved by 11 points and my perceived effort on threshold rides dropped. The ingredients are transparent and dosed properly, which matters to me as someone who reads every label. This is how supplements should be made.',
  },
  {
    name: 'Sofie Leclercq',
    role: 'Triathlete — Lyon, France',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'The taste kept me going. The results kept me loyal.',
    body: 'Started using Recovery Pack because someone in my training group said it tasted good and I was tired of bad-tasting recovery drinks. They were right. It actually tastes like real fruit, not artificial syrup. What made me a loyal customer is what happened to my recovery times over six weeks of tri training. Legs were ready faster for the next session.',
  },
  {
    name: 'Tyler Rhodes',
    role: 'Amateur Powerlifter — Nashville, Tennessee, USA',
    product: 'Recovery Pack',
    rating: 4,
    headline: 'DOMS after maximal efforts is almost gone',
    body: 'Training squat, bench and deadlift four times a week with high volume. Before, muscle soreness after heavy sessions was almost constant. After five weeks with Recovery Pack, DOMS after high-intensity training dropped significantly. The EAA plus creatine plus HMB combination is solid and the doses match what the research actually supports. Only wish the serving size was slightly larger for bigger athletes.',
  },
  {
    name: 'Markus Hoffmann',
    role: 'Gym Athlete — Munich, Germany',
    product: 'Morning Pak + Recovery Pack',
    rating: 4,
    headline: 'Taste surprised me first. Results followed.',
    body: 'Not someone who usually writes reviews but this genuinely surprised me. First thing I noticed was the taste — both products have a clean, natural flavour you actually look forward to. No artificial sweetener aftertaste. After four weeks using both consistently my energy in morning sessions improved and recovery between heavy training days got noticeably better. Already recommended it to three people at my gym.',
  },
  {
    name: 'Katarzyna Wojcik',
    role: 'Fitness Athlete and Mother of Two — Warsaw, Poland',
    product: 'Morning Pak',
    rating: 5,
    headline: 'Training four times a week as a mother — this makes it possible',
    body: 'With two kids and a full-time job, my training windows are small and recovery has to be efficient. Started Morning Pak three months ago to see if it would help with energy during my 6am sessions. By week three I stopped needing a second coffee before training. The ingredient transparency was what convinced me to try it. Clean label, real results.',
  },
  {
    name: 'Brandon Wells',
    role: 'Semi-pro Football Player — Atlanta, Georgia, USA',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'This is what team nutrition should look like',
    body: 'Playing at semi-professional level means two sessions a day during pre-season. I introduced both products six weeks into camp and the difference in how I felt heading into week seven versus previous seasons was significant. Less accumulated fatigue, better sleep, sharper focus in morning film sessions. Showed the label to our nutrition staff and they had no complaints about the formulation.',
  },
  {
    name: 'Lars Eriksson',
    role: 'Competitive Swimmer — Stockholm, Sweden',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Two products designed to actually work together',
    body: 'What I appreciate most is that the two products complement each other — Morning Pak sets up the day, Recovery Pack closes it. Training twice a day during peak season, this combination kept my energy levels more consistent than anything else I tested. The Recovery Pack after hard evening sessions is noticeably different from lighter training days. Transparent dosing, clean ingredients.',
  },
  {
    name: 'Ioana Constantin',
    role: 'Fitness Coach — Constanta, Romania',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Tested it personally before recommending to every client',
    body: 'Tested both products personally for seven weeks before recommending them. Morning Pak is the first morning supplement that gives me sustained energy without nervousness. Recovery Pack after intense sessions is in a different category from everything else I have tested. Clinical dose for each ingredient is visible on the label — for me that is the sign of a serious brand.',
  },
  {
    name: 'Caitlin Park',
    role: 'Track and Field Athlete — Portland, Oregon, USA',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Finally a recovery product without a novel full of fillers',
    body: 'As a track athlete I read every ingredient label and most recovery products on the US market are full of fillers, proprietary blends and underdosed actives. The Recovery Pack is the opposite. Every ingredient is listed with its exact dose and they match what peer-reviewed research supports. The natural flavour is also genuinely good. Two months in and this stays in my protocol.',
  },
  {
    name: 'Marco Ferreira',
    role: 'Football Player and Personal Trainer — Porto, Portugal',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'High-intensity recovery changed completely',
    body: 'Playing football at semi-professional level and working as a PT means my body gets pushed hard every day. The Recovery Pack has been part of my post-training routine for two months. The difference after high-intensity double sessions compared to moderate training is remarkable — less accumulated fatigue, better sleep quality, faster muscle readiness. My clients keep asking what I drink after sessions.',
  },
  {
    name: 'Derek Nunez',
    role: 'MMA Fighter — Miami, Florida, USA',
    product: 'Morning Pak + Recovery Pack',
    rating: 4,
    headline: 'Stacked training demands — this handles them well',
    body: 'MMA training means combining strength, conditioning and sparring in the same week. Recovery was always my weak point. After six weeks with both products my training partners noticed I was fresher in later rounds and my morning sessions were more productive. The Morning Pak energy is steady and clean, no crash before noon. Would give five stars if the Recovery Pack came unflavoured as an option.',
  },
  {
    name: 'Piia Makinen',
    role: 'Competitive Rower — Helsinki, Finland',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Solid system, results clear after three weeks',
    body: 'Rowing competitively means high aerobic and upper body demands daily. Started both products at the same time and gave it a full month before judging. By week three the difference in morning energy and post-session recovery was noticeable enough that my training partner asked what changed. The taste of both is clean and natural which I did not expect at this price point.',
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

        {/* Badge */}
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
            <div className="flex items-center gap-1">
              <Stars rating={5} />
            </div>
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
