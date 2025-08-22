import { PropsWithChildren } from "react";
import Header from "@/components/Header";

export default function MainLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t">
        <div className="container py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Actory. All rights reserved.</p>
          <nav className="flex items-center gap-6">
            <a href="#features" className="story-link">Features</a>
            <a href="#pricing" className="story-link">Pricing</a>
            <a href="#contact" className="story-link">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
