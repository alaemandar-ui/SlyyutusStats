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
  if (userId && /^\d+$/.test(userId)) {
    return `https://files.kick.com/images/user/${userId}/profile_image/conversion/default${idx}-fullsize.webp`;
  }
  return `https://files.kick.com/images/default_avatars/avatar_${idx}.png`;
}

export function getFallbackAvatarUrl(username?: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'kick')}`;
}

export interface UserAvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  username?: string;
  userId?: string;
  className?: string;
  alt?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  username = 'User',
  userId,
  className = 'w-10 h-10 rounded-full object-cover',
  alt,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() => getSafeAvatarUrl(src, username, userId));
  const [attempt, setAttempt] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(getSafeAvatarUrl(src, username, userId));
    setAttempt(0);
    setHasError(false);
  }, [src, username, userId]);

  const handleError = () => {
    if (attempt === 0) {
      setAttempt(1);
      // Fallback 1: Try personal user default on files.kick.com
      const seed = userId || username || 'chatter';
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      const idx = (Math.abs(hash) % 8) + 1;
      if (userId && /^\d+$/.test(userId)) {
        setImgSrc(`https://files.kick.com/images/user/${userId}/profile_image/conversion/default${idx}-fullsize.webp`);
      } else {
        setImgSrc(`https://files.kick.com/images/default_avatars/avatar_${idx}.png`);
      }
    } else if (attempt === 1) {
      setAttempt(2);
      // Fallback 2: Guaranteed DiceBear or Kick direct default
      const seed = username || userId || 'chatter';
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      const idx = (Math.abs(hash) % 8) + 1;
      setImgSrc(`https://kick.com/img/default-profile-pictures/default-avatar-${idx}.webp`);
    } else {
      // Gracefully switch to clean inline badge fallback rather than displaying broken alt text
      setHasError(true);
    }
  };

  if (hasError || !imgSrc) {
    const initial = (username || 'U').charAt(0).toUpperCase();
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-br from-[#1E1E24] to-[#121216] border border-[#D4AF37]/30 text-[#D4AF37] font-bold select-none shrink-0`}
        title={username}
      >
        <span className="text-[0.65em] tracking-tight">{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt || username}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      {...props}
    />
  );
};
