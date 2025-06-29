// This page is not intended to be viewed directly.
// The middleware will redirect requests for the root domain to /login.
export default function RootPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
