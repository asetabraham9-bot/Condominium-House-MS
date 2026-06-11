import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ApplicantDashboard from "./pages/applicant/Dashboard";
import ApplyHouse from "./pages/applicant/ApplyHouse";
import LotteryResult from "./pages/applicant/LotteryResult";
import Payment from "./pages/applicant/Payment";
import LeaveHouse from "./pages/applicant/LeaveHouse";
import Notifications from "./pages/applicant/Notifications";
import Settings from "./pages/applicant/Settings";
import CampusAdminDashboard from "./pages/campus-admin/Dashboard";
import ManageBlocks from "./pages/campus-admin/ManageBlocks";
import ManageResidents from "./pages/campus-admin/ManageResidents";
import VerifyPayments from "./pages/campus-admin/VerifyPayments";
import ResidentRequests from "./pages/campus-admin/ResidentRequests";
import ViewFeedback from "./pages/campus-admin/ViewFeedback";
import ManageRequests from "./pages/campus-admin/ManageRequests";
import CampusReports from "./pages/campus-admin/Reports";
import CHMSAdminDashboard from "./pages/chms-admin/Dashboard";
import ManageApplicants from "./pages/chms-admin/ManageApplicants";
import ManageCHMSResidents from "./pages/chms-admin/ManageResidents";
import DrawLottery from "./pages/chms-admin/DrawLottery";
import ManagePlacement from "./pages/chms-admin/ManagePlacement";
import CHMSVerifyPayments from "./pages/chms-admin/VerifyPayments";
import SendNotifications from "./pages/chms-admin/SendNotifications";
import CHMSReports from "./pages/chms-admin/Reports";
import ManageCampus from "./pages/chms-admin/ManageCampus";
import LaunchCycle from "./pages/chms-admin/LaunchCycle";
import CampusAdminSettings from "./pages/campus-admin/Settings";
import ChmsAdminSettings from "./pages/chms-admin/Settings";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerCampusInfo from "./pages/manager/CampusInfo";
import InformHouseRequests from "./pages/manager/InformHouseRequests";
import ManagerSettings from "./pages/manager/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/applicant",
    Component: ApplicantDashboard,
  },
  {
    path: "/applicant/apply",
    Component: ApplyHouse,
  },
  {
    path: "/applicant/lottery",
    Component: LotteryResult,
  },
  {
    path: "/applicant/payment",
    Component: Payment,
  },
  {
    path: "/applicant/leave-house",
    Component: LeaveHouse,
  },
  {
    path: "/applicant/notifications",
    Component: Notifications,
  },
  {
    path: "/applicant/settings",
    Component: Settings,
  },
  {
    path: "/campus-admin",
    Component: CampusAdminDashboard,
  },
  {
    path: "/campus-admin/blocks",
    Component: ManageBlocks,
  },
  {
    path: "/campus-admin/residents",
    Component: ManageResidents,
  },
  {
    path: "/campus-admin/verify-payments",
    Component: VerifyPayments,
  },
  {
    path: "/campus-admin/requests",
    Component: ResidentRequests,
  },
  {
    path: "/campus-admin/reports",
    Component: CampusReports,
  },
  {
    path: "/campus-admin/settings",
    Component: CampusAdminSettings,
  },
  {
    path: "/chms-admin",
    Component: CHMSAdminDashboard,
  },
  {
    path: "/chms-admin/launch-cycle",
    Component: LaunchCycle,
  },
  {
    path: "/chms-admin/applicants",
    Component: ManageApplicants,
  },
  {
    path: "/chms-admin/residents",
    Component: ManageCHMSResidents,
  },
  {
    path: "/chms-admin/lottery",
    Component: DrawLottery,
  },
  {
    path: "/chms-admin/placement",
    Component: ManagePlacement,
  },
  {
    path: "/chms-admin/verify-payments",
    Component: CHMSVerifyPayments,
  },
  {
    path: "/chms-admin/notifications",
    Component: SendNotifications,
  },
  {
    path: "/chms-admin/reports",
    Component: CHMSReports,
  },
  {
    path: "/chms-admin/campus",
    Component: ManageCampus,
  },
  {
    path: "/chms-admin/settings",
    Component: ChmsAdminSettings,
  },
  {
    path: "/manager/dashboard",
    Component: ManagerDashboard,
  },
  {
    path: "/manager/campus-info",
    Component: ManagerCampusInfo,
  },
  {
    path: "/manager/inform-house-requests",
    Component: InformHouseRequests,
  },
  {
    path: "/manager/settings",
    Component: ManagerSettings,
  },
]);