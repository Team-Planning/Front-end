/**
 * Menu basico para el layout de la aplicacion desarrollada por Diego Monsalves
 */

import { Avatar, Box, Typography } from "@mui/material";
import logo from "../../../assets/EII_logo.png";
import DrawerNav from "./DrawerNav";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


interface HeaderGPIProps {
  isMobile?: boolean;
}

/**
 * Componente que contiene el menu de la aplicacion
 * @param isMobile Indica si el menu es para movil o no
 * @returns JSX.Element
 *
 * @example
 * <HeaderGPI isMobile={true} />
 * <HeaderGPI />
 *
 * @version 1.0.0
 * */

function HeaderGPI({ isMobile = false }: HeaderGPIProps) {
  const actionsMenu = [
    {
      name: "Inicio",
      href: "/home",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      ),
    },
    {
      name: "Publicaciones",
      href: "/publicaciones",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z"
          />
        </svg>
      ),
    },
  ];
  const navigate = useNavigate();
  const openMenuAction = () => {
    setOpenMenu(true);
  };
  const closeMenuAction = () => {
    setOpenMenu(false);
  };

  const redirectTo = (path: string) => {
    navigate(path);
  };

  const [openMenu, setOpenMenu] = useState(false);

  return (
    <>
      {isMobile ? (
 <nav>
          {/* CAMBIO DE ESTILO: Color de fondo y padding */}
          {/* De h-16 w-full bg-(--color-darkgreen) a una barra superior más clara con padding */}
          <div className="h-16 w-full bg-white shadow-md">
            <div className="flex w-full h-full items-center justify-between p-4 py-0">
              
              {/* Nuevo: Logo/Título a la izquierda */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: '#4CAF50', // Color verde para el título
                  cursor: 'pointer'
                }}
                onClick={() => redirectTo('/home')}
              >
                PULGASHOP
              </Typography>

              {/* Contenedor del ícono de hamburguesa */}
              <div
                onClick={openMenuAction}
                className="cursor-pointer p-2 text-black hover:bg-gray-100 rounded-full" // Ícono de hamburguesa en color oscuro
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </div>
            </div>
          </div>
          <DrawerNav
            closeMenuAction={closeMenuAction}
            openMenu={openMenu}
            menuItems={actionsMenu}
          ></DrawerNav>
        </nav>
      ) : (
        <nav className="flex flex-col bg-(--color-darkgreen) w-80 h-full overflow-auto">
          <div className="flex flex-col justify-between p-4 h-full">
            <div className="flex flex-col items-center pt-10 justify-center gap-2">
              <Box
                width="100%"
                gap="16px"
                className="flex flex-col justify-center items-center"
              >
                <img alt="logo" className="h-30 invert" src={logo} />
                <Typography
                  fontSize={22}
                  lineHeight={"32px"}
                  letterSpacing={"-0.3px"}
                  fontWeight={600}
                  color="#ebebeb"
                >
                  GPI project
                </Typography>
              </Box>
              <Box className="flex flex-col pt-16 p-6 gap-6 w-full">
                {actionsMenu.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => redirectTo(item.href)}
                    className="group flex items-center gap-4 p-3 border-2 rounded-lg border-transparent hover:border-[#FFFFFF] hover:border-opacity-100 cursor-pointer"
                  >
                    <div className="text-white group-hover:text-[#FFFFFF]">
                      {item.icon}
                    </div>
                    <Typography
                      fontSize={18}
                      lineHeight={"24px"}
                      fontWeight={400}
                      className="text-[#ebebeb] group-hover:text-[#FFFFFF]"
                    >
                      {item.name}
                    </Typography>
                  </div>
                ))}
              </Box>
            </div>
            <div className="group flex items-center justify-between border-2 rounded-lg border-transparent p-2 hover:border-white">
              <div className="flex items-center">
                <Avatar className="w-25 h-25 rounded-full" alt="avatar">
                  JD
                </Avatar>
                <div className="ml-4">
                  <h4 className="text-md font-medium text-white group-hover:text-(--color-white)">
                    John Doe
                  </h4>
                  <p className="text-sm font-light text-white group-hover:text-(--color-white)">
                    Admin
                  </p>
                </div>
              </div>
              <button className="text-white cursor-pointer group-hover:text-(--color-white)">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-8"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}

export default HeaderGPI;
