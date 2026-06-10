import CssBaseline from "@mui/material/CssBaseline";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import React, { useEffect } from "react";
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
import { OidcAuthProvider } from "./auth";
import "immutable";
import "xterm/css/xterm.css";

function App() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("code") || urlParams.get("state")) {
      const cleanUrl = window.location.origin + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  return (
    <OidcAuthProvider>
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
    </OidcAuthProvider>
  );
}

export default App;
