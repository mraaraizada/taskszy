/**
 * Avatar — shows uploaded image if available, falls back to text avatar.
 * Props: member, size, fontSize, style
 */
export default function Avatar({ member, size = 28, fontSize, style = {} }) {
  const fs = fontSize || Math.round(size * 0.35);
  const base = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: member.color, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: fs, fontWeight: 800, color: '#fff',
    ...style,
  };

  if (member.avatarImg) {
    return (
      <div style={base}>
        <img src={member.avatarImg} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  return <div style={base}>{member.avatar}</div>;
}
