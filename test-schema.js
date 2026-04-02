import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const schema = z.object({
  selections: z.object({
    states: z.array(z.string()).describe("Array of state codes"),
    metric: z.string().describe("Metric key (e.g. 'revenue')"),
    period: z.enum(["monthly", "quarterly"]).describe("Period granularity"),
    year: z.string().describe("Year"),
  }).describe("The selections object from sales_metric_selector output"),
  report: z.object({
    summary: z.object({
      total: z.string(),
      average: z.string(),
      trend: z.string(),
      totalRaw: z.number(),
      averageRaw: z.number(),
    }),
    topState: z.object({
      name: z.string(),
      code: z.string(),
      value: z.string(),
      percentage: z.string(),
    }),
    periods: z.array(z.object({
      period: z.string(),
      total: z.string(),
      stateValues: z.record(z.string(), z.number()),
    })),
    states: z.array(z.object({
      state: z.string(),
      value: z.string(),
      percentage: z.string(),
    })),
    stateNames: z.array(z.string()).describe("Ordered state names for column headers"),
  }).describe("The report object from sales_metric_selector output"),
});

console.log(JSON.stringify(zodToJsonSchema(schema), null, 2));
