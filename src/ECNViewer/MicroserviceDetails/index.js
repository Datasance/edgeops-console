/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable default-case */
import React from "react";

import ReactJson from "../../Utils/ReactJson";
import {
  Paper,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  useMediaQuery,
  CircularProgress,
  useTheme,
  Box,
} from "@mui/material";

import { useData } from "../../providers/Data";
import getSharedStyle from "../sharedStyles";

import { icons, dateFormat, MiBFactor, prettyBytes } from "../utils";
import moment from "moment";
import lget from "lodash/get";
import Status, { MsvcStatus } from "../../Utils/Status";

import SearchBar from "../../Utils/SearchBar";
import Modal from "../../Utils/Modal";
import { useController } from "../../ControllerProvider";
import { useFeedback } from "../../Utils/FeedbackContext";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/mode-yaml";
import yaml from "js-yaml";
import {
  CANONICAL_DISPLAY_CONTROLLER_API_VERSION,
  isAllowedControllerApiVersion,
  invalidControllerApiVersionMessage,
} from "../../Utils/constants";
import { parseMicroservice } from "../../Utils/ApplicationParser";
import { appendImageToYamlAcc } from "../../Utils/imageArchYAML";

export default function MicroserviceDetails({
  microservice: selectedMicroservice,
  selectApplication,
  selectAgent,
  back,
}) {
  const { data } = useData();
  const theme = useTheme();
  const sharedSx = getSharedStyle(theme);
  const sx = {
    ...sharedSx,
    containerWithButtons: {
      display: "flex",
      placeContent: "space-between",
    },
    addnewButtonArea: { display: "flex" },
    volumesArea: { display: "flex", alignItems: "center" },
    container: { display: "flex", justifyContent: "end" },
    rebootAndDeleteArea: { display: "flex", justifyContent: "end" },
    copyButton: { display: "inline-block" },
  };
  const [openDeleteMicroserviceDialog, setOpenDeleteMicroserviceDialog] =
    React.useState(false);
  const [openDetailsModal, setOpenDetailsModal] = React.useState(false);
  const [envFilter, setEnvFilter] = React.useState("");
  const [volumeFilter, setVolumeFilter] = React.useState("");
  const [hostFilter, sethostFilter] = React.useState("");
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const [openRebootAgentDialog, setOpenRebootAgentDialog] =
    React.useState(false);
  const {
    microservices,
    reducedAgents,
    reducedApplications,
    systemApplications,
  } = data;
  const microservice =
    (microservices || []).find((a) => selectedMicroservice.uuid === a.uuid) ||
    selectedMicroservice; // Get live updates from data
  const agent = reducedAgents.byUUID[microservice.iofogUuid];

  const [editorIsChanged, setEditorIsChanged] = React.useState(false);
  const [
    openChangeYamlMicroserviceDialog,
    setOpenChangeYamlMicroserviceDialog,
  ] = React.useState(false);
  const [copyText, setcopyText] = React.useState("Copy All");
  const [editorDataChanged, setEditorDataChanged] = React.useState(false);
  const [fileParsing, setFileParsing] = React.useState(false);

  const _getMicroserviceImage = (m) => {
    if (!agent) {
      return "--";
    }
    const images = m?.images;
    if (!Array.isArray(images)) {
      return "--";
    }
    for (const img of images) {
      if (img.archId === agent.archId) {
        return img.containerImage ?? "--";
      }
    }
    return "--";
  };

  const env = microservice.env.filter(
    (e) =>
      lget(e, "key", "").toLowerCase().includes(envFilter) ||
      lget(e, "value", "").toString().toLowerCase().includes(envFilter),
  );
  if (!env.length > 0) {
    env.push({});
  }
  const volumes = reducedApplications.byName[
    microservice.application
  ].microservices
    .find((a) => selectedMicroservice.uuid === a.uuid)
    .volumeMappings.filter(
      (vm) =>
        lget(vm, "hostDestination", "").toLowerCase().includes(volumeFilter) ||
        lget(vm, "containerDestination", "")
          .toLowerCase()
          .includes(volumeFilter) ||
        lget(vm, "accessMode", "").toLowerCase().includes(volumeFilter) ||
        lget(vm, "type", "").toLowerCase().includes(volumeFilter),
    );

  const ports =
    reducedApplications.byName[microservice.application].microservices.find(
      (a) => selectedMicroservice.uuid === a.uuid,
    ).ports.length > 0
      ? reducedApplications.byName[microservice.application].microservices.find(
          (a) => selectedMicroservice.uuid === a.uuid,
        ).ports
      : [];
  const extraHosts = microservice.extraHosts.filter(
    (e) =>
      lget(e, "name", "").toLowerCase().includes(hostFilter) ||
      lget(e, "value", "").toLowerCase().includes(hostFilter) ||
      lget(e, "address", "").toLowerCase().includes(hostFilter),
  );
  if (!extraHosts.length > 0) {
    extraHosts.push({});
  }

  const application = reducedApplications.byName[microservice.application];

  const mainActions = (
    <Box sx={sx.actions} style={{ minWidth: 0 }}>
      <Box
        component="span"
        sx={sx.action}
        onClick={() => setOpenDeleteMicroserviceDialog(true)}
        title="Delete application"
      >
        <icons.DeleteIcon size={20} />
      </Box>
    </Box>
  );

  const detailActions = (
    <Box sx={sx.actions} style={{ minWidth: 0 }}>
      <Box
        component="span"
        sx={sx.action}
        onClick={() => setOpenDetailsModal(true)}
        title="Details"
      >
        <icons.CodeIcon size={20} />
      </Box>
    </Box>
  );

  const { request } = useController();
  const { pushFeedback } = useFeedback();

  const [openAddPortMicroserviceDialog, setOpenAddPortMicroserviceDialog] =
    React.useState(false);
  const [openDeletePortDialog, setOpenDeletePortDialog] = React.useState(false);
  const [selectedPortObject, setselectedPortObject] = React.useState({});

  const [
    openAddVolumeMappingMicroserviceDialog,
    setOpenAddVolumeMappingMicroserviceDialog,
  ] = React.useState(false);
  const [openDeleteVolumeMappingDialog, setOpenDeleteVolumeMappingDialog] =
    React.useState(false);
  const [selectedVolumeMappingObject, setselectedVolumeMappingObject] =
    React.useState({});

  const newPortArray = {
    internal: 0,
    external: 0,
    protocol: "tcp",
  };
  const [PortManipulatedData, setPortManipulatedData] =
    React.useState(newPortArray);

  const newVolumeMappingArray = {
    hostDestination: "/var/dest",
    containerDestination: "/var/dest",
    accessMode: "rw",
    type: "bind",
  };
  const [VolumeMappingManipulatedData, setVolumeMappingManipulatedData] =
    React.useState(newVolumeMappingArray);

  async function deleteMicroServiceFunction() {
    if (selectedPortObject !== undefined) {
      try {
        const res = await request(
          `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some((x) => x.name === selectedMicroservice.application) ? `system/` : ""}${selectedMicroservice.uuid}`,
          {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
          },
        );
        if (!res.ok) {
          pushFeedback({ message: res.message, type: "error" });
          setOpenAddPortMicroserviceDialog(false);
        } else {
          pushFeedback({ message: "Microservice Deleted", type: "success" });
          setOpenAddPortMicroserviceDialog(false);
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: "error", uuid: "error" });
        setOpenAddPortMicroserviceDialog(false);
      }
    }
  }

  async function addPortFunction() {
    try {
      const res = await request(
        `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some((x) => x.name === selectedMicroservice.application) ? `system/` : ""}${selectedMicroservice.uuid}/port-mapping`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(PortManipulatedData?.updated_src),
        },
      );
      if (!res.ok) {
        pushFeedback({ message: res.message, type: "error" });
      } else {
        pushFeedback({ message: "Controller Updated", type: "success" });
        setOpenAddPortMicroserviceDialog(false);
        setPortManipulatedData(newPortArray);
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

  async function deletePortFunction() {
    if (selectedPortObject !== undefined) {
      try {
        const res = await request(
          `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some((x) => x.name === selectedMicroservice.application) ? `system/` : ""}${selectedMicroservice.uuid}/port-mapping/${selectedPortObject?.internal}`,
          {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
          },
        );
        if (!res.ok) {
          pushFeedback({ message: res.message, type: "error" });
        } else {
          pushFeedback({ message: "Controller Updated", type: "success" });
          setOpenDeletePortDialog(false);
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: "error", uuid: "error" });
      }
    }
  }

  async function addVolumeMappingFunction() {
    try {
      const res = await request(
        `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some((x) => x.name === selectedMicroservice.application) ? `system/` : ""}${selectedMicroservice.uuid}/volume-mapping`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(
            VolumeMappingManipulatedData?.updated_src !== undefined
              ? VolumeMappingManipulatedData?.updated_src
              : newVolumeMappingArray,
          ),
        },
      );
      if (!res.ok) {
        pushFeedback({ message: res.message, type: "error" });
      } else {
        pushFeedback({ message: "Controller Updated", type: "success" });
        setOpenAddVolumeMappingMicroserviceDialog(false);
        setVolumeMappingManipulatedData(newVolumeMappingArray);
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
    }
  }

  async function deleteVolumeMappingFunction() {
    if (selectedVolumeMappingObject?.id !== undefined) {
      try {
        const res = await request(
          `/api/v3/microservices/${systemApplications.length > 0 && systemApplications.some((x) => x.name === selectedMicroservice.application) ? `system/` : ""}${selectedMicroservice.uuid}/volume-mapping/${selectedVolumeMappingObject?.id}`,
          {
            method: "DELETE",
            headers: {
              "content-type": "application/json",
            },
          },
        );
        if (!res.ok) {
          pushFeedback({ message: res.message, type: "error" });
        } else {
          pushFeedback({ message: "Controller Updated", type: "success" });
          setOpenDeleteVolumeMappingDialog(false);
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: "error", uuid: "error" });
      }
    }
  }

  function unsecuredCopyFunction(textToCopy) {
    const textarea = document.createElement("textarea");
    textarea.value = textToCopy;

    // Move the textarea outside the viewport to make it invisible
    textarea.style.position = "absolute";
    textarea.style.left = "-99999999px";

    document.body.prepend(textarea);

    // highlight the content of the textarea element
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.log(err);
    } finally {
      textarea.remove();
    }
    setcopyText("Copy All");
  }

  const _getApplicationYAMLFromJSON = (app) => {
    return {
      apiVersion: CANONICAL_DISPLAY_CONTROLLER_API_VERSION,
      kind: "Microservice",
      metadata: {
        name: app.name,
      },
      spec: {
        uuid: app.uuid,
        name: app.name,
        agent: {
          name: agent?.name,
        },
        images: (app.images || []).reduce(
          (acc, image) => appendImageToYamlAcc(acc, image),
          {
            registry: app.registryId,
            catalogId: app.catalogItemId,
          },
        ),
        container: {
          annotations: JSON.parse(app?.annotations),
          hostNetworkMode: app.hostNetworkMode,
          isPrivileged: app.isPrivileged,
          runAsUser: app?.runAsUser,
          platform: app?.platform,
          runtime: app?.runtime,
          cdiDevices: app?.cdiDevices !== undefined ? app?.cdiDevices : [],
          capAdd: app?.capAdd !== undefined ? app?.capAdd : [],
          capDrop: app?.capDrop !== undefined ? app?.capDrop : [],
          volumes: app.volumeMappings.map((vm) => {
            delete vm.id;
            return vm;
          }),
          env: app.env.map((env) => {
            delete env.id;
            return env;
          }),
          extraHosts: app.extraHosts.map((eH) => {
            delete eH.id;
            return eH;
          }),
          ports: app.ports.map((p) => {
            if (p.host) {
              p.host = (reducedAgents.byUUID[p.host] || { name: p.host }).name;
            }
            return p;
          }),
          commands: app.cmd.map((cmd) => {
            delete cmd.id;
            return cmd;
          }),
        },
        natsConfig: {
          natsAccess: app?.natsConfig?.natsAccess ?? app?.natsAccess,
          ...(app?.natsConfig?.natsRule && {
            natsRule: app.natsConfig.natsRule,
          }),
        },
        config: JSON.parse(app?.config),
        application: app?.application,
        rebuild: app?.rebuild,
      },
    };
  };

  const yamlDump = React.useMemo(
    () => yaml.dump(_getApplicationYAMLFromJSON(microservice)),
    [microservice],
  );

  const parseMicroserviceFile = async (doc) => {
    if (!isAllowedControllerApiVersion(doc.apiVersion)) {
      return [{}, invalidControllerApiVersionMessage(doc.apiVersion)];
    }
    if (doc.kind !== "Microservice") {
      return [{}, `Invalid kind ${doc.kind}`];
    }
    if (!doc.metadata || !doc.spec) {
      return [{}, "Invalid YAML format"];
    }
    let tempObject = await parseMicroservice(doc.spec);
    const microserviceData = {
      name: lget(doc, "metadata.name", undefined),
      ...tempObject,
    };
    return [microserviceData];
  };

  async function yamlChangesSave(item) {
    setFileParsing(true);
    if (item) {
      try {
        const doc = yaml.load(item);
        const [microserviceData, err] = await parseMicroserviceFile(doc);
        if (err) {
          setFileParsing(false);
          setOpenChangeYamlMicroserviceDialog(false);
          return pushFeedback({ message: err, type: "error" });
        }
        const newMicroservice = microserviceData;
        const res = await deployMicroservice(newMicroservice);
        if (!res.ok) {
          try {
            const error = await res.json();
            pushFeedback({ message: error.message, type: "error" });
            setFileParsing(false);
            setOpenChangeYamlMicroserviceDialog(false);
          } catch (e) {
            pushFeedback({ message: res.message, type: "error" });
            setFileParsing(false);
            setOpenChangeYamlMicroserviceDialog(false);
          }
        } else {
          pushFeedback({ message: "Microservice updated!", type: "success" });
          setFileParsing(false);
          setOpenChangeYamlMicroserviceDialog(false);
        }
      } catch (e) {
        pushFeedback({ message: e.message, type: "error" });
        setFileParsing(false);
        setOpenChangeYamlMicroserviceDialog(false);
      }
    }
  }

  const deployMicroservice = async (microservice) => {
    let isSystem =
      systemApplications.length > 0 &&
      systemApplications.some(
        (x) => x.name === selectedMicroservice.application,
      );
    const url = `/api/v3/microservices/${isSystem ? `system/` : ""}${`${selectedMicroservice.uuid}`}`;
    try {
      const res = await request(url, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(microservice),
      });
      return res;
    } catch (e) {
      pushFeedback({ message: e.message, type: "error" });
    }
  };

  const rebootActions = (
    <Box sx={sx.actions} style={{ minWidth: "unset", marginRight: "0.3rem" }}>
      <Box
        component="span"
        sx={sx.action}
        onClick={() => setOpenRebootAgentDialog(true)}
        title="Reboot Agent"
      >
        <icons.ReplayIcon size={20} />
      </Box>
    </Box>
  );

  async function rebootAgent() {
    try {
      let isSystem =
        systemApplications.length > 0 &&
        systemApplications.some(
          (x) => x.name === selectedMicroservice.application,
        );
      const res = await request(
        `/api/v3/microservices/${isSystem ? `system/` : ""}${selectedMicroservice.uuid}/rebuild`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
        },
      );
      if (!res.ok) {
        pushFeedback({ message: res.message, type: "error" });
        setOpenRebootAgentDialog(false);
      } else {
        pushFeedback({ message: "Microservice Rebuilt", type: "success" });
        setOpenRebootAgentDialog(false);
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: "error", uuid: "error" });
      setOpenRebootAgentDialog(false);
    }
  }

  return (
    <>
      <Paper className="section first" sx={sx.multiSections}>
        <Box className="paper-container-left" sx={[sx.section, sx.bottomPad]}>
          <Typography variant="subtitle2" sx={sx.title}>
            <span>Status</span>
            {!isMediumScreen && mainActions}
          </Typography>
          <Box
            component="span"
            sx={sx.text}
            style={{ display: "flex", alignItems: "center" }}
          >
            <MsvcStatus
              status={microservice.status.status}
              style={{ marginRight: "5px", marginTop: "-3px" }}
            />
            {microservice.status.status}
            {microservice.status.status === "PULLING" &&
              ` (${microservice.status.percentage.toFixed(2)}%)`}
          </Box>
          {microservice.status.errorMessage && (
            <Box component="span" sx={sx.subTitle}>
              Error:{" "}
              <Box component="span" sx={sx.text}>
                {microservice.status.errorMessage}
              </Box>
            </Box>
          )}
        </Box>
        <Box sx={sx.sectionDivider} />
        <Box
          className="paper-container-right"
          sx={sx.section}
          style={{ paddingBottom: "15px" }}
        >
          <Typography variant="subtitle2" sx={sx.title}>
            <span>Description</span>
            <Box sx={sx.rebootAndDeleteArea}>
              {isMediumScreen && rebootActions}
              {isMediumScreen && mainActions}
            </Box>
          </Typography>
          <Box component="span" sx={sx.text}>
            {microservice.description}
          </Box>
        </Box>
      </Paper>
      <Paper className="section" sx={sx.multiSections}>
        <Box className="paper-container-left" sx={sx.section}>
          <Typography variant="subtitle2" sx={sx.title}>
            <span>Microservices Details</span>
            {!isMediumScreen && detailActions}
          </Typography>
          <Box sx={sx.subSection}>
            <Box component="span" sx={sx.subTitle}>
              Image
            </Box>
            <Box component="span" sx={sx.text}>
              {_getMicroserviceImage(microservice)}
            </Box>
          </Box>
          <Box sx={sx.subSection}>
            <Box component="span" sx={sx.subTitle}>
              Application
            </Box>
            <Box
              component="span"
              sx={[sx.text, sx.action]}
              onClick={() => selectApplication(application)}
            >
              <span style={{ display: "flex", alignItems: "center" }}>
                <Status
                  status={application?.isActivated ? "RUNNING" : "UNKNOWN"}
                  size={10}
                  style={{ marginRight: "5px", "--pulse-size": "5px" }}
                />
                <span />
                {application.name}
              </span>
            </Box>
          </Box>
          <Box sx={sx.subSection}>
            <Box component="span" sx={sx.subTitle}>
              Agent
            </Box>
            {agent ? (
              <Box
                component="span"
                sx={[sx.text, sx.action]}
                onClick={() => selectAgent(agent)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>
                  <Status
                    status={agent.daemonStatus}
                    size={10}
                    style={{ marginRight: "5px", "--pulse-size": "5px" }}
                  />
                  <span />
                  {agent.name}
                </span>
              </Box>
            ) : (
              ""
            )}
          </Box>
          <Box sx={sx.subSection}>
            <Box component="span" sx={sx.subTitle}>
              Created at
            </Box>
            <Box component="span" sx={sx.text}>
              {moment(microservice.createdAt).format(dateFormat)}
            </Box>
          </Box>
        </Box>
        <Box sx={sx.sectionDivider} />
        <Box
          className="paper-container-right"
          sx={sx.section}
          style={{ paddingBottom: "15px" }}
        >
          <Typography variant="subtitle2" sx={sx.title}>
            <span>Resources Utilization</span>
            {isMediumScreen && detailActions}
          </Typography>
          <Box sx={sx.subSection}>
            <Box component="span" sx={sx.subTitle}>
              CPU Usage
            </Box>
            <Box component="span" sx={sx.text}>
              {(microservice.status.cpuUsage * 1).toFixed(2) + "%"}
            </Box>
          </Box>
          <Box sx={sx.subSection}>
            <Box component="span" sx={sx.subTitle}>
              Memory Usage
            </Box>
            <Box component="span" sx={sx.text}>{`${prettyBytes(
              microservice.status.memoryUsage || 0 * MiBFactor,
            )} / ${prettyBytes(agent.systemAvailableMemory || 0)} (${(
              (microservice.status.memoryUsage / agent.systemAvailableMemory) *
                100 || 0
            ).toFixed(2)}%)`}</Box>
          </Box>
        </Box>
      </Paper>
      <Paper className="section">
        <div className="section-container">
          <div
            className="paper-container-left paper-container-right"
            sx={[sx.section, sx.cardTitle]}
          >
            <Box sx={sx.containerWithButtons}>
              <Typography variant="subtitle2" sx={sx.title}>
                <Box component="span" sx={sx.stickyLeft}>
                  Ports
                </Box>
              </Typography>
              <Box sx={sx.addnewButtonArea}>
                <Button
                  color="primary"
                  onClick={() => setOpenAddPortMicroserviceDialog(true)}
                >
                  {`Add New`}
                </Button>
              </Box>
            </Box>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Internal
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  External
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Protocol
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  PublicLink
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ports.length > 0
                ? ports.map((p) => (
                    <TableRow key={p.external} hover sx={sx.tableRowHover}>
                      <TableCell component="th" scope="row">
                        {p.internal}
                      </TableCell>
                      <TableCell>{p.external}</TableCell>
                      <TableCell>
                        {p.protocol
                          ? p.protocol === "udp"
                            ? p.protocol
                            : "tcp"
                          : ""}
                      </TableCell>
                      <TableCell>
                        <a
                          sx={sx.link}
                          href={p.public?.links?.join(",")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {p.public?.links?.join(",")}
                        </a>
                      </TableCell>
                      <TableCell>
                        <icons.DeleteIcon
                          onClick={() => {
                            setselectedPortObject(p);
                            setOpenDeletePortDialog(true);
                          }}
                          sx={sx.action}
                          title="Delete application"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className="section">
        <div className="section-container">
          <div
            className="paper-container-left paper-container-right"
            sx={[sx.section, sx.cardTitle]}
          >
            <Typography variant="subtitle2" sx={sx.title}>
              <Box component="span" sx={sx.stickyLeft}>
                Volumes
              </Box>
              <Box sx={sx.volumesArea}>
                <SearchBar
                  onSearch={setVolumeFilter}
                  inputClasses={{ root: sx.narrowSearchBar }}
                  classes={{ root: sx.stickyRight }}
                />
                <Button
                  color="primary"
                  onClick={() =>
                    setOpenAddVolumeMappingMicroserviceDialog(true)
                  }
                >
                  {`Add New`}
                </Button>
              </Box>
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Host
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Container
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Acces Mode
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Type
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {volumes?.length > 0
                ? volumes?.map((p) => (
                    <TableRow
                      key={p.containerDestination}
                      hover
                      sx={sx.tableRowHover}
                    >
                      <TableCell component="th" scope="row">
                        {p.hostDestination}
                      </TableCell>
                      <TableCell>{p.containerDestination}</TableCell>
                      <TableCell>{p.accessMode}</TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell>
                        <icons.DeleteIcon
                          onClick={() => {
                            setselectedVolumeMappingObject(p);
                            setOpenDeleteVolumeMappingDialog(true);
                          }}
                          sx={sx.action}
                          title="Delete volume"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className="section">
        <div className="section-container">
          <div
            className="paper-container-left paper-container-right"
            sx={[sx.section, sx.cardTitle]}
          >
            <Typography variant="subtitle2" sx={sx.title}>
              <Box component="span" sx={sx.stickyLeft}>
                Environment variables
              </Box>
              <SearchBar
                onSearch={setEnvFilter}
                inputClasses={{ root: sx.narrowSearchBar }}
                classes={{ root: sx.stickyRight }}
              />
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px", maxWidth: "200px" }}
                >
                  Key
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px", maxWidth: "200px" }}
                >
                  Value
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {env.map((p) => (
                <TableRow key={p.key} hover sx={sx.tableRowHover}>
                  <TableCell
                    component="th"
                    scope="row"
                    style={{ maxWidth: "200px" }}
                  >
                    {p.key}
                  </TableCell>
                  <TableCell
                    style={{ maxWidth: "200px", wordWrap: "break-word" }}
                  >
                    {p.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper className="section">
        <div className="section-container">
          <div
            className="paper-container-left paper-container-right"
            sx={[sx.section, sx.cardTitle]}
          >
            <Typography variant="subtitle2" sx={sx.title}>
              <Box component="span" sx={sx.stickyLeft}>
                Extra hosts
              </Box>
              <SearchBar
                onSearch={sethostFilter}
                inputClasses={{ root: sx.narrowSearchBar }}
                classes={{ root: sx.stickyRight }}
              />
            </Typography>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Address
                </TableCell>
                <TableCell
                  sx={[sx.tableTitle, sx.stickyHeaderCell]}
                  style={{ top: "54px" }}
                >
                  Value
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {extraHosts.map((p) => (
                <TableRow key={p.name} hover sx={sx.tableRowHover}>
                  <TableCell component="th" scope="row">
                    {p.name}
                  </TableCell>
                  <TableCell>{p.address}</TableCell>
                  <TableCell>{p.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
      <Paper
        className="section"
        style={{ maxHeight: "800px", paddingBottom: "15px" }}
      >
        <div
          className="paper-container-left paper-container-right"
          sx={sx.section}
        >
          <Typography variant="subtitle2" sx={sx.title} style={{ zIndex: 5 }}>
            Microservice YAML
          </Typography>

          <Box sx={sx.container}>
            {editorIsChanged ? (
              <Box sx={sx.copyButton}>
                <Button
                  onClick={() => {
                    setOpenChangeYamlMicroserviceDialog(true);
                  }}
                >
                  {`Save Changes`}
                </Button>
              </Box>
            ) : null}
            <Box sx={sx.copyButton}>
              <Button
                autoFocus
                onClick={() => {
                  setcopyText("Copied");
                  unsecuredCopyFunction(
                    !editorDataChanged ? yamlDump : editorDataChanged,
                  );
                }}
              >
                {copyText}
              </Button>
            </Box>
          </Box>
          <AceEditor
            setOptions={{ useWorker: false, tabSize: 2 }}
            mode="yaml"
            theme="tomorrow"
            defaultValue={yamlDump}
            onLoad={function (editor) {
              editor.renderer.setPadding(10);
              editor.renderer.setScrollMargin(10);
            }}
            style={{
              width: "100%",
              height: "700px",
              borderRadius: "4px",
            }}
            change
            onChange={function editorChanged(editor) {
              setEditorIsChanged(true);
              setEditorDataChanged(editor);
            }}
          />
        </div>
      </Paper>
      <Dialog
        open={openDeleteMicroserviceDialog}
        onClose={() => {
          setOpenDeleteMicroserviceDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Delete {microservice.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteMicroserviceDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteMicroServiceFunction()}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Modal
        {...{
          open: openDetailsModal,
          title: `${microservice.name} details`,
          onClose: () => setOpenDetailsModal(false),
          size: "lg",
        }}
      >
        <ReactJson title="Microservice" src={microservice} name={false} />
      </Modal>

      <Dialog
        open={openAddPortMicroserviceDialog}
        onClose={() => {
          setOpenAddPortMicroserviceDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Add Port for {microservice.name}
        </DialogTitle>
        <DialogContent>
          {/* <DialogContentText id="alert-dialog-description">
            <span>You must fill all detail for port</span>
          </DialogContentText> */}
          <ReactJson
            title="Agent"
            src={
              PortManipulatedData?.updated_src !== undefined
                ? PortManipulatedData?.updated_src
                : newPortArray
            }
            name={false}
            reactJsonViewOnEdit={setPortManipulatedData}
            copyButtonEnable
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenAddPortMicroserviceDialog(false);
              setPortManipulatedData(newPortArray);
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => addPortFunction()} color="primary" autoFocus>
            Add Port
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeletePortDialog}
        onClose={() => {
          setOpenDeletePortDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Delete Port {selectedPortObject.internal}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeletePortDialog(false)}>Cancel</Button>
          <Button
            onClick={() => deletePortFunction()}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAddVolumeMappingMicroserviceDialog}
        onClose={() => {
          setOpenAddVolumeMappingMicroserviceDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Add Volume for {microservice.name}
        </DialogTitle>
        <DialogContent>
          {/* <DialogContentText id="alert-dialog-description">
            <span>You must fill all detail for port</span>
          </DialogContentText> */}
          <ReactJson
            title="Volume"
            src={
              VolumeMappingManipulatedData?.updated_src !== undefined
                ? VolumeMappingManipulatedData?.updated_src
                : newVolumeMappingArray
            }
            name={false}
            reactJsonViewOnEdit={setVolumeMappingManipulatedData}
            copyButtonEnable
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenAddVolumeMappingMicroserviceDialog(false);
              setVolumeMappingManipulatedData(newVolumeMappingArray);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => addVolumeMappingFunction()}
            color="primary"
            autoFocus
          >
            Add Volume
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openDeleteVolumeMappingDialog}
        onClose={() => {
          setOpenDeleteVolumeMappingDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Delete Voulme {selectedVolumeMappingObject?.hostDestination}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>This is not reversible.</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteVolumeMappingDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteVolumeMappingFunction()}
            color="secondary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openChangeYamlMicroserviceDialog}
        onClose={() => {
          setOpenChangeYamlMicroserviceDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Update {microservice.name} deployment yaml?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {fileParsing ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress color="primary" size={24} />
              </div>
            ) : (
              <>
                <span>
                  Updating a yaml file will update/reinstall/reconfigure{" "}
                  <b>{microservice.name}</b>.
                </span>
                <br />
                <br />
                <span>Do you want to proceed ?</span>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <>
            {fileParsing ? null : (
              <>
                <Button
                  onClick={() => setOpenChangeYamlMicroserviceDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    yamlChangesSave(editorDataChanged);
                  }}
                  color="primary"
                  autoFocus
                >
                  Confirm
                </Button>
              </>
            )}
          </>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openRebootAgentDialog}
        onClose={() => {
          setOpenRebootAgentDialog(false);
        }}
      >
        <DialogTitle id="alert-dialog-title">
          Rebuild {selectedMicroservice.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <span>Do you want to rebuild your microservice</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRebootAgentDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => rebootAgent()} color="primary" autoFocus>
            Reboot
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
