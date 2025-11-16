import { z } from "zod";

export const taskSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
});

export type TaskInput = z.infer<typeof taskSchema>;

type statusType = z.infer<typeof taskSchema>["status"];
