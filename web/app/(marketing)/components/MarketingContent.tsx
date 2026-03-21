"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
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
  Globe,
  Smartphone,
  BellRing,
  Puzzle,
} from "lucide-react";

const SUPPORTED_LANGS = ["en", "fi"];

export default function MarketingContent() {
  const { t, i18n } = useTranslation("marketing");

  // Auto-detect browser language once for unauthenticated visitors
  const hasDetected = useRef(false);
  useEffect(() => {
    if (hasDetected.current) return;
    hasDetected.current = true;
    const browserLang = navigator.language?.split("-")[0];
    if (browserLang && SUPPORTED_LANGS.includes(browserLang)) {
      i18n.changeLanguage(browserLang);
    }
  }, [i18n]);

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

  const reminderFeatures = [
    {
      icon: Globe,
      title: t("reminders.globalTitle"),
      desc: t("reminders.globalDesc"),
      color: "text-yellow-400",
      border: "border-yellow-500/20",
    },
    {
      icon: Smartphone,
      title: t("reminders.localTitle"),
      desc: t("reminders.localDesc"),
      color: "text-orange-400",
      border: "border-orange-500/20",
    },
    {
      icon: BellRing,
      title: t("reminders.priorityTitle"),
      desc: t("reminders.priorityDesc"),
      color: "text-red-400",
      border: "border-red-500/20",
    },
    {
      icon: Puzzle,
      title: t("reminders.integratedTitle"),
      desc: t("reminders.integratedDesc"),
      color: "text-amber-400",
      border: "border-amber-500/20",
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
      {/* Hero */}
      <main className="flex flex-col justify-center items-center gap-10 text-gray-100 py-10 lg:py-20 bg-linear-to-tr from-slate-950 via-slate-950 to-blue-900 rounded-t-xl px-5">
        <section>
          <AnimatedH1 />
          <p className="font-[family-name:var(--font-body)] text-md text-gray-300 py-2 sm:text-xl text-center">
            {t("hero.subtitle")}
          </p>
        </section>

        <section className="flex flex-col items-center gap-10 lg:flex-row text-center lg:text-left">
          <div className="flex flex-col items-center lg:items-start">
            <h2 className="text-2xl sm:text-3xl mb-4">
              {t("hero.heading")}
            </h2>
            <p className="font-[family-name:var(--font-body)] text-md sm:text-lg mt-4 max-w-lg text-gray-300">
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
                <p className="font-[family-name:var(--font-body)] text-[10px] text-gray-500 uppercase tracking-widest leading-tight">
                  {t("hero.comingSoon")}
                </p>
                <p className="font-[family-name:var(--font-body)] text-sm text-gray-300 leading-tight">
                  {t("hero.googlePlay")}
                </p>
              </div>
            </button>
          </div>
          <div>
            <Image
              src="/marketing/Screenshot_20260321_173043_Kurvi-portrait.png"
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
            <p className="font-[family-name:var(--font-body)] text-gray-400 text-lg">
              {t("phone.description")}
            </p>
            <p className="font-[family-name:var(--font-body)] text-gray-400 text-lg mt-4">
              {t("phone.sync")}
            </p>
          </div>
        </AnimatedSection>

        {/* Built for Simplicity */}
        <AnimatedSection className="py-16 sm:py-24 px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("simplicity.heading")}
            </h2>
            <p className="font-[family-name:var(--font-body)] text-gray-400 max-w-2xl mx-auto text-lg">
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
            <p className="font-[family-name:var(--font-body)] text-gray-400 max-w-2xl mx-auto text-lg">
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
            <p className="font-[family-name:var(--font-body)] text-gray-400 max-w-2xl mx-auto text-lg">
              {t("analytics.description")}
            </p>
          </div>
          <FeatureGrid features={analyticsFeatures} />
        </AnimatedSection>

        {/* Reminders */}
        <AnimatedSection className="py-16 sm:py-24 px-5 bg-linear-to-br from-slate-950 via-slate-950 to-yellow-950/20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("reminders.heading")}
            </h2>
            <p className="font-[family-name:var(--font-body)] text-gray-400 max-w-2xl mx-auto text-lg">
              {t("reminders.description")}
            </p>
          </div>
          <FeatureGrid features={reminderFeatures} />
        </AnimatedSection>

        {/* Social Feed */}
        <AnimatedSection className="py-16 sm:py-24 px-5 bg-linear-to-br from-slate-950 via-slate-950 to-rose-950/20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4">
              {t("social.heading")}
            </h2>
            <p className="font-[family-name:var(--font-body)] text-gray-400 max-w-2xl mx-auto text-lg">
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
            <p className="font-[family-name:var(--font-body)] text-gray-400 text-lg">
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
            <p className="font-[family-name:var(--font-body)] text-gray-400 max-w-2xl mx-auto text-lg">
              {t("chat.description")}
            </p>
          </div>
          <FeatureGrid features={chatFeatures} />
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection className="py-20 sm:py-28 px-5 text-center bg-linear-to-t from-blue-950/30 to-transparent">
          <h2 className="text-3xl sm:text-4xl mb-4">{t("cta.heading")}</h2>
          <p className="font-[family-name:var(--font-body)] text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            {t("cta.description")}
          </p>
          <Link href="/login">
            <button className="text-white bg-gradient-to-tr from-blue-700 to-blue-500 px-8 py-3 rounded-xl shadow-lg shadow-blue-950/50 hover:from-blue-600 hover:to-blue-400 transform hover:scale-105 transition-all duration-200 cursor-pointer text-lg">
              {t("cta.button")}
            </button>
          </Link>
        </AnimatedSection>
      </div>

      <Footer />
    </>
  );
}
