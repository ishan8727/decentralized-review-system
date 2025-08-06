import z from 'zod';

const imageValidate = z.object({
    options: z.array(z.object({
        imageurl: z.string()
    })),
    title: z.string().optional(),
    signature: z.string()
});

export default imageValidate;