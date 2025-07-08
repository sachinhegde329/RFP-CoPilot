
import { redirect } from 'next/navigation';

export default function SignUpPage() {
  // Authentication has been removed from this application.
  // Redirecting all sign-up attempts to the public demo workspace.
  redirect('/megacorp');
}
