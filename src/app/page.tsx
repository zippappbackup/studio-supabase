import Loading from "./loading";
import RootRedirector from "./RootRedirector";

/**
 * This is the root page of the application.
 * It renders a neutral loading component and a separate client component
 * that handles the initial, role-based redirection. This prevents any
 * specific app layout from flashing before the redirect occurs.
 */
export default function RootPage() {
  return (
    <>
      <RootRedirector />
      <Loading />
    </>
  );
}
