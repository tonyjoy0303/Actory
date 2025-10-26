import React from 'react'
const _jsxFileName = "";import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/api';

// Minimal type for the global google object















export default function GoogleSignIn({
  text = 'continue_with',
  shape = 'rectangular',
  theme = 'outline',
  size = 'large',
  width,
  role,
}) {
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Debug logging
  console.log('Google Client ID:', clientId);
  console.log('All env vars:', import.meta.env);

  useEffect(() => {
    if (!clientId) {
      // eslint-disable-next-line no-console
      console.warn('VITE_GOOGLE_CLIENT_ID is not set. Please create a .env file with your Google OAuth Client ID.');
      return;
    }

    // If script is already present, don't add again
    if (window.google && window.google.accounts) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);

    return () => {
      // we don't remove the script to allow reuse across pages
    };
  }, [clientId]);

  useEffect(() => {
    if (!loaded || !clientId || !window.google || !btnRef.current) return;

    const handleCredential = async (response) => {
      try {
        const credential = response.credential ;
        const { data } = await API.post('/auth/google', { credential, role });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('authChange'));
        // Redirect after Google sign-in
        if (data.user.role === 'Admin') {
          navigate('/dashboard/admin');
        } else {
          const uid = String(data.user._id || data.user.id || '').trim();
          if (uid) navigate(`/profile/${uid}`);
          else navigate('/');
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Google sign-in failed', err);
      }
    };

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      ux_mode: 'popup',
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      theme,
      size,
      shape,
      text,
      width,
    });
  }, [loaded, clientId, navigate, text, shape, theme, size, width, role]);

  if (!clientId) {
    return (
      React.createElement('div', { className: "w-full flex justify-center p-4 border border-dashed border-gray-300 rounded-md" },
        React.createElement('p', { className: "text-sm text-gray-500 text-center" },
          "Google Sign-In is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file."
        )
      )
    );
  }

  return (
    React.createElement('div', { className: "w-full flex justify-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}}
      , React.createElement('div', { ref: btnRef, __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}} )
    )
  );
}
