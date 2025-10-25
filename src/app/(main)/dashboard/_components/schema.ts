import z from "zod";

export const recentActivitySchema = z.object({
  id: z.string(),
  time: z.string(),
  contact: z.string(),
  type: z.string(),
  duration: z.string(),
  aiSummary: z.string(),
});
