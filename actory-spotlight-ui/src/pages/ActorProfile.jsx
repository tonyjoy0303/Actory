import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import API from "@/lib/api";
import { Star, Upload as UploadIcon, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import VideoList from "@/components/profile/VideoList";

export default function ActorProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState([]);
  
  // Cropper state
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [minZoom, setMinZoom] = useState(1);
  const cropContainerRef = useRef(null);

  // Compute backend origin (without /api/v1) to serve static uploads
  const API_ORIGIN = API.defaults.baseURL.replace(/\/api\/v1$/, "");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/auth/me');
        setUser(data.user);
        setName(data.user?.name || "");
      } catch (err) {
        const status = _optionalChain([err, 'access', _2 => _2.response, 'optionalAccess', _3 => _3.status]);
        const message = _optionalChain([err, 'access', _4 => _4.response, 'optionalAccess', _5 => _5.data, 'optionalAccess', _6 => _6.message]) || 'Failed to load profile.';
        setError(message);
        if (status === 401) {
          // Not authenticated; redirect to login
          navigate('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [navigate]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data } = await API.get('/videos/mine');
        setVideos(data.data || []);
      } catch (error) {
        console.error('Error fetching videos:', error);
        toast.error('Failed to load videos');
      }
    };

    if (user?._id) {
      fetchVideos();
    }
  }, [user?._id]); 

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsCropOpen(true);
      // reset crop/zoom for new image
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setMinZoom(1);
    }
  };

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  async function createImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (err) => reject(err));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  }

  async function getCroppedBlob(imageSrc, crop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.92);
    });
  }

  const handleConfirmCrop = async () => {
    if (!previewUrl || !croppedAreaPixels) return;
    try {
      setUploading(true);
      const blob = await getCroppedBlob(previewUrl, croppedAreaPixels);
      const form = new FormData();
      const fileName = photoFile?.name || 'avatar.jpg';
      form.append('photo', new File([blob], fileName, { type: 'image/jpeg' }));
      const { data } = await API.put('/auth/me/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(data.user);
      const stored = localStorage.getItem('user');
      const merged = stored ? { ...JSON.parse(stored), photo: data.user.photo } : data.user;
      localStorage.setItem('user', JSON.stringify(merged));
      window.dispatchEvent(new Event('authChange'));
      toast.success('Profile photo updated');
      setIsCropOpen(false);
      setPhotoFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err) {
      const msg = _optionalChain([err, 'access', _ => _.response, 'optionalAccess', _2 => _2.data, 'optionalAccess', _3 => _3.message]) || 'Failed to upload photo';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseCrop = () => {
    setIsCropOpen(false);
    setUploading(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleMediaLoaded = ({ naturalWidth, naturalHeight }) => {
    if (!cropContainerRef.current) return;
    const { offsetWidth: cw, offsetHeight: ch } = cropContainerRef.current;
    const computedMin = Math.max(cw / naturalWidth, ch / naturalHeight);
    setMinZoom(computedMin);
    setZoom((z) => Math.max(z, computedMin));
  };

  const handleVideoDeleted = (deletedVideoId) => {
    setVideos(prevVideos => prevVideos.filter(video => video._id !== deletedVideoId));
  };

  const handleVideoPlay = (video) => {
    window.open(video.videoUrl, '_blank');
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Your Profile" , description: "View and manage your profile information."     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 51}} )
      , React.createElement('section', { className: "container py-8 grid gap-6 md:grid-cols-3"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 52}}
        , React.createElement('div', { className: "md:col-span-2 grid gap-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 53}}
          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 54}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 55}}
              , React.createElement('div', { className: "flex items-center justify-between gap-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 56}}
                , React.createElement('div', { className: "flex-1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 57}}
                  , loading ? React.createElement(Skeleton, { className: "h-7 w-40" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 58}} ) : (
                    editMode ? (
                      React.createElement(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "Your name", className: "max-w-sm", __self: this, __source: {fileName: _jsxFileName, lineNumber: 61}} )
                    ) : (
                      React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}}, _optionalChain([user, 'optionalAccess', _7 => _7.name]) || 'Profile')
                    )
                  )
                )
                , loading ? null : (
                  editMode ? (
                    React.createElement('div', { className: "flex items-center gap-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 68}}
                      , React.createElement(Button, { variant: "hero", className: "hover-scale", onClick: async () => {
                          try {
                            const trimmed = name.trim();
                            if (trimmed.length < 3) {
                              toast.error("Name must be at least 3 characters.");
                              return;
                            }
                            const { data } = await API.put('/auth/me', { name: trimmed });
                            setUser(data.user);
                            setName(data.user.name);
                            // sync localStorage for header/profile
                            const stored = localStorage.getItem('user');
                            const merged = stored ? { ...JSON.parse(stored), name: data.user.name } : data.user;
                            localStorage.setItem('user', JSON.stringify(merged));
                            window.dispatchEvent(new Event('authChange'));
                            setEditMode(false);
                            toast.success('Profile updated');
                          } catch (err) {
                            const msg = _optionalChain([err, 'access', _ => _.response, 'optionalAccess', _2 => _2.data, 'optionalAccess', _3 => _3.message]) || 'Failed to update profile';
                            toast.error(msg);
                          }
                        }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 70}}, "Save" )
                      , React.createElement(Button, { variant: "ghost", onClick: () => { setName(_optionalChain([user, 'optionalAccess', _4 => _4.name]) || ''); setEditMode(false); }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}, "Cancel" )
                    )
                  ) : (
                    React.createElement(Button, { variant: "brand-outline", className: "hover-scale", onClick: () => setEditMode(true), __self: this, __source: {fileName: _jsxFileName, lineNumber: 90}}, "Edit Profile" )
                  )
                )
              )
            )
            , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 60}}
              , loading ? (
                React.createElement('div', { className: "space-y-3", __self: this, __source: {fileName: _jsxFileName, lineNumber: 62}}
                  , React.createElement(Skeleton, { className: "h-4 w-72" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}} )
                  , React.createElement(Skeleton, { className: "h-4 w-56" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 64}} )
                  , React.createElement(Skeleton, { className: "h-4 w-40" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 65}} )
                )
              ) : error ? (
                React.createElement('p', { className: "text-sm text-red-500" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 68}}, error)
              ) : (
                React.createElement('div', { className: "space-y-4 text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 70}}
                  , React.createElement('div', { className: "flex items-center gap-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}
                    , React.createElement('div', { className: "w-24 h-24 rounded-full bg-muted overflow-hidden flex items-center justify-center" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 72}}
                      , _optionalChain([user, 'optionalAccess', _8 => _8.photo]) ? (
                        React.createElement('img', { src: `${API_ORIGIN}${_optionalChain([user, 'optionalAccess', _9 => _9.photo])}`, alt: "Profile", className: "w-full h-full object-cover" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 74}} )
                      ) : (
                        React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 76}}, "No photo")
                      )
                    )
                    , editMode && React.createElement('div', { className: "flex-1 flex items-center gap-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 78}}
                      , React.createElement(Input, { type: "file", accept: "image/*", onChange: handlePhotoChange, className: "max-w-xs" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 79}} )
                    )
                  )
                  , React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}, "Role:"), " " , _optionalChain([user, 'optionalAccess', _10 => _10.role]))
                  , React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 72}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 72}}, "Email:"), " " , _optionalChain([user, 'optionalAccess', _11 => _11.email]))
                  , _optionalChain([user, 'optionalAccess', _12 => _12.phone]) && (
                    React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 74}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 74}}, "Phone:"), " " , user.phone)
                  )
                  , _optionalChain([user, 'optionalAccess', _13 => _13.skills]) && (
                    React.createElement('div', { className: "mt-3 flex flex-wrap gap-2"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 77}}
                      , user.skills.map((s) => (
                        React.createElement('span', { key: s, className: "px-2 py-1 rounded-full bg-secondary text-xs"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 79}}, s)
                      ))
                    )
                  )
                  , _optionalChain([user, 'optionalAccess', _14 => _14.media]) && (
                    React.createElement('div', { className: "mt-6 grid grid-cols-2 md:grid-cols-3 gap-3"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 84}}
                      , user.media.map((m, i) => (
                        React.createElement('div', { key: i, className: "aspect-video rounded-md bg-muted"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}} )
                      ))
                    )
                  )
                )
              )
            )
          )

          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 95}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 96}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}}, "Videos")
            )
            , React.createElement(CardContent, { className: "grid grid-cols-2 gap-3"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 99}}
              , videos.length > 0 ? (
                React.createElement(VideoList, { videos: videos, isOwner: true, onVideoDeleted: handleVideoDeleted, onVideoPlay: handleVideoPlay, __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}} )
              ) : (
                React.createElement('p', { className: "text-sm text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}, "No videos uploaded yet")
              )
            )
          )
        )

        , React.createElement('div', { className: "grid gap-6" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 107}}
          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 108}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 109}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 110}}, "Ratings")
            )
            , React.createElement(CardContent, { className: "flex items-center gap-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 112}}
              , Array.from({ length: 5 }).map((_, i) => (
                React.createElement(Star, { key: i, className: "text-brand", fill: "currentColor", __self: this, __source: {fileName: _jsxFileName, lineNumber: 114}} )
              ))
            )
          )

          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 119}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 120}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 121}}, "Contact")
            )
            , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 123}}
              , React.createElement(Button, { variant: "hero", className: "w-full hover-scale" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 124}}, "Message Actor" )
            )
          )
        )
      )
      , React.createElement(Dialog, { open: isCropOpen, onOpenChange: (o) => !o && handleCloseCrop(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 200}}
        , React.createElement(DialogContent, { className: "sm:max-w-[480px]", __self: this, __source: {fileName: _jsxFileName, lineNumber: 201}}
          , React.createElement(DialogHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 202}}
            , React.createElement(DialogTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 203}}, "Adjust your photo")
          )
          , React.createElement('div', { className: "relative w-full aspect-square rounded-md bg-muted overflow-hidden", ref: cropContainerRef, __self: this, __source: {fileName: _jsxFileName, lineNumber: 205}}
            , previewUrl && React.createElement(Cropper, { image: previewUrl, crop: crop, zoom: zoom, minZoom: minZoom, aspect: 1, onCropChange: setCrop, onZoomChange: setZoom, onCropComplete: onCropComplete, onMediaLoaded: handleMediaLoaded, restrictPosition: true, cropShape: "round", showGrid: false , __self: this, __source: {fileName: _jsxFileName, lineNumber: 206}} )
          )
          , React.createElement('div', { className: "mt-4 space-y-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 210}}
            , React.createElement('label', { className: "text-xs text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 211}}, "Zoom")
            , React.createElement(Slider, { value: [zoom], min: minZoom, max: 3, step: 0.01, onValueChange: (v) => setZoom(v[0]), __self: this, __source: {fileName: _jsxFileName, lineNumber: 212}} )
          )
          , React.createElement(DialogFooter, { className: "mt-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 214}}
            , React.createElement(Button, { variant: "ghost", onClick: handleCloseCrop, disabled: uploading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 215}}, "Cancel" )
            , React.createElement(Button, { variant: "hero", className: "hover-scale", onClick: handleConfirmCrop, disabled: uploading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 216}}, uploading ? 'Saving…' : 'Save' )
          )
        )
      )
    )
  );
}
