import type { ReactElement } from 'react';

interface PublicRouteProps {
  children: ReactElement;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  return children;
}
