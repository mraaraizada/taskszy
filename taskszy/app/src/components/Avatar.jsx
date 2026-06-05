import { useState, useEffect, useRef, useMemo } from 'react';
import { lazyLoader } from '../lib/paginationService';

/**
 * Avatar — shows uploaded image if available, falls back to text avatar.
 * Props: member, size, fontSize, style, lazy (default: true)
 */
export default function Avatar({ member, size = 28, fontSize, style = {}, lazy = true }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);
  const fs = fontSize || Math.round(size * 0.35);
  
  // CRITICAL: Keep previous member data when member becomes null to prevent flickering
  const prevMemberRef = useRef(member);
  useEffect(() => {
    if (member && member.id) {
      prevMemberRef.current = member;
    }
  }, [member?.id, member?.avatarImg, member?.avatar, member?.color, member?.name]);
  
  // Use current member if available, otherwise use previous member
  const activeMember = member || prevMemberRef.current;
  
  // Guard against completely null member (first render before any data)
  if (!activeMember) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: '#9CA3AF', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: fs, fontWeight: 800, color: '#fff',
        position: 'relative',
        ...style,
      }}>U</div>
    );
  }
  
  // Memoize member data to prevent unnecessary resets
  const stableMember = useMemo(() => activeMember, [activeMember?.id, activeMember?.avatarImg, activeMember?.avatar, activeMember?.color, activeMember?.name]);
  
  const base = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: stableMember.color, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: fs, fontWeight: 800, color: '#fff',
    position: 'relative',
    ...style,
  };

  // Reset error state only when avatarImg actually changes
  const prevAvatarImg = useRef(stableMember.avatarImg);
  useEffect(() => {
    if (prevAvatarImg.current !== stableMember.avatarImg) {
      setImageError(false);
      setImageLoaded(false);
      prevAvatarImg.current = stableMember.avatarImg;
    }
  }, [stableMember.avatarImg]);

  // Lazy loading setup
  useEffect(() => {
    if (!stableMember.avatarImg || !lazy || !imgRef.current) return;

    // Register image for lazy loading
    lazyLoader.observe(imgRef.current, stableMember.avatarImg);

    return () => {
      if (imgRef.current) {
        lazyLoader.unobserve(imgRef.current);
      }
    };
  }, [stableMember.avatarImg, lazy]);

  // Show text avatar if no image or if image failed to load
  if (!stableMember.avatarImg || imageError) {
    return <div style={base}>{stableMember.avatar}</div>;
  }

  return (
    <div style={base}>
      {/* Only render img tag when we have a src (not lazy loading) */}
      {!lazy && stableMember.avatarImg && (
        <img 
          ref={imgRef}
          src={stableMember.avatarImg}
          data-src={stableMember.avatarImg}
          alt={stableMember.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s'
          }}
          onError={(e) => {
            // Silently fall back to text avatar without logging
            setImageError(true);
          }}
          onLoad={() => {
            setImageLoaded(true);
          }}
        />
      )}
      {/* For lazy loading, render img with data-src only */}
      {lazy && stableMember.avatarImg && (
        <img 
          ref={imgRef}
          data-src={stableMember.avatarImg}
          alt={stableMember.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s'
          }}
          onError={(e) => {
            // Silently fall back to text avatar without logging
            setImageError(true);
          }}
          onLoad={() => {
            setImageLoaded(true);
          }}
        />
      )}
      {/* Show text avatar while image is loading */}
      {!imageLoaded && !imageError && (
        <div style={{ position: 'absolute', fontSize: fs, fontWeight: 800, color: '#fff' }}>
          {stableMember.avatar}
        </div>
      )}
    </div>
  );
}
