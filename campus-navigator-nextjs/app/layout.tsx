import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { SimulationProvider } from "./context/SimulationContext";
import AppInitializer from "./components/AppInitializer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SimulationProvider>
          <AppInitializer>
            {children}
          </AppInitializer>
        </SimulationProvider>
      </body>
    </html>
  );
}

