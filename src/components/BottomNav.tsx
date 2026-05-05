"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles, TrendingUp, BookOpen, User, Heart } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  // ランディングページやログイン画面では表示しない
  if (pathname === '/' || pathname === '/login') return null;

  const navItems = [
    { href: "/dashboard?mode=personal", icon: Sparkles, label: "AI選抜", isActive: pathname === '/dashboard' && mode !== 'trend' && mode !== 'keep' },
    { href: "/dashboard?mode=trend", icon: TrendingUp, label: "トレンド", isActive: pathname === '/dashboard' && mode === 'trend' },
    { href: "/dashboard?mode=keep", icon: Heart, label: "保存リスト", isActive: pathname === '/dashboard' && mode === 'keep' },
    { href: "/column", icon: BookOpen, label: "コラム", isActive: pathname.startsWith('/column') },
    { href: "/mypage", icon: User, label: "マイページ", isActive: pathname === '/mypage' },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-card/95 backdrop-blur-xl border-t border-border z-[100] px-1 pt-2 pb-6 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
      {navItems.map((item) => {
         return (
           <Link
             key={item.href}
             href={item.href}
             className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${item.isActive ? 'text-primary scale-105' : 'text-foreground/50 hover:text-foreground'}`}
           >
             <div className="relative">
               <item.icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5px]' : 'stroke-2'} ${item.isActive && item.href !== '/dashboard?mode=trend' ? 'fill-primary/20' : ''}`} />
               {item.isActive && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
             </div>
             <span className={`text-[9px] font-extrabold tracking-wide ${item.isActive ? 'text-primary' : ''}`}>
               {item.label}
             </span>
           </Link>
         );
      })}
    </nav>
  );
}
