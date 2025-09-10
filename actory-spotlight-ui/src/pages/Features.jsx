import React from 'react'
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { NavLink } from "react-router-dom"

export default function Features() {
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
            <NavLink to="/auth/register">
              <Button
                variant="brand-outline"
                className="rounded-full px-10 py-6 text-lg font-semibold border-[#FFD700]/70 text-[#FFD700] hover:bg-[#151a22] hover:border-[#FFD700] hover:text-[#FFE066] transition-colors"
              >
                Get Started
              </Button>
            </NavLink>
          </div>
        </section>
      </div>
    </main>
  )
}
