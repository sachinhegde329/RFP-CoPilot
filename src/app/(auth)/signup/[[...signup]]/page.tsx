import { redirect } from 'next/navigation';

export default function SignUpPage() {
  redirect('/api/auth/signup');
  // This return is technically unreachable but required by React.
  return null;
}
