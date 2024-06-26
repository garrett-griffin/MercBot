import { z } from 'zod';

export const AssetEnumSchema = z.enum([
    "cog",
    "handcart",
    "hulk",
    "money",
    "snekkja",
    "tumbrel",
]);

export type AssetEnumType = z.infer<typeof AssetEnumSchema>;
