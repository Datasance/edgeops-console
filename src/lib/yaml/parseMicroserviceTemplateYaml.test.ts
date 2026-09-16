import { describe, expect, it } from "vitest";
import {
  dumpMicroserviceTemplateYaml,
  parseMicroserviceTemplateYaml,
} from "./parseMicroserviceTemplateYaml";
import { parseUnifiedYaml } from "./unifiedYamlParser";

const TEMPLATE_YAML = `
apiVersion: iofog.org/v3
kind: MicroserviceTemplate
metadata:
  name: whisper-infer
spec:
  description: Whisper inference
  variables:
    - key: model
      description: Model name
      defaultValue: llama-7b
  microservice:
    images:
      amd64: whisper:latest
      registry: 1
    models:
      bindPath: /models
      permissions: ro
      items:
        - name: test-model
    container:
      commands:
        - python
        - app.py
      env: []
`;

describe("parseMicroserviceTemplateYaml", () => {
  it("parses name, variables, and nested microservice including models", async () => {
    const result = await parseUnifiedYaml(TEMPLATE_YAML);
    expect(result.errors).toEqual([]);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].kind).toBe("MicroserviceTemplate");
    expect(result.resources[0].identifier).toBe("whisper-infer");

    const parsed = result.resources[0].parsed;
    expect(parsed.name).toBe("whisper-infer");
    expect(parsed.description).toBe("Whisper inference");
    expect(parsed.variables).toEqual([
      { key: "model", description: "Model name", defaultValue: "llama-7b" },
    ]);
    expect(parsed.microservice.models).toEqual({
      bindPath: "/models",
      permissions: "ro",
      items: [{ name: "test-model" }],
    });
    expect(parsed.microservice.commands).toEqual(["python", "app.py"]);
    expect(parsed.microservice).not.toHaveProperty("name");
    expect(parsed.microservice).not.toHaveProperty("application");
    expect(parsed.microservice).not.toHaveProperty("agentName");
  });

  it("rejects missing spec.microservice", async () => {
    const [parsed, error] = await parseMicroserviceTemplateYaml({
      apiVersion: "iofog.org/v3",
      kind: "MicroserviceTemplate",
      metadata: { name: "whisper-infer" },
      spec: { description: "empty" },
    });
    expect(parsed).toBeNull();
    expect(error).toMatch(/spec.microservice/);
  });

  it("dumps library YAML without instance identity on the nested microservice", async () => {
    const result = await parseUnifiedYaml(TEMPLATE_YAML);
    const dumped = dumpMicroserviceTemplateYaml(result.resources[0].parsed);
    const roundTrip = await parseUnifiedYaml(dumped);

    expect(dumped).toContain("kind: MicroserviceTemplate");
    expect(dumped).not.toMatch(/agent:\s*\n\s*name:/);
    expect(roundTrip.errors).toEqual([]);
    expect(roundTrip.resources[0].parsed.name).toBe("whisper-infer");
    expect(roundTrip.resources[0].parsed.variables).toEqual([
      { key: "model", description: "Model name", defaultValue: "llama-7b" },
    ]);
    expect(roundTrip.resources[0].parsed.microservice.models).toEqual({
      bindPath: "/models",
      permissions: "ro",
      items: [{ name: "test-model" }],
    });
    expect(roundTrip.resources[0].parsed.microservice.commands).toEqual([
      "python",
      "app.py",
    ]);
    expect(roundTrip.resources[0].parsed.microservice).not.toHaveProperty(
      "name",
    );
    expect(roundTrip.resources[0].parsed.microservice).not.toHaveProperty(
      "application",
    );
    expect(roundTrip.resources[0].parsed.microservice).not.toHaveProperty(
      "agentName",
    );
  });
});
