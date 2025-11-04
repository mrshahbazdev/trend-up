import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ["js-big-decimal"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@components": path.resolve(__dirname, "src/components"),
            "@utils": path.resolve(__dirname, "src/utils"),
            "@context": path.resolve(__dirname, "src/context"),
            "@store": path.resolve(__dirname, "src/store"),
            "@api": path.resolve(__dirname, "src/api"),
            "@connectivityAssets":path.resolve(__dirname, "src/connectivityAssets"),
            "@assets":path.resolve(__dirname, "src/assets"),
            "@routes":path.resolve(__dirname, "src/routes"),
            "@pages":path.resolve(__dirname, "src/pages"),
        },
    },
});
