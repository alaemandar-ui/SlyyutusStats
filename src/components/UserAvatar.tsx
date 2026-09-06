import React, { useState, useEffect } from 'react';

export function getSafeAvatarUrl(avatarUrl?: string | null, username?: string, userId?: string): string {
  if (!avatarUrl || avatarUrl.includes('default-medium.webp') || avatarUrl.trim() === '') {
    const seed = username || userId || 'chatter';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const idx = (Math.abs(hash) % 8) + 1;
    return `https://kick.com/img/default-profile-pictures/default-avatar-${idx}.webp`;
  }
  return avatarUrl;
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

  useEffect(() => {
    setImgSrc(getSafeAvatarUrl(src, username, userId));
    setAttempt(0);
  }, [src, username, userId]);

  const handleError = () => {
    if (attempt === 0) {
      setAttempt(1);
      // Fallback 1: Authentic Kick default avatar (1 through 8)
      const seed = username || userId || 'chatter';
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      const idx = (Math.abs(hash) % 8) + 1;
      setImgSrc(`https://kick.com/img/default-profile-pictures/default-avatar-${idx}.webp`);
    } else if (attempt === 1) {
      setAttempt(2);
      // Fallback 2: Guaranteed DiceBear SVG
      setImgSrc(getFallbackAvatarUrl(username));
    }
  };

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
