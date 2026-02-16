import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { SimulationProvider } from "./context/SimulationContext";
import AppInitializer from "./components/AppInitializer";
import AuthProvider from "./components/AuthOverlay";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider theme="light">
          <SimulationProvider>
            <AppInitializer>
              {children}
            </AppInitializer>
          </SimulationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

