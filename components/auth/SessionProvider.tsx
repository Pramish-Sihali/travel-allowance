'use client';

import { ReactNode } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export default function SessionProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <NextAuthSessionProvider
      // Set refetchInterval to false to avoid unnecessary refetching 
      // which can cause issues with the token
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}