import React from 'react'
import { useState } from 'react'
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { NavLink, useNavigate } from "react-router-dom"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import actorImg from "@/assets/actor.jpg"
import recruiterImg from "@/assets/recruiter.jpg"

export default function Features() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const navigate = useNavigate()
  const features = [
    { title: 'Casting Calls', desc: 'Rich filters by role, skills, age, and location.' },
    { title: 'Audition Uploads', desc: 'Fast, reliable uploads with previews and status.' },
    { title: 'Messaging', desc: 'Secure, real-time conversations between actors and producers.' },
    { title: 'Profiles & Portfolios', desc: 'Polished pages with photos, videos, and credits.' },
    { title: 'Dashboards', desc: 'Actor and Producer views to stay organized and productive.' },
    { title: 'Notifications', desc: 'Timely updates on shortlists, callbacks, and messages.' },
  ]

  const engineering = [
    { title: 'MERN Stack', desc: 'MongoDB, Express, React, Node for speed and flexibility.' },
    { title: 'API-First', desc: 'RESTful endpoints with clean versioning and auth.' },
    { title: 'Auth & Roles', desc: 'JWT-based authentication with Actor/Producer/Admin roles.' },
    { title: 'Media Handling', desc: 'Optimized uploads and delivery for audition videos.' },
  ]

  return (
    <main className="bg-[#0f1115] text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#10131a] via-[#0f1115] to-[#0f1115]" />
        <div className="container relative py-12 md:py-16">
          <header className="mb-8 md:mb-12">
            <p className="text-xs uppercase tracking-widest text-slate-400">Explore</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Platform <span className="text-[#FFD700]">Features</span>
            </h1>
            <p className="mt-3 text-slate-300 max-w-3xl">
              A complete toolkit for auditions and casting – thoughtfully designed for actors, producers, and admins.
            </p>
          </header>
        </div>
      </section>

      <div className="container py-10 md:py-14 space-y-14">
        {/* Feature grid */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-5">Core Capabilities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-[#12161d] border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-slate-300">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Engineering */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-5">Engineering</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {engineering.map((f) => (
              <Card key={f.title} className="bg-[#12161d] border-slate-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-slate-300">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Reliability & Security */}
        <section>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">Security</h3>
                <p className="mt-2 text-slate-300">JWT auth, role-based access, input validation, and secure headers.</p>
              </CardContent>
            </Card>
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">Performance</h3>
                <p className="mt-2 text-slate-300">Responsive UI, optimized assets, and efficient database access.</p>
              </CardContent>
            </Card>
            <Card className="bg-[#12161d] border-slate-800">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">Collaboration</h3>
                <p className="mt-2 text-slate-300">Messaging, shortlisting, and notifications that keep teams aligned.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <p className="text-slate-400 mb-4">Ready to experience Actory?</p>
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
    </main>
  )
}
