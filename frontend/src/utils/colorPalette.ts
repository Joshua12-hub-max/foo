export const MEDIUM_PURPLE = '#4B4376';
export const DEEP_PURPLE = '#2E294E';
export const ROSE_PINK = '#AE445A'
export const LIGHT_PINK = '#E8BCB9';
export const SOFT_PURPLE = '#9290C3';
export const DARK_FOREST_GREEN = '#2C3930';
export const MEDIUM_FOREST_GREEN = '#3F4F44';
export const WARM_BROWN = '#A27B5C';
export const LIGHT_BEIGE = '#DCD7C9';
export const DEEP_NAVY = '#070F2B';
export const DARK_NAVY = '#1B1A55';
export const SLATE_BLUE = '#535C91';
export const ROYAL_BLUE = '#2C497F';

export const STATUS_GREEN = '#79B791'; 
export const STATUS_RED = '#7A0000';    
export const STATUS_AMBER = '#CF9033';  
export const STATUS_GRAY = '#778797';  
export const HOLIDAY_COLORS = {
  REGULAR: ROSE_PINK,           
  SPECIAL_NON_WORKING: DEEP_PURPLE,  
  SPECIAL_WORKING: WARM_BROWN,  
};

export const PRIORITY_COLORS = {
  HIGH: STATUS_RED,
  MEDIUM: STATUS_AMBER,
  LOW: STATUS_GREEN,
  DEFAULT: STATUS_GRAY,
};


export const NOTIFICATION_COLORS = {
  DTR_REQUEST: SLATE_BLUE,
  UNDERTIME_REQUEST: MEDIUM_PURPLE,
  LEAVE_REQUEST: WARM_BROWN,
  SCHEDULE_ASSIGNED: SLATE_BLUE,
  APPROVAL: STATUS_GREEN,
  LEAVE_PROCESS: SLATE_BLUE,
  LEAVE_FINALIZE: SOFT_PURPLE,
  REJECTION: STATUS_RED,
  

  DEFAULT: STATUS_GRAY,
};


export const SCHEDULE_COLORS = {
  REGULAR_SHIFT: SLATE_BLUE,
  REST_DAY: WARM_BROWN,
  LOADING: SLATE_BLUE,
};


export const EVENT_COLORS = {
  SCHEDULE: SLATE_BLUE,
  EVENT: DARK_NAVY,
  ANNOUNCEMENT: SOFT_PURPLE,
};

export const UI_COLORS = {
  HEADER_BG: DARK_NAVY,
  CARD_BG: '#F8F9FA',
  BORDER: '#E5E7EB',
};

/**
 * Get color with opacity
 * @param color - Hex color code
 * @param opacity - Opacity value (0-1)
 * @returns - RGBA color string
 */
export const withOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
