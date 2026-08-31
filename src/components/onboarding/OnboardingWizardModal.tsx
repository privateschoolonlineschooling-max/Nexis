import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Community, User } from '../../types/index';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Compass, 
  Users, 
  Heart, 
  Tag, 
  MapPin, 
  User as UserIcon, 
  Smile, 
  X, 
  Plus, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Search,
  BookOpen,
  Code,
  Palette,
  Briefcase,
  Gamepad2,
  Music,
  Video,
  Atom,
  Flame,
  Globe2,
  Layers,
  ShoppingBag,
  Cpu
} from 'lucide-react';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Preset avatars for instant 1-click selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria'
];

interface InterestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

const CURATED_INTERESTS: InterestCategory[] = [
  { id: 'Technology', name: 'Technology & AI', description: 'Web development, AI, software & tech news', icon: Code, gradient: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400' },
  { id: 'Education', name: 'Education & Learning', description: 'Online courses, tutoring, academic insights', icon: BookOpen, gradient: 'from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400' },
  { id: 'Design', name: 'Design & Creative Arts', description: 'UI/UX, digital illustration, 3D modeling', icon: Palette, gradient: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400' },
  { id: 'Business', name: 'Startups & Business', description: 'Entrepreneurship, growth, investing & SaaS', icon: Briefcase, gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400' },
  { id: 'Gaming', name: 'Gaming & Esports', description: 'Indie games, gameplay, streams & hardware', icon: Gamepad2, gradient: 'from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-400' },
  { id: 'Music', name: 'Music & Audio', description: 'Production, songwriting, instruments & playlists', icon: Music, gradient: 'from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400' },
  { id: 'Photography', name: 'Photography & Film', description: 'Visual storytelling, cinematography & gear', icon: Video, gradient: 'from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400' },
  { id: 'Science', name: 'Science & Innovation', description: 'Physics, space exploration, biotech & discoveries', icon: Atom, gradient: 'from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400' },
  { id: 'Fitness', name: 'Health & Fitness', description: 'Workouts, nutrition, mindfulness & wellness', icon: Flame, gradient: 'from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-400' },
  { id: 'Travel', name: 'Travel & Culture', description: 'Destinations, nomadic living, photography & food', icon: Globe2, gradient: 'from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-400' },
  { id: 'Marketplace', name: 'Creators & Commerce', description: 'Handcrafted goods, digital items & vintage', icon: ShoppingBag, gradient: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-600 dark:text-fuchsia-400' },
  { id: 'Hardware', name: 'Hardware & Gadgets', description: 'Custom rigs, electronics, smart home & devices', icon: Cpu, gradient: 'from-slate-500/20 to-zinc-500/20 text-slate-600 dark:text-slate-400' },
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, completeOnboarding, allUsers } = useAuth();
  const { showToast } = useNotifications();

  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [avatar, setAvatar] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterestInput, setCustomInterestInput] = useState<string>('');
  const [searchInterestFilter, setSearchInterestFilter] = useState<string>('');

  // Recommended items
  const [availableCommunities, setAvailableCommunities] = useState<Community[]>([]);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize values when currentUser changes or modal opens
  useEffect(() => {
    if (currentUser) {
      setAvatar(currentUser.avatar || '');
      setDisplayName(currentUser.displayName || currentUser.username || '');
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setSelectedInterests(currentUser.interests && currentUser.interests.length ? currentUser.interests : ['Technology', 'Education']);
    }
  }, [currentUser, isOpen]);

  // Fetch communities for Step 3
  useEffect(() => {
    if (isOpen) {
      setLoadingRecommendations(true);
      api.getCommunities()
        .then(res => {
          setAvailableCommunities(res.communities || []);
        })
        .catch(() => {})
        .finally(() => setLoadingRecommendations(false));
    }
  }, [isOpen]);

  // Trigger celebration confetti on step 4
  useEffect(() => {
    if (currentStep === 4) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }
  }, [currentStep]);

  if (!isOpen || !currentUser) return null;

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setAvatar(result);
        showToast('Profile photo updated', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle Interest
  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interestId));
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  // Add Custom Interest
  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterestInput.trim();
    if (!clean) return;
    if (selectedInterests.some(i => i.toLowerCase() === clean.toLowerCase())) {
      showToast('Interest already selected', 'info');
      setCustomInterestInput('');
      return;
    }
    setSelectedInterests([...selectedInterests, clean]);
    setCustomInterestInput('');
  };

  // Toggle Join Community in step 3
  const toggleJoinCommunity = async (commId: string) => {
    if (joinedCommunityIds.includes(commId)) {
      setJoinedCommunityIds(joinedCommunityIds.filter(id => id !== commId));
    } else {
      setJoinedCommunityIds([...joinedCommunityIds, commId]);
      try {
        await api.joinCommunity(commId);
      } catch (e) {
        // optimistically keep joined
      }
    }
  };

  // Toggle Follow User in step 3
  const toggleFollowUser = async (targetUserId: string) => {
    if (followedUserIds.includes(targetUserId)) {
      setFollowedUserIds(followedUserIds.filter(id => id !== targetUserId));
    } else {
      setFollowedUserIds([...followedUserIds, targetUserId]);
      try {
        await api.followUser(targetUserId);
      } catch (e) {
        // optimistically keep followed
      }
    }
  };

  // Join All Recommended Communities
  const handleJoinAllCommunities = async () => {
    const allIds = availableCommunities.slice(0, 4).map(c => c.id);
    setJoinedCommunityIds(allIds);
    for (const id of allIds) {
      api.joinCommunity(id).catch(() => {});
    }
    showToast('Joined all recommended communities!', 'success');
  };

  // Finish Onboarding
  const handleCompleteWizard = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        avatar: avatar || currentUser.avatar,
        displayName: displayName.trim() || currentUser.displayName,
        bio: bio.trim(),
        location: location.trim(),
        interests: selectedInterests.length > 0 ? selectedInterests : ['General Community']
      });

      // Join selected communities if not already joined
      for (const commId of joinedCommunityIds) {
        api.joinCommunity(commId).catch(() => {});
      }

      showToast('Welcome to the network! Your profile and feed are ready.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete setup', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter interests by search keyword
  const filteredInterests = CURATED_INTERESTS.filter(cat => 
    cat.name.toLowerCase().includes(searchInterestFilter.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchInterestFilter.toLowerCase())
  );

  // Recommended users to follow (excluding current user)
  const recommendedUsers = allUsers.filter(u => u.id !== currentUser.id && u.accountStatus !== 'banned').slice(0, 4);

  return (
    <div
      id="onboarding-wizard-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="onboarding-wizard-modal"
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Progress Bar & Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-neutral-800/80 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                  Welcome to Nexis
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                    Setup Wizard
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Step {currentStep} of 4: {
                    currentStep === 1 ? 'Profile & Photo' :
                    currentStep === 2 ? 'Select Passions & Interests' :
                    currentStep === 3 ? 'Recommended Connections' :
                    'Ready to Explore'
                  }
                </p>
              </div>
            </div>

            {/* Skip / Close option */}
            <button
              onClick={handleCompleteWizard}
              id="skip-onboarding-btn"
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              title="Skip setup and go directly to feed"
            >
              Skip Setup
            </button>
          </div>

          {/* Stepper Dots & Progress Line */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((stepNum) => {
              const isDone = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div key={stepNum} className="flex flex-col gap-1">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isDone 
                        ? 'bg-blue-600' 
                        : isCurrent 
                        ? 'bg-blue-500' 
                        : 'bg-gray-200 dark:bg-neutral-800'
                    }`}
                  />
                  <span className={`text-[10px] font-medium hidden sm:block ${
                    isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-neutral-500'
                  }`}>
                    {stepNum === 1 ? '1. Profile' : stepNum === 2 ? '2. Interests' : stepNum === 3 ? '3. Connect' : '4. Finish'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= STEP 1: Profile Photo & Details ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="text-center max-w-md mx-auto">
                <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100">
                  Let's personalize your appearance
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                  Upload an optional profile photo or pick an artistic preset avatar to introduce yourself to other members.
                </p>
              </div>

              {/* Avatar Upload / Preview Block */}
              <div className="flex flex-col items-center justify-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-200/80 dark:border-neutral-800">
                <div className="relative group">
                  <img
                    src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName || 'Nexis'}`}
                    alt="Profile Avatar Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-xl ring-2 ring-blue-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-xs cursor-pointer"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-semibold mt-1">Change</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(7)}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-200 text-xs font-medium rounded-xl transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Generate Style
                  </button>
                </div>

                {/* Preset Avatars Quick Selector */}
                <div className="w-full pt-3 border-t border-gray-200/60 dark:border-neutral-700/60">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-neutral-400 block mb-2 text-center">
                    Or choose a preset style:
                  </span>
                  <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                    {PRESET_AVATARS.map((presetUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(presetUrl)}
                        className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition transform hover:scale-105 shrink-0 ${
                          avatar === presetUrl 
                            ? 'border-blue-600 ring-2 ring-blue-500/40 scale-105' 
                            : 'border-transparent hover:border-gray-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        <img src={presetUrl} alt="preset" className="w-full h-full object-cover" />
                        {avatar === presetUrl && (
                          <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Name & Bio Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Smile className="w-3.5 h-3.5 text-blue-500" />
                      Short Bio (Optional)
                    </span>
                    <span className="text-[10px] text-gray-400">{bio.length}/160</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell members about yourself, your role, or what you're working on..."
                    rows={2}
                    maxLength={160}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 dark:text-neutral-100 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London, UK / San Francisco, CA / Remote"
                    maxLength={60}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: Select Interests ================= */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100">
                    What topics are you interested in?
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Pick at least 2 interests to personalize your feed, discover relevant groups, and find creators.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-full text-xs font-bold text-blue-700 dark:text-blue-300 shrink-0 self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{selectedInterests.length} Selected</span>
                </div>
              </div>

              {/* Search & Custom Tag Addition Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchInterestFilter}
                    onChange={(e) => setSearchInterestFilter(e.target.value)}
                    placeholder="Search interest categories..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {searchInterestFilter && (
                    <button
                      onClick={() => setSearchInterestFilter('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleAddCustomInterest} className="flex gap-1.5">
                  <input
                    type="text"
                    value={customInterestInput}
                    onChange={(e) => setCustomInterestInput(e.target.value)}
                    placeholder="Add custom topic..."
                    className="px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none w-36 sm:w-44"
                  />
                  <button
                    type="submit"
                    disabled={!customInterestInput.trim()}
                    className="px-3 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-blue-600 hover:text-white disabled:opacity-50 text-gray-700 dark:text-neutral-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-neutral-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </form>
              </div>

              {/* Active Selected Tags Pill Bar */}
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 self-center mr-1">
                    Your Selection:
                  </span>
                  {selectedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg shadow-xs"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="hover:text-red-500 p-0.5 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedInterests([])}
                    className="text-[11px] text-gray-400 hover:text-red-500 underline ml-auto self-center"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Interest Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {filteredInterests.map((cat) => {
                  const isSelected = selectedInterests.includes(cat.id);
                  const Icon = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleInterest(cat.id)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-gray-50/70 dark:bg-neutral-800/60 border-gray-200/80 dark:border-neutral-700/80 hover:bg-gray-100/80 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${cat.gradient}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-gray-900 dark:text-neutral-100 block truncate">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                            {cat.description}
                          </span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 3: Recommended Connections ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100">
                    Recommended for You
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Join communities and connect with verified creators matching your interests.
                  </p>
                </div>
                {availableCommunities.length > 0 && (
                  <button
                    type="button"
                    onClick={handleJoinAllCommunities}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                  >
                    Join All
                  </button>
                )}
              </div>

              {/* Communities Recommendation Section */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Featured Communities
                </span>

                {availableCommunities.length === 0 ? (
                  <div className="p-4 text-center rounded-2xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800 text-xs text-gray-400">
                    No public communities created yet. Be the first to create one after onboarding!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableCommunities.slice(0, 4).map((comm) => {
                      const isJoined = joinedCommunityIds.includes(comm.id) || comm.members?.some(m => m.userId === currentUser.id);

                      return (
                        <div
                          key={comm.id}
                          className="p-3 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={comm.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${comm.slug}`}
                              alt={comm.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-neutral-700"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-neutral-100 block truncate">
                                {comm.name}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-neutral-400 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {comm.memberCount || 1} members
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleJoinCommunity(comm.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 cursor-pointer ${
                              isJoined
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            }`}
                          >
                            {isJoined ? 'Joined' : 'Join'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Creators & Members Recommendation Section */}
              {recommendedUsers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider block">
                    People to Follow
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendedUsers.map((user) => {
                      const isFollowed = followedUserIds.includes(user.id) || currentUser.following?.includes(user.id);

                      return (
                        <div
                          key={user.id}
                          className="p-3 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                              alt={user.displayName}
                              className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-neutral-700"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-neutral-100 block truncate">
                                {user.displayName}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-neutral-400 block truncate">
                                @{user.username}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleFollowUser(user.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 cursor-pointer ${
                              isFollowed
                                ? 'bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-neutral-200'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                            }`}
                          >
                            {isFollowed ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: All Set & Launch ================= */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-neutral-100">
                  You're all set, {displayName || currentUser.displayName}!
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                  Your personalized profile and customized interest feed are prepared and synchronized with the shared network.
                </p>
              </div>

              {/* Profile Card Summary */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={avatar || currentUser.avatar}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-neutral-100">
                      {displayName || currentUser.displayName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">
                      @{currentUser.username} {location && `• ${location}`}
                    </p>
                  </div>
                </div>

                {bio && (
                  <p className="text-xs text-gray-700 dark:text-neutral-300 italic bg-white dark:bg-neutral-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-neutral-800">
                    "{bio}"
                  </p>
                )}

                <div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Selected Interests ({selectedInterests.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInterests.map((interest) => (
                      <span
                        key={interest}
                        className="px-2 py-0.5 bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold rounded-md"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Controls & Navigation */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-800/80 bg-gray-50/50 dark:bg-neutral-900/80 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 rounded-xl transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <span>{currentStep === 1 ? 'Next: Choose Interests' : currentStep === 2 ? 'Next: Discover' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteWizard}
              disabled={isSubmitting}
              id="finish-onboarding-btn"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Finalizing Profile...</span>
              ) : (
                <>
                  <span>Enter Nexis Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
