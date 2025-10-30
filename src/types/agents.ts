// AI Agents types and constants

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  business_type: BusinessType;
  language: Language;
  tone: Tone;
  voice_id: string;
  voice_name: string;
  greeting_message?: string;
  system_prompt?: string;
  vapi_assistant_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentFormData {
  name: string;
  business_type: BusinessType;
  language: Language;
  tone: Tone;
  voice_id: string;
  voice_name: string;
  greeting_message: string;
  system_prompt?: string;
}

export type BusinessType = "cleaning" | "real_estate" | "clinic" | "agency" | "general";
export type Language = "english" | "arabic" | "both";
export type Tone = "friendly" | "professional" | "energetic";

export interface VoiceOption {
  id: string;
  name: string;
  provider: string;
  gender: "male" | "female";
  description: string;
  voiceId: string; // Vapi voice ID
}

export const BUSINESS_TYPES = [
  { value: "cleaning", label: "Cleaning Services" },
  { value: "real_estate", label: "Real Estate" },
  { value: "clinic", label: "Medical Clinic" },
  { value: "agency", label: "Agency" },
  { value: "general", label: "General Business" },
] as const;

export const LANGUAGES = [
  { value: "english", label: "English (US)" },
  { value: "arabic", label: "Arabic (Saudi)" },
  { value: "both", label: "Both (English/Arabic)" },
] as const;

export const TONES = [
  { value: "friendly", label: "Friendly", description: "Warm and approachable tone" },
  { value: "professional", label: "Professional", description: "Business-like and formal" },
  { value: "energetic", label: "Energetic", description: "Enthusiastic and dynamic" },
] as const;

// 4 Vapi voices - 2 male, 2 female (using exact Vapi voice IDs)
export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "elliot",
    name: "Elliot",
    provider: "11labs",
    gender: "male",
    description: "Soothing, friendly, and professional",
    voiceId: "cgSgspJ2msm6clMCkdW9", // Working ElevenLabs voice ID
  },
  {
    id: "paige",
    name: "Paige",
    provider: "11labs",
    gender: "female",
    description: "Deeper tone, calming and professional",
    voiceId: "cgSgspJ2msm6clMCkdW9", // Using same voice for now
  },
  {
    id: "kylie",
    name: "Kylie",
    provider: "11labs",
    gender: "female",
    description: "Clear and engaging female voice",
    voiceId: "cgSgspJ2msm6clMCkdW9", // Using same voice for now
  },
  {
    id: "cole",
    name: "Cole",
    provider: "11labs",
    gender: "male",
    description: "Warm and natural male voice",
    voiceId: "cgSgspJ2msm6clMCkdW9", // Using same voice for now
  },
];

// Greeting templates based on business type
export const GREETING_TEMPLATES: Record<BusinessType, string> = {
  cleaning: "Hi! Thanks for calling [Business Name]. How can I help you with your cleaning needs today?",
  real_estate:
    "Hello! Thank you for calling [Business Name] Real Estate. Are you looking to buy, sell, or rent a property?",
  clinic:
    "Good day! You've reached [Business Name]. How may I assist you with scheduling an appointment or answering your questions?",
  agency: "Hello! Thanks for reaching out to [Business Name]. How can we help you today?",
  general: "Hi! Thank you for calling [Business Name]. How can I assist you today?",
};

// System prompt templates based on business type
export const SYSTEM_PROMPT_TEMPLATES: Record<BusinessType, string> = {
  cleaning: `You are a friendly and professional AI receptionist for a cleaning services business. Your role is to:
- Greet callers warmly
- Answer questions about cleaning services (residential, commercial, deep cleaning)
- Collect customer information (name, phone, address)
- Schedule cleaning appointments
- Provide pricing information when asked
- Handle inquiries professionally and efficiently

Always be helpful, patient, and maintain a positive attitude.`,

  real_estate: `You are a professional AI assistant for a real estate agency. Your role is to:
- Welcome potential buyers, sellers, and renters
- Qualify leads by asking about their property needs
- Schedule viewings and consultations with agents
- Provide basic information about listings
- Collect contact information for follow-up
- Transfer calls to specific agents when requested

Be professional, knowledgeable, and help guide callers through their real estate journey.`,

  clinic: `You are a compassionate and professional AI receptionist for a medical clinic. Your role is to:
- Greet patients warmly and professionally
- Schedule, reschedule, or cancel appointments
- Collect patient information (name, DOB, contact details)
- Answer questions about clinic hours and services
- Handle appointment reminders
- Direct urgent matters to medical staff immediately

Always maintain patient confidentiality and show empathy in all interactions.`,

  agency: `You are a professional AI assistant for a business agency. Your role is to:
- Welcome clients and prospects professionally
- Understand their business needs and requirements
- Schedule consultations and meetings
- Provide information about agency services
- Collect contact information for follow-up
- Route calls to appropriate team members

Be professional, efficient, and help clients feel valued and understood.`,

  general: `You are a friendly and professional AI receptionist. Your role is to:
- Greet callers warmly
- Answer general questions about the business
- Collect caller information (name, phone, reason for call)
- Schedule appointments or callbacks
- Route calls to appropriate departments
- Handle inquiries professionally

Always be helpful, courteous, and maintain a positive attitude.`,
};
