"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import SparkleCanvas from "@/components/birthday/SparkleCanvas";
import BackgroundBlobs from "@/components/birthday/BackgroundBlobs";
import IntroScreen from "@/components/birthday/IntroScreen";
import HeroSection from "@/components/birthday/HeroSection";
import MemoryDeck from "@/components/birthday/MemoryDeck";
import LoveJar from "@/components/birthday/LoveJar";
import CakeSection from "@/components/birthday/CakeSection";
import Footer from "@/components/birthday/Footer";
import FloatingControls from "@/components/birthday/FloatingControls";
import ScrollProgress from "@/components/birthday/ScrollProgress";
import BackToTop from "@/components/birthday/BackToTop";
import ConfettiRain from "@/components/birthday/ConfettiRain";
import ComplimentsSection from "@/components/birthday/ComplimentsSection";
import StatsFinale from "@/components/birthday/StatsFinale";
import KeyboardShortcuts from "@/components/birthday/KeyboardShortcuts";
import FilmGrainOverlay from "@/components/birthday/FilmGrainOverlay";
import SectionDivider from "@/components/birthday/SectionDivider";
import ScrollSpy from "@/components/birthday/ScrollSpy";
import { initAudio, resumeAudio, startAmbientPad } from "@/lib/audio";

const TimelineSection = dynamic(() => import("@/components/birthday/TimelineSection"));
const VinylPlayer = dynamic(() => import("@/components/birthday/VinylPlayer"));

export default function Home() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const unlock = () => {
      initAudio();
      resumeAudio();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (entered) {
      const t = setTimeout(() => startAmbientPad(), 800);
      return () => clearTimeout(t);
    }
  }, [entered]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <BackgroundBlobs />
      <SparkleCanvas />
      <ConfettiRain />
      <FilmGrainOverlay />
      <ScrollProgress />
      <ScrollSpy />
      <FloatingControls />
      <KeyboardShortcuts />

      {/* Skip-to-content link — visible on keyboard focus only */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-amber-500 focus:px-5 focus:py-2.5 focus:font-mono-elegant focus:text-xs focus:font-bold focus:text-white focus:shadow-xl"
      >
        Skip to content
      </a>

      <IntroScreen onOpen={() => setEntered(true)} />

      <AnimatePresence>
        {entered && (
          <motion.main
            id="main-content"
            className="relative z-10 flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <HeroSection />
            <TimelineSection />
            <SectionDivider index={0} />
            <MemoryDeck />
            <SectionDivider index={1} />
            <LoveJar />
            <SectionDivider index={2} />
            <ComplimentsSection />
            <SectionDivider index={3} />
            <VinylPlayer />
            <SectionDivider index={4} />
            <CakeSection />
            <SectionDivider index={5} />
            <StatsFinale />
            <Footer />
          </motion.main>
        )}
      </AnimatePresence>

      <BackToTop />
    </div>
  );
}
