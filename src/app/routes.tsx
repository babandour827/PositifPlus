import { createBrowserRouter, Outlet } from "react-router";
import { Layout } from "./components/Layout";
import { AuthGuard } from "./components/AuthGuard";
import { Splash } from "./screens/Splash";
import { Auth } from "./screens/Auth";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Community } from "./screens/Community";
import { Tracking } from "./screens/Tracking";
import { Resources } from "./screens/Resources";
import { Profile } from "./screens/Profile";
import { Notifications } from "./screens/Notifications";
import { AIAssistant } from "./screens/AIAssistant";
import Chat from "./screens/Chat";
import { HeartPulse } from "lucide-react";
import { Link } from "react-router";
import { PinLockOverlay } from "./components/PinLockOverlay";

function AppRoot() {
  return (
    <>
      <Outlet />
      <PinLockOverlay />
    </>
  );
}

function NotFound() {
  return (
    <div className="mx-auto w-full max-w-md h-[100dvh] bg-white flex flex-col items-center justify-center gap-4 font-sans px-8">
      <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B6B] to-[#FF9F43] rounded-3xl flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
        <HeartPulse className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-6xl font-black text-gray-900">404</h1>
      <p className="text-base font-bold text-gray-600 text-center">Cette page n'existe pas.</p>
      <Link
        to="/app"
        className="mt-2 px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FF9F43] text-white font-bold rounded-xl shadow-lg shadow-[#FF6B6B]/20 text-sm"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    Component: AppRoot,
    children: [
      { index: true,           Component: Splash },
      { path: "/auth",       Component: Auth },
      { path: "/onboarding", Component: Onboarding },
      {
        path: "/app",
        Component: AuthGuard,
        children: [
          {
            Component: Layout,
            children: [
              { index: true,           Component: Home },
              { path: "community",   Component: Community },
              { path: "tracking",    Component: Tracking },
              { path: "resources",   Component: Resources },
              { path: "profile",     Component: Profile },
              { path: "notifications", Component: Notifications },
              { path: "ai-assistant", Component: AIAssistant },
              { path: "chat",        Component: Chat },
            ],
          },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
