import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { NavLink, useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import actorImg from "@/assets/actor.jpg"
import recruiterImg from "@/assets/recruiter.jpg"

export default function KnowMore() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const navigate = useNavigate()
  // enable smooth scroll for in-page anchors
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth'
      return () => {
        document.documentElement.style.scrollBehavior = ''
      }
    }
  }, [])

  const toc = [
    { id: 'intro', label: 'Introduction' },
    { id: 'actors', label: 'For Actors' },
    { id: 'producers', label: 'For Producers' },
    { id: 'admins', label: 'For Admins' },
    { id: 'why', label: 'Why Actory' },
    { id: 'future', label: 'Future Enhancements' },
    { id: 'faq', label: 'FAQ' },
  ]

  return (
    <main className="bg-[#0f1115] text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#10131a] via-[#0f1115] to-[#0f1115]" />
        <div className="container relative py-12 md:py-16">
          <header className="mb-6 md:mb-10">
            <p className="text-xs uppercase tracking-widest text-slate-400">About</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Actory – A Web-Based Film Audition Platform <span className="text-[#FFD700]">Know More</span>
            </h1>
            <p className="mt-3 text-slate-300 max-w-3xl">
              Actory is a modern, end‑to‑end platform that connects talented actors with producers and casting directors. 
              From discovering casting calls to managing auditions and messaging, Actory streamlines the entire workflow.
            </p>
          </header>

          {/* TOC */}
          <Card className="bg-[#12161d] border-slate-800">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-3">
                {toc.map((t) => (
                  <a key={t.id} href={`#${t.id}`} className="text-sm text-slate-300 hover:text-white border border-slate-700/70 hover:border-slate-500 rounded-full px-4 py-2 transition-colors">
                    {t.label}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="container py-10 md:py-14 space-y-12 md:space-y-16">
        {/* Introduction */}
        <section id="intro" className="scroll-mt-24">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6 space-y-3">
                <h2 className="text-2xl md:text-3xl font-semibold">🎬 Introduction</h2>
                <p className="leading-relaxed text-slate-300">
                  Actory simplifies the casting process by providing a centralized hub for <span className="text-[#FFD700] font-medium">casting calls</span>,
                  <span className="text-[#FFD700] font-medium"> audition submissions</span>, and <span className="text-[#FFD700] font-medium">direct communication</span> between
                  actors and producers. It’s built on the MERN stack for speed, flexibility, and developer productivity.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold">Key Capabilities</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Powerful search and filters</li>
                  <li>Secure auth with role‑based access</li>
                  <li>Audition video uploads and management</li>
                  <li>Built for performance and scalability</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Actors */}
        <section id="actors" className="scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">🎭 For Actors</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Discover and filter <span className="text-[#FFD700] font-medium">casting calls</span> by role, skills, and location.</li>
                  <li>Build and showcase a professional <span className="text-[#FFD700] font-medium">profile & portfolio</span>.</li>
                  <li>Upload <span className="text-[#FFD700] font-medium">audition videos</span> with quick preview.</li>
                  <li>Receive live updates and communicate directly with recruiters.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold text-center">Get Started</h3>
                <div className="flex justify-center">
                  <NavLink to="/auth/register/actor">
                    <Button
                      variant="brand-outline"
                      className="rounded-full px-8 py-3 font-semibold border-[#FFD700]/70 text-[#FFD700] hover:bg-[#151a22] hover:border-[#FFD700] hover:text-[#FFE066] transition-colors"
                    >
                      Join as Actor
                    </Button>
                  </NavLink>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Producers */}
        <section id="producers" className="scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">🌟 For Producers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Post detailed <span className="text-[#FFD700] font-medium">casting calls</span> and manage role requirements.</li>
                  <li>Search a large talent pool using <span className="text-[#FFD700] font-medium">smart filters</span>.</li>
                  <li>Review auditions, shortlist candidates, and <span className="text-[#FFD700] font-medium">message</span> actors.</li>
                  <li>Coordinate the entire audition pipeline from one dashboard.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold text-center">Get Started</h3>
                <div className="flex justify-center">
                  <NavLink to="/auth/register/producer">
                    <Button
                      variant="brand-outline"
                      className="rounded-full px-8 py-3 font-semibold border-[#FFD700]/70 text-[#FFD700] hover:bg-[#151a22] hover:border-[#FFD700] hover:text-[#FFE066] transition-colors"
                    >
                      Join as Producer
                    </Button>
                  </NavLink>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Admins */}
        <section id="admins" className="scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">🛡️ For Admins</h2>
          <Card className="bg-[#12161d] border-slate-800">
            <CardContent className="p-6">
              <ul className="list-disc pl-6 space-y-2 text-slate-300">
                <li>Platform oversight with <span className="text-[#FFD700] font-medium">user management</span> and moderation tools.</li>
                <li>Manage content, handle reports, and ensure a safe community.</li>
                <li>Monitor performance and platform health.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Why Actory */}
        <section id="why" className="scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">🚀 Why Actory</h2>
          <Card className="bg-[#12161d] border-slate-800">
            <CardContent className="p-6">
              <p className="leading-relaxed text-slate-300">
                Actory brings the entire casting lifecycle into a single, elegant experience. With a focus on
                usability, performance, and trust, Actory empowers both talent and recruiters to collaborate
                effectively and make faster decisions.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Future Enhancements */}
        <section id="future" className="scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">🔮 Future Enhancements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6">
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>AI‑powered <span className="text-[#FFD700] font-medium">talent recommendations</span> and audition scoring.</li>
                  <li>Advanced <span className="text-[#FFD700] font-medium">analytics dashboards</span> for producers and admins.</li>
                  <li>Integrated scheduling and video callbacks.</li>
                  <li>Mobile apps for on‑the‑go submissions and reviews.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold text-center">Stay in the loop</h3>
                <p className="text-slate-400">Follow updates as we ship new features.</p>
                <div className="flex justify-center">
                  <NavLink to="/casting">
                    <Button
                      variant="brand-outline"
                      className="rounded-full px-8 py-3 font-semibold border-[#FFD700]/70 text-[#FFD700] hover:bg-[#151a22] hover:border-[#FFD700] hover:text-[#FFE066] transition-colors"
                    >
                      View Castings
                    </Button>
                  </NavLink>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ (interactive) */}
        <section id="faq" className="scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">❓ FAQ</h2>
          <Accordion type="single" collapsible className="bg-[#12161d] border border-slate-800 rounded-lg">
            <AccordionItem value="item-1" className="border-b border-slate-800">
              <AccordionTrigger className="px-6">How do I submit an audition?</AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-300">
                Create an account, find a casting call, and upload your audition video directly from the casting page.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b border-slate-800">
              <AccordionTrigger className="px-6">Is there a fee to join?</AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-300">
                Core features are free. We plan optional premium features in the future to enhance visibility and workflow.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6">Can producers message actors?</AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-300">
                Yes. Producers can message shortlisted actors, and actors can reply to continue the conversation securely.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-slate-400 mb-4">Ready to get started?</p>
          <div className="flex items-center justify-center">
            <Button
              onClick={() => setRegisterOpen(true)}
              variant="brand-outline"
              className="rounded-full px-10 py-6 text-lg font-semibold border-[#FFD700]/70 text-[#FFD700] hover:bg-[#151a22] hover:border-[#FFD700] hover:text-[#FFE066] transition-colors"
            >
              Get Started
            </Button>
            <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
              <DialogContent className="max-w-5xl p-0 overflow-hidden">
                <div className="relative grid grid-cols-1 md:grid-cols-2">
                  <div className="p-10 flex flex-col items-center text-center gap-5">
                    <div className="h-56 w-80 flex items-center justify-center">
                      <img src={actorImg} alt="Artist" className="max-h-full max-w-full object-contain" />
                    </div>
                    <p className="text-sm text-slate-300 max-w-xs">Apply for unlimited jobs/auditions posted by top industry recruiters.</p>
                    <button className="text-xs font-semibold text-[#FFD700]" onClick={() => navigate('/casting')}>KNOW MORE</button>
                    <Button variant="hero" className="rounded-full px-6 py-6 text-base w-[220px]" onClick={() => { setRegisterOpen(false); navigate('/auth/register/actor'); }}>Register As Artist</Button>
                  </div>
                  <div className="p-10 flex flex-col items-center text-center gap-5">
                    <div className="h-56 w-80 flex items-center justify-center">
                      <img src={recruiterImg} alt="Producer" className="max-h-full max-w-full object-contain" />
                    </div>
                    <p className="text-sm text-slate-300 max-w-xs">Search and find the perfect talent for your project.</p>
                    <button className="text-xs font-semibold text-[#FFD700]" onClick={() => navigate('/casting')}>KNOW MORE</button>
                    <Button variant="hero" className="rounded-full px-6 py-6 text-base w-[220px]" onClick={() => { setRegisterOpen(false); navigate('/auth/register/producer'); }}>Register As Producer</Button>
                  </div>
                  <div className="hidden md:block absolute inset-y-0 left-1/2 w-px bg-slate-800" />
                </div>
                <div className="px-6 pb-6 text-center text-xs text-slate-400">Are you a talent agency? <span className="underline cursor-pointer" onClick={() => { setRegisterOpen(false); navigate('/auth/register/producer'); }}>Click here.</span></div>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 rounded-full bg-slate-800/70 hover:bg-slate-700 text-white px-3 py-2 text-sm shadow"
        aria-label="Back to top"
      >
        ↑ Top
      </button>
    </main>
  )
}
