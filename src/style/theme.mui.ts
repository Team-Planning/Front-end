// theme.ts o theme.js
import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    pearl: Palette["primary"];
  }
  interface PaletteOptions {
    pearl?: PaletteOptions["primary"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    pearl: true;
  }
}

const theme = createTheme({
  palette: {
    // Cambiando la paleta principal
    primary: {
      main: "#00D563", // color base: verde PulgaShop
      light: "#33de81", // versión más clara
      dark: "#00a04d", // versión más oscura
      contrastText: "#ffffff",
    },
    // Cambiando la paleta secundaria
    secondary: {
      main: "#1f4d5d",
      light: "#327d96",
      dark: "#0c1f25",
      contrastText: "#ffffff",
    },
    // Si deseas redefinir "error", "warning", "info", "success" etc., puedes hacerlo igualmente:
    // error: { main: '#...' },
    // warning: { main: '#...' },
    // ...

    // Si quieres añadir más colores personalizados, puedes hacerlo
    // pearl: {
    //   main: "#d5d4b3",
    //   light: "#b9b881",
    //   dark: "#656438",
    //   contrastText: "#33321c",
    // },
  },
  typography: {
    // Cambiando la fuente
    fontFamily: "Poppins, sans-serif",
    // Cambiando la fuente del botón
    button: {
      fontFamily: "Poppins, sans-serif",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          padding: "0 20px 0 20px",
          height: "45px",
        },
      },
    },
  },
});

export default theme;
