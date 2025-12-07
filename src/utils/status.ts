
export const getStatusColor = (status?: string): string => {
  if (!status) return '#6b7280'; // gray-500
  
  switch (status.toLowerCase()) {
    // Application/Candidate Status
    case 'hired':
    case 'completed':
    case 'accepted':
    case 'offer':
    case 'offered':
      return '#10b981'; // emerald-500
      
    case 'active':
    case 'published':
    case 'interviewing':
    case 'scheduled':
      return '#3b82f6'; // blue-500
      
    case 'reviewing':
    case 'screening':
    case 'screening_passed':
    case 'rescheduled':
      return '#f59e0b'; // amber-500
      
    case 'pending':
    case 'submitted':
    case 'draft':
      return '#6b7280'; // gray-500
      
    case 'rejected':
    case 'card_failed':
    case 'screening_failed':
    case 'cancelled':
    case 'closed':
    case 'archived':
      return '#ef4444'; // red-500
      
    default:
      return '#6b7280'; // gray-500
  }
};

export const getStatusLabel = (status?: string, t?: (key: string) => string): string => {
  if (!status) return 'N/A';
  
  // If translation function provided, try to translate
  if (t) {
    // You might need to adjust translation keys based on your i18n structure
    return t(`status.${status.toLowerCase()}`);
  }
  
  // Fallback to formatting the string
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getStatusBackground = (status?: string): string => {
  const color = getStatusColor(status);
  return `${color}20`; // 20% opacity using hex alpha
};
