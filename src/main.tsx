import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Spinner from "./components/spinner/Spinner.tsx";
import { BrowserRouter } from "react-router-dom";

// --- INICIO DE LA COMBINACIÓN ---

// 1. Importamos el ThemeProvider y CssBaseline de MUI
import { ThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

// 2. Importamos el tema local
import theme from "./style/theme.mui";

// --- FIN DE LA COMBINACIÓN ---

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 4. Usamos el ThemeProvider con el tema local */}
    <ThemeProvider theme={theme}>
      {/* 5. Añadimos CssBaseline aquí, dentro del provider */}
      <CssBaseline />
      
      {/* 6. Mantenemos toda tu estructura original intacta */}
      <Suspense fallback={<Spinner />}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Suspense>
    </ThemeProvider>
  </StrictMode>
);