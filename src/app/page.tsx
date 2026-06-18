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
      <ScrollProgress />
      <FloatingControls />

      <IntroScreen onOpen={() => setEntered(true)} />

      <AnimatePresence>
        {entered && (
          <motion.main
            className="relative z-10 flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <HeroSection />
            <TimelineSection />
            <MemoryDeck />
            <LoveJar />
            <ComplimentsSection />
            <VinylPlayer />
            <CakeSection />
            <Footer />
          </motion.main>
        )}
      </AnimatePresence>

      <BackToTop />
    </div>
  );
}
