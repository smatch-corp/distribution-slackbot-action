import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        setupFiles: ['dotenv/config'],
        testTimeout: 20000
    }
});
//# sourceMappingURL=vitest.config.js.map