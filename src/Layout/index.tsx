import React from "react";
import {
  HashRouter,
  Route,
  NavLink,
  useLocation,
  Routes,
  Navigate,
} from "react-router-dom";
import {
  Settings as MiscellaneousServicesIcon,
  LogOut as ExitToAppIcon,
  LayoutDashboard as DashboardIcon,
  ChevronLeft as ChevronLeftSharp,
  ChevronRight as ChevronRightSharp,
  Network as Hub,
  Database as StorageRounded,
  Layers as LayersRounded,
  Calendar as EventIcon,
  SlidersHorizontal as TuneIcon,
  ShieldCheck as AccessControlIcon,
  Waypoints as MessageBusIcon,
} from "lucide-react";

import { useData } from "../providers/Data";
import { useController } from "../ControllerProvider";
import { useAuth } from "react-oidc-context";
import { useTerminal } from "../providers/Terminal/TerminalProvider";

import Dashboard from "../Dashboard";
import SwaggerDoc from "../swagger/SwaggerDoc";
import logomark from "../assets/potLogoWithWhiteText.svg";

import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { ProSidebarProvider } from "react-pro-sidebar";
import NodesList from "../Nodes/List";
import MicroservicesList from "../Workloads/Microservices";
import SystemMicroservicesList from "../Workloads/SystemMicroservices";
import ApplicationList from "../Workloads/Applications";
import SystemApplicationList from "../Workloads/SystemApplications";
import AppTemplates from "../DatasanceConfig/appTemplates/index";
import CatalogMicroservices from "../DatasanceConfig/catalogMicroservices";
import Registries from "../DatasanceConfig/registries";
import ConfigMaps from "../DatasanceConfig/configMaps";
import VolumeMounts from "../DatasanceConfig/volumeMounts";
import Secrets from "../DatasanceConfig/secret";
import Certificates from "../DatasanceConfig/certificates";
import Services from "../DatasanceConfig/services";
import PollingSettings from "../DatasanceConfig/pollingSettings";
import Map from "../ECNViewer/Map/Map";
import GlobalTerminalDrawer from "../CustomComponent/GlobalTerminalDrawer";
import Events from "../Events";
import Roles from "../AccessControl/roles";
import RoleBindings from "../AccessControl/rolebindings";
import ServiceAccounts from "../AccessControl/serviceaccounts";
import NatsAccountRules from "../AccessControl/natsAccountRules";
import NatsUserRules from "../AccessControl/natsUserRules";
import Operators from "../MessageBus/Operators";
import Accounts from "../MessageBus/Accounts";
import Users from "../MessageBus/Users";

const controllerJson = window.controllerConfig || null;

function resolveAdminConsoleUrl(config: ControllerConfig | null): string | null {
  if (!config) return null;
  if (config.oidcAdminConsoleUrl?.trim()) return config.oidcAdminConsoleUrl.trim();
  const issuer = config.oidcIssuerUrl?.replace(/\/+$/, "");
  if (issuer && /\/realms\/[^/]+/.test(issuer)) return `${issuer}/console`;
  return null;
}

function RouteWatcher() {
  const { refreshData } = useData();
  const location = useLocation();

  React.useEffect(() => {
    if (
      location.pathname === "/overview" ||
      location.pathname === "/dashboard"
    ) {
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function Layout() {
  const auth = useAuth();
  const adminConsoleUrl = resolveAdminConsoleUrl(controllerJson);
  const returnHomeCbRef = React.useRef<(() => void) | null>(null);
  const { status, updateController, request } = useController();
  const { isDrawerOpen } = useTerminal();
  const [collapsed, setCollapsed] = React.useState(true);
  const [isPinned, setIsPinned] = React.useState(false);
  const [isNatsEnabled, setIsNatsEnabled] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = React.useState(80);
  const returnHome = () => {
    if (returnHomeCbRef.current) {
      returnHomeCbRef.current();
    }
  };

  const handleLogout = async () => {
    try {
      if (auth?.signoutRedirect) {
        await auth.signoutRedirect();
      } else {
        updateController({ user: null });
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Measure actual sidebar width dynamically
  React.useEffect(() => {
    const measureSidebar = () => {
      if (sidebarRef.current) {
        requestAnimationFrame(() => {
          if (sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            setSidebarWidth(rect.width);
          }
        });
      }
    };

    const timeoutId = setTimeout(measureSidebar, 100);

    let resizeObserver: ResizeObserver | null = null;
    if (sidebarRef.current) {
      resizeObserver = new ResizeObserver(measureSidebar);
      resizeObserver.observe(sidebarRef.current);
    }

    window.addEventListener("resize", measureSidebar);

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", measureSidebar);
    };
  }, [collapsed, isPinned]);

  React.useEffect(() => {
    let mounted = true;
    const checkNatsCapability = async () => {
      try {
        const response = await request("/api/v3/capabilities/nats", {
          method: "HEAD",
        });
        if (mounted) {
          setIsNatsEnabled(Boolean(response?.ok));
        }
      } catch (e) {
        if (mounted) {
          setIsNatsEnabled(false);
        }
      }
    };

    if (auth?.isAuthenticated) {
      checkNatsCapability();
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isAuthenticated, auth?.user?.access_token]);

  if (auth.isLoading) {
    return null;
  }

  return (
    <HashRouter>
      <RouteWatcher />
      <div className="min-h-screen flex flex-col text-gray-900 dark:bg-gray-900 dark:text-white">
        <div className="flex">
          <ProSidebarProvider>
            <div
              ref={sidebarRef}
              className="h-screen overflow-y-auto custom-scrollbar"
              onMouseEnter={() => !isPinned && setCollapsed(false)}
              onMouseLeave={() => !isPinned && setCollapsed(true)}
            >
              <Sidebar
                collapsed={collapsed}
                backgroundColor="#111827"
                className="h-full flex flex-col border-r border-gray-500"
              >
                <div className="flex justify-center py-4">
                  <NavLink to="/dashboard" onClick={returnHome}>
                    <img src={logomark} className="w-7 mt-2" alt="Datasance" />
                  </NavLink>
                </div>

                <div className="overflow-y-auto h-[calc(100vh-265px)] border-t border-gray-500">
                  <Menu
                    menuItemStyles={{
                      button: ({ active, disabled }) => ({
                        backgroundColor: active ? "#374151" : "#111827",
                        color: disabled
                          ? "#5e5e5e"
                          : active
                            ? "#ffffff"
                            : "#d1d5db",
                        cursor: disabled ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        "&:hover": {
                          backgroundColor: disabled ? "#111827" : "#1a2633",
                          color: disabled ? "#9ca3af" : "#ffffff",
                        },
                      }),
                      icon: ({ active, disabled }) => ({
                        color: disabled
                          ? "#5e5e5e"
                          : active
                            ? "#ffffff"
                            : "#95a5a6",
                        fontSize: "18px",
                      }),
                      label: ({ active, disabled }) => ({
                        fontWeight: active && !disabled ? 600 : 400,
                        fontSize: "14px",
                      }),
                      subMenuContent: () => ({
                        fontSize: "14px",
                      }),
                    }}
                  >
                    <NavLink to="/dashboard">
                      {({ isActive }) => (
                        <MenuItem icon={<DashboardIcon />} active={isActive}>
                          Overview
                        </MenuItem>
                      )}
                    </NavLink>

                    <SubMenu label="Nodes" icon={<StorageRounded size={18} />}>
                      <NavLink to="/nodes/list">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>List</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/nodes/Map">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Map</MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <SubMenu label="Workloads" icon={<LayersRounded />}>
                      <NavLink to="/Workloads/MicroservicesList">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Microservices</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/SystemMicroservicesList">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            System Microservices
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/ApplicationList">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Application</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/SystemApplicationList">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            System Application
                          </MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <SubMenu
                      label="Config"
                      icon={<MiscellaneousServicesIcon size={18} />}
                    >
                      <NavLink to="/config/AppTemplates">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>App Templates</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/CatalogMicroservices">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Catalog Microservices
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/Registries">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Registries</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/ConfigMaps">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Config Maps</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/secret">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Secrets</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/VolumeMounts">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Volume Mounts</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/certificates">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Certificates</MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <SubMenu label="Network" icon={<Hub />}>
                      <NavLink to="/config/services">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Services</MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    {isNatsEnabled && (
                      <SubMenu
                        label="MessageBus"
                        icon={<MessageBusIcon size={18} />}
                      >
                        <NavLink to="/messagebus/operators">
                          {({ isActive }) => (
                            <MenuItem active={isActive}>Operators</MenuItem>
                          )}
                        </NavLink>
                        <NavLink to="/messagebus/accounts">
                          {({ isActive }) => (
                            <MenuItem active={isActive}>Accounts</MenuItem>
                          )}
                        </NavLink>
                        <NavLink to="/messagebus/users">
                          {({ isActive }) => (
                            <MenuItem active={isActive}>Users</MenuItem>
                          )}
                        </NavLink>
                      </SubMenu>
                    )}

                    <SubMenu
                      label="Access Control"
                      icon={<AccessControlIcon size={18} />}
                    >
                      <NavLink to="/access-control/roles">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Roles</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/access-control/rolebindings">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>Role Bindings</MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/access-control/serviceaccounts">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Service Accounts
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/access-control/nats-account-rules">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            NATs Account Rules
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/access-control/nats-user-rules">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>NATs User Rules</MenuItem>
                        )}
                      </NavLink>
                      {adminConsoleUrl && (
                        <MenuItem
                          onClick={() =>
                            window.open(adminConsoleUrl, "_blank")
                          }
                        >
                          IAM
                        </MenuItem>
                      )}
                    </SubMenu>

                    <NavLink to="/events">
                      {({ isActive }) => (
                        <MenuItem icon={<EventIcon />} active={isActive}>
                          Events
                        </MenuItem>
                      )}
                    </NavLink>

                    <NavLink to="/config/pollingSettings">
                      {({ isActive }) => (
                        <MenuItem
                          icon={<TuneIcon size={18} />}
                          active={isActive}
                        >
                          Viewer Config
                        </MenuItem>
                      )}
                    </NavLink>

                    <MenuItem
                      icon={<ExitToAppIcon size={18} />}
                      onClick={handleLogout}
                    >
                      Logout
                    </MenuItem>
                  </Menu>
                </div>

                <div className="flex flex-col gap-3 px-3 py-4 border-t border-gray-500">
                  <button
                    className="w-full text-xs bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition flex items-center justify-center"
                    onClick={() => {
                      setIsPinned(!isPinned);
                      setCollapsed(false);
                    }}
                  >
                    {!collapsed && (
                      <span className="mr-2">
                        {isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                      </span>
                    )}
                    {isPinned ? (
                      <ChevronLeftSharp size={18} />
                    ) : (
                      <ChevronRightSharp size={18} />
                    )}
                  </button>

                  {!collapsed ? (
                    <>
                      <div className="flex justify-center items-center text-white text-xs space-x-8">
                        <span
                          className="cursor-pointer underline"
                          onClick={() =>
                            window.open("https://docs.datasance.com", "_blank")
                          }
                        >
                          DOCS
                        </span>
                        <span
                          className="cursor-pointer underline"
                          onClick={() =>
                            window.open(
                              "https://github.com/Datasance",
                              "_blank",
                            )
                          }
                        >
                          GitHub
                        </span>
                        <a
                          className="underline underline-offset-2"
                          href={`/#/api?authToken=${auth?.user?.access_token}&baseUrl=${
                            window.controllerConfig?.url === undefined
                              ? `${window.location.protocol}//${window.location.hostname}:${window?.controllerConfig?.port}/api/v3`
                              : `${window.location.origin}/api/v3`
                          }`}
                          target="_parent"
                        >
                          API
                        </a>
                        <span
                          className="cursor-pointer underline"
                          onClick={() =>
                            window.open(
                              "https://datasance.com/EULA.pdf",
                              "_blank",
                            )
                          }
                        >
                          EULA
                        </span>
                      </div>

                      <div className="text-white text-xs text-center">
                        <p>Controller v{status?.versions.controller}</p>
                        <p>ECN Viewer v{status?.versions.ecnViewer}</p>
                      </div>
                    </>
                  ) : null}
                  <span
                    className="text-white text-xs text-center cursor-pointer"
                    onClick={() =>
                      window.open("https://datasance.com/", "_blank")
                    }
                  >
                    © {new Date().getFullYear()} Datasance
                  </span>
                </div>
              </Sidebar>
            </div>
          </ProSidebarProvider>

          <div
            className="flex-1 px-5 pt-6 overflow-auto bg-gray-900 overflow-auto"
            style={{
              height: isDrawerOpen
                ? "calc(100vh - var(--terminal-drawer-height, 40px))"
                : "100vh",
              maxHeight: isDrawerOpen
                ? "calc(100vh - var(--terminal-drawer-height, 40px))"
                : "100vh",
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" Component={Dashboard} />

              <Route path="/api" Component={SwaggerDoc} />
              <Route path="/nodes/list" Component={NodesList} />
              <Route
                path="/Workloads/MicroservicesList"
                Component={MicroservicesList}
              />
              <Route
                path="/Workloads/SystemMicroservicesList"
                Component={SystemMicroservicesList}
              />
              <Route
                path="/Workloads/ApplicationList"
                Component={ApplicationList}
              />
              <Route
                path="/Workloads/SystemApplicationList"
                Component={SystemApplicationList}
              />
              <Route
                path="/nodes/Map"
                element={<Map collapsed={collapsed} />}
              />
              <Route path="/config/AppTemplates" Component={AppTemplates} />
              <Route
                path="/config/CatalogMicroservices"
                Component={CatalogMicroservices}
              />
              <Route path="/config/Registries" Component={Registries} />
              <Route path="/config/ConfigMaps" Component={ConfigMaps} />
              <Route path="/config/secret" Component={Secrets} />
              <Route path="/config/VolumeMounts" Component={VolumeMounts} />
              <Route path="/config/certificates" Component={Certificates} />
              <Route path="/config/services" Component={Services} />
              <Route
                path="/config/pollingSettings"
                Component={PollingSettings}
              />
              <Route path="/events" Component={Events} />
              <Route path="/access-control/roles" Component={Roles} />
              <Route
                path="/access-control/rolebindings"
                Component={RoleBindings}
              />
              <Route
                path="/access-control/serviceaccounts"
                Component={ServiceAccounts}
              />
              <Route
                path="/access-control/nats-account-rules"
                Component={NatsAccountRules}
              />
              <Route
                path="/access-control/nats-user-rules"
                Component={NatsUserRules}
              />
              <Route path="/messagebus/operators" Component={Operators} />
              <Route path="/messagebus/accounts" Component={Accounts} />
              <Route path="/messagebus/users" Component={Users} />
              <Route Component={() => <Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
        <GlobalTerminalDrawer
          sidebarCollapsed={collapsed}
          sidebarWidth={sidebarWidth}
        />
      </div>
    </HashRouter>
  );
}
