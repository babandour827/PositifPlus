import { createBrowserRouter, Outlet } from "react-router";
import { lazy, Suspense } from "react";
import { Layout } from "./components/Layout";
import { AuthGuard } from "./components/AuthGuard";
import { Splash } from "./screens/Splash";
import { Auth } from "./screens/Auth";
import { Onboarding } from "./screens/Onboarding";
import { HeartPulse } from "lucide-react";
import { Link } from "react-router";
import { PinLockOverlay } from "./components/PinLockOverlay";

// Chargement différé : chaque écran est téléchargé uniquement quand l'utilisateur y accède
const Home           = lazy(() => import('./screens/Home').then(m => ({ default: m.Home })));
const Tracking       = lazy(() => import('./screens/Tracking').then(m => ({ default: m.Tracking })));
const Resources      = lazy(() => import('./screens/Resources').then(m => ({ default: m.Resources })));
const Profile        = lazy(() => import('./screens/Profile').then(m => ({ default: m.Profile })));
const Notifications  = lazy(() => import('./screens/Notifications').then(m => ({ default: m.Notifications })));
const Echanges       = lazy(() => import('./screens/Echanges').then(m => ({ default: m.Echanges })));
const SoignantAgenda = lazy(() => import('./screens/SoignantAgenda').then(m => ({ default: m.SoignantAgenda })));
const PosPlus        = lazy(() => import('./screens/PosPlus').then(m => ({ default: m.default ?? m })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[40vh]">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#10AC84] rounded-full animate-spin" />
    </div>
  );
}

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

function SuspenseRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    Component: AppRoot,
    children: [
      { index: true,           Component: Splash },
      { path: "/auth",         Component: Auth },
      { path: "/onboarding",   Component: Onboarding },
      {
        path: "/app",
        Component: AuthGuard,
        children: [
          {
            Component: Layout,
            children: [
              { index: true,           element: <SuspenseRoute><Home /></SuspenseRoute> },
              { path: "echanges",      element: <SuspenseRoute><Echanges /></SuspenseRoute> },
              { path: "agenda",        element: <SuspenseRoute><SoignantAgenda /></SuspenseRoute> },
              { path: "tracking",      element: <SuspenseRoute><Tracking /></SuspenseRoute> },
              { path: "resources",     element: <SuspenseRoute><Resources /></SuspenseRoute> },
              { path: "profile",       element: <SuspenseRoute><Profile /></SuspenseRoute> },
              { path: "notifications", element: <SuspenseRoute><Notifications /></SuspenseRoute> },
            ],
          },
        ],
      },
      { path: "/pos-plus", element: <SuspenseRoute><PosPlus /></SuspenseRoute> },
      { path: "*", Component: NotFound },
    ],
  },
]);
