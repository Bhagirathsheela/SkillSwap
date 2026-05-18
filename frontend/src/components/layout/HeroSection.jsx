import React from "react";

const HeroSection = () => {
  return (
    <section
      className="hero_section relative overflow-hidden px-5 sm:px-8 py-16 sm:py-20 md:py-28 text-center"
      style={{ background: "var(--color-brand-gradient)" }}
    >
      {/* Decorative soft glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25), transparent 45%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
          Learn What You Need.
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          Teach What You Know.
        </h1>

        <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-white/90 max-w-xl mx-auto leading-relaxed">
          Find people who know what you want to learn – and help those who want what you know.
        </p>

        <form
          className="search_bar mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="searchInput" className="sr-only">
            Search for a skill
          </label>
          <input
            type="text"
            id="searchInput"
            placeholder="What do you want to learn?"
            name="search"
            className="flex-1 px-5 py-3 text-sm sm:text-base rounded-full
                       bg-white/95 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                       border border-white/40 shadow-[var(--search-shadow)]
                       focus:outline-none focus:bg-white
                       focus:ring-2 focus:ring-white/70 transition"
          />
          <button
            type="submit"
            className="px-6 py-3 text-sm sm:text-base font-semibold rounded-full
                       bg-white text-[var(--color-brand-primary)]
                       hover:bg-[var(--color-brand-primary-pale)]
                       hover:-translate-y-0.5 active:translate-y-0
                       shadow-[0_6px_20px_rgba(0,0,0,0.18)]
                       transition whitespace-nowrap"
          >
            Find Your Match
          </button>
        </form>
      </div>
    </section>
  );
};

export default HeroSection;
