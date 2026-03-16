import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  RefreshCw,
  ChevronDown,
  TrendingUp,
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Gauge,
  Trophy,
  ClipboardCheck,
  SlidersHorizontal,
  Mail,
  MapPin,
  Calendar,
  Phone,
  User,
} from 'lucide-react';
import API from '../lib/api';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import EmotionAnalysisDisplay from '../components/EmotionAnalysisDisplay';
import '@/styles/submissions-light.css';

const SubmissionsPage = () => {
  const { castingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [sortBy, setSortBy] = useState('overallScore');
  const [filterScore, setFilterScore] = useState(0);
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');
  const [filterHeightMin, setFilterHeightMin] = useState('');
  const [filterHeightMax, setFilterHeightMax] = useState('');
  const [filterWeightMin, setFilterWeightMin] = useState('');
  const [filterWeightMax, setFilterWeightMax] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [draftFilterAgeMin, setDraftFilterAgeMin] = useState('');
  const [draftFilterAgeMax, setDraftFilterAgeMax] = useState('');
  const [draftFilterHeightMin, setDraftFilterHeightMin] = useState('');
  const [draftFilterHeightMax, setDraftFilterHeightMax] = useState('');
  const [draftFilterWeightMin, setDraftFilterWeightMin] = useState('');
  const [draftFilterWeightMax, setDraftFilterWeightMax] = useState('');
  const [draftFilterCity, setDraftFilterCity] = useState('');
  const [draftFilterSkill, setDraftFilterSkill] = useState('');
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [reanalyzingId, setReanalyzingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [lastCollapsedId, setLastCollapsedId] = useState(null);
  
  // Refs for each submission card to enable scroll-into-view
  const cardRefs = useRef({});

  const apiSortBy = sortBy === 'date'
    ? 'newest'
    : sortBy === 'dateOldest'
      ? 'oldest'
      : sortBy;

  // Fetch submissions with AI analysis
  const { data: submissionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['submissions', castingId, apiSortBy, filterScore],
    queryFn: async () => {
      const url = `/submissions/${castingId}/submissions?sort=${apiSortBy}&filter=${filterScore}`;
      const response = await API.get(url);
      return response.data;
    },
    enabled: !!castingId,
    staleTime: 0, // Always refetch - AI analysis happens asynchronously
    refetchInterval: 5000, // Auto-refetch every 5 seconds while page is in focus
    refetchOnWindowFocus: true, // Refetch when user returns to page
  });

  // Fetch casting details
  const { data: castingData } = useQuery({
    queryKey: ['casting', castingId],
    queryFn: async () => {
      const response = await API.get(`/casting/${castingId}`);
      return response.data;
    },
    enabled: !!castingId,
  });

  // Re-analyze mutation
  const reanalyzeMutation = useMutation({
    mutationFn: async (auditionId) => {
      const response = await API.post(`/submissions/audition/${auditionId}/reanalyze`);
      return response.data;
    },
    onSuccess: (data, auditionId) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', castingId] });
      setReanalyzingId(null);
    },
    onError: (error) => {
      console.error('Re-analysis failed:', error);
      setReanalyzingId(null);
    },
  });

  // Update submission status mutation (accept/reject)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ submissionId, status }) => {
      const response = await API.put(`/submissions/${submissionId}/status`, { status });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions', castingId] });
      setUpdatingStatusId(null);
      setExpandedSubmission(null);
    },
    onError: (error) => {
      console.error('Status update failed:', error);
      setUpdatingStatusId(null);
    },
  });

  const submissions = useMemo(() => {
    return submissionsData?.data || [];
  }, [submissionsData]);

  const displayedSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const age = Number(submission.age);
      const height = Number(submission.height);
      const weight = Number(submission.weight);

      if (filterAgeMin !== '' && (!Number.isFinite(age) || age < Number(filterAgeMin))) return false;
      if (filterAgeMax !== '' && (!Number.isFinite(age) || age > Number(filterAgeMax))) return false;

      if (filterHeightMin !== '' && (!Number.isFinite(height) || height < Number(filterHeightMin))) return false;
      if (filterHeightMax !== '' && (!Number.isFinite(height) || height > Number(filterHeightMax))) return false;

      if (filterWeightMin !== '' && (!Number.isFinite(weight) || weight < Number(filterWeightMin))) return false;
      if (filterWeightMax !== '' && (!Number.isFinite(weight) || weight > Number(filterWeightMax))) return false;

      if (filterCity.trim()) {
        const city = (submission.livingCity || '').toLowerCase();
        if (!city.includes(filterCity.trim().toLowerCase())) return false;
      }

      if (filterSkill.trim()) {
        const skillTerm = filterSkill.trim().toLowerCase();
        const hasSkill = Array.isArray(submission.skills)
          && submission.skills.some((skill) => String(skill).toLowerCase().includes(skillTerm));
        if (!hasSkill) return false;
      }

      return true;
    });
  }, [
    submissions,
    filterAgeMin,
    filterAgeMax,
    filterHeightMin,
    filterHeightMax,
    filterWeightMin,
    filterWeightMax,
    filterCity,
    filterSkill,
  ]);

  // Scroll to expanded/collapsed card for better UX
  useEffect(() => {
    if (expandedSubmission && cardRefs.current[expandedSubmission]) {
      // Small delay to allow DOM to update, then scroll into view
      setTimeout(() => {
        cardRefs.current[expandedSubmission]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 50);
    } else if (expandedSubmission === null && lastCollapsedId && cardRefs.current[lastCollapsedId]) {
      // When collapsing, scroll to the same card that was just collapsed
      setTimeout(() => {
        cardRefs.current[lastCollapsedId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 50);
    }
  }, [expandedSubmission, lastCollapsedId]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!displayedSubmissions || displayedSubmissions.length === 0) {
      return { total: 0, analyzed: 0, avgScore: 0, topScore: 0 };
    }

    const analyzed = displayedSubmissions.filter(s => s.aiAnalyzed).length;
    const scores = displayedSubmissions
      .filter(s => s.aiAnalyzed && Number(s.overallPerformanceScore ?? s.overallScore ?? 0) > 0)
      .map(s => Number(s.overallPerformanceScore ?? s.overallScore ?? 0));

    return {
      total: displayedSubmissions.length,
      analyzed,
      avgScore: scores.length > 0 ? (scores.reduce((a, b) => a + b) / scores.length).toFixed(1) : 0,
      topScore: scores.length > 0 ? Math.max(...scores).toFixed(1) : 0,
    };
  }, [displayedSubmissions]);

  const resetApplicationFilters = () => {
    setFilterAgeMin('');
    setFilterAgeMax('');
    setFilterHeightMin('');
    setFilterHeightMax('');
    setFilterWeightMin('');
    setFilterWeightMax('');
    setFilterCity('');
    setFilterSkill('');
    setDraftFilterAgeMin('');
    setDraftFilterAgeMax('');
    setDraftFilterHeightMin('');
    setDraftFilterHeightMax('');
    setDraftFilterWeightMin('');
    setDraftFilterWeightMax('');
    setDraftFilterCity('');
    setDraftFilterSkill('');
  };

  const openFilterPanel = () => {
    setDraftFilterAgeMin(filterAgeMin);
    setDraftFilterAgeMax(filterAgeMax);
    setDraftFilterHeightMin(filterHeightMin);
    setDraftFilterHeightMax(filterHeightMax);
    setDraftFilterWeightMin(filterWeightMin);
    setDraftFilterWeightMax(filterWeightMax);
    setDraftFilterCity(filterCity);
    setDraftFilterSkill(filterSkill);
    setShowFilterPanel(true);
  };

  const applyApplicationFilters = () => {
    setFilterAgeMin(draftFilterAgeMin);
    setFilterAgeMax(draftFilterAgeMax);
    setFilterHeightMin(draftFilterHeightMin);
    setFilterHeightMax(draftFilterHeightMax);
    setFilterWeightMin(draftFilterWeightMin);
    setFilterWeightMax(draftFilterWeightMax);
    setFilterCity(draftFilterCity);
    setFilterSkill(draftFilterSkill);
    setShowFilterPanel(false);
  };

  const getScoreTone = (score) => {
    if (score >= 80) return 'text-emerald-300';
    if (score >= 60) return 'text-amber-300';
    return 'text-rose-300';
  };

  const getMatchTone = (score) => {
    if (score >= 75) return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30';
    if (score >= 50) return 'bg-amber-500/15 text-amber-200 border-amber-400/30';
    return 'bg-rose-500/15 text-rose-200 border-rose-400/30';
  };

  const getStatusTone = (status) => {
    if (status === 'Accepted') return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200';
    if (status === 'Rejected') return 'bg-rose-500/15 border-rose-500/40 text-rose-200';
    return 'bg-slate-500/15 border-slate-500/40 text-slate-200';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="submissions-page min-h-screen bg-slate-950 text-white p-4 sm:p-6">
        <div className="max-w-3xl mx-auto mt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Submissions</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
      <div className="submissions-page min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="overflow-hidden border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800">
          <CardContent className="p-0">
            <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400" />
            <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <Badge className="w-fit border-cyan-400/30 bg-cyan-500/10 text-cyan-200">AI Performance Analysis</Badge>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Submissions Evaluation Board</h1>
                  <p className="mt-1 text-sm text-slate-300 sm:text-base">
                    {castingData?.data?.roleTitle || 'Casting Role'}
                    {castingData?.data?.location ? ` • ${castingData.data.location}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> {stats.total} candidates</span>
                  <span className="inline-flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> {stats.analyzed} analyzed</span>
                  <span className="inline-flex items-center gap-2"><Gauge className="h-4 w-4" /> Avg {stats.avgScore}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="border-slate-600 bg-slate-900/40 text-slate-200 hover:bg-slate-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="border-slate-600 bg-slate-900/40 text-slate-200 hover:bg-slate-800"
                >
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Total Submissions</p>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-100">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">AI Coverage</p>
                <Brain className="h-4 w-4 text-cyan-300" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-cyan-300">{stats.analyzed}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Average Score</p>
                <TrendingUp className="h-4 w-4 text-amber-300" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-amber-300">{stats.avgScore}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Best Score</p>
                <Trophy className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-emerald-300">{stats.topScore}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="sticky top-2 z-20 border-slate-800 bg-slate-900/95 backdrop-blur">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Review Controls
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openFilterPanel}
                  className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                >
                  Filter
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Sort submissions</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800 text-white">
                    <SelectItem value="overallScore">Highest score first</SelectItem>
                    <SelectItem value="date">Sort by date</SelectItem>
                    <SelectItem value="dateOldest">Sort by date (oldest first)</SelectItem>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-slate-400">Minimum AI score</label>
                  <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-200">{filterScore}+</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={filterScore}
                  onChange={(e) => setFilterScore(parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {showFilterPanel && (
            <div className="mt-5 border-t border-slate-800 pt-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs uppercase tracking-wider text-slate-400">Application Filters</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetApplicationFilters}
                    className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    onClick={applyApplicationFilters}
                    className="bg-cyan-600 text-white hover:bg-cyan-700"
                  >
                    Done
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Age Min</label>
                  <input
                    type="number"
                    min="0"
                    value={draftFilterAgeMin}
                    onChange={(e) => setDraftFilterAgeMin(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Age Max</label>
                  <input
                    type="number"
                    min="0"
                    value={draftFilterAgeMax}
                    onChange={(e) => setDraftFilterAgeMax(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Height Min (cm)</label>
                  <input
                    type="number"
                    min="0"
                    value={draftFilterHeightMin}
                    onChange={(e) => setDraftFilterHeightMin(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Height Max (cm)</label>
                  <input
                    type="number"
                    min="0"
                    value={draftFilterHeightMax}
                    onChange={(e) => setDraftFilterHeightMax(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Weight Min (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={draftFilterWeightMin}
                    onChange={(e) => setDraftFilterWeightMin(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Weight Max (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={draftFilterWeightMax}
                    onChange={(e) => setDraftFilterWeightMax(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Living City</label>
                  <input
                    type="text"
                    value={draftFilterCity}
                    onChange={(e) => setDraftFilterCity(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="e.g. Kochi"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-slate-500">Skill</label>
                  <input
                    type="text"
                    value={draftFilterSkill}
                    onChange={(e) => setDraftFilterSkill(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="e.g. Dancing"
                  />
                </div>
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        {displayedSubmissions.length === 0 && (
          <Card className="border-slate-800 bg-slate-900/80">
            <CardContent className="py-16 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-500" />
              <p className="text-lg text-slate-300">No submissions match this filter.</p>
              <p className="mt-2 text-sm text-slate-500">Try lowering the score threshold or relaxing application filters.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {displayedSubmissions.map((submission) => {
            const isExpanded = expandedSubmission === submission._id;
            const score = Number(submission.overallPerformanceScore ?? submission.overallScore ?? 0);
            const match = Number(submission.emotionMatchScore || 0);
            const consistency = Number(submission.emotionConsistency || 0);
            const intensity = Number(submission.expressionIntensity || 0);
            const visibility = Number(submission.faceVisibility || 0);
            const confidence = Number(submission.confidence || 0) * 100;

            return (
              <Card
                ref={(el) => {
                  cardRefs.current[submission._id] = el;
                }}
                key={submission._id}
                className="cursor-pointer overflow-hidden border-slate-800 bg-slate-900/80 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-900"
                onClick={() => {
                  if (isExpanded) {
                    setLastCollapsedId(submission._id);
                  }
                  setExpandedSubmission(isExpanded ? null : submission._id);
                }}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (submission.actor?._id) {
                            navigate(`/profile/${submission.actor._id}`);
                          }
                        }}
                        className="group relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-800 transition-all hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 sm:h-24 sm:w-24"
                      >
                        {submission.actor?.profileImage ? (
                          <img
                            src={submission.actor.profileImage}
                            alt={submission.actor?.name || 'Actor'}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300 transition-transform group-hover:scale-110">
                            <User className="h-8 w-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="rounded-full bg-cyan-500/90 p-1.5 text-white shadow-lg">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-slate-100 sm:text-xl">{submission.actor?.name || 'Unknown candidate'}</h3>
                            <p className="mt-0.5 flex items-center gap-2 truncate text-sm text-slate-400">
                              <Mail className="h-3.5 w-3.5" />
                              {submission.actor?.email || 'No email available'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {submission.status && (
                              <Badge className={`border ${getStatusTone(submission.status)}`}>
                                {submission.status}
                              </Badge>
                            )}
                            <Badge className={`border ${getMatchTone(match)}`}>
                              Match {Math.round(match)}%
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                            <p className="text-xs uppercase tracking-wider text-slate-500">Required</p>
                            <p className="mt-1 text-sm capitalize text-slate-200">{submission.requiredEmotion || 'neutral'}</p>
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                            <p className="text-xs uppercase tracking-wider text-slate-500">Detected</p>
                            <p className="mt-1 text-sm capitalize text-slate-200">{submission.detectedEmotion || 'pending'}</p>
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                            <p className="text-xs uppercase tracking-wider text-slate-500">Overall</p>
                            <p className={`mt-1 text-lg font-semibold ${getScoreTone(score)}`}>{score.toFixed(1)}</p>
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                            <p className="text-xs uppercase tracking-wider text-slate-500">Confidence</p>
                            <p className="mt-1 text-lg font-semibold text-slate-200">{Math.round(confidence)}%</p>
                          </div>
                        </div>

                        {submission.aiAnalyzed ? (
                          <div className="space-y-2 rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-3">
                            <div className="flex items-center justify-between text-xs text-slate-300">
                              <span>Performance score</span>
                              <span className={getScoreTone(score)}>{score.toFixed(1)} / 100</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400"
                                style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                              />
                            </div>
                            {submission.feedback && !isExpanded && (
                              <p
                                className="text-sm text-slate-300"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {submission.feedback}
                              </p>
                            )}
                            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                              <div className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1.5 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Match</p>
                                <p className="text-sm font-semibold text-cyan-200">{Math.round(match)}%</p>
                              </div>
                              <div className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1.5 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Consistency</p>
                                <p className="text-sm font-semibold text-cyan-200">{Math.round(consistency)}%</p>
                              </div>
                              <div className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1.5 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Intensity</p>
                                <p className="text-sm font-semibold text-cyan-200">{Math.round(intensity)}%</p>
                              </div>
                              <div className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1.5 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Visibility</p>
                                <p className="text-sm font-semibold text-cyan-200">{Math.round(visibility)}%</p>
                              </div>
                            </div>
                            {submission.framesAnalyzed && (
                              <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <Sparkles className="h-3 w-3" />
                                {submission.framesAnalyzed} frames analyzed
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-400">
                            AI analysis is in progress. This card auto-refreshes every 5 seconds.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center self-center lg:self-start">
                      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 space-y-5 border-t border-slate-800 pt-5">
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <Card className="border-slate-800 bg-slate-950/70 xl:col-span-1">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-200">Candidate Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            {submission.actor?.profileImage && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${submission.actor._id}`);
                                }}
                                className="group relative mx-auto h-32 w-32 cursor-pointer overflow-hidden rounded-xl border-2 border-slate-700 bg-slate-800 transition-all hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30"
                              >
                                <img
                                  src={submission.actor.profileImage}
                                  alt={submission.actor.name}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                  <div className="rounded-full bg-cyan-500/90 p-2 text-white shadow-lg">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div>
                              <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Full Name</p>
                              <p className="font-semibold text-slate-100">{submission.actor?.name || 'Unknown'}</p>
                            </div>
                            <div className="flex items-start gap-2 text-slate-300">
                              <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                              <span className="break-all">{submission.actor?.email || submission.email || 'Not provided'}</span>
                            </div>
                            {submission.phoneNumber && (
                              <div className="flex items-start gap-2 text-slate-300">
                                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                                <span className="font-mono">{submission.phoneNumber}</span>
                              </div>
                            )}
                            {submission.livingCity && (
                              <div className="flex items-start gap-2 text-slate-300">
                                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                                <span>{submission.livingCity}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-2 text-slate-300">
                              <Calendar className="mt-0.5 h-4 w-4 text-slate-400" />
                              <span>Submitted {formatDateTime(submission.createdAt)}</span>
                            </div>

                            {(submission.age || submission.height || submission.weight) && (
                              <div className="grid grid-cols-3 gap-2 pt-2">
                                {submission.age && <div className="rounded-md border border-slate-800 bg-slate-900 p-2 text-center"><p className="text-xs text-slate-500">Age</p><p className="text-slate-200">{submission.age}</p></div>}
                                {submission.height && <div className="rounded-md border border-slate-800 bg-slate-900 p-2 text-center"><p className="text-xs text-slate-500">Height</p><p className="text-slate-200">{submission.height}</p></div>}
                                {submission.weight && <div className="rounded-md border border-slate-800 bg-slate-900 p-2 text-center"><p className="text-xs text-slate-500">Weight</p><p className="text-slate-200">{submission.weight}</p></div>}
                              </div>
                            )}

                            {submission.skills?.length > 0 && (
                              <div>
                                <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Skills</p>
                                <div className="flex flex-wrap gap-2">
                                  {submission.skills.map((skill, i) => (
                                    <span key={i} className="rounded-md border border-cyan-700/30 bg-cyan-900/20 px-2 py-1 text-xs text-cyan-200">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(submission.portfolioUrl || submission.idProofUrl) && (
                              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                                {submission.portfolioUrl && (
                                  <a
                                    href={submission.portfolioUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-200"
                                  >
                                    View Portfolio
                                  </a>
                                )}
                                {submission.idProofUrl && (
                                  <a
                                    href={submission.idProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-200"
                                  >
                                    View ID Proof
                                  </a>
                                )}
                              </div>
                            )}

                            {submission.videoUrl && (
                              <div className="pt-2">
                                <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Submitted Video</p>
                                <video
                                  src={submission.videoUrl}
                                  controls
                                  className="w-full rounded-lg border border-slate-800 bg-black"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <div className="space-y-4 xl:col-span-2">
                          {submission.aiAnalyzed ? (
                            <Card className="border-slate-800 bg-slate-950/70">
                              <CardContent className="p-4">
                                <EmotionAnalysisDisplay submission={submission} darkTheme={true} />
                              </CardContent>
                            </Card>
                          ) : (
                            <Alert className="border-slate-700 bg-slate-900/80 text-slate-200">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Analysis Pending</AlertTitle>
                              <AlertDescription>
                                AI analysis is still running for this audition. Use re-analyze if needed.
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUpdatingStatusId(submission._id);
                                updateStatusMutation.mutate({
                                  submissionId: submission._id,
                                  status: 'Accepted',
                                });
                              }}
                              disabled={updatingStatusId === submission._id}
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              {updatingStatusId === submission._id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Accept Candidate
                                </>
                              )}
                            </Button>

                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUpdatingStatusId(submission._id);
                                updateStatusMutation.mutate({
                                  submissionId: submission._id,
                                  status: 'Rejected',
                                });
                              }}
                              disabled={updatingStatusId === submission._id}
                              className="bg-rose-600 text-white hover:bg-rose-700"
                            >
                              {updatingStatusId === submission._id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject Candidate
                                </>
                              )}
                            </Button>

                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReanalyzingId(submission._id);
                                reanalyzeMutation.mutate(submission._id);
                              }}
                              disabled={reanalyzingId === submission._id}
                              className="border border-cyan-500/40 bg-cyan-600/10 text-cyan-200 hover:bg-cyan-600/20"
                            >
                              {reanalyzingId === submission._id ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Re-analyzing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Re-analyze Emotion
                                </>
                              )}
                            </Button>

                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${submission.actor?._id}`);
                              }}
                              variant="outline"
                              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                            >
                              View Profile
                            </Button>
                          </div>

                          <p className="text-center text-xs text-slate-500">Submitted on {formatDate(submission.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;
