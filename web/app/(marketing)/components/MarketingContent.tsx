"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import Navbar from "./navbar";
import AnimatedH1 from "./AnimatedH1";
import FeatureMarquee from "./FeatureMarquee";
import AnimatedSection from "./AnimatedSection";
import FeatureGrid from "./FeatureGrid";
import Footer from "./footer";
import {
  Layout,
  Navigation,
  MapPin,
  ChartArea,
  Users,
  MessageCircle,
  Route,
  Target,
  FileText,
  Trophy,
  Heart,
  Share2,
  Camera,
  Mic,
  Send,
  PenLine,
  Package,
  Star,
  Footprints,
  Clock,
  Flame,
  Bell,
  ScanBarcode,
  Search,
  PieChart,
  UtensilsCrossed,
  ChevronUp,
} from "lucide-react";

const SUPPORTED_LANGS = ["en", "fi"];

export default function MarketingContent() {
  const { t, i18n } = useTranslation("marketing");

  // Apply saved/detected language before first paint
  const hasDetected = useRef(false);
  useLayoutEffect(() => {
    if (hasDetected.current) return;
    hasDetected.current = true;
    const saved = localStorage.getItem("marketing-lang");
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      i18n.changeLanguage(saved);
    } else {
      const browserLang = navigator.language?.split("-")[0];
      if (browserLang && SUPPORTED_LANGS.includes(browserLang)) {
        i18n.changeLanguage(browserLang);
      }
    }
  }, [i18n]);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const simplicityFeatures = [
    {
      icon: Layout,
      title: t("simplicity.intuitiveTitle"),
      desc: t("simplicity.intuitiveDesc"),
      color: "text-blue-400",
      border: "border-blue-500/20",
    },
    {
      icon: Navigation,
      title: t("simplicity.navigationTitle"),
      desc: t("simplicity.navigationDesc"),
      color: "text-green-400",
      border: "border-green-500/20",
    },
    {
      icon: PenLine,
      title: t("simplicity.editTitle"),
      desc: t("simplicity.editDesc"),
      color: "text-purple-400",
      border: "border-purple-500/20",
    },
    {
      icon: Package,
      title: t("simplicity.allInOneTitle"),
      desc: t("simplicity.allInOneDesc"),
      color: "text-amber-400",
      border: "border-amber-500/20",
    },
  ];

  const activityFeatures = [
    {
      icon: MapPin,
      title: t("activities.gpsTitle"),
      desc: t("activities.gpsDesc"),
      color: "text-green-400",
      border: "border-green-500/20",
    },
    {
      icon: Footprints,
      title: t("activities.statsTitle"),
      desc: t("activities.statsDesc"),
      color: "text-teal-400",
      border: "border-teal-500/20",
    },
    {
      icon: Route,
      title: t("activities.templatesTitle"),
      desc: t("activities.templatesDesc"),
      color: "text-lime-400",
      border: "border-lime-500/20",
    },
    {
      icon: Share2,
      title: t("activities.shareTitle"),
      desc: t("activities.shareDesc"),
      color: "text-emerald-400",
      border: "border-emerald-500/20",
    },
  ];

  const nutritionFeatures = [
    {
      icon: ScanBarcode,
      title: t("nutrition.barcodeTitle"),
      desc: t("nutrition.barcodeDesc"),
      color: "text-orange-400",
      border: "border-orange-500/20",
    },
    {
      icon: Search,
      title: t("nutrition.searchTitle"),
      desc: t("nutrition.searchDesc"),
      color: "text-amber-400",
      border: "border-amber-500/20",
    },
    {
      icon: PieChart,
      title: t("nutrition.trackingTitle"),
      desc: t("nutrition.trackingDesc"),
      color: "text-yellow-400",
      border: "border-yellow-500/20",
    },
    {
      icon: UtensilsCrossed,
      title: t("nutrition.mealsTitle"),
      desc: t("nutrition.mealsDesc"),
      color: "text-red-400",
      border: "border-red-500/20",
    },
  ];

  const analyticsFeatures = [
    {
      icon: ChartArea,
      title: t("analytics.chartsTitle"),
      desc: t("analytics.chartsDesc"),
      color: "text-indigo-400",
      border: "border-indigo-500/20",
    },
    {
      icon: Trophy,
      title: t("analytics.recordsTitle"),
      desc: t("analytics.recordsDesc"),
      color: "text-amber-400",
      border: "border-amber-500/20",
    },
    {
      icon: FileText,
      title: t("analytics.reportsTitle"),
      desc: t("analytics.reportsDesc"),
      color: "text-violet-400",
      border: "border-violet-500/20",
    },
    {
      icon: Target,
      title: t("analytics.goalsTitle"),
      desc: t("analytics.goalsDesc"),
      color: "text-rose-400",
      border: "border-rose-500/20",
    },
  ];

  const socialFeatures = [
    {
      icon: Share2,
      title: t("social.shareTitle"),
      desc: t("social.shareDesc"),
      color: "text-pink-400",
      border: "border-pink-500/20",
    },
    {
      icon: Heart,
      title: t("social.likeTitle"),
      desc: t("social.likeDesc"),
      color: "text-rose-400",
      border: "border-rose-500/20",
    },
    {
      icon: Users,
      title: t("social.friendsTitle"),
      desc: t("social.friendsDesc"),
      color: "text-fuchsia-400",
      border: "border-fuchsia-500/20",
    },
    {
      icon: Star,
      title: t("social.feedTitle"),
      desc: t("social.feedDesc"),
      color: "text-orange-400",
      border: "border-orange-500/20",
    },
  ];

  const habitsFeatures = [
    {
      icon: Footprints,
      title: t("habits.stepsTitle"),
      desc: t("habits.stepsDesc"),
      color: "text-rose-400",
      border: "border-rose-500/20",
    },
    {
      icon: Clock,
      title: t("habits.timedTitle"),
      desc: t("habits.timedDesc"),
      color: "text-pink-400",
      border: "border-pink-500/20",
    },
    {
      icon: Bell,
      title: t("habits.remindersTitle"),
      desc: t("habits.remindersDesc"),
      color: "text-fuchsia-400",
      border: "border-fuchsia-500/20",
    },
    {
      icon: Flame,
      title: t("habits.streaksTitle"),
      desc: t("habits.streaksDesc"),
      color: "text-orange-400",
      border: "border-orange-500/20",
    },
  ];

  const chatFeatures = [
    {
      icon: MessageCircle,
      title: t("chat.messagesTitle"),
      desc: t("chat.messagesDesc"),
      color: "text-sky-400",
      border: "border-sky-500/20",
    },
    {
      icon: Camera,
      title: t("chat.mediaTitle"),
      desc: t("chat.mediaDesc"),
      color: "text-cyan-400",
      border: "border-cyan-500/20",
    },
    {
      icon: Mic,
      title: t("chat.voiceTitle"),
      desc: t("chat.voiceDesc"),
      color: "text-teal-400",
      border: "border-teal-500/20",
    },
    {
      icon: Send,
      title: t("chat.shareSessionsTitle"),
      desc: t("chat.shareSessionsDesc"),
      color: "text-blue-400",
      border: "border-blue-500/20",
    },
  ];

  return (
    <>
      <header>
        <Navbar />
      </header>

      {/* Hero */}
      <main className="flex flex-col justify-center items-center gap-10 text-gray-100 py-10 lg:py-20 bg-linear-to-tr from-slate-950 via-slate-950 to-blue-900 rounded-t-xl px-5">
        <section>
          <AnimatedH1 />
          <p className="font-body text-md text-gray-300 py-2 sm:text-xl text-center">
            {t("hero.subtitle")}
          </p>
        </section>

        <section className="flex flex-col items-center gap-10 lg:flex-row text-center lg:text-left">
          <div className="flex flex-col items-center lg:items-start">
            <h2 className="text-2xl sm:text-3xl mb-4">
              {t("hero.heading")}
            </h2>
            <p className="font-body text-md sm:text-lg mt-4 max-w-lg text-gray-300">
              {t("hero.description")}
            </p>
            <button
              disabled
              className="flex items-center gap-3 mt-8 bg-gray-800/50 border border-gray-600/50 rounded-xl px-5 py-3 opacity-50 cursor-not-allowed"
            >
              <svg
                viewBox="0 0 24 24"
                width={24}
                height={24}
                className="shrink-0"
              >
                <path
                  d="M3.5 2.1c-.3.2-.5.5-.5.9v18c0 .4.2.7.5.9l.1.1L13.5 12l-.1-.1L3.6 2z"
                  fill="#34A853"
                />
                <path
                  d="M17.3 15.8l-3.8-3.8 3.8-3.8 4.3 2.5c1.2.7 1.2 1.8 0 2.5l-4.3 2.6z"
                  fill="#FBBC04"
                />
                <path
                  d="M17.3 15.8L13.5 12 3.6 22c.4.4 1.1.5 1.8.1l11.9-6.3z"
                  fill="#EA4335"
                />
                <path
                  d="M17.3 8.2L5.4 2C4.7 1.6 4 1.6 3.6 2l9.9 10 3.8-3.8z"
                  fill="#4285F4"
                />
              </svg>
              <div className="text-left">
                <p className="font-body text-[10px] text-gray-500 uppercase tracking-widest leading-tight">
                  {t("hero.comingSoon")}
                </p>
                <p className="font-body text-sm text-gray-300 leading-tight">
                  {t("hero.googlePlay")}
                </p>
              </div>
            </button>
          </div>
          <div>
            <Image
              src="/marketing/Screenshot_20260325_190256_Kurvi-portrait.png"
              alt="App Feed"
              width={300}
              height={650}
              priority
            />
          </div>
        </section>
      </main>

      {/* Feature Marquee */}
      <FeatureMarquee />

      {/* Feature Sections */}
      <div className="text-gray-100">
        {/* No Extra Devices */}
        <AnimatedSection className="py-16 sm:py-24 px-5 text-center border-b border-slate-800/50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("phone.heading")}
            </h2>
            <p className="font-body text-gray-400 text-lg">
              {t("phone.description")}
            </p>
            <p className="font-body text-gray-400 text-lg mt-4">
              {t("phone.sync")}
            </p>
            <p className="font-body text-gray-400 text-lg mt-4">
              {t("phone.multitask")}
            </p>
          </div>
        </AnimatedSection>

        {/* Built for Simplicity */}
        <AnimatedSection className="py-16 sm:py-24 px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("simplicity.heading")}
            </h2>
            <p className="font-body text-gray-400 max-w-2xl mx-auto text-lg">
              {t("simplicity.description")}
            </p>
          </div>
          <FeatureGrid features={simplicityFeatures} />
        </AnimatedSection>

        {/* Activities */}
        <AnimatedSection className="py-16 sm:py-24 px-5 bg-linear-to-br from-slate-950 via-slate-950 to-green-950/30">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("activities.heading")}
            </h2>
            <p className="font-body text-gray-400 max-w-2xl mx-auto text-lg">
              {t("activities.description")}
            </p>
          </div>
          <FeatureGrid features={activityFeatures} />
        </AnimatedSection>

        {/* Analytics */}
        <AnimatedSection className="py-16 sm:py-24 px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("analytics.heading")}
            </h2>
            <p className="font-body text-gray-400 max-w-2xl mx-auto text-lg">
              {t("analytics.description")}
            </p>
          </div>
          <FeatureGrid features={analyticsFeatures} />
        </AnimatedSection>

        {/* Nutrition */}
        <AnimatedSection className="py-16 sm:py-24 px-5 bg-linear-to-br from-slate-950 via-slate-950 to-orange-950/30">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("nutrition.heading")}
            </h2>
            <p className="font-body text-gray-400 max-w-2xl mx-auto text-lg">
              {t("nutrition.description")}
            </p>
          </div>
          <FeatureGrid features={nutritionFeatures} />
        </AnimatedSection>

        {/* Reminders */}
        <AnimatedSection className="py-16 sm:py-24 px-5 text-center border-y border-slate-800/50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("reminders.heading")}
            </h2>
            <p className="font-body text-gray-400 text-lg">
              {t("reminders.statement")}
            </p>
          </div>
        </AnimatedSection>

        {/* Habits */}
        <AnimatedSection className="py-16 sm:py-24 px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("habits.heading")}
            </h2>
            <p className="font-body text-gray-400 max-w-2xl mx-auto text-lg">
              {t("habits.description")}
            </p>
          </div>
          <FeatureGrid features={habitsFeatures} />
        </AnimatedSection>

        {/* Social Feed */}
        <AnimatedSection className="py-16 sm:py-24 px-5 bg-linear-to-br from-slate-950 via-slate-950 to-rose-950/20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("social.heading")}
            </h2>
            <p className="font-body text-gray-400 max-w-2xl mx-auto text-lg">
              {t("social.description")}
            </p>
          </div>
          <FeatureGrid features={socialFeatures} />
        </AnimatedSection>

        {/* Push Notifications */}
        <AnimatedSection className="py-16 sm:py-24 px-5 text-center border-y border-slate-800/50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("notifications.heading")}
            </h2>
            <p className="font-body text-gray-400 text-lg">
              {t("notifications.description")}
            </p>
          </div>
        </AnimatedSection>

        {/* Chat */}
        <AnimatedSection className="py-16 sm:py-24 px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("chat.heading")}
            </h2>
            <p className="font-body text-gray-400 max-w-2xl mx-auto text-lg">
              {t("chat.description")}
            </p>
          </div>
          <FeatureGrid features={chatFeatures} />
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection className="py-20 sm:py-28 px-5 text-center bg-linear-to-t from-blue-950/30 to-transparent">
          <h2 className="text-3xl sm:text-4xl mb-4">{t("cta.heading")}</h2>
          <p className="font-body text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            {t("cta.description")}
          </p>
          {/* Login button hidden — web app not fully ready yet */}
        </AnimatedSection>
      </div>

      <Footer />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 shadow-lg transition-all"
          aria-label="Scroll to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </>
  );
}
