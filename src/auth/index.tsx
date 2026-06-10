import React, {
  createContext,
  useContext,
  ReactNode,
  FC,
  useEffect,
  useState,
} from "react";
import { AuthProvider as OidcProvider, useAuth } from "react-oidc-context";

const controllerConfig = window.controllerConfig || {};

const oidcConfig = {
  authority: controllerConfig.oidcIssuerUrl!,
  client_id: controllerConfig.oidcClientId,
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid profile email",
  automaticSilentRenew: true,
  loadUserInfo: true,
  silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
};

type OidcAuthContextType = {
  oidc: ReturnType<typeof useAuth>;
  initialized: boolean;
  token?: string;
  isAuthenticated: boolean;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const OidcAuthContext = createContext<OidcAuthContextType | null>(null);

const OidcProviderContent: FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!auth.isLoading) {
      setInitialized(true);
      if (!auth.isAuthenticated) {
        auth.signinRedirect();
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth]);

  useEffect(() => {
    const handleTokenExpired = () => {
      auth.signoutRedirect();
    };

    auth.events.addAccessTokenExpired(handleTokenExpired);

    return () => {
      auth.events.removeAccessTokenExpired(handleTokenExpired);
    };
  }, [auth]);

  const authValue: OidcAuthContextType = {
    oidc: auth,
    initialized,
    token: auth.user?.access_token,
    isAuthenticated: auth.isAuthenticated,
    logout: () => auth.signoutRedirect(),
    hasRole: () => false,
  };

  return (
    <OidcAuthContext.Provider value={authValue}>
      {children}
    </OidcAuthContext.Provider>
  );
};

export const OidcAuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <OidcProvider {...oidcConfig}>
      <OidcProviderContent>{children}</OidcProviderContent>
    </OidcProvider>
  );
};

export const useOidcAuth = (): OidcAuthContextType => {
  const context = useContext(OidcAuthContext);
  if (!context) {
    throw new Error("useOidcAuth must be used within an OidcAuthProvider");
  }
  return context;
};

export { useOidcAuth as useAuth };
