import React, { useState, useRef, useId } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, RefreshCw, Link as LinkIcon, Check } from 'lucide-react';

interface ImageUploadPickerProps {
  label: string;
  value: string;
  onChange: (dataUrlOrUrl: string) => void;
  type?: 'avatar' | 'banner';
  hint?: string;
  placeholderText?: string;
  required?: boolean;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Quantum',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Aura',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Elena'
];

const BANNER_PRESETS = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80'
];

export const ImageUploadPicker: React.FC<ImageUploadPickerProps> = ({
  label,
  value,
  onChange,
  type = 'avatar',
  hint,
  placeholderText = 'Upload an image from device or choose a preset',
  required = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();

  const isAvatar = type === 'avatar';
  const presets = isAvatar ? AVATAR_PRESETS : BANNER_PRESETS;

  // Process and compress local file to base64 Data URL
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }

    // Check size (allow up to 10MB input, but we will compress it down)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Please select an image under 10MB');
      return;
    }

    setError(null);
    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        setIsCompressing(false);
        return;
      }

      // Compress and resize using HTML5 Canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = isAvatar ? 400 : 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(src);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        onChange(src);
        setIsCompressing(false);
      };
      img.src = src;
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSelectPreset = (presetUrl: string) => {
    onChange(presetUrl);
    setError(null);
  };

  const handleRandomize = () => {
    const randomSeed = Math.random().toString(36).substring(2, 8);
    if (isAvatar) {
      const dicebearStyles = ['bottts', 'shapes', 'avataaars', 'lorelei', 'adventurer'];
      const style = dicebearStyles[Math.floor(Math.random() * dicebearStyles.length)];
      onChange(`https://api.dicebear.com/7.x/${style}/svg?seed=${randomSeed}`);
    } else {
      const randomPreset = BANNER_PRESETS[Math.floor(Math.random() * BANNER_PRESETS.length)];
      onChange(randomPreset);
    }
    setError(null);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setCustomUrl('');
      setShowUrlInput(false);
      setError(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Quick Actions */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomize}
            title="Generate random stylish preset"
            className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Generate Preset</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPresets(prev => !prev)}
            className="text-[11px] font-medium text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
          >
            <ImageIcon className="w-3 h-3" />
            <span>{showPresets ? 'Hide Presets' : 'Presets'}</span>
          </button>
        </div>
      </div>

      {hint && <p className="text-[11px] text-gray-500 dark:text-neutral-400">{hint}</p>}

      {/* Main Upload / Preview Area */}
      <div className="space-y-3">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          id={`file-input-${uniqueId}`}
          className="hidden"
          onChange={handleFileChange}
        />

        {value ? (
          /* Image Preview with overlay controls */
          <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
            <div className={`w-full overflow-hidden flex items-center justify-center ${isAvatar ? 'h-32' : 'h-36 sm:h-40'}`}>
              {isAvatar ? (
                <img
                  src={value}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-white dark:border-neutral-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Quick Action Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New File</span>
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          /* Drag & Drop / Click Upload Box */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
                : 'border-gray-200 dark:border-neutral-800 bg-gray-50/60 dark:bg-neutral-950/60 hover:bg-gray-100 dark:hover:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {isCompressing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-neutral-200">
                {isCompressing ? 'Optimizing image...' : 'Click to upload picture or drag and drop'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5">
                PNG, JPG, WebP, GIF from your device (no URL required)
              </p>
            </div>
          </div>
        )}

        {/* Error message if any */}
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

        {/* Preset Gallery Accordion */}
        {showPresets && (
          <div className="p-3 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-600 dark:text-neutral-400">
                Choose a pre-designed style
              </span>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Shuffle</span>
              </button>
            </div>

            <div className={`grid gap-2 ${isAvatar ? 'grid-cols-4 sm:grid-cols-8' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {presets.map((preset, idx) => {
                const isSelected = value === preset;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative rounded-lg overflow-hidden border transition group ${
                      isSelected
                        ? 'ring-2 ring-blue-500 border-transparent'
                        : 'border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600'
                    } ${isAvatar ? 'aspect-square' : 'h-14'}`}
                  >
                    <img
                      src={preset}
                      alt="Preset"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional URL input toggle */}
        <div className="flex items-center justify-between pt-0.5">
          <button
            type="button"
            onClick={() => setShowUrlInput(prev => !prev)}
            className="text-[10px] text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Hide link option' : 'Paste link instead (optional)'}</span>
          </button>
        </div>

        {showUrlInput && (
          <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!customUrl.trim()}
              className="px-3 py-1.5 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-800 dark:text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
