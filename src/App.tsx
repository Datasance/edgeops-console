import CssBaseline from "@mui/material/CssBaseline";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import React, { useEffect, useRef } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { ControllerProvider } from "./ControllerProvider";
import { DataProvider } from "./providers/Data";
import { TerminalProvider } from "./providers/Terminal/TerminalProvider";
import { LogViewerProvider } from "./providers/LogViewer/LogViewerProvider";
import Layout from "./Layout";
import "./App.scss";

import FeedbackContext from "./Utils/FeedbackContext";
import ThemeContext from "./Theme/ThemeProvider";
import { ConfigProvider } from "./providers/Config";
import { PollingConfigProvider } from "./providers/PollingConfig/PollingConfigProvider";
import "./styles/tailwind.css";
import {
  capturePostLoginRedirect,
  consumePostLoginRedirect,
  getHashRoute,
  resolvePostLoginRoute,
} from "./auth/postLoginRedirect";
import {
  AuthProvider,
  LoginPage,
  OAuthInteractionPage,
  tryConsumeOAuthCallbackFromLocation,
  useAuth,
} from "./auth";
import "immutable";
import "xterm/css/xterm.css";

function LoginShell() {
  useEffect(() => {
    capturePostLoginRedirect();
    if (tryConsumeOAuthCallbackFromLocation()) {
      return;
    }
    if (getHashRoute() !== "/login" && getHashRoute() !== "/login/oauth") {
      window.location.hash = "#/login";
    }
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/oauth" element={<OAuthInteractionPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}

function AppShell() {
  const { user } = useAuth();
  const pendingRef = useRef<string | null>(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    pendingRef.current = consumePostLoginRedirect();
  }, []);

  useEffect(() => {
    if (redirectedRef.current || !user?.profile) {
      return;
    }
    redirectedRef.current = true;
    const target = resolvePostLoginRoute(user.profile, pendingRef.current);
    const current = getHashRoute();
    if (current !== target) {
      window.location.hash = `#${target.replace(/^\//, "")}`;
    }
  }, [user?.profile]);

  return (
    <>
      <CssBaseline />
      <ThemeContext>
        <DndProvider backend={HTML5Backend}>
          <FeedbackContext>
            <ControllerProvider>
              <ConfigProvider>
                <PollingConfigProvider>
                  <DataProvider>
                    <TerminalProvider>
                      <LogViewerProvider>
                        <Layout />
                      </LogViewerProvider>
                    </TerminalProvider>
                  </DataProvider>
                </PollingConfigProvider>
              </ConfigProvider>
            </ControllerProvider>
          </FeedbackContext>
        </DndProvider>
      </ThemeContext>
    </>
  );
}

function AuthenticatedGate() {
  const { isAuthenticated, isSessionValidating } = useAuth();

  if (isAuthenticated && isSessionValidating) {
    return null;
  }

  return isAuthenticated ? <AppShell /> : <LoginShell />;
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedGate />
    </AuthProvider>
  );
}

export default App;
