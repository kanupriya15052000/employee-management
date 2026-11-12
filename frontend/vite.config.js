import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // REST-style employee URLs are mapped to the existing PHP API script.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => {
          const employeeRoute = path.match(/^\/api\/employees(?:\/(\d+))?$/);
          if (employeeRoute) {
            return employeeRoute[1]
              ? `/add_employee.php?id=${employeeRoute[1]}`
              : "/add_employee.php";
          }
          return path.replace(/^\/api/, "");
        },
      },
    },
  },
});
