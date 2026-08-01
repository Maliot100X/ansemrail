import Link from "next/link";
import { Dashboard, Agents, Terminal, Signals, Marketplace, Skills, Settings, Bull } from "./nav-icons";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Dashboard },
  { href: "/agents", label: "Agents", icon: Agents },
  { href: "/terminal", label: "Terminal", icon: Terminal },
  { href: "/signals", label: "Signals", icon: Signals },
  { href: "/marketplace", label: "Marketplace", icon: Marketplace },
  { href: "/skills", label: "Skills", icon: Skills },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-zinc-900/50 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
          <Bull className="h-6 w-6 text-amber-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            AnsemRail
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">AnsemRail User</p>
              <p className="text-xs text-zinc-500 truncate">Connected</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100 md:hidden">
              AnsemRail
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-zinc-500">Bull Mode</span>
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://clawpump.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              ClawPump
            </a>
            <Link
              href="/register"
              className="flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              Register
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
