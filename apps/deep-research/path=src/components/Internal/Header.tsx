"use client";
import { Github, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Internal/Button";
import { useGlobalStore } from "@/store/global";

const VERSION = process.env.NEXT_PUBLIC_VERSION;

function Header() {
  const { setOpenSetting } = useGlobalStore();
  const pathname = usePathname();

  // Hide header on specific paths
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">Deep Research</h1>
      </div>
      <div className="flex items-center space-x-2">
        <Link
          href="https://github.com/u14app/deep-research"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            title="GitHub"
          >
            <Github className="h-5 w-5" />
          </Button>
        </Link>
        <Button
          className="h-8 w-8"
          title="Settings"
          variant="ghost"
          size="icon"
          onClick={() => setOpenSetting(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

export default Header; 