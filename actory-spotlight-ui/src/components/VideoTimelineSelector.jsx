import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Scissors } from 'lucide-react';

const DEFAULT_MAX_DURATION = 240;

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function extractThumbnails(file, duration, count = 12) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.src = url;
  video.muted = true;
  video.crossOrigin = 'anonymous';

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const w = 96;
  const h = 56;
  canvas.width = w;
  canvas.height = h;

  const points = Array.from({ length: count }, (_, i) => {
    if (count === 1) return 0;
    return (duration * i) / (count - 1);
  });

  const thumbs = [];
  for (const t of points) {
    await new Promise((resolve) => {
      const onSeeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          thumbs.push(canvas.toDataURL('image/jpeg', 0.65));
        }
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = Math.max(0, Math.min(t, duration));
    });
  }

  URL.revokeObjectURL(url);
  return thumbs;
}

export default function VideoTimelineSelector({ file, maxDuration = DEFAULT_MAX_DURATION, onSelectionChange }) {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const dragStateRef = useRef({ mode: null, pointerId: null, startX: 0, initialStart: 0, initialEnd: 0 });
  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [thumbs, setThumbs] = useState([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const selectedDuration = useMemo(() => Math.max(0, endSec - startSec), [endSec, startSec]);
  const exceedsLimit = duration > maxDuration;

  useEffect(() => {
    if (!file) {
      setDuration(0);
      setStartSec(0);
      setEndSec(0);
      setThumbs([]);
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;

    const onLoaded = async () => {
      const d = Math.floor(video.duration || 0);
      const initialEnd = Math.min(d, maxDuration);
      setDuration(d);
      setStartSec(0);
      setEndSec(initialEnd);

      setLoadingThumbs(true);
      try {
        const frames = await extractThumbnails(file, d, 12);
        setThumbs(frames);
      } catch {
        setThumbs([]);
      } finally {
        setLoadingThumbs(false);
      }

      onSelectionChange?.({
        totalDuration: d,
        startTime: 0,
        endTime: initialEnd,
        selectedDuration: initialEnd,
        exceedsLimit: d > maxDuration,
      });
    };

    video.onloadedmetadata = onLoaded;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, maxDuration, onSelectionChange]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!duration) return;
    onSelectionChange?.({
      totalDuration: duration,
      startTime: startSec,
      endTime: endSec,
      selectedDuration,
      exceedsLimit,
    });
  }, [duration, endSec, exceedsLimit, onSelectionChange, selectedDuration, startSec]);

  const scrubTo = (sec) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = sec;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

  const secondsPerPixel = () => {
    const width = timelineRef.current?.clientWidth || 1;
    return duration > 0 ? duration / width : 1;
  };

  const toPercent = (sec) => (duration ? (sec / duration) * 100 : 0);

  const applyStart = (nextStart, fixedEnd) => {
    const safeEnd = clamp(fixedEnd, 1, duration);
    const constrainedStart = clamp(nextStart, 0, safeEnd - 1);
    const maxWindowStart = Math.max(0, safeEnd - maxDuration);
    const finalStart = Math.max(constrainedStart, maxWindowStart);
    setStartSec(finalStart);
    setEndSec(safeEnd);
    scrubTo(finalStart);
  };

  const applyEnd = (fixedStart, nextEnd) => {
    const safeStart = clamp(fixedStart, 0, Math.max(0, duration - 1));
    const constrainedEnd = clamp(nextEnd, safeStart + 1, duration);
    const maxWindowEnd = Math.min(duration, safeStart + maxDuration);
    const finalEnd = Math.min(constrainedEnd, maxWindowEnd);
    setStartSec(safeStart);
    setEndSec(finalEnd);
  };

  const applyMoveWindow = (nextStart, windowSize) => {
    const clampedWindow = clamp(windowSize, 1, Math.min(maxDuration, duration || 1));
    const maxStart = Math.max(0, duration - clampedWindow);
    const finalStart = clamp(nextStart, 0, maxStart);
    const finalEnd = finalStart + clampedWindow;
    setStartSec(finalStart);
    setEndSec(finalEnd);
    scrubTo(finalStart);
  };

  const onPointerDownHandle = (mode, event) => {
    if (!duration || !timelineRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      initialStart: startSec,
      initialEnd: endSec,
    };

    timelineRef.current.setPointerCapture(event.pointerId);
  };

  const onPointerDownSelection = (event) => {
    if (!duration || !timelineRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current = {
      mode: 'move',
      pointerId: event.pointerId,
      startX: event.clientX,
      initialStart: startSec,
      initialEnd: endSec,
    };

    timelineRef.current.setPointerCapture(event.pointerId);
  };

  const onPointerMoveTimeline = (event) => {
    const drag = dragStateRef.current;
    if (!drag.mode || drag.pointerId !== event.pointerId || !duration) return;

    const deltaPx = event.clientX - drag.startX;
    const deltaSec = deltaPx * secondsPerPixel();

    if (drag.mode === 'start') {
      applyStart(drag.initialStart + deltaSec, drag.initialEnd);
      return;
    }

    if (drag.mode === 'end') {
      applyEnd(drag.initialStart, drag.initialEnd + deltaSec);
      return;
    }

    if (drag.mode === 'move') {
      const windowSize = drag.initialEnd - drag.initialStart;
      applyMoveWindow(drag.initialStart + deltaSec, windowSize);
    }
  };

  const onPointerUpTimeline = (event) => {
    const drag = dragStateRef.current;
    if (!timelineRef.current || drag.pointerId !== event.pointerId) return;

    try {
      timelineRef.current.releasePointerCapture(event.pointerId);
    } catch {
      // no-op
    }

    dragStateRef.current = { mode: null, pointerId: null, startX: 0, initialStart: 0, initialEnd: 0 };
  };

  const leftPercent = toPercent(startSec);
  const widthPercent = toPercent(endSec - startSec);

  return (
    <div className="space-y-3 rounded-lg border p-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Scissors className="h-4 w-4" />
          Select The Exact Segment To Submit
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          Max {formatTime(maxDuration)}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        Full video: {formatTime(duration)} | Selected: {formatTime(selectedDuration)}
      </div>

      {exceedsLimit && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          Video is longer than 4 minutes. Move the timeline handles to pick any part up to 4 minutes.
        </div>
      )}

      <video ref={videoRef} src={previewUrl || undefined} controls className="w-full rounded-md border max-h-64 bg-black" />

      <div
        ref={timelineRef}
        className="relative rounded-md border overflow-hidden bg-muted/20 select-none touch-none"
        onPointerMove={onPointerMoveTimeline}
        onPointerUp={onPointerUpTimeline}
        onPointerCancel={onPointerUpTimeline}
      >
        <div className="flex h-14">
          {loadingThumbs && <div className="w-full text-xs text-muted-foreground flex items-center justify-center">Generating preview strip...</div>}
          {!loadingThumbs && thumbs.length > 0 && thumbs.map((img, idx) => (
            <img
              key={`${idx}-${img.slice(0, 24)}`}
              src={img}
              alt={`frame-${idx}`}
              className="h-14 w-full object-cover"
            />
          ))}
        </div>

        <div
          className="absolute top-0 bottom-0 border-2 border-white rounded-sm shadow-[0_0_0_1000px_rgba(0,0,0,0.45)] cursor-grab active:cursor-grabbing"
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
          onPointerDown={onPointerDownSelection}
        >
          <button
            type="button"
            aria-label="Trim start handle"
            className="absolute -left-2 top-1/2 -translate-y-1/2 h-8 w-4 rounded-full border-2 border-white bg-black/80 cursor-ew-resize"
            onPointerDown={(e) => onPointerDownHandle('start', e)}
          />
          <button
            type="button"
            aria-label="Trim end handle"
            className="absolute -right-2 top-1/2 -translate-y-1/2 h-8 w-4 rounded-full border-2 border-white bg-black/80 cursor-ew-resize"
            onPointerDown={(e) => onPointerDownHandle('end', e)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md border p-2">Start: {formatTime(startSec)}</div>
        <div className="rounded-md border p-2">End: {formatTime(endSec)}</div>
        <div className="rounded-md border p-2">Length: {formatTime(selectedDuration)}</div>
      </div>
    </div>
  );
}
