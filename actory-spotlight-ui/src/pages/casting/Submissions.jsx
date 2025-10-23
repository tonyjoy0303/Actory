import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export default function Submissions() {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [castingTitle, setCastingTitle] = useState('');
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [portfolioSrc, setPortfolioSrc] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    heightMin: '',
    heightMax: '',
    cities: [],
    skills: [],
  });
  const [cityInput, setCityInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const sortSubmissions = (items, sort) => {
    const sorted = [...items];
    switch (sort) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name-asc':
        return sorted.sort((a, b) => (a.actor?.name || '').localeCompare(b.actor?.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.actor?.name || '').localeCompare(a.actor?.name || ''));
      case 'status-accepted':
        return sorted.sort((a, b) => {
          if (a.status === 'Accepted' && b.status !== 'Accepted') return -1;
          if (b.status === 'Accepted' && a.status !== 'Accepted') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      case 'status-rejected':
        return sorted.sort((a, b) => {
          if (a.status === 'Rejected' && b.status !== 'Rejected') return -1;
          if (b.status === 'Rejected' && a.status !== 'Rejected') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      case 'status-pending':
        return sorted.sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (b.status === 'Pending' && a.status !== 'Pending') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      case 'age-asc':
        return sorted.sort((a, b) => (a.age || 0) - (b.age || 0));
      case 'age-desc':
        return sorted.sort((a, b) => (b.age || 0) - (a.age || 0));
      case 'height-asc':
        return sorted.sort((a, b) => (a.height || 0) - (b.height || 0));
      case 'height-desc':
        return sorted.sort((a, b) => (b.height || 0) - (a.height || 0));
      default:
        return sorted;
    }
  };

  const uniqueCities = useMemo(() => {
    const set = new Set();
    submissions.forEach(s => { if (s.livingCity) set.add(String(s.livingCity)); });
    return Array.from(set).sort();
  }, [submissions]);

  const uniqueSkills = useMemo(() => {
    const set = new Set();
    submissions.forEach(s => { (s.skills || []).forEach(sk => set.add(String(sk))); });
    return Array.from(set).sort();
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const aMin = Number(filters.ageMin) || null;
    const aMax = Number(filters.ageMax) || null;
    const hMin = Number(filters.heightMin) || null;
    const hMax = Number(filters.heightMax) || null;
    const citySel = new Set(filters.cities || []);
    const skillSel = new Set(filters.skills || []);
    return submissions.filter(s => {
      if (aMin !== null && (s.age ?? 0) < aMin) return false;
      if (aMax !== null && (s.age ?? 0) > aMax) return false;
      if (hMin !== null && (s.height ?? 0) < hMin) return false;
      if (hMax !== null && (s.height ?? 0) > hMax) return false;
      if (citySel.size && !citySel.has(String(s.livingCity || ''))) return false;
      if (skillSel.size) {
        const list = new Set((s.skills || []).map(x => String(x)));
        let ok = false;
        for (const sk of skillSel) { if (list.has(sk)) { ok = true; break; } }
        if (!ok) return false;
      }
      return true;
    });
  }, [submissions, filters]);

  const displayedSubmissions = useMemo(() => sortSubmissions(filteredSubmissions, sortBy), [filteredSubmissions, sortBy]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosRes, castingRes] = await Promise.all([
          API.get(`/casting/${id}/videos`),
          API.get(`/casting/${id}`),
        ]);
        setSubmissions(videosRes.data.data || []);
        setCastingTitle(castingRes.data.data?.roleTitle || castingRes.data.data?.roleName || 'Casting');
      } catch (error) {
        const msg = error?.response?.data?.message || 'Failed to load submissions.';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const updateSubmissionStatus = async (submissionId, status) => {
    try {
      setUpdatingId(submissionId);
      const { data } = await API.patch(`/videos/${submissionId}/status`, { status });
      setSubmissions((prev) => prev.map((s) => (s._id === submissionId ? { ...s, status: data.data.status } : s)));
      toast.success(`Submission ${status.toLowerCase()}.`);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewPortfolio = async (url, id) => {
    try {
      if (!url) {
        toast.error('No portfolio uploaded.');
        return;
      }
      
      console.log('Attempting to view portfolio:', { url, id });
      
      // If the URL is a public Cloudinary raw upload, open it directly
      if (typeof url === 'string' && url.includes('/raw/upload/')) {
        setPortfolioSrc(url);
        setPortfolioOpen(true);
        return;
      }
      
      // For legacy image upload URLs, try direct access first
      if (typeof url === 'string' && url.includes('/image/upload/')) {
        // Test if the URL is accessible
        try {
          const testResponse = await fetch(url, { method: 'HEAD' });
          if (testResponse.ok) {
            setPortfolioSrc(url);
            setPortfolioOpen(true);
            return;
          }
        } catch (error) {
          console.log('Direct URL access failed, trying proxy method');
        }
      }
      
      // Try the proxy stream endpoint first (more reliable)
      try {
        const res = await API.get(`/videos/${id}/portfolio/file`, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        setPortfolioSrc(objectUrl);
        setPortfolioOpen(true);
        return;
      } catch (proxyError) {
        console.log('Proxy method failed, trying direct URL:', proxyError.message);
      }
      
      // Fallback to direct URL access
      try {
        const { data } = await API.get(`/videos/${id}/portfolio`, { params: { format: 'json' } });
        if (data?.success && data?.url) {
          setPortfolioSrc(data.url);
          setPortfolioOpen(true);
          return;
        }
      } catch (directError) {
        console.log('Direct URL method failed:', directError.message);
      }
      
      // If both methods fail, show error
      throw new Error('All portfolio access methods failed');
      
    } catch (error) {
      console.error('Portfolio view error:', error);
      // Try to extract server error from blob responses
      let msg = 'Unable to load portfolio.';
      try {
        const data = error?.response?.data;
        if (data instanceof Blob) {
          const text = await data.text();
          try {
            const parsed = JSON.parse(text);
            msg = parsed?.message || msg;
          } catch (_) {
            msg = text || msg;
          }
        } else if (typeof data === 'object') {
          msg = data?.message || msg;
        }
      } catch (_) {}
      toast.error(msg);
    }
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: `Submissions - ${castingTitle}` , description: "View and manage all submissions for this casting call." , __self: this, __source: {fileName: '', lineNumber: 0}} )
      , React.createElement('section', { className: "container py-8 max-w-4xl" }
        , React.createElement(Card, null
          , React.createElement(CardHeader, { className: "flex flex-row items-center justify-between" }
            , React.createElement(CardTitle, { className: "font-display" }, `Submissions for ${castingTitle}`)
            , React.createElement('div', { className: "flex items-center gap-2" }
              , React.createElement('label', { className: "text-sm font-medium" }, "Sort by:")
              , React.createElement(Select, { value: sortBy, onValueChange: setSortBy }
                , React.createElement(SelectTrigger, { className: "w-[180px]" }
                  , React.createElement(SelectValue, { placeholder: "Sort submissions" } )
                )
                , React.createElement(SelectContent, null
                  , React.createElement(SelectItem, { value: "date-desc" }, "Newest First")
                  , React.createElement(SelectItem, { value: "date-asc" }, "Oldest First")
                  , React.createElement(SelectItem, { value: "name-asc" }, "Name A-Z")
                  , React.createElement(SelectItem, { value: "name-desc" }, "Name Z-A")
                  , React.createElement(SelectItem, { value: "status-accepted" }, "Accepted First")
                  , React.createElement(SelectItem, { value: "status-rejected" }, "Rejected First")
                  , React.createElement(SelectItem, { value: "status-pending" }, "Pending First")
                  , React.createElement(SelectItem, { value: "age-asc" }, "Age (Youngest)")
                  , React.createElement(SelectItem, { value: "age-desc" }, "Age (Oldest)")
                  , React.createElement(SelectItem, { value: "height-asc" }, "Height (Shortest)")
                  , React.createElement(SelectItem, { value: "height-desc" }, "Height (Tallest)")
                )
              )
              , React.createElement(Button, { variant: "outline", onClick: () => setFilterOpen(true) }, "Filter")
            )
          )
          , React.createElement(CardContent, null
            , loading ? (
              React.createElement('p', { className: "text-center text-sm" }, 'Loading submissions...')
            ) : submissions.length ? (
              React.createElement('div', { className: "space-y-3" }
                , displayedSubmissions.map((s) => (
                  React.createElement('div', { key: s._id, className: "p-3 rounded-md border flex items-center justify-between gap-3" }
                    , React.createElement('div', null
                      , React.createElement('p', { className: "font-medium" }, s.actor?.name || 'Unknown actor')
                      , React.createElement('p', { className: "text-xs text-muted-foreground" }, s.actor?.email)
                      , React.createElement('p', { className: "text-xs text-muted-foreground" }, `Title: ${s.title}`)
                      , React.createElement('p', { className: "text-xs text-muted-foreground" }, `Height: ${s.height} cm • Weight: ${s.weight} kg • Age: ${s.age}`)
                      , React.createElement('p', { className: "text-xs text-muted-foreground" }, `Address: ${s.permanentAddress}`)
                      , React.createElement('p', { className: "text-xs text-muted-foreground" }, `City: ${s.livingCity} • DOB: ${new Date(s.dateOfBirth).toLocaleDateString()} • Phone: ${s.phoneNumber}`)
                      , s.email && (
                        React.createElement('p', { className: "text-xs text-muted-foreground" }, `Email: ${s.email}`)
                      )
                      , s.skills && s.skills.length > 0 && (
                        React.createElement('div', { className: "flex flex-wrap gap-1 mt-1" }
                          , s.skills.map((skill) => (
                            React.createElement('span', { key: skill, className: "px-2 py-0.5 rounded-full bg-secondary text-xs" }, skill)
                          ))
                        )
                      )
                      , React.createElement('p', { className: "text-xs text-muted-foreground" }, `Submitted: ${new Date(s.createdAt).toLocaleString()}`)
                      , s.portfolioUrl ? React.createElement('a', { href: s.portfolioUrl, target: "_blank", rel: "noreferrer", className: "text-xs underline mt-1 inline-block" }, 'View Portfolio (PDF)') : null
                      , React.createElement('div', { className: "mt-1" }
                        , React.createElement('span', { className: `inline-block px-2 py-0.5 rounded text-xs ${s.status === 'Accepted' ? 'bg-green-600/20 text-green-500' : s.status === 'Rejected' ? 'bg-red-600/20 text-red-500' : 'bg-yellow-600/20 text-yellow-500'}` }, s.status || 'Pending')
                      )
                    )
                    , React.createElement('div', { className: "flex items-center gap-2" }
                      , React.createElement('a', { href: s.videoUrl, target: "_blank", rel: "noreferrer" }
                        , React.createElement(Button, { size: "sm", variant: "outline" }, 'View Video')
                      )
                      , React.createElement(Button, { size: "sm", variant: "outline", onClick: () => handleViewPortfolio(s.portfolioUrl, s._id), disabled: !s.portfolioUrl }, 'View Portfolio')
                      , React.createElement(Button, { size: "sm", variant: "secondary", disabled: updatingId === s._id, onClick: () => updateSubmissionStatus(s._id, 'Accepted') }, updatingId === s._id ? 'Updating...' : 'Accept')
                      , React.createElement(Button, { size: "sm", variant: "ghost", disabled: updatingId === s._id, onClick: () => updateSubmissionStatus(s._id, 'Rejected') }, 'Reject')
                    )
                  )
                )))
              ) : (
                React.createElement('p', { className: "text-center text-sm text-muted-foreground" }, 'No submissions yet.')
              )
          )
        )
      )
      , React.createElement(Dialog, { open: filterOpen, onOpenChange: setFilterOpen }
        , React.createElement(DialogContent, { className: "max-w-3xl w-[95vw]" }
          , React.createElement(DialogHeader, null
            , React.createElement(DialogTitle, null, 'Filters')
          )
          , React.createElement('div', { className: "grid md:grid-cols-3 gap-4" }
            , React.createElement('div', { className: "space-y-2" }
              , React.createElement('p', { className: "text-sm font-medium" }, 'Age')
              , React.createElement('div', { className: "flex items-center gap-2" }
                , React.createElement(Input, { type: "number", placeholder: "Min", value: filters.ageMin, onChange: (e) => setFilters((f) => ({ ...f, ageMin: e.target.value })) })
                , React.createElement(Input, { type: "number", placeholder: "Max", value: filters.ageMax, onChange: (e) => setFilters((f) => ({ ...f, ageMax: e.target.value })) })
              )
              , React.createElement('p', { className: "text-sm font-medium mt-2" }, 'Height (cm)')
              , React.createElement('div', { className: "flex items-center gap-2" }
                , React.createElement(Input, { type: "number", placeholder: "Min", value: filters.heightMin, onChange: (e) => setFilters((f) => ({ ...f, heightMin: e.target.value })) })
                , React.createElement(Input, { type: "number", placeholder: "Max", value: filters.heightMax, onChange: (e) => setFilters((f) => ({ ...f, heightMax: e.target.value })) })
              )
            )
            , React.createElement('div', { className: "space-y-2" }
              , React.createElement('p', { className: "text-sm font-medium" }, 'Cities')
              , React.createElement('div', { className: "flex gap-2" }
                , React.createElement(Input, { placeholder: "Add a city", value: cityInput, onChange: (e) => setCityInput(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); if (cityInput.trim()) setFilters(f => ({ ...f, cities: f.cities.includes(cityInput.trim()) ? f.cities : [...f.cities, cityInput.trim()] })); setCityInput(''); } } })
                , React.createElement(Button, { type: "button", variant: "outline", size: "icon", onClick: () => { if (cityInput.trim()) setFilters(f => ({ ...f, cities: f.cities.includes(cityInput.trim()) ? f.cities : [...f.cities, cityInput.trim()] })); setCityInput(''); } }
                  , React.createElement(Plus, { className: "h-4 w-4" })
                )
              )
              , React.createElement('div', { className: "flex flex-wrap gap-2 mt-2" }
                , (filters.cities || []).map((c) => (
                  React.createElement('div', { key: c, className: "flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm" }
                    , c
                    , React.createElement('button', { type: "button", onClick: () => setFilters(f => ({ ...f, cities: f.cities.filter(x => x !== c) })), className: "text-muted-foreground hover:text-foreground" }
                      , React.createElement(X, { className: "h-3 w-3" })
                    )
                  )
                ))
              )
              , React.createElement('div', { className: "mt-2 flex flex-wrap gap-2" }
                , uniqueCities.slice(0, 30).map(c => (
                  React.createElement('button', { key: c, type: "button", className: "text-xs px-2 py-1 rounded-md border hover:bg-accent", onClick: () => setFilters(f => ({ ...f, cities: f.cities.includes(c) ? f.cities : [...f.cities, c] })) }, c)
                ))
              )
            )
            , React.createElement('div', { className: "space-y-2" }
              , React.createElement('p', { className: "text-sm font-medium" }, 'Skills')
              , React.createElement('div', { className: "flex gap-2" }
                , React.createElement(Input, { placeholder: "Add a skill", value: skillInput, onChange: (e) => setSkillInput(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim()) setFilters(f => ({ ...f, skills: f.skills.includes(skillInput.trim()) ? f.skills : [...f.skills, skillInput.trim()] })); setSkillInput(''); } } })
                , React.createElement(Button, { type: "button", variant: "outline", size: "icon", onClick: () => { if (skillInput.trim()) setFilters(f => ({ ...f, skills: f.skills.includes(skillInput.trim()) ? f.skills : [...f.skills, skillInput.trim()] })); setSkillInput(''); } }
                  , React.createElement(Plus, { className: "h-4 w-4" })
                )
              )
              , React.createElement('div', { className: "flex flex-wrap gap-2 mt-2" }
                , (filters.skills || []).map((s) => (
                  React.createElement('div', { key: s, className: "flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm" }
                    , s
                    , React.createElement('button', { type: "button", onClick: () => setFilters(f => ({ ...f, skills: f.skills.filter(x => x !== s) })), className: "text-muted-foreground hover:text-foreground" }
                      , React.createElement(X, { className: "h-3 w-3" })
                    )
                  )
                ))
              )
              , React.createElement('div', { className: "mt-2 flex flex-wrap gap-2" }
                , uniqueSkills.slice(0, 30).map(s => (
                  React.createElement('button', { key: s, type: "button", className: "text-xs px-2 py-1 rounded-md border hover:bg-accent", onClick: () => setFilters(f => ({ ...f, skills: f.skills.includes(s) ? f.skills : [...f.skills, s] })) }, s)
                ))
              )
            )
          )
          , React.createElement('div', { className: "mt-4 flex items-center justify-end gap-2" }
            , React.createElement(Button, { variant: "ghost", onClick: () => setFilters({ ageMin: '', ageMax: '', heightMin: '', heightMax: '', cities: [], skills: [] }) }, 'Clear')
            , React.createElement(Button, { variant: "hero", onClick: () => setFilterOpen(false) }, 'Apply Filters')
          )
        )
      )
      , React.createElement(Dialog, { open: portfolioOpen, onOpenChange: setPortfolioOpen }
        , React.createElement(DialogContent, { className: "max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden" }
          , React.createElement(DialogHeader, null
            , React.createElement(DialogTitle, null, 'Portfolio (PDF)')
          )
          , React.createElement('div', { className: "h-full" }
            , portfolioSrc ? React.createElement('iframe', { src: portfolioSrc, title: "Portfolio PDF", className: "w-full h-[75vh]", frameBorder: "0" }) : React.createElement('p', { className: "p-4 text-sm" }, 'No portfolio available')
          )
        )
      )
    )
  );
}


// Portfolio viewer modal
// Rendered at the end to avoid nesting issues
export function PortfolioDialogWrapper({ open, onOpenChange, src }) {
  return (
    React.createElement(Dialog, { open: open, onOpenChange: onOpenChange }
      , React.createElement(DialogContent, { className: "max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden" }
        , React.createElement(DialogHeader, null
          , React.createElement(DialogTitle, null, 'Portfolio (PDF)')
        )
        , React.createElement('div', { className: "h-full" }
          , src ? React.createElement('iframe', { src: src, title: "Portfolio PDF", className: "w-full h-[75vh]", frameBorder: "0" }) : React.createElement('p', { className: "p-4 text-sm" }, 'No portfolio available')
        )
      )
    )
  );
}


