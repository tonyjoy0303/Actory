/**
 * Recruiter Submissions Dashboard with AI Emotion Analysis
 * 
 * Displays audition submissions with emotion analysis results,
 * charts, and sorting capabilities.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  MoodBad,
  SentimentVerySatisfied,
  SentimentSatisfied,
  SentimentDissatisfied
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SubmissionsDashboard = ({ castingId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [casting, setCasting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('emotionMatchScore');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchSubmissions();
  }, [castingId, sortBy, sortOrder]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/castings/${castingId}/submissions`,
        {
          params: { sortBy, order: sortOrder }
        }
      );
      
      setSubmissions(response.data.submissions);
      setCasting(response.data.casting);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: '#4caf50',
      sad: '#2196f3',
      angry: '#f44336',
      fear: '#9c27b0',
      surprise: '#ff9800',
      disgust: '#795548',
      neutral: '#9e9e9e'
    };
    return colors[emotion] || '#9e9e9e';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <SentimentVerySatisfied />;
    if (score >= 60) return <SentimentSatisfied />;
    if (score >= 40) return <SentimentDissatisfied />;
    return <MoodBad />;
  };

  const formatEmotionScores = (emotionScores) => {
    return Object.entries(emotionScores).map(([emotion, score]) => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      score: (score * 100).toFixed(1)
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Submissions for: {casting?.title}
      </Typography>
      
      {/* Sort Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="emotionMatchScore">Emotion Match Score</MenuItem>
                <MenuItem value="submittedAt">Submission Date</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Alert severity="info">No submissions yet for this casting.</Alert>
      ) : (
        <Grid container spacing={3}>
          {submissions.map((submission) => (
            <Grid item xs={12} key={submission.id}>
              <Card>
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Actor Info */}
                    <Grid item xs={12} md={3}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          src={submission.actor.profilePicture}
                          alt={submission.actor.name}
                          sx={{ width: 60, height: 60 }}
                        />
                        <Box>
                          <Typography variant="h6">
                            {submission.actor.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {submission.actor.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Video Player */}
                    <Grid item xs={12} md={3}>
                      <video
                        src={submission.videoURL}
                        controls
                        style={{ width: '100%', maxHeight: '200px', borderRadius: '8px' }}
                      />
                    </Grid>

                    {/* Emotion Analysis */}
                    <Grid item xs={12} md={6}>
                      {submission.aiAnalyzed ? (
                        <>
                          {/* Match Score */}
                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                            {getScoreIcon(submission.emotionMatchScore)}
                            <Box flex={1}>
                              <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="body2">
                                  Emotion Match Score
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {submission.emotionMatchScore}/100
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={submission.emotionMatchScore}
                                color={getScoreColor(submission.emotionMatchScore)}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                            </Box>
                          </Box>

                          {/* Required vs Detected */}
                          <Box display="flex" gap={2} mb={2}>
                            <Chip
                              label={`Required: ${submission.requiredEmotion}`}
                              size="small"
                              sx={{
                                bgcolor: getEmotionColor(submission.requiredEmotion),
                                color: 'white'
                              }}
                            />
                            <Chip
                              label={`Detected: ${submission.detectedEmotion}`}
                              size="small"
                              sx={{
                                bgcolor: getEmotionColor(submission.detectedEmotion),
                                color: 'white'
                              }}
                            />
                          </Box>

                          {/* Feedback */}
                          <Alert severity={getScoreColor(submission.emotionMatchScore)} sx={{ mb: 2 }}>
                            {submission.feedback}
                          </Alert>

                          {/* Emotion Distribution Chart */}
                          {submission.emotionScores && (
                            <Box>
                              <Typography variant="body2" gutterBottom>
                                Emotion Distribution ({submission.framesAnalyzed} frames analyzed)
                              </Typography>
                              <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={formatEmotionScores(submission.emotionScores)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="emotion" tick={{ fontSize: 10 }} />
                                  <YAxis tick={{ fontSize: 10 }} />
                                  <Tooltip />
                                  <Bar dataKey="score" fill="#8884d8" />
                                </BarChart>
                              </ResponsiveContainer>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Box display="flex" alignItems="center" gap={2}>
                          {submission.aiAnalysisError ? (
                            <Alert severity="error" sx={{ width: '100%' }}>
                              Analysis failed: {submission.aiAnalysisError}
                            </Alert>
                          ) : (
                            <>
                              <CircularProgress size={24} />
                              <Typography variant="body2">
                                AI analysis in progress...
                              </Typography>
                            </>
                          )}
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SubmissionsDashboard;
