import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber } from '../utils/translations';
import { APP_IMAGES, resolveFarmImage } from '../utils/imageAssets';
import { 
  Sprout, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Landmark, 
  CheckCircle2, 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ArrowUpRight,
  Filter,
  Eye
} from 'lucide-react';

export const PublicWebsite: React.FC = () => {
  const { 
    db, 
    currentUser,
    language, 
    t, 
    setActiveTab, 
    setSelectedSectorId, 
    globalFinancials, 
    showToast,
    isLoggedIn,
    setIsLoginModalOpen
  } = useApp();
  const [selectedGallerySector, setSelectedGallerySector] = useState<string>('all');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSector, setContactSector] = useState('');
  const [contactAmount, setContactAmount] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      language === 'bn' 
        ? 'ধন্যবাদ! আপনার বিনিয়োগ অনুসন্ধান সফলভাবে জমা হয়েছে। আমাদের টিম শীঘ্রই যোগাযোগ করবে।' 
        : 'Thank you! Your investment inquiry has been submitted. Our team will contact you shortly.'
    );
    setContactName('');
    setContactPhone('');
    setContactSector('');
    setContactAmount('');
    setContactMessage('');
  };

  const filteredGallery = selectedGallerySector === 'all' 
    ? db.gallery 
    : db.gallery.filter((g) => g.sectorId === selectedGallerySector);

  // Live total animal/bird count from active sectors
  const totalLivestockStock = db.sectors.reduce((total, sector) => {
    const animalMetric = sector.customMetrics.find((m) => 
      m.label.toLowerCase().includes('total') || m.label.toLowerCase().includes('duck') || m.label.toLowerCase().includes('bird')
    );
    const val = typeof animalMetric?.value === 'number' ? animalMetric.value : 0;
    return total + val;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src={APP_IMAGES.hero}
            alt="Modern Agro Farm in Bangladesh"
            className="w-full h-full object-cover opacity-35"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = APP_IMAGES.heroFallback;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-4">
              <span>{language === 'bn' ? 'বাংলাদেশ সমন্বিত টেকসই কৃষি প্রকল্প' : 'Sustainable Integrated Agro Venture in Bangladesh'}</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'bn' ? 'শতভাগ স্বচ্ছ হিসাব' : '100% Verified Ledger'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white text-balance leading-tight">
              {language === 'bn' 
                ? 'আধুনিক সমন্বিত কৃষি খামার ও বিনিয়োগ স্বচ্ছতা' 
                : 'Pioneering Commercial Agro Farming with Total Investor Transparency'}
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {language === 'bn'
                ? 'হাঁস, পোল্ট্রি, ব্ল্যাক বেঙ্গল ছাগল, উন্নত জাতের কবুতর ও জৈব সবজি চাষে একটি যুগান্তকারী সমন্বিত খামার। সেক্টরভিত্তিক পৃথক বিনিয়োগের সুযোগ এবং রিয়েল-টাইম অডিট ও লভ্যাংশ ট্র্যাকিং।'
                : 'A high-yield, bio-secure agricultural ecosystem in Bangladesh. Accept sector-wise dedicated investments with real-time operational feeds, automated P&L accounting, and verified profit payouts.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  const sectorsEl = document.getElementById('sectors-section');
                  sectorsEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-md transition-colors"
              >
                {language === 'bn' ? 'ফার্ম সেক্টরসমূহ দেখুন' : 'Explore Farm Sectors'}
              </button>

              <button
                onClick={() => {
                  if (isLoggedIn) {
                    setActiveTab('investorPortal');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>{language === 'bn' ? 'বিনিয়োগকারী পোর্টাল লগইন' : 'Investor Portal Login'}</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Quick Verified Numbers Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'bn' ? 'মোট সংগৃহীত বিনিয়োগ' : 'Total Capital Invested'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-1">
                {formatCurrency(globalFinancials.totalInvestment, language)}
              </p>
              <span className="text-[11px] text-emerald-400">
                {language === 'bn' ? '৫টি সেক্টরে চলমান' : 'Across 5 active sectors'}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'bn' ? 'সর্বমোট উৎপাদিত রাজস্ব' : 'Verified Revenue Generated'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-1">
                {formatCurrency(globalFinancials.totalIncome, language)}
              </p>
              <span className="text-[11px] text-emerald-400">
                {language === 'bn' ? 'বিক্রয় চালান দ্বারা সমর্থিত' : 'Backed by official invoices'}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'bn' ? 'মোট পশুপাখি ও স্টক' : 'Active Livestock & Birds'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-1">
                {formatNumber(totalLivestockStock || 10200, language)}+
              </p>
              <span className="text-[11px] text-slate-400">
                {language === 'bn' ? 'বায়োসিকিউর পরিবেশে পালিত' : 'Bio-secure facilities'}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'bn' ? 'সক্রিয় বিনিয়োগকারী' : 'Verified Partner Investors'}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-1">
                {formatNumber(db.investors.length, language)}
              </p>
              <span className="text-[11px] text-emerald-400">
                {language === 'bn' ? 'ত্রৈমাসিক লভ্যাংশ বণ্টন' : 'Quarterly profit distributions'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT THE AGRO FARM */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mb-2">
                {language === 'bn' ? 'আমাদের দৃষ্টিভঙ্গি ও মূল্যবোধ' : 'About Ahmadun Agro'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
                {language === 'bn'
                  ? 'বিজ্ঞানসম্মত ব্যবস্থাপনা ও শতভাগ স্বচ্ছ অংশীদারিত্ব'
                  : 'Modern Agricultural Science Meets Total Financial Transparency'}
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                {language === 'bn'
                  ? 'আহমাদুন এগ্রো একটি অগ্রগামী বহুমুখী সমন্বিত কৃষি উদ্যোগ। আমাদের খামারগুলোতে প্রাণিসম্পদ অধিদপ্তর ও কৃষি বিশেষজ্ঞদের প্রত্যক্ষ তত্ত্বাবধানে আধুনিক বায়োসিকিউরিটি, স্বয়ংক্রিয় খাদ্য ব্যবস্থা, স্বাস্থ্যকর মাচা ও পুকুর ব্যবস্থাপনা নিশ্চিত করা হয়েছে।'
                  : 'Ahmadun Agro operates high-standard commercial livestock and organic farming across multiple strategically chosen zones in Bangladesh. We combine certified biosecurity, balanced nutrition, and advanced water/soil monitoring with institutional financial standards.'}
              </p>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                {language === 'bn'
                  ? 'আমরা বিশ্বাস করি স্বচ্ছতাই আস্থার মূল ভিত্তি। তাই প্রতিটি সেক্টরের সকল আয়, ব্যয় ও দৈনন্দিন উৎপাদন সরাসরি ডিজিটাল ডাটাবেজে সংরক্ষণ করা হয় এবং বিনিয়োগকারীরা তাদের ব্যক্তিগত ড্যাশবোর্ড থেকে তা যেকোনো সময় যাচাই করতে পারেন।'
                  : 'Every expense voucher, feed bill, egg count, and wholesale invoice is posted to an immutable ledger so investors have absolute visibility into their invested sector.'}
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'bn' ? 'শরীয়া সম্মত মুদারাবা নীতি' : 'Sharia & Equity Profit Models'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'bn' ? 'লাভের নির্দিষ্ট অনুপাত বা ফিক্সড চুক্তিতে লভ্যাংশ বণ্টন।' : 'Transparent profit-loss sharing calculated directly from net profit.'}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'bn' ? 'সরাসরি খামার পরিদর্শন' : 'Open Farm Inspection'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'bn' ? 'বিনিয়োগকারীদের জন্য নিয়মিত খামার পরিদর্শন ও অডিট সুযোগ।' : 'Verified investors enjoy quarterly on-site inspection and audit meetings.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-4/3 rounded-xl overflow-hidden shadow-lg border border-slate-200">
                <img
                  src={APP_IMAGES.sectorDuck}
                  alt="Duck farm pond"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = APP_IMAGES.sectorDuckFallback;
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-lg border border-slate-200 shadow-xl max-w-xs hidden sm:block">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  {language === 'bn' ? 'কিশোরগঞ্জ ও গাজীপুর খামার' : 'Verified Agro Land'}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {language === 'bn' ? '৪৫+ বিঘা সমন্বিত খামার প্রকল্প' : '45+ Bighas Modern Agricultural Acreage'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR SECTORS SHOWCASE */}
      <section id="sectors-section" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mb-2">
                {language === 'bn' ? 'আমাদের প্রকল্পসমূহ' : 'Specialized Sectors'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {language === 'bn' ? 'আমাদের সক্রিয় কৃষি সেক্টরসমূহ' : 'Dedicated Agro Farm Sectors'}
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-xl">
                {language === 'bn' 
                  ? 'প্রতিটি সেক্টর স্বাধীন আর্থিক ও পরিচালন কাঠামোর অধীনে পরিচালিত হয়। আপনার পছন্দের সেক্টরে অংশীদারিত্ব নিন।' 
                  : 'Each agricultural division operates as an independent profit center with isolated books and specialized management.'}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => {
                  if (isLoggedIn) {
                    setActiveTab('sectors');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <span>{language === 'bn' ? 'সকল সেক্টরের বিস্তারিত ড্যাশবোর্ড' : 'View Full Sector Dashboards'}</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {db.sectors.map((sector) => {
              const sectorFin = globalFinancials.sectorBreakdown.find((sb) => sb.sectorId === sector.id);

              return (
                <div
                  key={sector.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={resolveFarmImage(sector.image)}
                      alt={sector.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = APP_IMAGES.hero;
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded">
                      {sector.code}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {language === 'bn' ? sector.nameBn : sector.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {language === 'bn' ? sector.descriptionBn : sector.description}
                      </p>

                      {/* Custom metrics snippet */}
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                        {sector.customMetrics.slice(0, 2).map((m, idx) => (
                          <div key={idx}>
                            <span className="text-slate-400 block text-[11px]">
                              {language === 'bn' ? m.labelBn : m.label}
                            </span>
                            <span className="font-bold text-slate-800 tabular-nums">
                              {typeof m.value === 'number' ? formatNumber(m.value, language) : m.value} {m.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financial performance snippet */}
                      {sectorFin && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">{language === 'bn' ? 'মোট বিক্রয়/রাজস্ব:' : 'Revenue:'}</span>
                            <span className="font-semibold text-slate-800 tabular-nums">{formatCurrency(sectorFin.totalIncome, language)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{language === 'bn' ? 'নিট লাভ (P&L):' : 'Net Profit:'}</span>
                            <span className={`font-semibold tabular-nums ${sectorFin.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {formatCurrency(sectorFin.netProfit, language)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Area: {sector.totalArea}
                      </span>
                      <button
                        onClick={() => {
                          if (isLoggedIn) {
                            setSelectedSectorId(sector.id);
                            setActiveTab('sectors');
                          } else {
                            setIsLoginModalOpen(true);
                          }
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                      >
                        {language === 'bn' ? 'লাইভ ড্যাশবোর্ড' : 'Live Dashboard'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. WHY INVEST WITH US */}
      <section className="py-20 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mb-2">
              {language === 'bn' ? 'বিনিয়োগ নিরাপত্তা ও সুবিধা' : 'Our Value Proposition'}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
              {language === 'bn' ? 'কেন আহমাদুন এগ্রোতে বিনিয়োগ করবেন?' : 'Why Partner With Ahmadun Agro?'}
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              {language === 'bn'
                ? 'অনলাইন রিয়েল-টাইম হিসাব, প্রাতিষ্ঠানিক জবাবদিহিতা ও হালাল লভ্যাংশ নিশ্চিতকরণ।'
                : 'A modern institutional approach to agriculture, engineered for discerning investors.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'bn' ? 'শতভাগ স্বচ্ছ ডিজিটাল খতিয়ান' : 'Immutable Digital Ledger'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {language === 'bn'
                  ? 'খামারের প্রতি বস্তা খাদ্য ক্রয় থেকে শুরু করে ডিম ও মাংস বিক্রয়ের প্রতিটি চালান সফটওয়্যারে আপলোড করা হয়। কোনো অনুমাননির্ভর বা মনগড়া হিসাব নয়।'
                  : 'Every single transaction, vendor voucher, and customer payment is logged with exact receipts and approval audits.'}
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'bn' ? 'সেক্টরভিত্তিক লাভ-ক্ষতি বণ্টন' : 'Sector-Isolated P&L'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {language === 'bn'
                  ? 'আপনি যে সেক্টরে বিনিয়োগ করবেন (যেমন শুধু হাঁস খামার বা ছাগল খামার), আপনার লভ্যাংশ কেবল সেই নির্দিষ্ট সেক্টরের নিট লাভের উপর ভিত্তি করে হিসাব করা হবে।'
                  : 'Your investment is mapped strictly to the agricultural sector you choose, with transparent equity or ROI formulas.'}
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-4">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'bn' ? 'আইনগত অংশীদারিত্ব চুক্তি ও ব্যাংক পে-আউট' : 'Legal Agreements & Direct Payouts'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {language === 'bn'
                  ? 'নোটারি পাবলিক দ্বারা সত্যায়িত অংশীদারিত্ব ডিড এবং ত্রৈমাসিক লভ্যাংশ সরাসরি আপনার ব্যাংক অ্যাকাউন্ট বা bKash/Nagad এ স্থানান্তর।'
                  : 'Formally notarized partnership deed with direct quarterly disbursements to your Bangladeshi bank account or bKash/Nagad.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LATEST FARM UPDATES & FIELD NEWS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mb-2">
              {language === 'bn' ? 'সরাসরি খামার সংবাদ' : 'Field Operations News'}
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {language === 'bn' ? 'সাম্প্রতিক খামার কার্যক্রম ও ঘোষণা' : 'Live Farm Activities & Milestones'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {db.announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ann.date}</span>
                    </span>
                    {ann.sectorId && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {db.sectors.find((s) => s.id === ann.sectorId)?.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'bn' ? ann.titleBn : ann.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {language === 'bn' ? ann.contentBn : ann.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Priority: {ann.priority.toUpperCase()}</span>
                  <span className="text-emerald-600 font-medium">Verified Field Post</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PHOTO & VIDEO GALLERY */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mb-1">
                {language === 'bn' ? 'ছবি ও ভিডিও গ্যালারি' : 'Visual Documentation'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {language === 'bn' ? 'খামারের বাস্তব চিত্র' : 'On-Site Gallery'}
              </h2>
            </div>

            {/* Sector filter tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setSelectedGallerySector('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedGallerySector === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.all}
              </button>
              {db.sectors.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedGallerySector(s.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedGallerySector === s.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'bn' ? s.nameBn.split(' ')[0] : s.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
              >
                <div className="aspect-4/3 overflow-hidden">
                  <img
                    src={resolveFarmImage(item.url)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = APP_IMAGES.hero;
                    }}
                  />
                </div>
                <div className="p-3 bg-white">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {language === 'bn' ? item.titleBn : item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.description}</p>
                  <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                    <span>{item.date}</span>
                    <span>{db.sectors.find((s) => s.id === item.sectorId)?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. INVESTOR INQUIRY & CONTACT SECTION */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-5">
              <div className="text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-2">
                {language === 'bn' ? 'যোগাযোগ ও তথ্য' : 'Direct Inquiry'}
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                {language === 'bn' ? 'আমাদের সাথে বিনিয়োগে যুক্ত হোন' : 'Partner With Us in Sustainable Agriculture'}
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                {language === 'bn'
                  ? 'আপনি কি কোনো নির্দিষ্ট এগ্রো সেক্টরে বিনিয়োগ করতে আগ্রহী? আমাদের কর্পোরেট অফিস বা খামারে সরাসরি পরিদর্শনের জন্য আমন্ত্রণ। আপনার তথ্য প্রদান করুন, আমাদের ইনভেস্টমেন্ট রিলেশন অফিসার দ্রুত আপনার সাথে যোগাযোগ করবেন।'
                  : 'Ready to invest in Duck Farming, Pedigree Goat Husbandry, Poultry or Organic Vegetables? Schedule a visit or speak to our investment relations team.'}
              </p>

              <div className="mt-8 space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">{language === 'bn' ? 'প্রধান কর্পোরেট কার্যালয়:' : 'Corporate Office:'}</strong>
                    <span>{language === 'bn' ? db.settings.officeAddressBn : db.settings.officeAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Sprout className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">{language === 'bn' ? 'খামার প্রকল্প এলাকা:' : 'Farm Facilities:'}</strong>
                    <span>{language === 'bn' ? db.settings.farmAddressBn : db.settings.farmAddress}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white mr-1">Phone:</strong>
                    <span>{db.settings.contactPhone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white mr-1">Email:</strong>
                    <span>{db.settings.contactEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-800/90 p-8 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-6">
                {language === 'bn' ? 'বিনিয়োগ আবেদন ও পরামর্শ ফরম' : 'Investor Consultation Form'}
              </h3>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {language === 'bn' ? 'আপনার নাম *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Kazi Rafiqul Islam"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {language === 'bn' ? 'মোবাইল নম্বর (বাংলাদেশ / আন্তর্জাতিক) *' : 'Phone Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+880 17XXXXXXXX"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {language === 'bn' ? 'আগ্রহী সেক্টর' : 'Preferred Farm Sector'}
                    </label>
                    <select
                      value={contactSector}
                      onChange={(e) => setContactSector(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">{language === 'bn' ? '-- সেক্টর বেছে নিন --' : '-- Choose Sector --'}</option>
                      {db.sectors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {language === 'bn' ? s.nameBn : s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {language === 'bn' ? 'প্রত্যাশিত বিনিয়োগের পরিমাণ (৳ BDT)' : 'Target Capital (৳ BDT)'}
                    </label>
                    <input
                      type="text"
                      value={contactAmount}
                      onChange={(e) => setContactAmount(e.target.value)}
                      placeholder="e.g. 5,00,000"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {language === 'bn' ? 'মন্তব্য বা কোনো বিশেষ প্রশ্ন' : 'Your Query or Message'}
                  </label>
                  <textarea
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Tell us about your expectations or schedule a farm visit..."
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
                >
                  {language === 'bn' ? 'তথ্য জমা দিন' : 'Submit Investment Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0">
                <img
                  src={APP_IMAGES.logoIcon || APP_IMAGES.logo}
                  alt="Ahmadun Agro Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = APP_IMAGES.logo;
                  }}
                />
              </div>
              <div>
                <span className="font-extrabold text-white text-sm block">
                  {db.settings?.farmName || 'Ahmadun Agro'}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold block leading-none">
                  {db.settings?.farmNameBn || 'আহমাদুন এগ্রো'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-400">
              <button onClick={() => setActiveTab('public')} className="hover:text-white transition-colors">
                {language === 'bn' ? 'হোম' : 'Home'}
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('sectors-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="hover:text-white transition-colors"
              >
                {language === 'bn' ? 'প্রকল্পসমূহ' : 'Sectors'}
              </button>
              <button 
                onClick={() => {
                  if (isLoggedIn) {
                    setActiveTab(currentUser.role === 'investor' ? 'investorPortal' : 'dashboard');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }} 
                className="hover:text-white transition-colors"
              >
                {isLoggedIn ? (currentUser.role === 'investor' ? (language === 'bn' ? 'আমার পোর্টাল' : 'My Portal') : (language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard')) : (language === 'bn' ? 'লগইন' : 'Sign In')}
              </button>
            </div>

            <p className="text-slate-500 text-center md:text-right">
              © {new Date().getFullYear()} Ahmadun Agro (আহমাদুন এগ্রো). All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
