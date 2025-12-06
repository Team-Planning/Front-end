import { Outlet } from "react-router-dom";
// import useWindowDimensions from "../../scripts/useWindowDimensions"; // YA NO ES NECESARIO
import HeaderGPI from "./menuHeader/HeaderGPI";
import Footer from "../../components/Footer";

function MainLayout() {
  // const { width } = useWindowDimensions(); // YA NO ES NECESARIO
  return (
    // CAMBIAMOS LA ESTRUCTURA PARA ELIMINAR EL MENU LATERAL
    <div className="flex flex-1 w-full max-h-screen">
      <div className="flex flex-1 flex-col overflow-hidden max-h-screen">
        {/* Usamos el HeaderGPI siempre en modo móvil para mostrar la hamburguesa en el top */}
        {/* Se recomienda crear un nuevo componente de Header si se quiere rediseñar solo la parte superior */}
        <HeaderGPI isMobile /> 

        <main className="flex-1 overflow-y-auto">
          <div className="flex-1 px-6 py-8 overflow-y-auto w-full h-full">
            {<Outlet />}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;