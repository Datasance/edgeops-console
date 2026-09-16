import { describe, expect, it } from "vitest";
import { parseUnifiedYaml } from "./unifiedYamlParser";

describe("unified YAML kind order", () => {
  it("orders Registry before Model, RuntimeClass, and MicroserviceTemplate", async () => {
    const result = await parseUnifiedYaml(`
apiVersion: iofog.org/v3
kind: Microservice
metadata:
  name: app-a/ms-a
spec:
  container:
    env: []
---
apiVersion: iofog.org/v3
kind: MicroserviceTemplate
metadata:
  name: whisper-infer
spec:
  microservice:
    container:
      env: []
---
apiVersion: iofog.org/v3
kind: Model
metadata:
  name: test-model
spec:
  repo: org/repo
  registryId: 3
---
apiVersion: iofog.org/v3
kind: RuntimeClass
metadata:
  name: spin
handler: spin
---
apiVersion: iofog.org/v3
kind: Registry
metadata:
  name: docker-io
spec:
  url: docker.io
`);

    expect(result.errors).toEqual([]);
    expect(result.resources.map((resource) => resource.kind)).toEqual([
      "Registry",
      "Model",
      "RuntimeClass",
      "MicroserviceTemplate",
      "Microservice",
    ]);
  });
});
