/**
 * 🤖 Recruiter Submissions Dashboard
 * Display and manage casting submissions with AI emotion analysis
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, ChevronDown, Award, TrendingUp, Brain, Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import API from '../lib/api';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import EmotionAnalysisDisplay from '../components/EmotionAnalysisDisplay';

const SubmissionsPage = () => {
  const { castingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [sortBy, setSortBy] = useState('overallScore');
  const [filterScore, setFilterScore] = useState(0);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [reanalyzingId, setReanalyzingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Fetch submissions with AI analysis
  const { data: submissionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['submissions', castingId, sortBy, filterScore],
    queryFn: async () => {
      const url = `/submissions/${castingId}/submissions?sort=${sortBy}&filter=${filterScore}`;
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
    const data = submissionsData?.data || [];
    console.log('Submissions data received:', data);
    if (data.length > 0) {
      console.log('First submission:', data[0]);
    }
    return data;
  }, [submissionsData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return { total: 0, analyzed: 0, avgScore: 0, topScore: 0 };
    }

    const analyzed = submissions.filter(s => s.aiAnalyzed).length;
    const scores = submissions
      .filter(s => s.aiAnalyzed && s.overallScore > 0)
      .map(s => s.overallScore);

    return {
      total: submissions.length,
      analyzed,
      avgScore: scores.length > 0 ? (scores.reduce((a, b) => a + b) / scores.length).toFixed(1) : 0,
      topScore: scores.length > 0 ? Math.max(...scores).toFixed(1) : 0,
    };
  }, [submissions]);

  // Get score badge color
  const getScoreBadgeColor = (score) => {
    if (score > 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // Get emotion badge color
  const getEmotionBadgeColor = (emotion) => {
    const colors = {
      happy: 'bg-yellow-100 text-yellow-800',
      sad: 'bg-blue-100 text-blue-800',
      angry: 'bg-red-100 text-red-800',
      fear: 'bg-purple-100 text-purple-800',
      surprise: 'bg-pink-100 text-pink-800',
      disgust: 'bg-orange-100 text-orange-800',
      neutral: 'bg-gray-100 text-gray-800',
    };
    return colors[emotion] || colors.neutral;
  };

  // Emotion colors for emotion bars
  const emotionColors = {
    happy: '#FFD700',
    sad: '#4682B4',
    angry: '#DC143C',
    fear: '#9370DB',
    surprise: '#FF6347',
    disgust: '#8B4513',
    neutral: '#808080'
  };

  // Emotion icons
  const emotionIcons = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fear: '😨',
    surprise: '😲',
    disgust: '🤢',
    neutral: '😐'
  };

  // Compact Emotion Indicator Component
  const CompactEmotionIndicator = ({ emotionScores, detectedEmotion }) => {
    if (!emotionScores) return null;

    // Get top 3 emotions
    const topEmotions = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400 font-medium">AI Emotion Analysis</span>
        </div>
        <div className="space-y-1.5">
          {topEmotions.map(([emotion, score]) => (
            <div key={emotion} className="flex items-center gap-2 group">
              <span className="text-lg transition-transform group-hover:scale-125">{emotionIcons[emotion]}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs capitalize text-slate-300 font-medium">{emotion}</span>
                  <span className="text-xs text-slate-400 font-bold">{(score * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300 group-hover:brightness-110"
                    style={{ 
                      width: `${score * 100}%`,
                      backgroundColor: emotionColors[emotion]
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Casting Submissions</h1>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              Back
            </Button>
          </div>
          {castingData?.data && (
            <p className="text-slate-400 text-lg">
              {castingData.data.roleTitle} • {castingData.data.location}
            </p>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-400">{stats.total}</div>
              <p className="text-slate-400 text-sm mt-1">Total Submissions</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-400">{stats.analyzed}</div>
              <p className="text-slate-400 text-sm mt-1">AI Analyzed</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-400">{stats.avgScore}</div>
              <p className="text-slate-400 text-sm mt-1">Average Score</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-400">{stats.topScore}</div>
              <p className="text-slate-400 text-sm mt-1">Top Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-2 block">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="overallScore">Highest Score First</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-2 block">Minimum Score</label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filterScore}
              onChange={(e) => setFilterScore(parseInt(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="text-xs text-slate-400 mt-1">{filterScore}+</div>
          </div>
        </div>

        {/* Empty State */}
        {submissions.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400 text-lg">No submissions matching your filters</p>
            </CardContent>
          </Card>
        )}

        {/* Submissions List */}
        <div className="space-y-4">
          {submissions.map((submission, idx) => (
            <Card 
              key={submission._id} 
              className="bg-slate-800 border-slate-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => setExpandedSubmission(expandedSubmission === submission._id ? null : submission._id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  {/* Left Section - Actor Info and Photo */}
                  <div className="flex-shrink-0">
                    {submission.actor?.profilePicture ? (
                      <img 
                        src={submission.actor.profilePicture} 
                        alt={submission.actor.name}
                        className="w-24 h-24 rounded-lg object-cover border-2 border-slate-600 group-hover:border-blue-500 transition"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-slate-700 flex items-center justify-center border-2 border-slate-600 group-hover:border-blue-500 transition">
                        <span className="text-3xl">{emotionIcons.neutral}</span>
                      </div>
                    )}
                  </div>

                  {/* Middle Section - Actor Details and AI Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-xl text-white group-hover:text-blue-400 transition">{submission.actor?.name || 'Unknown'}</h3>
                        <p className="text-sm text-slate-400">{submission.actor?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {idx < 3 && (
                          <Award className="w-5 h-5 text-yellow-400 animate-pulse" />
                        )}
                        {submission.status && (
                          <Badge className={`whitespace-nowrap ${
                            submission.status === 'Accepted' ? 'bg-green-600 text-white' : 
                            submission.status === 'Rejected' ? 'bg-red-600 text-white' : 
                            'bg-yellow-600 text-white'
                          }`}>
                            {submission.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* AI Analysis Summary (Always Visible) */}
                    {submission.aiAnalyzed ? (
                      <div className="mt-4 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg border-2 border-blue-500/30 p-4 space-y-3">
                        {/* Emotion Comparison */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-xs text-slate-400 mb-1 font-medium">Expected</div>
                              <div className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg">
                                <span className="text-2xl">{emotionIcons[submission.requiredEmotion]}</span>
                                <span className="text-sm font-semibold text-white capitalize">{submission.requiredEmotion}</span>
                              </div>
                            </div>
                            <div className="text-blue-400 text-xl">→</div>
                            <div className="text-center">
                              <div className="text-xs text-slate-400 mb-1 font-medium">Detected</div>
                              <div className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg">
                                <span className="text-2xl">{emotionIcons[submission.detectedEmotion]}</span>
                                <span className="text-sm font-semibold text-white capitalize">{submission.detectedEmotion}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Scores Row */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-700/80 rounded-lg p-3 text-center">
                            <div className={`text-2xl font-bold ${getScoreBadgeColor(submission.overallScore).split(' ')[1]}`}>
                              {submission.overallScore.toFixed(1)}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Overall Score</div>
                          </div>
                          <div className="bg-slate-700/80 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-blue-400">
                              {submission.emotionMatchScore}%
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Match</div>
                          </div>
                          <div className="bg-slate-700/80 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-purple-400">
                              {(submission.confidence * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Confidence</div>
                          </div>
                        </div>

                        {/* Feedback Preview (Collapsed State) */}
                        {submission.feedback && expandedSubmission !== submission._id && (
                          <div className="bg-slate-700/50 rounded-lg p-3 border-l-4 border-blue-500">
                            <div className="flex items-start gap-2">
                              <Brain className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-slate-400 font-semibold mb-1">AI Feedback</p>
                                <p className="text-sm text-slate-300" style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>{submission.feedback}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stats Badge */}
                        {submission.framesAnalyzed && (
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Sparkles className="w-3 h-3" />
                            <span>Analyzed {submission.framesAnalyzed} frames</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600 p-6 text-center">
                        <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-400 rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-slate-400 font-medium">AI Analysis in Progress...</p>
                        <p className="text-xs text-slate-500 mt-1">Analyzing video for emotion detection</p>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Expand Control */}
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {/* Chevron */}
                    <div className="flex flex-col items-center">
                      <ChevronDown 
                        className={`w-8 h-8 text-slate-400 transition-transform duration-300 group-hover:text-blue-400 ${
                          expandedSubmission === submission._id ? 'rotate-180' : ''
                        }`}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {expandedSubmission === submission._id ? 'Less' : 'More'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedSubmission === submission._id && (
                  <div className="mt-6 pt-6 border-t border-slate-700 space-y-6 transition-all duration-300">
                    {/* Applicant Details */}
                    {submission.actor && (
                      <div className="bg-slate-800 rounded-xl p-4 space-y-4">
                        <h4 className="text-sm font-bold text-slate-200">Applicant Details</h4>
                        <div className="flex gap-4">
                          {submission.actor.profileImage && (
                            <img 
                              src={submission.actor.profileImage} 
                              alt={submission.actor.name}
                              className="w-20 h-20 rounded-lg object-cover border-2 border-slate-700"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-xs text-slate-500">Name</p>
                              <p className="text-sm text-white font-medium">{submission.actor.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Email</p>
                              <p className="text-sm text-slate-300">{submission.actor.email}</p>
                            </div>
                            {submission.gender && (
                              <div>
                                <p className="text-xs text-slate-500">Gender</p>
                                <p className="text-sm text-slate-300 capitalize">{submission.gender}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Physical Details */}
                        {(submission.age || submission.height || submission.weight) && (
                          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
                            {submission.age && (
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Age</p>
                                <p className="text-sm text-slate-300">{submission.age}</p>
                              </div>
                            )}
                            {submission.height && (
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Height</p>
                                <p className="text-sm text-slate-300">{submission.height}</p>
                              </div>
                            )}
                            {submission.weight && (
                              <div className="text-center">
                                <p className="text-xs text-slate-500">Weight</p>
                                <p className="text-sm text-slate-300">{submission.weight}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Skills */}
                        {submission.skills && submission.skills.length > 0 && (
                          <div className="pt-3 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {submission.skills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-md border border-blue-700/50">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Portfolio and ID Proof */}
                    <div className="grid grid-cols-2 gap-3">
                      {submission.portfolioUrl && (
                        <a
                          href={submission.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition text-sm text-slate-300 hover:text-white"
                        >
                          <Award className="w-4 h-4" />
                          View Portfolio
                        </a>
                      )}
                      {submission.idProofUrl && (
                        <a
                          href={submission.idProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition text-sm text-slate-300 hover:text-white"
                        >
                          <AlertCircle className="w-4 h-4" />
                          View ID Proof
                        </a>
                      )}
                    </div>

                    {/* Full AI Analysis Display */}
                    {submission.aiAnalyzed ? (
                      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-1">
                        <div className="bg-slate-900 rounded-lg p-4">
                          <EmotionAnalysisDisplay submission={submission} darkTheme={true} />
                        </div>
                      </div>
                    ) : (
                      <Alert className="bg-slate-700 border-slate-600">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Analysis Pending</AlertTitle>
                        <AlertDescription>
                          AI analysis is in progress. Please refresh to see results.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Video Preview */}
                    {submission.videoUrl && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-slate-400 font-medium">Audition Video</span>
                        </div>
                        <video
                          src={submission.videoUrl}
                          controls
                          className="w-full rounded-lg bg-black max-h-96 border-2 border-slate-700 hover:border-blue-500 transition"
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {/* Accept/Reject Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdatingStatusId(submission._id);
                            updateStatusMutation.mutate({
                              submissionId: submission._id,
                              status: 'Accepted'
                            });
                          }}
                          disabled={updatingStatusId === submission._id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-75"
                        >
                          {updatingStatusId === submission._id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdatingStatusId(submission._id);
                            updateStatusMutation.mutate({
                              submissionId: submission._id,
                              status: 'Rejected'
                            });
                          }}
                          disabled={updatingStatusId === submission._id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-75"
                        >
                          {updatingStatusId === submission._id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Re-analyze and Portfolio Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReanalyzingId(submission._id);
                            reanalyzeMutation.mutate(submission._id);
                          }}
                          disabled={reanalyzingId === submission._id}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {reanalyzingId === submission._id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Re-analyzing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Re-analyze Emotion
                            </>
                          )}
                        </Button>

                        {/* View Full Portfolio Button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/actor/${submission.actor?._id}`);
                          }}
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          View Full Portfolio
                        </Button>
                      </div>
                    </div>

                    {/* Submission Date */}
                    <p className="text-xs text-slate-500 text-center mt-4">
                      Submitted: {new Date(submission.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;
