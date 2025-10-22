import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Submissions() {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [castingTitle, setCastingTitle] = useState('');
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [portfolioSrc, setPortfolioSrc] = useState('');

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
      , React.createElement('section', { className: "container py-8 max-w-4xl"  , __self: this, __source: {fileName: '', lineNumber: 0}}
        , React.createElement(Card, {__self: this, __source: {fileName: '', lineNumber: 0}}
          , React.createElement(CardHeader, {__self: this, __source: {fileName: '', lineNumber: 0}}
            , React.createElement(CardTitle, { className: "font-display" , __self: this, __source: {fileName: '', lineNumber: 0}}, `Submissions for ${castingTitle}`)
          )
          , React.createElement(CardContent, {__self: this, __source: {fileName: '', lineNumber: 0}}
            , loading ? (
              React.createElement('p', { className: "text-center text-sm" , __self: this, __source: {fileName: '', lineNumber: 0}}, 'Loading submissions...')
            ) : submissions.length ? (
              React.createElement('div', { className: "space-y-3" , __self: this, __source: {fileName: '', lineNumber: 0}}
                , submissions.map((s) => (
                  React.createElement('div', { key: s._id, className: "p-3 rounded-md border flex items-center justify-between gap-3"  , __self: this, __source: {fileName: '', lineNumber: 0}}
                    , React.createElement('div', {__self: this, __source: {fileName: '', lineNumber: 0}}
                      , React.createElement('p', { className: "font-medium" , __self: this, __source: {fileName: '', lineNumber: 0}}, s.actor?.name || 'Unknown actor')
                      , React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: '', lineNumber: 0}}, s.actor?.email)
                      , React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: '', lineNumber: 0}}, `Title: ${s.title}`)
                      , React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: '', lineNumber: 0}}, `Height: ${s.height} cm • Weight: ${s.weight} kg • Age: ${s.age} • Skintone: ${s.skintone}`)
                      , React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: '', lineNumber: 0}}, `Submitted: ${new Date(s.createdAt).toLocaleString()}`)
                      , s.portfolioUrl ? React.createElement('a', { href: s.portfolioUrl, target: "_blank", rel: "noreferrer", className: "text-xs underline mt-1 inline-block" , __self: this, __source: {fileName: '', lineNumber: 0}}, 'View Portfolio (PDF)') : null
                      , React.createElement('div', { className: "mt-1" , __self: this, __source: {fileName: '', lineNumber: 0}}
                        , React.createElement('span', { className: `inline-block px-2 py-0.5 rounded text-xs ${s.status === 'Accepted' ? 'bg-green-600/20 text-green-500' : s.status === 'Rejected' ? 'bg-red-600/20 text-red-500' : 'bg-yellow-600/20 text-yellow-500'}` , __self: this, __source: {fileName: '', lineNumber: 0}}, s.status || 'Pending')
                      )
                    )
                    , React.createElement('div', { className: "flex items-center gap-2" , __self: this, __source: {fileName: '', lineNumber: 0}}
                      , React.createElement('a', { href: s.videoUrl, target: "_blank", rel: "noreferrer" , __self: this, __source: {fileName: '', lineNumber: 0}}
                        , React.createElement(Button, { size: "sm", variant: "outline" , __self: this, __source: {fileName: '', lineNumber: 0}}, 'View Video')
                      )
                      , React.createElement(Button, { size: "sm", variant: "outline", onClick: () => handleViewPortfolio(s.portfolioUrl, s._id), disabled: !s.portfolioUrl , __self: this, __source: {fileName: '', lineNumber: 0}}, 'View Portfolio')
                      , React.createElement(Button, { size: "sm", variant: "secondary", disabled: updatingId === s._id, onClick: () => updateSubmissionStatus(s._id, 'Accepted') , __self: this, __source: {fileName: '', lineNumber: 0}}, updatingId === s._id ? 'Updating...' : 'Accept')
                      , React.createElement(Button, { size: "sm", variant: "ghost", disabled: updatingId === s._id, onClick: () => updateSubmissionStatus(s._id, 'Rejected') , __self: this, __source: {fileName: '', lineNumber: 0}}, 'Reject')
                    )
                  )
                )))
              ) : (
                React.createElement('p', { className: "text-center text-sm text-muted-foreground" , __self: this, __source: {fileName: '', lineNumber: 0}}, 'No submissions yet.')
              )
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


