import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { generateWordAudio } from "./audioGeneration";

export const audioRouter = router({
  generateWordAudio: protectedProcedure
    .input(
      z.object({
        word: z.string(),
        targetLanguage: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const audioUrl = await generateWordAudio(input.word, input.targetLanguage);
      return { audioUrl };
    }),
});
