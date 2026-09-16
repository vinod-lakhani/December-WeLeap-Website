import { configDefaults, defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    /**
     * Keep the run inside the working tree.
     *
     * Agent sessions leave git worktrees under .claude/worktrees, each a full
     * checkout at whatever commit it was cut from, each carrying its own copy
     * of every test file. Vitest's default glob walked into them, so the suite
     * was running twice — once against this code and once against an older
     * snapshot — which doubled the reported test count and, worse, could fail
     * the run for something fixed weeks ago. Registering a new tool failed
     * "every tool_completed slug is a registered tool" purely because a stale
     * copy of lib/tools.ts had never heard of it.
     *
     * Spread rather than replaced: assigning `exclude` drops Vitest's own
     * defaults, and node_modules is in them.
     */
    exclude: [...configDefaults.exclude, '**/.claude/worktrees/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
