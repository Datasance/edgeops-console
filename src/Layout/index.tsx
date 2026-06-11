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
  UserCircle as UserCircleIcon,
  Users as UsersIcon,
} from "lucide-react";

import { useData } from "../providers/Data";
import { useController } from "../ControllerProvider";
import { getAuthMode, useAuth } from "../auth";
import { getApiV3BaseUrl } from "../auth/api";
import ForcePasswordChangePage from "../auth/ForcePasswordChangePage";
import PostLoginGate from "../auth/PostLoginGate";
import { useTerminal } from "../providers/Terminal/TerminalProvider";

import Dashboard from "../Dashboard";
import SwaggerDoc from "../swagger/SwaggerDoc";
import logomark from "../assets/potLogoWithWhiteText.svg";

import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { ProSidebarProvider } from "react-pro-sidebar";
import SidebarNavItem from "./SidebarNavItem";
import IamExternalBanner from "./IamExternalBanner";
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
import IdentityUsersList from "../Identity/Users";
import IdentityGroupsList from "../Identity/Groups";
import IdentityAccountPage from "../Identity/Account";

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
  const returnHomeCbRef = React.useRef<(() => void) | null>(null);
  const { status, request } = useController();
  const authMode = getAuthMode();
  const isEmbeddedAuth = authMode === "embedded";
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
      await auth.signoutRedirect();
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
                    <SidebarNavItem
                      to="/dashboard"
                      icon={<DashboardIcon />}
                      end
                    >
                      Overview
                    </SidebarNavItem>

                    <SubMenu label="Nodes" icon={<StorageRounded size={18} />}>
                      <SidebarNavItem to="/nodes/list">List</SidebarNavItem>
                      <SidebarNavItem to="/nodes/Map">Map</SidebarNavItem>
                    </SubMenu>

                    <SubMenu label="Workloads" icon={<LayersRounded />}>
                      <SidebarNavItem to="/Workloads/MicroservicesList">
                        Microservices
                      </SidebarNavItem>
                      <SidebarNavItem to="/Workloads/SystemMicroservicesList">
                        System Microservices
                      </SidebarNavItem>
                      <SidebarNavItem to="/Workloads/ApplicationList">
                        Application
                      </SidebarNavItem>
                      <SidebarNavItem to="/Workloads/SystemApplicationList">
                        System Application
                      </SidebarNavItem>
                    </SubMenu>

                    <SubMenu
                      label="Config"
                      icon={<MiscellaneousServicesIcon size={18} />}
                    >
                      <SidebarNavItem to="/config/AppTemplates">
                        App Templates
                      </SidebarNavItem>
                      <SidebarNavItem to="/config/CatalogMicroservices">
                        Catalog Microservices
                      </SidebarNavItem>
                      <SidebarNavItem to="/config/Registries">
                        Registries
                      </SidebarNavItem>
                      <SidebarNavItem to="/config/ConfigMaps">
                        Config Maps
                      </SidebarNavItem>
                      <SidebarNavItem to="/config/secret">
                        Secrets
                      </SidebarNavItem>
                      <SidebarNavItem to="/config/VolumeMounts">
                        Volume Mounts
                      </SidebarNavItem>
                      <SidebarNavItem to="/config/certificates">
                        Certificates
                      </SidebarNavItem>
                    </SubMenu>

                    <SubMenu label="Network" icon={<Hub />}>
                      <SidebarNavItem to="/config/services">
                        Services
                      </SidebarNavItem>
                    </SubMenu>

                    {isNatsEnabled && (
                      <SubMenu
                        label="MessageBus"
                        icon={<MessageBusIcon size={18} />}
                      >
                        <SidebarNavItem to="/messagebus/operators">
                          Operators
                        </SidebarNavItem>
                        <SidebarNavItem to="/messagebus/accounts">
                          Accounts
                        </SidebarNavItem>
                        <SidebarNavItem to="/messagebus/users">
                          Users
                        </SidebarNavItem>
                      </SubMenu>
                    )}

                    <SubMenu
                      label="Access Control"
                      icon={<AccessControlIcon size={18} />}
                    >
                      <SidebarNavItem to="/access-control/roles">
                        Roles
                      </SidebarNavItem>
                      <SidebarNavItem to="/access-control/rolebindings">
                        Role Bindings
                      </SidebarNavItem>
                      <SidebarNavItem to="/access-control/serviceaccounts">
                        Service Accounts
                      </SidebarNavItem>
                      <SidebarNavItem to="/access-control/nats-account-rules">
                        NATs Account Rules
                      </SidebarNavItem>
                      <SidebarNavItem to="/access-control/nats-user-rules">
                        NATs User Rules
                      </SidebarNavItem>
                    </SubMenu>

                    {isEmbeddedAuth ? (
                      <SubMenu label="IAM" icon={<UsersIcon size={18} />}>
                        <SidebarNavItem to="/account">My Account</SidebarNavItem>
                        <SidebarNavItem to="/access-control/users">
                          Users
                        </SidebarNavItem>
                        <SidebarNavItem to="/access-control/groups">
                          Groups
                        </SidebarNavItem>
                      </SubMenu>
                    ) : (
                      <SidebarNavItem
                        to="/account"
                        icon={<UserCircleIcon size={18} />}
                      >
                        My Account
                      </SidebarNavItem>
                    )}

                    <SidebarNavItem to="/events" icon={<EventIcon />}>
                      Events
                    </SidebarNavItem>

                    <SidebarNavItem
                      to="/config/pollingSettings"
                      icon={<TuneIcon size={18} />}
                    >
                      Viewer Config
                    </SidebarNavItem>

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
                          href={`/#/api?authToken=${auth?.user?.access_token}&baseUrl=${encodeURIComponent(getApiV3BaseUrl())}`}
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
            <IamExternalBanner />
            <PostLoginGate>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" Component={Dashboard} />
                <Route
                  path="/account/force-password-change"
                  Component={ForcePasswordChangePage}
                />
                <Route path="/account" Component={IdentityAccountPage} />

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
              <Route
                path="/access-control/users"
                Component={IdentityUsersList}
              />
              <Route
                path="/access-control/groups"
                Component={IdentityGroupsList}
              />
              <Route path="/messagebus/operators" Component={Operators} />
              <Route path="/messagebus/accounts" Component={Accounts} />
              <Route path="/messagebus/users" Component={Users} />
              <Route Component={() => <Navigate to="/dashboard" />} />
              </Routes>
            </PostLoginGate>
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
