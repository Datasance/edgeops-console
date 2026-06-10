import React from "react";
import ReactDOM from "react-dom";
import { render, wait } from "@testing-library/react";
import App from "./App";
import { act } from "react-dom/test-utils";

const getUrl = (path) => `/api/controllerApi${path}`;

beforeAll(() => {
  const jsonMockResponse = (url, options) => {
    switch (url) {
      case "http://ip-api.com/json/8.8.8.8":
        return Promise.resolve({
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
        });
      case getUrl("/api/v3/user/login"):
        expect(options.method).toBe("POST");
        return Promise.resolve({ accessToken: "test" });
      case getUrl("/api/v3/iofog-list"):
        expect(options.headers.Authorization).toBe("test");
        return Promise.resolve({ fogs: [] });
      case getUrl("/api/v3/application"):
        expect(options.headers.Authorization).toBe("test");
        return Promise.resolve({ applications: [] });
      default:
        return Promise.reject(new Error(`Could not match URL: ${url}`));
    }
  };
  const mockFetchPromise = (...args) =>
    Promise.resolve({
      ok: true,
      json: () => jsonMockResponse(...args),
    });
  jest.spyOn(window, "fetch").mockImplementation(mockFetchPromise);
});

it("renders without crashing", () => {
  act(() => {
    const div = document.createElement("div");
    ReactDOM.render(<App />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});

it("renders Active resources and Agent list", () => {
  let getByText = () => {};
  act(() => {
    getByText = render(<App />).getByText;
  });
  expect(getByText("Agents")).toBeInTheDocument();
  expect(getByText("Active resources")).toBeInTheDocument();
  expect(getByText("Applications")).toBeInTheDocument();
  expect(getByText("Microservices")).toBeInTheDocument();
});

it("fetches controller GPS coordinates, authenticates and fetches agents and applications", () => {
  let rendered = {};
  act(() => {
    rendered = render(<App />);
  });
  return wait(() => {
    // wait for loading to stop, and show default local controller
    return rendered.getByText("8.8.8.8");
  });
});
