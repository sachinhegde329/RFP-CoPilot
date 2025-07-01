
'use client';

import { type Tenant } from '@/lib/tenant-types';
import React, { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';

type TenantContextType = {
  tenant: Tenant;
  setTenant: Dispatch<SetStateAction<Tenant>>;
};

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({
  children,
  tenant: initialTenant,
}: {
  children: React.ReactNode;
  tenant: Tenant;
}) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant);

  return (
    <TenantContext.Provider value={{ tenant, setTenant }}>
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
