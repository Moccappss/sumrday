export type QuestionType =
  | 'short_text'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'linear_scale'
  | 'date'
  | 'time'
  | 'rating'
  | 'section_header'
  | 'info_text'
  | 'image_block'
  | 'file_upload'
  | 'email'
  | 'phone'
  | 'website'
  | 'signature';

export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string; // Optional image for multiple choice / checkbox options
  isOther?: boolean;
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  subtitle?: string;  // For section_header
  imageUrl?: string;  // For image_block
  fileTypes?: string; // For file_upload
  required: boolean;
  options: QuestionOption[];
  cardColor?: string; // Custom accent/left stripe color for this question card
  cardBg?: string;    // Custom background tint for this question card
  page?: number;      // 1-indexed page/section number (defaults to 1)
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

export interface FormSchema {
  id: string;
  title: string;
  description: string;
  themeColor: string;
  headerBanner?: string; // Header theme banner image URL
  headerThemeId?: string; // Preset theme identifier
  acceptingResponses: boolean;
  autoSaveDrive: boolean;
  driveFileUrl?: string;
  driveFileId?: string;
  lastDriveSync?: string;
  createdAt: string;
  updatedAt: string;
  pageTitles?: Record<number, { title?: string; description?: string }>; // Optional title & description for Page 2, 3, etc.
  questions: FormQuestion[];
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  answers: Record<string, any>; // questionId -> answer
}
