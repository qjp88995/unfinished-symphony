import { prisma } from "@/lib/db";
import type { Project as ProjectModel } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowDown, ExternalLink, Github, ArrowRight } from "lucide-react";

async function getProjects() {
  return prisma.project.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });
}

function parseTechs(techString: string): string[] {
  try {
    return JSON.parse(techString);
  } catch {
    return [];
  }
}

export default async function PortfolioPage() {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden bg-background">
        {/* Modern Sci-Fi Background effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Cyber grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_20%,transparent_100%)] opacity-[0.03] dark:opacity-[0.15]"></div>

          {/* Scanline overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,var(--color-background)_50%)] bg-[size:100%_4px] opacity-10 mix-blend-overlay"></div>
          <div className="absolute h-1 w-full bg-primary/20 animate-scanline blur-[2px]"></div>

          {/* Glowing orbs/nodes */}
          <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] rounded-full bg-primary/20 blur-[100px] mix-blend-screen opacity-50 animate-pulse duration-[8s]" />
          <div className="absolute bottom-1/3 right-1/4 w-[25vw] h-[25vw] rounded-full bg-accent/20 blur-[80px] mix-blend-screen opacity-50" />
        </div>

        <div className="animate-fade-in space-y-10 max-w-4xl relative z-10 pt-20">
          <div className="inline-flex items-center gap-3 border border-primary/20 dark:border-primary/30 bg-background/80 dark:bg-background/50 px-5 py-2 text-xs font-mono text-primary dark:text-primary backdrop-blur-md shadow-[0_0_10px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(0,243,255,0.15)] uppercase tracking-widest relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/10 w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 bg-primary"></span>
            </span>
            <span className="relative z-10">
              [SYS.STATUS]: ONLINE_AND_READY
            </span>
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-none uppercase">
            <span className="relative inline-block text-foreground drop-shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              创意
            </span>
            <br />
            <span className="relative inline-block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary/80 via-accent/80 to-primary/80 dark:from-primary dark:via-accent dark:to-primary animate-gradient hover:animate-glitch drop-shadow-[0_0_8px_rgba(var(--color-primary),0.3)] dark:drop-shadow-[0_0_15px_var(--color-primary)] opacity-90">
              开发者
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-mono tracking-wide">
            &gt; INITIATING SEQUENCE...
            <br />
            &gt; BUILDING HIGH-PERFORMANCE DIGITAL EXPERIENCES.
            <br />
            &gt; MERGING FLAWLESS ENGINEERING WITH STUNNING AESTHETICS.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
            <a
              href="#projects"
              className="group relative inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 text-sm font-mono font-bold uppercase tracking-wider transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-md dark:shadow-[0_0_20px_var(--color-primary)] hover:shadow-lg dark:hover:shadow-[0_0_30px_var(--color-primary)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-foreground/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">ACCESS_PROJECTS</span>
              <ArrowDown className="size-4 animate-bounce relative z-10" />
            </a>
            <a
              href="mailto:hello@example.com"
              className="group relative inline-flex items-center justify-center gap-3 border border-border dark:border-primary/50 bg-secondary/80 dark:bg-background/50 px-8 py-4 text-sm font-mono font-bold text-foreground backdrop-blur uppercase tracking-wider transition-all hover:bg-secondary dark:hover:bg-primary/10 hover:border-border dark:hover:border-primary shadow-sm dark:shadow-[inset_0_0_10px_rgba(0,243,255,0)] dark:hover:shadow-[inset_0_0_20px_rgba(0,243,255,0.2)]"
            >
              <span className="w-2 h-2 bg-primary/70 dark:bg-primary group-hover:animate-ping"></span>
              INIT_CONTACT
            </a>
          </div>
        </div>

        {/* Scroll indicator - Sci-fi style */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-60 hidden md:flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono text-primary tracking-[0.3em] uppercase">
            Scroll
          </span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent relative overflow-hidden">
            <div className="w-full h-1/3 bg-foreground absolute top-0 animate-[scanline_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section
        id="projects"
        className="px-6 py-32 max-w-7xl mx-auto space-y-32"
      >
        {featured.length > 0 && (
          <div>
            <div className="mb-12 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-primary tracking-widest uppercase">
                  Select_Portfolio
                </span>
                <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">
                  精选作品
                </h2>
              </div>
              <div className="hidden md:flex h-[1px] flex-1 bg-border ml-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-[scanline_3s_ease-in-out_infinite_alternate]"></div>
              </div>
            </div>
            <div className="flex flex-col gap-12">
              {featured.map((p) => (
                <FeaturedProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <div className="mb-12 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                  Archive_Data
                </span>
                <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
                  更多项目
                </h2>
              </div>
              <div className="hidden md:flex h-[1px] flex-1 bg-border ml-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-transparent via-muted-foreground/30 to-transparent"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((p) => (
                <RegularProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-32 border border-border rounded-none bg-card/10 backdrop-blur-sm relative overflow-hidden">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-muted-foreground"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-muted-foreground"></div>

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-none border border-border bg-background mb-6 shadow-inner">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-mono font-bold text-foreground mb-2 uppercase tracking-widest">
              [ERR: NO_DATA_FOUND]
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-mono text-sm uppercase">
              Please initialize database records via admin console.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function FeaturedProjectCard({ project }: { project: ProjectModel }) {
  const techs = parseTechs(project.techStack);

  return (
    <div className="group relative border border-border bg-card/80 dark:bg-card/50 overflow-hidden transition-all duration-500 hover:border-primary/50 hover:bg-card hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(0,243,255,0.15)] flex flex-col lg:flex-row min-h-[400px] shadow-sm">
      {/* Tech corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40 dark:border-primary opacity-50 group-hover:opacity-100 transition-opacity z-20"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/40 dark:border-primary opacity-50 group-hover:opacity-100 transition-opacity z-20"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/40 dark:border-primary opacity-50 group-hover:opacity-100 transition-opacity z-20"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/40 dark:border-primary opacity-50 group-hover:opacity-100 transition-opacity z-20"></div>

      {/* Image container */}
      <div className="relative w-full lg:w-[55%] aspect-video lg:aspect-auto overflow-hidden bg-background">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-90 dark:opacity-80 group-hover:opacity-100 dark:mix-blend-luminosity group-hover:mix-blend-normal"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(128,128,128,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] bg-background flex items-center justify-center">
            <span className="text-muted-foreground font-mono text-sm border border-border px-4 py-2 bg-background/50 backdrop-blur">
              [NO_DATA_FEED]
            </span>
          </div>
        )}
        {/* Holographic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background pointer-events-none" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>

      {/* Content container */}
      <div className="relative w-full lg:w-[45%] p-8 sm:p-12 lg:p-14 flex flex-col justify-center backdrop-blur-md z-10 -mt-12 lg:mt-0 lg:-ml-12 border-t lg:border-t-0 lg:border-l border-border bg-gradient-to-b lg:bg-gradient-to-r from-background/90 to-background/50 lg:from-background lg:via-background/90">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-accent/10 text-accent font-mono text-[10px] sm:text-xs font-bold tracking-widest border border-accent/30 shadow-[0_0_10px_rgba(139,92,246,0.2)] uppercase">
                FEAT_PRJ
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-foreground group-hover:text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground group-hover:from-primary group-hover:to-accent transition-all duration-500 uppercase tracking-tight">
              {project.title}
            </h3>
          </div>

          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg font-light">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {techs.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="text-[10px] sm:text-xs border-primary/30 text-primary font-mono bg-background hover:bg-primary/20 hover:text-primary transition-all rounded-none uppercase tracking-wider"
              >
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-6 mt-auto">
            {project.liveUrl && (
              <Link
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-5 py-3 transition-colors shadow-[0_0_15px_var(--color-primary)] hover:shadow-[0_0_25px_var(--color-primary)] uppercase tracking-wider"
              >
                [EXEC_LINK] <ExternalLink className="size-4" />
              </Link>
            )}
            {project.repoUrl && (
              <Link
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs sm:text-sm font-mono font-medium text-muted-foreground hover:text-primary transition-colors px-4 py-3 border border-border hover:border-primary/50 bg-background/50 hover:bg-primary/10 uppercase tracking-wider"
              >
                <Github className="size-4" />
                SRC_CODE
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegularProjectCard({ project }: { project: ProjectModel }) {
  const techs = parseTechs(project.techStack);

  return (
    <div className="group relative border border-border bg-card/50 dark:bg-card/30 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/50 hover:bg-card flex flex-col h-full shadow-sm hover:shadow-lg dark:hover:shadow-[0_10px_40px_-10px_rgba(0,243,255,0.15)]">
      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-[linear-gradient(225deg,var(--color-primary)_50%,transparent_50%)] opacity-0 group-hover:opacity-30 dark:group-hover:opacity-50 transition-opacity z-20"></div>

      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

      {/* Image header */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-background border-b border-border">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-90 dark:opacity-70 group-hover:opacity-100 dark:mix-blend-luminosity group-hover:mix-blend-normal"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(128,128,128,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px] bg-background flex items-center justify-center">
            <span className="text-muted-foreground font-mono text-[10px] border border-border px-2 py-1 bg-background/50 backdrop-blur">
              [NO_IMG]
            </span>
          </div>
        )}
      </div>

      {/* Content body */}
      <div className="p-6 sm:p-8 flex flex-col flex-1 relative z-20">
        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors uppercase tracking-tight">
          {project.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6 flex-1 group-hover:text-foreground/80 transition-colors font-light">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {techs.slice(0, 3).map((t) => (
            <span
              key={t}
              className="px-2 py-1 bg-background text-[10px] text-primary font-mono border border-border group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors uppercase tracking-wider"
            >
              {t}
            </span>
          ))}
          {techs.length > 3 && (
            <span className="px-2 py-1 bg-background text-[10px] text-muted-foreground font-mono border border-border uppercase">
              +{techs.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-border mt-auto">
          <div className="flex gap-2">
            {project.repoUrl && (
              <Link
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-1"
                title="SRC_CODE"
              >
                <Github className="size-4.5" />
              </Link>
            )}
          </div>
          {project.liveUrl && (
            <Link
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link flex items-center gap-1.5 text-xs font-mono font-bold text-foreground transition-colors hover:text-primary uppercase tracking-wider"
            >
              [LAUNCH]{" "}
              <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
