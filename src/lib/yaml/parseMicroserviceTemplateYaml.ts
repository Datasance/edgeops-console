import lget from "lodash/get";
import {
  CANONICAL_DISPLAY_CONTROLLER_API_VERSION,
  isAllowedControllerApiVersion,
  invalidControllerApiVersionMessage,
} from "@/lib/constants/constants";
import { parseMicroservice } from "./ApplicationParser";
import {
  buildMicroserviceYamlFields,
  dumpAnnotatedYaml,
} from "./microserviceYAML";

const IDENTITY_FIELDS = [
  "name",
  "application",
  "iofogUuid",
  "agentName",
  "flowId",
  "template",
];

const _deleteUndefinedFields = (obj: Record<string, unknown>) => {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
};

const stripInstanceIdentity = (microservice: Record<string, unknown>) => {
  const clone = { ...microservice };
  for (const field of IDENTITY_FIELDS) {
    delete clone[field];
  }
  return clone;
};

export const parseMicroserviceTemplateYaml = async (
  doc: any,
): Promise<[any, string | null]> => {
  if (!doc) {
    return [null, "Invalid YAML: Document is empty or null"];
  }

  if (!isAllowedControllerApiVersion(doc.apiVersion)) {
    return [null, invalidControllerApiVersionMessage(doc.apiVersion)];
  }

  if (doc.kind !== "MicroserviceTemplate") {
    return [null, `Invalid kind ${doc.kind}, expected MicroserviceTemplate`];
  }

  if (!doc.metadata || !doc.spec) {
    return [null, "Invalid YAML format (missing metadata or spec)"];
  }

  const name = lget(doc, "metadata.name");
  if (!name) {
    return [null, "Invalid YAML format (missing metadata.name)"];
  }

  const spec = lget(doc, "spec", {});
  if (
    !spec.microservice ||
    typeof spec.microservice !== "object" ||
    Array.isArray(spec.microservice)
  ) {
    return [null, "Invalid YAML format (missing spec.microservice)"];
  }

  const microservice = stripInstanceIdentity(
    await parseMicroservice(spec.microservice),
  );

  const apiObject: Record<string, unknown> = {
    name,
    description: spec.description,
    variables: spec.variables,
    microservice,
  };
  _deleteUndefinedFields(apiObject);

  return [apiObject, null];
};

const dumpVariables = (variables: unknown) => {
  if (!Array.isArray(variables)) {
    return variables;
  }
  return variables.map((variable: any) => ({
    key: variable.key,
    ...(variable.description != null && { description: variable.description }),
    ...(variable.defaultValue !== undefined && {
      defaultValue: variable.defaultValue,
    }),
  }));
};

export const dumpMicroserviceTemplateYaml = (template: any): string => {
  const microserviceSpec = buildMicroserviceYamlFields(
    template?.microservice || {},
    {
      includeName: false,
      includeUuid: false,
      includeApplication: false,
      includeAgent: false,
    },
  );

  const spec: Record<string, unknown> = {
    microservice: microserviceSpec,
  };
  if (template?.description != null && template.description !== "") {
    spec.description = template.description;
  }
  const variables = dumpVariables(template?.variables);
  if (variables != null) {
    spec.variables = variables;
  }

  return dumpAnnotatedYaml({
    apiVersion: CANONICAL_DISPLAY_CONTROLLER_API_VERSION,
    kind: "MicroserviceTemplate",
    metadata: {
      name: template?.name,
    },
    spec,
  });
};
