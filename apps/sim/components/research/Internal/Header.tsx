"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Internal/Button";

function Header() {
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
        {/* Removed GitHub and Settings buttons as requested */}
      </div>
    </header>
  );
}

export default Header;
