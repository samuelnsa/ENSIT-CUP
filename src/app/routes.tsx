import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Teams } from "./pages/Teams";
import { TeamDetails } from "./pages/TeamDetails";
import { Matches } from "./pages/Matches";
import { MatchDetails } from "./pages/MatchDetails";
import { Standings } from "./pages/Standings";
import { Tactics } from "./pages/Tactics";
import { Admin } from "./pages/Admin";
import { MatchScheduler } from "./pages/MatchScheduler";
import { Login } from "./pages/Login";
import { Statistics } from "./pages/Statistics";
import { Bracket } from "./pages/Bracket";
import { RegisterTeam } from "./pages/RegisterTeam";
import { GoalscorersPage } from "./pages/GoalscorersPage";
import { TeamsRegisteredPage } from "./pages/TeamsRegisteredPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "teams", Component: Teams },
      { path: "teams/:teamId", Component: TeamDetails },
      { path: "teams-registered", Component: TeamsRegisteredPage },
      { path: "matches", Component: Matches },
      { path: "matches/:matchId", Component: MatchDetails },
      { path: "standings", Component: Standings },
      { path: "statistics", Component: Statistics },
      { path: "bracket", Component: Bracket },
      { path: "goalscorers", Component: GoalscorersPage },
      {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          { path: "admin", Component: Admin },
          { path: "admin/scheduler", Component: MatchScheduler },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['captain']} />,
        children: [
          { path: "register-team", Component: RegisterTeam },
          { path: "tactics", Component: Tactics },
        ],
      },
    ],
  },
]);
