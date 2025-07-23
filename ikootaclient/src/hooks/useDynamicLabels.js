// ikootaclient/src/hooks/useDynamicLabels.js
// Hook to fetch dynamic question labels for the survey form

import { useState, useEffect } from 'react';
import api from '../components/service/api';

// Default labels - fallback if API fails
const DEFAULT_LABELS = {
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  nationality: 'Nationality',
  currentLocation: 'Current Location',
  phoneNumber: 'Phone Number',
  highestEducation: 'Highest Level of Education',
  fieldOfStudy: 'Field of Study',
  currentInstitution: 'Current/Most Recent Institution',
  graduationYear: 'Graduation Year',
  currentOccupation: 'Current Occupation',
  workExperience: 'Years of Work Experience',
  professionalSkills: 'Professional Skills',
  careerGoals: 'Career Goals',
  howDidYouHear: 'How did you hear about Ikoota?',
  reasonForJoining: 'Why do you want to join Ikoota?',
  expectedContributions: 'How do you plan to contribute to the community?',
  educationalGoals: 'What are your educational goals?',
  previousMemberships: 'Previous Memberships',
  specialSkills: 'Special Skills',
  languagesSpoken: 'Languages Spoken',
  availabilityForEvents: 'Availability for Events',
  agreeToTerms: 'I agree to the Terms and Conditions',
  agreeToCodeOfConduct: 'I agree to follow the Community Code of Conduct',
  agreeToDataProcessing: 'I consent to processing of my personal data'
};

export const useDynamicLabels = () => {
  const [labels, setLabels] = useState(DEFAULT_LABELS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        console.log('🔍 Fetching dynamic question labels...');
        const response = await api.get('/survey/question-labels');
        
        let fetchedLabels;
        if (response.data?.success && response.data?.data) {
          fetchedLabels = response.data.data;
        } else if (typeof response.data === 'object') {
          fetchedLabels = response.data;
        } else {
          throw new Error('Invalid response format');
        }
        
        // Merge with defaults to ensure all fields have labels
        const mergedLabels = { ...DEFAULT_LABELS, ...fetchedLabels };
        setLabels(mergedLabels);
        console.log('✅ Dynamic labels loaded successfully');
        
      } catch (err) {
        console.warn('⚠️ Failed to fetch dynamic labels, using defaults:', err.message);
        setError(err.message);
        // Keep using default labels
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, []);

  return { labels, loading, error };
};