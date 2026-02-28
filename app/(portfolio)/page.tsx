import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

async function getProjects() {
  return prisma.project.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });
}

export default async function PortfolioPage() {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>

        <div className="animate-fade-in space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-400 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            正在寻找机会
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent leading-none">
            前端开发者
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed">
            打造令人印象深刻的界面，以下是我的作品。
          </p>

          <div className="flex gap-4 justify-center">
            <a
              href="#projects"
              className="rounded-full bg-white text-black px-6 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              查看项目
            </a>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="px-6 pb-24 max-w-6xl mx-auto">
        {featured.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-8">
              精选
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-8">
              {featured.length > 0 ? "更多项目" : "项目"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-24 text-zinc-600">
            <p>暂无项目，请通过后台对话添加。</p>
          </div>
        )}
      </section>
    </>
  );
}

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string;
  imageUrl: string | null;
  liveUrl: string | null;
  repoUrl: string | null;
  featured: boolean;
}

function ProjectCard({ project }: { project: Project }) {
  const techs: string[] = (() => {
    try {
      return JSON.parse(project.techStack);
    } catch {
      return [];
    }
  })();

  return (
    <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
      <div className="space-y-3">
        <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {techs.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="text-xs bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
            >
              {t}
            </Badge>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          {project.liveUrl && (
            <Link
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              预览 →
            </Link>
          )}
          {project.repoUrl && (
            <Link
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              源码
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
