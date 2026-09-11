import React, { useState, useEffect } from 'react';

export function normalizeAvatarUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.includes('default-medium.webp')) {
    return '';
  }
  let clean = url.trim();
  // Convert expiring AWS S3 signed URLs to permanent Kick CloudFront CDN
  const s3Match = clean.match(/amazonaws\.com\/(images\/user\/\d+\/profile_image\/conversion\/[^?]+)/);
  if (s3Match) {
    return `https://files.kick.com/${s3Match[1]}`;
  }
  // Strip expiring signature parameters if present
  if (clean.includes('X-Amz-') || clean.includes('?')) {
    clean = clean.split('?')[0];
  }
  return clean;
}

export function getSafeAvatarUrl(avatarUrl?: string | null, username?: string, userId?: string): string {
  const normalized = normalizeAvatarUrl(avatarUrl);
  if (normalized) {
    return normalized;
  }
  const seed = userId || username || 'chatter';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = (Math.abs(hash) % 8) + 1;
  // Use Kick's verified working default profile picture CDN (returns HTTP 200)
  return `https://kick.com/img/default-profile-pictures/default-avatar-${idx}.webp`;
}

export function getFallbackAvatarUrl(username?: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'kick')}`;
}

export interface UserAvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  avatarUrl?: string | null;
  username?: string;
  userId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
  bordered?: boolean;
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'w-6 h-6 rounded-md text-[10px]',
  sm: 'w-8 h-8 rounded-lg text-xs',
  md: 'w-10 h-10 rounded-lg text-sm',
  lg: 'w-12 h-12 rounded-xl text-base',
  xl: 'w-14 h-14 rounded-xl text-lg',
  '2xl': 'w-16 h-16 rounded-2xl text-xl'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  avatarUrl,
  username = 'User',
  userId,
  size,
  className,
  alt,
  bordered = true,
  ...props
}) => {
  const effectiveUrl = src || avatarUrl;
  const [imgSrc, setImgSrc] = useState<string>(() => getSafeAvatarUrl(effectiveUrl, username, userId));
  const [attempt, setAttempt] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(getSafeAvatarUrl(effectiveUrl, username, userId));
    setAttempt(0);
    setHasError(false);
  }, [effectiveUrl, username, userId]);

  const handleError = () => {
    const seed = username || userId || 'chatter';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const idx = (Math.abs(hash) % 8) + 1;

    if (attempt === 0) {
      setAttempt(1);
      // Fallback 1: Kick official default avatar (HTTP 200)
      setImgSrc(`https://kick.com/img/default-profile-pictures/default-avatar-${idx}.webp`);
    } else if (attempt === 1) {
      setAttempt(2);
      // Fallback 2: DiceBear reliable SVG avatar
      setImgSrc(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || userId || 'kick')}`);
    } else {
      // Fallback 3: Switch to sleek luxury monogram badge
      setHasError(true);
    }
  };

  // Base sizing and styling
  const sizeClass = size ? SIZE_CLASSES[size] : '';
  const borderClass = bordered ? 'border border-[#D4AF37]/30 hover:border-[#D4AF37]' : '';
  const finalClassName = className 
    ? (className.includes('rounded') ? className : `${className} rounded-lg`)
    : `${sizeClass || 'w-10 h-10 rounded-lg'} ${borderClass} object-cover transition-all shadow-sm`;

  if (hasError || !imgSrc) {
    const initial = (username || 'U').charAt(0).toUpperCase();
    return (
      <div
        className={`${finalClassName} flex items-center justify-center bg-gradient-to-br from-[#1C1A14] via-[#121212] to-[#0A0A0A] border border-[#D4AF37]/50 text-[#FFD700] font-black font-heading select-none shrink-0 shadow-[0_0_10px_rgba(212,175,55,0.15)]`}
        title={username}
      >
        <span className="tracking-tight">{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt || username}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={finalClassName}
      {...props}
    />
  );
};
