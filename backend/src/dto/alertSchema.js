import { z } from "zod";

export const severityEnum = z.enum(["minor", "moderate", "severe", "extreme"]);
export const urgencyEnum = z.enum(["immediate", "expected", "future", "past"]);
export const certaintyEnum = z.enum(["likely", "observed", "possible", "unknown"]);
export const sourceEnum = z.enum(["openweather", "meteoalarm", "dwd", "nws", "metoffice"]);

export const alertDTOSchema = z.object({
  id: z.string().min(1),
  source: sourceEnum,
  event: z.string().min(1),
  severity: severityEnum,
  urgency: urgencyEnum,
  areas: z.array(z.string()).default([]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  headline: z.string().min(1),
  description: z.string().optional(),
  instruction: z.string().optional(),
  certainty: certaintyEnum.optional(),
});

export const alertsResponseSchema = z.object({
  updatedAt: z.string().datetime(),
  alerts: z.array(alertDTOSchema),
});
