import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var backend = env.VITE_BACKEND_URL || 'http://localhost:3000';
    return {
        plugins: [react()],
        build: {
            assetsDir: 'react-assets',
            sourcemap: true
        },
        server: {
            port: Number(env.VITE_PORT || 5173),
            proxy: {
                '/api': backend,
                '/app': backend,
                '/auth': backend,
                '/dashboard': backend,
                '/portal': backend,
                '/invitation': backend,
                '/flashcards': backend,
                '/alumet': backend,
                '/cdn': backend,
                '/preview': backend,
                '/viewer': backend,
                '/openai': backend,
                '/swiftChat': backend,
                '/assets': backend
            }
        }
    };
});
