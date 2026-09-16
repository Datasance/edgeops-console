export type MicroserviceTemplateDeployInput = {
  templateName: string;
  instanceName: string;
  application: string;
  agentName: string;
  variables: Record<string, string | number>;
};

export type MicroserviceTemplateDeployBody = {
  name: string;
  application: string;
  agentName: string;
  template: {
    name: string;
    variables: Record<string, string | number>;
  };
};

export function buildMicroserviceTemplateDeployBody(
  input: MicroserviceTemplateDeployInput,
): MicroserviceTemplateDeployBody {
  const variables: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(input.variables || {})) {
    if (value === "" || value == null) {
      continue;
    }
    variables[key] = value;
  }

  return {
    name: input.instanceName,
    application: input.application,
    agentName: input.agentName,
    template: {
      name: input.templateName,
      variables,
    },
  };
}
