import { z } from 'genkit';

export const geocodeAddressInputSchema = z.object({
  address: z.string().describe('The address, landmark, postal code, or general area to geocode.'),
});
export type GeocodeAddressInput = z.infer<typeof geocodeAddressInputSchema>;

export const geocodeAddressOutputSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  formattedAddress: z.string().optional(),
  error: z.string().optional(),
  isLandmark: z.boolean().optional().describe("True if the result is a known landmark (e.g., MRT station, mall)"),
  logs: z.array(z.string()).optional().describe("Detailed logs from the geocoding process for debugging."),
});
export type GeocodeAddressOutput = z.infer<typeof geocodeAddressOutputSchema>;
