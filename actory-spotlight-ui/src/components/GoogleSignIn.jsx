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
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ;

  useEffect(() => {
    if (!clientId) {
      // eslint-disable-next-line no-console
      console.warn('VITE_GOOGLE_CLIENT_ID is not set');
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
        // Redirect based on role like email/password flow
        if (data.user.role === 'Admin') navigate('/dashboard/admin');
        else if (data.user.role === 'Actor') navigate('/dashboard/actor');
        else if (data.user.role === 'Producer') navigate('/dashboard/producer');
        else navigate('/');
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

  return (
    React.createElement('div', { className: "w-full flex justify-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}}
      , React.createElement('div', { ref: btnRef, __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}} )
    )
  );
}
