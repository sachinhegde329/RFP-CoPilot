
import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Authentication has been removed from this application.
  // Redirecting all login attempts to the public demo workspace.
  redirect('/megacorp');
}
