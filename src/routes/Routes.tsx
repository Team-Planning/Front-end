import { lazy } from "react";
import { Navigate } from "react-router-dom";
import Loadable from "./Loadable";

/* ***Layouts**** */
const BlankLayout = Loadable(
  lazy(() => import("../layouts/blank-layout/BlankLayout"))
);
const AuthLayout = Loadable(lazy(() => import("../layouts/auth/AuthLayout")));
const MainLayout = Loadable(
  lazy(() => import("../layouts/dashboardLayout/MainLayout"))
);

/* ***End Layouts**** */
const Error = Loadable(lazy(() => import("../views/authentication/Error")));

/* ****Pages***** */
const Home = Loadable(lazy(() => import("../views/home/Home")));
const Login = Loadable(lazy(() => import("../views/authentication/Login")));
const Register = Loadable(
  lazy(() => import("../views/authentication/Register"))
);
const ResetPass = Loadable(
  lazy(() => import("../views/authentication/ResetPass"))
);

/* ****Publicaciones***** */
const PublicacionesList = Loadable(
  lazy(() => import("../views/publicaciones/PublicacionesList"))
);
const CreatePublicacion = Loadable(
  lazy(() => import("../views/publicaciones/CreatePublicacion"))
);
const PublicacionDetail = Loadable(
  lazy(() => import("../views/publicaciones/PublicacionDetail"))
);
const EditPublicacion = Loadable(
  lazy(() => import("../views/publicaciones/EditPublicacion"))
);

/* ****Reseñas***** */
const Resenas = Loadable(
  lazy(() => import("../views/resenas/Resenas"))
);

/* ****End Pages***** */

const Router = [
  {
    path: "/error",
    element: <BlankLayout />,
    children: [{ path: "404", element: <Error /> }],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "", exact: true, element: <Navigate to="/auth/login" /> },
      { path: "login", exact: true, element: <Login /> },
      {
        path: "register",
        exact: true,
        element: <Register />,
      },
      {
        path: "forgot-password",
        exact: true,
        element: <ResetPass />,
      },

      { path: "*", element: <Navigate to="/error/404" /> },
      { path: "404", exact: true, element: <Error /> },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "",
        exact: true,
        element: <Navigate to="/publicaciones" />,
      },
      {
        path: "home",
        exact: true,
        element: <Home />,
      },
      {
        path: "publicaciones",
        exact: true,
        element: <PublicacionesList />,
      },
      {
        path: "publicaciones/crear",
        exact: true,
        element: <CreatePublicacion />,
      },
      {
        path: "publicaciones/:id",
        exact: true,
        element: <PublicacionDetail />,
      },
      {
        path: "publicaciones/editar/:id",
        exact: true,
        element: <EditPublicacion />,
      },
      {
        path: "resenas/:id",
        exact: true,
        element: <Resenas />,
      },
      { path: "*", element: <Navigate to="/error/404" /> },
    ],
  },
  {
    path: "/error",
    element: <BlankLayout />,
    children: [
      { path: "*", element: <Navigate to="/error/404" /> },
      { path: "404", exact: true, element: <Error /> },
    ],
  },
];

export default Router;
