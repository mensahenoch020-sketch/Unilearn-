import React from 'react';

export default function RoleWrapper({ currentRole, requiredRole, children }) {
  if (currentRole === requiredRole) {
    return <>{children}</>;
  }
  return null; 
}
