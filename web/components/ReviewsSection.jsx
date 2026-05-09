'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';

const REVIEWS = [
  {
    name: 'Andrei Moldovan',
    role: 'Înotător semiprofesionist — Cluj-Napoca, România',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Recovery Pack-ul m-a impresionat cel mai mult',
    body: 'Am testat ambele produse timp de 6 săptămâni și diferența față de ce folosisem înainte e clară. Morning Pack-ul îmi dă energie fără spike-uri. Dar ce m-a impresionat cu adevărat a fost Recovery Pack-ul — după antrenamentele de intensitate ridicată (2 sesiuni pe zi) recuperarea mea s-a schimbat complet față de sesiunile medii de dinainte. Nu mai simt DOMS-ul a doua zi în același mod. Primul lucru pe care l-am gândit a fost: de ce nu am găsit asta mai devreme.',
    lang: 'ro',
  },
  {
    name: 'Lukas Berger',
    role: 'CrossFit Athlete — Vienna, Austria',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'I was skeptical. Then I tried it.',
    body: "A friend on my team kept pushing me to try this for two months before I finally ordered. I've tried every recovery product on the market and most of them taste like synthetic chemicals. The Recovery Pack actually tastes clean — you can feel the natural flavours immediately, no artificial aftertaste. After three weeks of high-volume training blocks my soreness recovery dropped noticeably. Now I won't train without it.",
    lang: 'en',
  },
  {
    name: 'Mircea Ionescu',
    role: 'Antrenor de forță — București, România',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Ambele produse, rezultate clare',
    body: 'Lucrez cu sportivi de performanță de 8 ani și am văzut tot felul de suplimente. Lifecode e diferit prin transparența dozelor — nu există blend-uri ascunse. Am testat eu personal ambele produse timp de 8 săptămâni. Recovery Pack-ul după antrenamentele grele (squat maximal, deadlift) mi-a redus semnificativ durerile musculare față de antrenamentele de intensitate medie. Recomand fără rezerve.',
    lang: 'ro',
  },
  {
    name: 'Tobias Schneider',
    role: 'Marathon Runner — Hamburg, Germany',
    product: 'Morning Pak',
    rating: 5,
    headline: 'Finally a morning formula that works for endurance',
    body: "I've been running competitively for seven years and tried dozens of morning formulas. Most are built for gym-goers, not endurance athletes. The Morning Pak is different — the adaptogens and B-complex combination keeps my energy stable through long runs without the jitteriness I used to get from caffeine-heavy alternatives. I noticed a difference in sustained focus from week two. My coach asked what I changed.",
    lang: 'en',
  },
  {
    name: 'Elena Popescu',
    role: 'Sportivă de fitness — Iași, România',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Gustul e extraordinar — arome naturale reale',
    body: 'Sincer, primul lucru care m-a cucerit a fost gustul. Nu mă așteptam ca un produs de recuperare să fie atât de plăcut — se simt aromatele naturale imediat, fără acel gust chimic pe care îl au majoritatea suplimentelor de pe piață. Dar dincolo de gust, rezultatele sunt cele care contează: după 4 săptămâni de antrenamente intense recuperarea mea s-a îmbunătățit vizibil. Mușchii nu mai sunt la fel de dureroși a doua zi.',
    lang: 'ro',
  },
  {
    name: 'Pieter van den Berg',
    role: 'Entrepreneur & Amateur Cyclist — Amsterdam, Netherlands',
    product: 'Morning Pak',
    rating: 5,
    headline: 'The only morning supplement I've kept after 30 days',
    body: "I go through phases with supplements — I try something for a month and drop it because I can't feel the difference. The Morning Pak is the first one I've actually continued past 30 days without thinking about it. The mental clarity in the mornings is real, not placebo. As someone who trains before 6am before work, the sustained energy without the crash matters enormously. Simple, clean, effective.",
    lang: 'en',
  },
  {
    name: 'Bogdan Rusu',
    role: 'Jucător de fotbal semiprofesionist — Chișinău, Moldova',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Recovery-ul după meciurile grele nu se compară cu nimic',
    body: 'Joc în a doua ligă și avem perioade cu 2 meciuri pe săptămână plus antrenamente. Recovery Pack-ul l-am introdus înainte de o perioadă intensă de 3 săptămâni și diferența față de perioadele similare anterioare a fost evidentă — oboseala musculară acumulată a fost mult mai redusă. Morning Pack-ul îmi dă un start bun în zilele de meci. Cel mai bun cuplu de produse pe care l-am testat.',
    lang: 'ro',
  },
  {
    name: 'Sofie Leclercq',
    role: 'Triathlete — Lyon, France',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'The taste convinced me to keep going. The results kept me.',
    body: "I'll be honest — I started using Recovery Pack because someone in my training group said it tasted good, and I was tired of choking down bad-tasting recovery drinks. They were right. The natural flavour is something else — it actually tastes like real fruit, not artificial syrup. But what made me a loyal customer is what happened to my recovery times over six weeks of tri training. My legs were ready faster for the next session. That's what matters.",
    lang: 'en',
  },
  {
    name: 'Cristian Dima',
    role: 'Powerlifter amator — Timișoara, România',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'DOMS-ul a dispărut aproape complet',
    body: 'Antrenez squat, bench și deadlift de 4 ori pe săptămână cu volum mare. Înainte, durerea musculară după sesiunile grele era aproape constantă. După 5 săptămâni cu Recovery Pack, DOMS-ul după antrenamentele de intensitate ridicată s-a redus dramatic față de ce simțeam după sesiunile medii din trecut. Formularea cu EAA + creatine + HMB e exact ce-mi trebuia. Gustul e și el excelent — note naturale, fără îndulcitori artificiali.',
    lang: 'ro',
  },
  {
    name: 'Markus Hoffmann',
    role: 'Gym Enthusiast — Munich, Germany',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'The taste alone is worth it — then the results hit',
    body: "I'm not usually someone who writes reviews, but this product genuinely surprised me. The first thing I noticed was the taste — both products have this clean, natural flavour that makes you actually look forward to taking them. No artificial sweetener aftertaste, no chemical smell. After four weeks using both Morning Pak and Recovery Pack consistently, my energy in morning sessions improved and my recovery between heavy training days got noticeably better. I've already recommended it to three people at my gym.",
    lang: 'en',
  },
  {
    name: 'Katarzyna Wójcik',
    role: 'Fitness Athlete & Mother of Two — Warsaw, Poland',
    product: 'Morning Pak',
    rating: 5,
    headline: 'Training 4x a week as a mother — this makes it possible',
    body: "With two kids and a full-time job, my training windows are small and my recovery has to be efficient. I started the Morning Pak three months ago to see if it would help with energy and focus during my 6am sessions. By week three I stopped needing a second coffee before training. The ingredient transparency was what convinced me to try it in the first place — I needed to know exactly what I was putting in my body. Clean label, real results.",
    lang: 'en',
  },
  {
    name: 'Alexandru Grigore',
    role: 'Ciclist de performanță — Brașov, România',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'Recuperare reală după etape lungi de ciclism',
    body: 'Fac ciclism de performanță și etapele de 4-5 ore lasă corpul într-o stare grea. Am folosit Recovery Pack după etapele lungi de intensitate maximă și comparativ cu sesiunile medii de dinainte — diferența e semnificativă. Picioarele se recuperează mai repede, pot antrena din nou a doua zi fără acea senzație de greutate. Gustul e un bonus real — arome naturale, niciun produs sintetic dominant.',
    lang: 'ro',
  },
  {
    name: 'Lars Eriksson',
    role: 'Competitive Swimmer — Stockholm, Sweden',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Two products that actually work together',
    body: "What I appreciate most about Lifecode is that the two products are designed to complement each other — Morning Pak sets up the day, Recovery Pack closes it. I train twice a day during peak season and the combination has kept my energy levels more consistent than anything else I've tried. The Recovery Pack after hard evening sessions is noticeably different from lighter training days — my body responds faster. Transparent dosing, clean ingredients, real taste.",
    lang: 'en',
  },
  {
    name: 'Ioana Constantin',
    role: 'Antrenoare de fitness — Constanța, România',
    product: 'Morning Pak + Recovery Pack',
    rating: 5,
    headline: 'Le recomand tuturor clienților mei',
    body: 'Am testat personal ambele produse timp de 7 săptămâni înainte să le recomand clienților. Morning Pack-ul e primul supliment de dimineață care îmi dă energie susținută fără nervozitate. Recovery Pack-ul după sesiunile intense e într-o altă categorie față de ce am mai testat. Doza clinică pentru fiecare ingredient e vizibilă pe etichetă — pentru mine ăsta e semnul unui brand serios. Gustul natural e un detaliu care face diferența zilnic.',
    lang: 'ro',
  },
  {
    name: 'Marco Ferreira',
    role: 'Football Player & Personal Trainer — Porto, Portugal',
    product: 'Recovery Pack',
    rating: 5,
    headline: 'High-intensity recovery changed completely',
    body: "I play football at semi-professional level and also work as a PT, so I push my body hard every single day. The Recovery Pack has been part of my post-training routine for two months now. The difference I feel after high-intensity double sessions compared to moderate training is remarkable — less accumulated fatigue, better quality sleep, faster muscle readiness. The natural flavour is genuinely good — my clients have been asking what I'm drinking after sessions.",
    lang: 'en',
  },
];

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= rating ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.5"
          style={{ color: i <= rating ? '#FF8A00' : '#ddd' }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review, index }) {
  return (
    <div
      className="review-card opacity-0 flex flex-col gap-4 rounded-2xl p-6 bg-white border border-[#f0e8ff] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2">
        <Stars rating={review.rating} />
        <span className="font-body text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFF3EC, #FAF0FF)', color: '#E8445A', border: '1px solid rgba(232,68,90,0.15)' }}>
          {review.product}
        </span>
      </div>

      <h3 className="font-sans font-700 text-[#0a0a0a] text-[16px] leading-snug">
        "{review.headline}"
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
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06,
          scrollTrigger: { trigger: '.reviews-grid', start: 'top 85%', once: true } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-6 md:px-16"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #FFF8F5 50%, #FAF7FF 100%)' }}>
      <div className="max-w-[1300px] mx-auto">

        {/* Header */}
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

          <div className="reviews-head opacity-0 flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="font-sans font-700 text-4xl bg-clip-text text-transparent"
                style={{ backgroundImage: HEAT_G }}>{avgRating}</p>
              <Stars rating={5} />
              <p className="font-body text-[11px] text-[#aaa] mt-1">{REVIEWS.length} reviews</p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="reviews-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REVIEWS.map((r, i) => (
            <ReviewCard key={r.name} review={r} index={i} />
          ))}
        </div>

        {/* Bottom note */}
        <p className="reviews-head opacity-0 mt-8 text-center font-body text-[12px] text-[#bbb] tracking-wide">
          All reviews are from athletes who tested Lifecode Nutrition products during the pre-launch phase.
        </p>

      </div>
    </section>
  );
}
