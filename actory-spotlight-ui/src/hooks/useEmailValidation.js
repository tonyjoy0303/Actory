import { useState, useEffect } from 'react';
import API from '@/lib/api';

export function useEmailValidation(initialValue = '') {
  const [email, setEmail] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);

  // Gmail-only email format validation
  const validateEmailFormat = (email) => {
    const re = /^[^\s@]+@gmail\.com$/i;
    return re.test(email);
  };

  // Check if email exists in the database
  const checkEmailAvailability = async (email) => {
    if (!email || !validateEmailFormat(email)) {
      setIsValid(false);
      setError('Only Gmail addresses are allowed (e.g., yourname@gmail.com)');
      return;
    }

    setIsChecking(true);
    setError('');
    
    try {
      const response = await API.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      setIsAvailable(response.data.available);
      setIsValid(response.data.available);
      if (!response.data.available) {
        setError('This email is already registered');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setError('Error checking email availability');
      setIsValid(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Debounced email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email && validateEmailFormat(email)) {
        checkEmailAvailability(email);
      } else if (email) {
        setIsValid(false);
        setError('Only Gmail addresses are allowed (e.g., yourname@gmail.com)');
      } else {
        setIsValid(true);
        setError('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  return {
    email,
    setEmail,
    isValid,
    isChecking,
    error,
    isAvailable,
    reset: () => {
      setEmail('');
      setIsValid(true);
      setError('');
      setIsAvailable(null);
    }
  };
}

export default useEmailValidation;
