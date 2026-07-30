interface LeadAvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LeadAvatar({ firstName, lastName, size = 'md', className = '' }: LeadAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium ${className}`}
    >
      {initials}
    </div>
  );
}