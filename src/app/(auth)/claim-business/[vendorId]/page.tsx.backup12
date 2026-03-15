
import ClaimBusinessClientPage from './ClaimBusinessClientPage';

// This is the server component wrapper for the claim business page.
// It now correctly accesses `params.vendorId` to pass to the client component.
export default function ClaimBusinessServerPage({ params }: { params: { vendorId: string } }) {
  // The client component will handle fetching, loading, and not found states.
  return <ClaimBusinessClientPage vendorId={params.vendorId} />;
}
