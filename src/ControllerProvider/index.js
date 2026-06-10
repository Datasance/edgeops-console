import React from "react";
import { useAuth } from "../auth";
import { useFeedback } from "../Utils/FeedbackContext";

const controllerConfig = window.controllerConfig || {};
const IPLookUp = "http://ip-api.com/json/";

const getBaseUrl = () =>
  controllerConfig.url ||
  `${window.location.protocol}//${[window.location.hostname, controllerConfig.port].join(":")}`;

const getUrl = (path) => `${getBaseUrl()}${path}`;

export const ControllerContext = React.createContext();
export const useController = () => React.useContext(ControllerContext);

const initState = {
  user: null,
  status: null,
  refresh: null,
  location: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE":
      return { ...state, ...action.data };
    default:
      return state;
  }
};

const lookUpControllerInfo = async (ip) => {
  if (!ip) ip = window.location.host.split(":")[0];

  const localhost = /(0\.0\.0\.0|localhost|127\.0\.0\.1|192\.168\.)/;
  const lookupIP = localhost.test(ip) ? "8.8.8.8" : ip;

  const response = await fetch(
    IPLookUp + lookupIP.replace("http://", "").replace("https://", ""),
  );
  if (response.ok) {
    return response.json();
  }
  throw new Error(response.statusText);
};

const getControllerStatus = async () => {
  const response = await fetch(getUrl("/api/v3/status"));
  if (response.ok) return response.json();
  console.log("Controller status unreachable", { status: response.statusText });
  return null;
};

export const ControllerProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initState);
  const auth = useAuth();
  const feedbackContext = useFeedback();
  const pushFeedback = feedbackContext?.pushFeedback;

  // Keep a ref so request() always uses the latest token at call time (e.g. YAML/Deploy
  // save after the drawer has been open and the token was refreshed).
  const authRef = React.useRef(auth);
  authRef.current = auth;

  const updateController = (data) => {
    dispatch({ type: "UPDATE", data });
  };

  const request = async (path, options = {}) => {
    const headers = {
      ...options.headers,
    };
    const token = authRef.current?.token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(getUrl(path), {
        ...options,
        headers: { ...headers },
      });

      if (!response.ok) {
        const status = response.status;
        let errorData;

        try {
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON, create a basic error object
          errorData = {
            message: response.statusText || "An error occurred",
          };
        }

        // Check for authorization errors (401 Unauthorized or 403 Forbidden)
        if ((status === 401 || status === 403) && pushFeedback) {
          const errorMessage =
            errorData.message ||
            (status === 401
              ? "Unauthorized: You don't have permission to access this resource"
              : "Forbidden: Access to this resource is denied");

          pushFeedback({
            message: errorMessage,
            type: "error",
          });
        }

        // Return error object with status and ok properties for backward compatibility
        return {
          ...errorData,
          ok: false,
          status: status,
          statusText: response.statusText,
        };
      }

      return response;
    } catch (error) {
      console.error("Request failed:", error);
      return null;
    }
  };

  React.useEffect(() => {
    const effect = async () => {
      try {
        const ipInfo = await lookUpControllerInfo(window.location.hostname);
        dispatch({ type: "UPDATE", data: { location: ipInfo } });
      } catch (e) {
        dispatch({
          type: "UPDATE",
          data: {
            location: {
              lat: "40.935",
              lon: "28.97",
              query: window.location.hostname,
            },
          },
        });
      }
    };
    effect();
  }, []);

  React.useEffect(() => {
    const effect = async () => {
      const status = await getControllerStatus();
      dispatch({ type: "UPDATE", data: { status } });
    };

    if (auth.isAuthenticated) {
      dispatch({ type: "UPDATE", data: { user: auth.user } });
      effect();
    }
  }, [auth.user, auth.isAuthenticated]);

  return (
    <ControllerContext.Provider
      value={{
        ...state,
        updateController,
        request,
      }}
    >
      {children}
    </ControllerContext.Provider>
  );
};
