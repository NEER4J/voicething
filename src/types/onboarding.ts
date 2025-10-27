export enum OnboardingStep {
  WELCOME = "welcome",
  BUSINESS_INFO = "business_info",
  PHONE_SETUP = "phone_setup",
  VOICE_SELECTION = "voice_selection",
  CHANNELS = "channels",
  TEST_ASSISTANT = "test_assistant",
}

export interface BusinessProfile {
  id?: string;
  user_id: string;
  business_name?: string;
  business_category?: string;
  default_language?: string;
  timezone?: string;
  use_business_hours?: boolean;
  ai_phone_number?: string;
  phone_country_code?: string;
  phone_area_code?: string;
  voice_model?: string;
  voice_tone?: "friendly" | "formal" | "energetic";
  whatsapp_connected?: boolean;
  telegram_connected?: boolean;
  test_call_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingFormData {
  business_name: string;
  business_category: string;
  default_language: string;
  timezone: string;
  use_business_hours: boolean;
  phone_option: "new" | "existing";
  phone_country_code: string;
  phone_area_code: string;
  voice_model: string;
  voice_tone: "friendly" | "formal" | "energetic";
  whatsapp_connected: boolean;
  telegram_connected: boolean;
  test_call_completed: boolean;
}

export const BUSINESS_CATEGORIES = [
  "Real Estate",
  "Cleaning Services",
  "Medical Clinic",
  "Law Firm",
  "Consulting",
  "Restaurant",
  "Retail",
  "Other",
] as const;

export const LANGUAGES = ["English", "Arabic", "Spanish", "French", "German"] as const;

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Tokyo",
] as const;

export const VOICE_MODELS = [
  { id: "sarah", name: "Sarah", gender: "Female", tone: "Friendly" },
  { id: "james", name: "James", gender: "Male", tone: "Professional" },
  { id: "emma", name: "Emma", gender: "Female", tone: "Energetic" },
  { id: "david", name: "David", gender: "Male", tone: "Formal" },
] as const;

export const VOICE_TONES = [
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "energetic", label: "Energetic" },
] as const;
