'use server';

/**
 * @fileOverview This file contains the scrape deduplication and confidence flow, which uses an LLM
 * to identify similar businesses from scrapes by comparing their name, phone, and address.
 *
 * - deduplicateAndDetermineConfidence - A function that handles the scrape deduplication and confidence determination process.
 * - DeduplicateAndDetermineConfidenceInput - The input type for the deduplicateAndDetermineConfidence function.
 * - DeduplicateAndDetermineConfidenceOutput - The return type for the deduplicateAndDetermineConfidence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DeduplicateAndDetermineConfidenceInputSchema = z.object({
  existingVendorData: z.record(z.any()).describe('The existing data of the vendor from our database, if any.'),
  newData: z.record(z.any()).describe('The new data scraped for a potential vendor from an external source.'),
});
export type DeduplicateAndDetermineConfidenceInput = z.infer<typeof DeduplicateAndDetermineConfidenceInputSchema>;

const DeduplicateAndDetermineConfidenceOutputSchema = z.object({
  isDuplicate: z.boolean().describe('Whether the new data is determined to be a duplicate of the existing vendor data.'),
  updatedData: z.record(z.any()).describe('The final, merged, and cleaned data for the vendor, combining the most reliable information from both sources.'),
});
export type DeduplicateAndDetermineConfidenceOutput = z.infer<typeof DeduplicateAndDetermineConfidenceOutputSchema>;

export async function deduplicateAndDetermineConfidence(
  input: DeduplicateAndDetermineConfidenceInput
): Promise<DeduplicateAndDetermineConfidenceOutput> {
  return deduplicateAndDetermineConfidenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'deduplicateAndDetermineConfidencePrompt',
  input: {schema: z.object({
    existingVendorData: z.string(),
    newData: z.string(),
  })},
  output: {schema: DeduplicateAndDetermineConfidenceOutputSchema},
  prompt: `You are an expert data analyst specializing in deduplicating business listings. Your task is to compare existing vendor data from our database with new data from a web scrape and determine if they represent the same entity. Then, you must merge them into a single, canonical record.

Follow these rules:
1.  **Analyze for Duplicates**: Compare the 'existingVendorData' and 'newData'. Consider variations in name (e.g., 'The Cafe' vs 'The Cafe on Main'), phone number (e.g., '+65 123456' vs '123-456'), and address (e.g., '123 Main St' vs '123 Main Street, Suite 100'). If you are confident they are the same business, set 'isDuplicate' to true.
2.  **Merge and Clean Data**: Create the 'updatedData' object by merging the two sources.
    *   **Preference**: Prefer data from 'existingVendorData' for core fields like 'name' unless the 'newData' is clearly more complete or correct (e.g., 'newData' has a full address while 'existingData' has a partial one).
    *   **Combine**: For array fields like 'tags', combine unique values from both sources.
    *   **Synthesize**: For fields like 'name', you might choose a more descriptive version (e.g., prefer "Chicken Rice Shop (Jurong Point)" over "The Chicken Rice Shop" if the context suggests specificity is better).
    *   **Remove Redundancy**: Ensure the final 'updatedData' is clean and doesn't contain conflicting or redundant information.

Here is the data:

**Existing Vendor Data from DB:**
\`\`\`json
{{{existingVendorData}}}
\`\`\`

**New Data from Scrape:**
\`\`\`json
{{{newData}}}
\`\`\`

Now, perform the analysis and return the result in the specified JSON format.`,
});

const deduplicateAndDetermineConfidenceFlow = ai.defineFlow(
  {
    name: 'deduplicateAndDetermineConfidenceFlow',
    inputSchema: DeduplicateAndDetermineConfidenceInputSchema,
    outputSchema: DeduplicateAndDetermineConfidenceOutputSchema,
  },
  async input => {
    const {output} = await prompt({
      existingVendorData: JSON.stringify(input.existingVendorData, null, 2),
      newData: JSON.stringify(input.newData, null, 2),
    });
    if (!output) {
      throw new Error("The AI model did not return a valid output.");
    }
    return output;
  }
);
