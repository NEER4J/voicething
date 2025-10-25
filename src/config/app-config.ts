import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Voicething",
  version: packageJson.version,
  copyright: `© ${currentYear}, Voicething.`,
  meta: {
    title: "Voicething - AI Voice Agent Dashboard",
    description:
      "Voicething is a powerful AI voice agent platform built with Next.js 16, Tailwind CSS v4, and shadcn/ui. Create, manage, and deploy intelligent voice assistants with advanced conversational AI capabilities.",
  },
};
