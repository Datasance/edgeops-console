import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DeployMicroserviceTemplate from "./DeployMicroserviceTemplate";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  pushFeedback: vi.fn(),
  refreshData: vi.fn(),
}));

vi.mock("@/app/providers", () => ({
  useController: () => ({ request: mocks.request }),
  useFeedback: () => ({ pushFeedback: mocks.pushFeedback }),
  useData: () => ({
    data: {
      applications: [{ name: "test-app" }],
      reducedAgents: {
        byUUID: {
          "agent-1": { uuid: "agent-1", name: "edge-node-1" },
        },
      },
    },
    refreshData: mocks.refreshData,
  }),
}));

describe("DeployMicroserviceTemplate", () => {
  it("POSTs a template overlay and refreshes microservices", async () => {
    mocks.request.mockResolvedValue({ ok: true });
    mocks.refreshData.mockResolvedValue(undefined);
    const close = vi.fn();
    let deployFn: (() => Promise<void>) | undefined;

    render(
      <DeployMicroserviceTemplate
        template={{
          name: "whisper-infer",
          variables: [
            {
              key: "model",
              description: "Model name",
              defaultValue: "llama-7b",
            },
          ],
        }}
        close={close}
        onDeploy={(deployData) => {
          deployFn = deployData.deploy;
        }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Enter instance name"), {
      target: { value: "whisper-instance-1" },
    });
    fireEvent.change(screen.getByDisplayValue("Select an application"), {
      target: { value: "test-app" },
    });
    fireEvent.change(screen.getByDisplayValue("Select an agent"), {
      target: { value: "edge-node-1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Default: llama-7b"), {
      target: { value: "whisper-small" },
    });

    await waitFor(() => expect(deployFn).toBeTypeOf("function"));
    await deployFn?.();

    expect(mocks.request).toHaveBeenCalledWith("/api/v3/microservices", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "whisper-instance-1",
        application: "test-app",
        agentName: "edge-node-1",
        template: {
          name: "whisper-infer",
          variables: { model: "whisper-small" },
        },
      }),
    });
    expect(mocks.pushFeedback).toHaveBeenCalledWith({
      message: "Microservice deployed!",
      type: "success",
    });
    expect(mocks.refreshData).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
