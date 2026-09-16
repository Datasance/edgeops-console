import { describe, expect, it } from "vitest";
import { buildMicroserviceTemplateDeployBody } from "./microserviceTemplateDeploy";

describe("buildMicroserviceTemplateDeployBody", () => {
  it("sends identity fields and a template overlay map, not an inline spec", () => {
    const body = buildMicroserviceTemplateDeployBody({
      templateName: "whisper-infer",
      instanceName: "whisper-instance-1",
      application: "test-app",
      agentName: "edge-node-1",
      variables: { model: "llama-7b", extra: "" },
    });

    expect(body).toEqual({
      name: "whisper-instance-1",
      application: "test-app",
      agentName: "edge-node-1",
      template: {
        name: "whisper-infer",
        variables: { model: "llama-7b" },
      },
    });
    expect(body).not.toHaveProperty("images");
    expect(body).not.toHaveProperty("container");
    expect(body).not.toHaveProperty("microservice");
  });
});
