import React from "react";
import { useController } from "@/app/providers";
import { useFeedback } from "@/app/providers";
import { useData } from "@/app/providers";
import { buildMicroserviceTemplateDeployBody } from "./microserviceTemplateDeploy";

const formStyles = {
  container: "h-full flex flex-col bg-gray-800 text-white",
  formContent: "flex-1 overflow-y-auto p-4 space-y-2",
  formRow:
    "flex items-center space-x-3 py-1.5 border-b border-gray-700 last:border-b-0",
  label: "w-36 text-sm font-medium text-gray-300 flex-shrink-0",
  inputContainer: "w-48 flex-shrink-0",
  input:
    "w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent",
  select:
    "w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent",
  description: "flex-1 text-xs text-gray-400 italic min-w-0",
};

type VariableField = {
  value: string | number;
  defaultValue: unknown;
  description?: string;
  key: string;
  placeholder: string;
  type: string;
  readOnly?: boolean;
};

const mapVariables = (template: any): Record<string, VariableField> => {
  const variables = template?.variables || [];
  if (!Array.isArray(variables)) {
    return {};
  }
  return variables.reduce((acc: Record<string, VariableField>, v: any) => {
    let defaultValue: unknown = "";
    if (v.defaultValue !== undefined && v.defaultValue !== null) {
      try {
        defaultValue = JSON.parse(v.defaultValue);
      } catch {
        defaultValue = v.defaultValue;
      }
    }

    acc[v.key] = {
      value: "",
      defaultValue,
      description: v.description,
      key: v.key,
      placeholder:
        defaultValue !== undefined && defaultValue !== null && defaultValue !== ""
          ? `Default: ${defaultValue}`
          : "",
      type: "text",
    };

    if (defaultValue !== undefined && defaultValue !== null) {
      acc[v.key].type = typeof defaultValue;
      if (acc[v.key].type === "string") {
        acc[v.key].type = "text";
      }
      if (acc[v.key].type === "number") {
        acc[v.key].placeholder = `Default: ${defaultValue}`;
      }
    }
    if (acc[v.key].type !== "text" && acc[v.key].type !== "number") {
      acc[v.key].readOnly = true;
    }
    return acc;
  }, {});
};

type DeployMicroserviceTemplateProps = {
  template: any;
  close: () => void;
  onDeploy?: (deployData: {
    deploy: () => Promise<void>;
    deployApplication: () => Promise<void>;
    isValid: boolean;
    loading: boolean;
  }) => void;
};

export default function DeployMicroserviceTemplate({
  template,
  close,
  onDeploy,
}: DeployMicroserviceTemplateProps) {
  const [variables, setVariables] = React.useState(() => mapVariables(template));
  const [instanceName, setInstanceName] = React.useState("");
  const [application, setApplication] = React.useState("");
  const [agentName, setAgentName] = React.useState("");
  const { pushFeedback } = useFeedback();
  const { request } = useController();
  const { data, refreshData } = useData();
  const [loading, setLoading] = React.useState(false);

  const applications = Array.isArray(data?.applications)
    ? data.applications
    : [];
  const agents = Object.values(data?.reducedAgents?.byUUID || {}) as Array<{
    uuid?: string;
    name?: string;
  }>;

  const isValid = Boolean(instanceName && application && agentName);

  const deployMicroservice = React.useCallback(async () => {
    if (!instanceName) {
      pushFeedback({ message: "Instance name is required", type: "error" });
      return;
    }
    if (!application) {
      pushFeedback({ message: "Application is required", type: "error" });
      return;
    }
    if (!agentName) {
      pushFeedback({ message: "Agent is required", type: "error" });
      return;
    }

    const variableValues = Object.keys(variables).reduce(
      (acc: Record<string, string | number>, key) => {
        acc[key] = variables[key].value;
        return acc;
      },
      {},
    );

    try {
      setLoading(true);
      const res = await request("/api/v3/microservices", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(
          buildMicroserviceTemplateDeployBody({
            templateName: template.name,
            instanceName,
            application,
            agentName,
            variables: variableValues,
          }),
        ),
      });
      if (!res.ok) {
        try {
          const error = await res.json();
          pushFeedback({ message: error.message, type: "error" });
        } catch {
          pushFeedback({
            message: res.message || "Failed to deploy microservice",
            type: "error",
          });
        }
        setLoading(false);
        return;
      }
      pushFeedback({ message: "Microservice deployed!", type: "success" });
      if (refreshData) {
        await refreshData();
      }
      setLoading(false);
      close();
    } catch (e: any) {
      setLoading(false);
      pushFeedback({ message: e.message, type: "error" });
    }
  }, [
    agentName,
    application,
    close,
    instanceName,
    pushFeedback,
    refreshData,
    request,
    template.name,
    variables,
  ]);

  React.useEffect(() => {
    if (onDeploy) {
      onDeploy({
        deploy: deployMicroservice,
        deployApplication: deployMicroservice,
        isValid,
        loading,
      });
    }
  }, [deployMicroservice, isValid, loading, onDeploy]);

  const handleChange = (key: string, value: string) => {
    setVariables((current) => ({
      ...current,
      [key]: {
        ...current[key],
        value: current[key].type === "number" ? +value : value,
      },
    }));
  };

  return (
    <div className={formStyles.container}>
      <div className={formStyles.formContent}>
        <div className={formStyles.formRow}>
          <div className={formStyles.label}>Instance Name:</div>
          <div className={formStyles.inputContainer}>
            <input
              className={formStyles.input}
              type="text"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Enter instance name"
            />
          </div>
          <div className={formStyles.description}>
            Name for the deployed microservice instance
          </div>
        </div>

        <div className={formStyles.formRow}>
          <div className={formStyles.label}>Application:</div>
          <div className={formStyles.inputContainer}>
            <select
              className={formStyles.select}
              value={application}
              onChange={(e) => setApplication(e.target.value)}
            >
              <option value="">Select an application</option>
              {applications.map((app: { name?: string }) => (
                <option key={app.name} value={app.name}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.description}>
            Application that will own this microservice
          </div>
        </div>

        <div className={formStyles.formRow}>
          <div className={formStyles.label}>Agent:</div>
          <div className={formStyles.inputContainer}>
            <select
              className={formStyles.select}
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.uuid || agent.name} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.description}>
            Fog node that will run this instance
          </div>
        </div>

        {Object.keys(variables).map((key) => {
          const v = variables[key];
          if (v.readOnly) {
            return (
              <div className={formStyles.formRow} key={key}>
                <div className={formStyles.label}>{key}:</div>
                <div className={formStyles.inputContainer}>
                  <div className="text-gray-400 text-sm">
                    Variable <strong>{key}</strong> is not configurable
                  </div>
                </div>
                <div className={formStyles.description}>
                  Default: <strong>{JSON.stringify(v.defaultValue)}</strong>
                </div>
              </div>
            );
          }
          return (
            <div className={formStyles.formRow} key={key}>
              <div className={formStyles.label}>{key}:</div>
              <div className={formStyles.inputContainer}>
                <input
                  className={formStyles.input}
                  type={v.type}
                  value={v.value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={v.placeholder}
                />
              </div>
              <div className={formStyles.description}>{v.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
