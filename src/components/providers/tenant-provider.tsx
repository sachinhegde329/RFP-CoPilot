'use client';

import { type Tenant } from '@/lib/tenants';
import React, { createContext, useContext } from 'react';

type TenantContextType = {
  tenant: Tenant;
};

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({
  children,
  tenant,
}: {
  children: React.ReactNode;
  tenant: Tenant;
}) {
  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
