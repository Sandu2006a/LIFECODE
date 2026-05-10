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
    body: 'Tested both products for six weeks. Morning Pak gives clean, stable energy. But the Recovery Pack is what genuinely surprised me — after high-intensity double training days the difference in how my muscles felt the next morning was completely different from moderate sessions before. No more waking up dreading the next workout. First thing I thought: why did I not find this earlier.',
  },
  {
    name: 'Lukas Berger',
    role: 'CrossFit Athlete — Vienna, Austria',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'I was skeptical for two months. Then I tried it.',
    body: 'A teammate kept pushing me to try this before I finally ordered. Tried every recovery product on the market and most taste like synthetic chemicals. The Recovery Pack tastes clean — natural flavours, no artificial aftertaste at all. After three weeks of high-volume training blocks my recovery speed dropped noticeably. Would not train without it now.',
  },
  {
    name: 'Tobias Schneider',
    role: 'Marathon Runner — Hamburg, Germany',
    product: 'Morning Pak',
    rating: 5,
    headline: 'Finally a morning formula built for endurance athletes',
    body: 'Running competitively for seven years, I tried dozens of morning formulas. Most are built for gym-goers, not endurance athletes. The Morning Pak is different — the adaptogens and B-complex combination keeps energy stable through long runs without jitteriness. Noticed a difference in sustained focus from week two. My coach asked what I had changed.',
  },
  {
    name: 'Elena Popescu',
    role: 'Fitness Athlete — Iasi, Romania',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'The taste alone sets it apart from everything else',
    body: 'The first thing that won me over was the taste. Did not expect a recovery product to be this pleasant — the natural flavours hit immediately, no chemical aftertaste like most supplements on the market. Beyond the taste, the results are what matter: after four weeks of intense training my recovery improved visibly and muscle soreness the next day is noticeably reduced.',
  },
  {
    name: 'Pieter van den Berg',
    role: 'Entrepreneur and Amateur Cyclist — Amsterdam, Netherlands',
    product: 'Morning Pak',
    rating: 4,
    headline: 'Kept it past 30 days — first time that has happened',
    body: 'I go through phases with supplements. Try something for a month and drop it because I cannot feel the difference. The Morning Pak is the first one I actually continued past 30 days. Mental clarity in the mornings is real. As someone training before 6am before work, sustained energy without the crash matters a lot. Would like to see more flavour options eventually.',
  },
  {
    name: 'Bogdan Rusu',
    role: 'Semi-pro Football Player — Chisinau, Moldova',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Recovery after match days is completely different now',
    body: 'Playing in the second division we have periods with two matches a week plus training. I introduced the Recovery Pack before a heavy three-week block and the difference compared to similar periods before was clear — accumulated muscle fatigue was significantly lower. Morning Pak gives a solid start on match days. Best combination of products I have tested.',
  },
  {
    name: 'Sofie Leclercq',
    role: 'Triathlete — Lyon, France',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'The taste kept me going. The results kept me loyal.',
    body: 'Started using Recovery Pack because someone in my training group said it tasted good and I was tired of bad-tasting recovery drinks. They were right. It actually tastes like real fruit, not artificial syrup. What made me a loyal customer is what happened to my recovery times over six weeks of tri training. Legs were ready faster for the next session. That is what matters in the end.',
  },
  {
    name: 'Cristian Dima',
    role: 'Amateur Powerlifter — Timisoara, Romania',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'DOMS almost completely gone after heavy sessions',
    body: 'Training squat, bench and deadlift four times a week with high volume. Before, muscle soreness after heavy sessions was almost constant. After five weeks with Recovery Pack, DOMS after high-intensity training dropped dramatically compared to what I felt after moderate sessions in the past. The EAA plus creatine plus HMB combination is exactly what I needed. Taste is excellent — natural notes, no artificial sweeteners.',
  },
  {
    name: 'Markus Hoffmann',
    role: 'Gym Athlete — Munich, Germany',
    product: 'Morning Pak + Recovery Pack',
    rating: 4,
    headline: 'Taste surprised me first. Results followed.',
    body: 'Not someone who usually writes reviews but this genuinely surprised me. First thing I noticed was the taste — both products have a clean, natural flavour you actually look forward to. No artificial sweetener aftertaste. After four weeks using both consistently my energy in morning sessions improved and recovery between heavy training days got noticeably better. Already recommended it to three people. Only wish the packaging was resealable.',
  },
  {
    name: 'Katarzyna Wojcik',
    role: 'Fitness Athlete and Mother of Two — Warsaw, Poland',
    product: 'Morning Pak',
    rating: 5,
    headline: 'Training four times a week as a mother — this makes it possible',
    body: 'With two kids and a full-time job, my training windows are small and recovery has to be efficient. Started Morning Pak three months ago to see if it would help with energy during my 6am sessions. By week three I stopped needing a second coffee before training. The ingredient transparency was what convinced me to try it — I needed to know exactly what I was putting in my body. Clean label, real results.',
  },
  {
    name: 'Alexandru Grigore',
    role: 'Performance Cyclist — Brasov, Romania',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Real recovery after four and five hour stages',
    body: 'Cycling at performance level means four to five hour stages that leave the body in a difficult state. Used Recovery Pack after long high-intensity stages and compared to moderate sessions before — the difference is significant. Legs recover faster and I can train again the next day without that heavy feeling. The natural aroma is a genuine bonus, no synthetic dominant flavour.',
  },
  {
    name: 'Lars Eriksson',
    role: 'Competitive Swimmer — Stockholm, Sweden',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Two products designed to actually work together',
    body: 'What I appreciate most is that the two products complement each other — Morning Pak sets up the day, Recovery Pack closes it. Training twice a day during peak season, this combination kept my energy levels more consistent than anything else I tested. The Recovery Pack after hard evening sessions is noticeably different from lighter training days. My body responds faster. Transparent dosing, clean ingredients.',
  },
  {
    name: 'Ioana Constantin',
    role: 'Fitness Coach — Constanta, Romania',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Tested it personally before recommending to every client',
    body: 'Tested both products personally for seven weeks before recommending them. Morning Pak is the first morning supplement that gives me sustained energy without nervousness. Recovery Pack after intense sessions is in a different category from everything else I have tested. Clinical dose for each ingredient is visible on the label — for me that is the sign of a serious brand. The natural taste is a daily detail that makes a difference.',
  },
  {
    name: 'Marco Ferreira',
    role: 'Football Player and Personal Trainer — Porto, Portugal',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'High-intensity recovery changed completely',
    body: 'Playing football at semi-professional level and working as a PT means my body gets pushed hard every day. The Recovery Pack has been part of my post-training routine for two months. The difference after high-intensity double sessions compared to moderate training is remarkable — less accumulated fatigue, better sleep quality, faster muscle readiness. Natural flavour is genuinely good. My clients keep asking what I drink after sessions.',
  },
  {
    name: 'Piia Makinen',
    role: 'Competitive Rower — Helsinki, Finland',
    product: 'Morning Pak + Recovery Pack',
    rating: 4,
    headline: 'Solid system, results clear after three weeks',
    body: 'Rowing competitively means high aerobic and upper body demands daily. I started both products at the same time and gave it a full month before judging. By week three the difference in morning energy and post-session recovery was noticeable enough that my training partner asked what changed. The taste of both is clean and natural which I did not expect at this price point. Would rate five stars if the Recovery Pack came in a larger size.',
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

  const total = REVIEWS.reduce((s, r) => s + r.rating, 0);
  const avg = (total / REVIEWS.length).toFixed(1);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-6 md:px-16"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #FFF8F5 50%, #FAF7FF 100%)' }}>
      <div className="max-w-[1300px] mx-auto">

        <div className="reviews-head opacity-0 flex items-center gap-3 mb-6">
          <div className="w-5 h-px" style={{ background: HEAT_G }} />
          <span className="font-body text-[10px] tracking-[0.32em] uppercase font-600" style={{ color: '#E8445A' }}>
            Verified Reviews
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <h2 className="reviews-head opacity-0 font-sans font-700 text-[#0a0a0a] leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
            Real athletes.<br/>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
              Real results.
            </span>
          </h2>

          <div className="reviews-head opacity-0 flex items-center gap-4 pb-2">
            <div className="text-center">
              <p className="font-sans font-700 text-4xl bg-clip-text text-transparent"
                style={{ backgroundImage: HEAT_G }}>{avg}</p>
              <Stars rating={5} />
              <p className="font-body text-[11px] text-[#aaa] mt-1">{REVIEWS.length} reviews</p>
            </div>
          </div>
        </div>

        <div className="reviews-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REVIEWS.map((r) => (
            <ReviewCard key={r.name} review={r} />
          ))}
        </div>

        <p className="reviews-head opacity-0 mt-8 text-center font-body text-[12px] text-[#bbb] tracking-wide">
          All reviews are from athletes who tested Lifecode Nutrition products during the pre-launch phase.
        </p>

      </div>
    </section>
  );
}
