import z from 'zod';

export const imageValidate = z.object({
    options: z.array(z.object({
        imageurl: z.string()
    })),
    title: z.string().optional(),
    signature: z.string()
});

export const createSubmissionInput = z.object({
    taskId: z.string(),
    selection: z.string()
})