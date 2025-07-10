import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/api/auth/login');
  // This return is technically unreachable but required by React.
  return null;
}
