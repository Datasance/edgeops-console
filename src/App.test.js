import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

jest.mock("./Layout", () => ({
  __esModule: true,
  default: function MockLayout() {
    return (
      <div>
        <span>Overview</span>
        <span>Microservices</span>
        <span>Application</span>
        <h1>Cluster Dashboard</h1>
      </div>
    );
  },
}));

jest.mock("./auth", () => {
  const authState = {
    token: "test-token",
    initialized: true,
    isAuthenticated: true,
    user: { access_token: "test-token" },
  };
  const oidcState = {
    oidc: { isAuthenticated: true, isLoading: false },
    initialized: true,
    token: "test-token",
    isAuthenticated: true,
    logout: jest.fn(),
    hasRole: () => false,
  };

  return {
    OidcAuthProvider: ({ children }) => children,
    useOidcAuth: () => oidcState,
    useAuth: () => authState,
  };
});

jest.mock("react-oidc-context", () => {
  const authState = {
    isLoading: false,
    isAuthenticated: true,
    user: { access_token: "test-token", profile: {} },
    signinRedirect: jest.fn(),
    signoutRedirect: jest.fn(),
    events: {
      addAccessTokenExpired: jest.fn(() => jest.fn()),
    },
  };

  return {
    AuthProvider: ({ children }) => children,
    useAuth: () => authState,
  };
});

const defaultResponses = {
  "http://ip-api.com/json/8.8.8.8": {
    status: "success",
    country: "United States",
    countryCode: "US",
    region: "VA",
    regionName: "Virginia",
    city: "Ashburn",
    zip: "20149",
    lat: 39.0438,
    lon: -77.4874,
    timezone: "America/New_York",
    isp: "Level 3",
    org: "Google LLC",
    as: "AS15169 Google LLC",
    query: "8.8.8.8",
  },
};

const jsonMockResponse = (url, options = {}) => {
  if (url.includes("/api/v3/microservices")) {
    return Promise.resolve({ microservices: [] });
  }

  if (url.includes("/api/v3/iofog-list")) {
    expect(options.headers?.Authorization).toBe("Bearer test-token");
    return Promise.resolve({ fogs: [] });
  }

  if (url.includes("/api/v3/application/system")) {
    expect(options.headers?.Authorization).toBe("Bearer test-token");
    return Promise.resolve({ applications: [] });
  }

  if (url.includes("/api/v3/application")) {
    expect(options.headers?.Authorization).toBe("Bearer test-token");
    return Promise.resolve({ applications: [] });
  }

  if (url.includes("/api/v3/status")) {
    return Promise.resolve({
      status: "ok",
      versions: { controller: "1.0.0", ecnViewer: "1.0.0" },
    });
  }

  if (url === "http://ip-api.com/json/8.8.8.8") {
    return Promise.resolve(defaultResponses["http://ip-api.com/json/8.8.8.8"]);
  }

  return Promise.resolve({});
};

let fetchMock;

beforeEach(() => {
  window.controllerConfig = {
    port: "51121",
    oidcIssuerUrl: "http://localhost:8080/realms/datasance",
    oidcClientId: "ecn-viewer",
  };

  fetchMock = jest.fn((url, options) =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => jsonMockResponse(url, options),
    }),
  );
  global.fetch = fetchMock;
});

afterEach(() => {
  jest.resetAllMocks();
});

it("renders without crashing", () => {
  render(<App />);
});

it("renders dashboard navigation and workload menu items", async () => {
  render(<App />);

  expect(await screen.findByText("Cluster Dashboard")).toBeInTheDocument();
  expect(screen.getByText("Overview")).toBeInTheDocument();
  expect(screen.getByText("Microservices")).toBeInTheDocument();
  expect(screen.getByText("Application")).toBeInTheDocument();
});

it("loads controller data after authentication", async () => {
  render(<App />);

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v3/iofog-list"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  expect(fetchMock).toHaveBeenCalledWith("http://ip-api.com/json/8.8.8.8");
});
