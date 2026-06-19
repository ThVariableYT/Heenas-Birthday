"use client";

export default function BackgroundBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div
        className="liquid-blob-1 absolute -left-[15%] -top-[5%] h-[600px] w-[600px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,200,190,0.45) 0%, rgba(255,170,190,0.18) 60%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        className="liquid-blob-2 absolute -right-[15%] -bottom-[5%] h-[650px] w-[650px]"
        style={{
          background:
            "radial-gradient(circle, rgba(245,210,255,0.45) 0%, rgba(190,220,255,0.18) 60%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div className="ambient-glow-circle left-1/4 top-1/4 h-96 w-96" />
      <div
        className="ambient-glow-circle bottom-1/4 right-1/4 h-80 w-80"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="ambient-glow-circle left-1/2 top-1/2 h-72 w-72"
        style={{
          animationDelay: "-12s",
          background: "radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
