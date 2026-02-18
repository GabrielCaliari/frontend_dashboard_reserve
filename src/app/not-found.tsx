import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        {/* Animated 404 number */}
        <div className="relative mb-8">
          <h1
            className="text-[10rem] leading-none font-black tracking-tighter select-none"
            style={{
              background:
                "linear-gradient(135deg, hsl(270 80% 60%), hsl(220 90% 55%), hsl(270 80% 60%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
              animation: "gradient-shift 4s ease infinite",
            }}
          >
            404
          </h1>
          {/* Subtle glow behind */}
          <div
            className="absolute inset-0 blur-3xl opacity-20 -z-10"
            style={{
              background:
                "radial-gradient(circle, hsl(270 80% 55% / 0.4), transparent 70%)",
            }}
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Pagina nao encontrada
        </h2>

        {/* Description */}
        <p className="text-default-500 mb-10 leading-relaxed max-w-sm mx-auto">
          A pagina que voce esta procurando nao existe ou foi movida para outro
          endereco.
        </p>

        {/* Back to Dashboard button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, hsl(270 80% 55%), hsl(220 90% 50%))",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar para o Dashboard
        </Link>
      </div>

      {/* Gradient animation keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes gradient-shift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `,
        }}
      />
    </div>
  );
}
