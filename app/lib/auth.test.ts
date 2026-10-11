import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// Use React's actual server renderer: ordinary Node calls do not enable React cache.
test("session validation shares concurrent reads per render and revalidates each new request", () => {
  const script = String.raw`
    const assert = require('node:assert/strict');
    const fs = require('node:fs');
    const vm = require('node:vm');
    const ts = require('typescript');
    const React = require('react');
    const { renderToReadableStream } = require('next/dist/compiled/react-server-dom-webpack/server.edge');
    let sessionReads = 0, userReads = 0;
    let currentUser = { user_id: 'user-1', username: 'first', name: 'First', role: 'SUPER_ADMIN',
      branch: { branch_id: 'branch-1', name: 'First' }, last_activity_at: new Date() };
    let signedIn = true;
    function load(file, overrides = {}) {
      const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
      }).outputText;
      const module = { exports: {} };
      vm.runInNewContext(code, { module, exports: module.exports,
        require: id => id in overrides ? overrides[id] : require(id), Date }, { filename: file });
      return module.exports;
    }
    const auth = load('app/lib/auth.ts', {
      'next-auth': { getServerSession: async () => {
        sessionReads++;
        return signedIn ? { user: { username: currentUser.username }, expires: '2099-01-01' } : null;
      } },
      'next-auth/providers/credentials': () => ({}),
      'src/controllers/users/login.controller': {},
      'src/entities/errors/common': { InputParseError: Error },
      'next/navigation': { redirect: url => { throw new Error(url); } },
      'src/infrastructure/di/repositories': { UserRepository: {
        getUserByUsername: async username => {
          userReads++;
          assert.equal(username, currentUser.username);
          return currentUser;
        }
      } },
      './session-timeout': load('app/lib/session-timeout.ts'),
    });
    let observed;
    async function Component() {
      const results = await Promise.all([auth.getValidatedSession(), auth.getValidatedSession(), auth.getOptionalSession()]);
      assert.equal(results[0], results[1]);
      observed = results[0];
      return null;
    }
    async function render() {
      const stream = renderToReadableStream(React.createElement(Component), {});
      await new Response(stream).text();
    }
    (async () => {
      await render();
      assert.equal(sessionReads, 1); assert.equal(userReads, 1);
      assert.equal(observed.session.user.role, 'SUPER_ADMIN');
      currentUser = { ...currentUser, user_id: 'user-2', username: 'second', role: 'CASHIER',
        branch: { branch_id: 'branch-2', name: 'Second' } };
      await render();
      assert.equal(sessionReads, 2); assert.equal(userReads, 2);
      assert.equal(observed.session.user.id, 'user-2');
      assert.equal(observed.session.user.role, 'CASHIER');
      assert.equal(observed.session.user.branch.branch_id, 'branch-2');
      currentUser.last_activity_at = new Date(Date.now() - 61 * 60 * 1000);
      await render();
      assert.equal(observed.status, 'inactive');
      assert.equal(observed.session, null); assert.equal(userReads, 3);
      signedIn = false;
      await render();
      assert.equal(observed.status, 'unauthenticated');
      assert.equal(sessionReads, 4); assert.equal(userReads, 3);
      await Promise.all([auth.getValidatedSession(), auth.getValidatedSession()]);
      assert.equal(sessionReads, 6); // Calls outside a server render do not retain validation.
      process.stdout.write('auth render checks passed');
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `;
  const result = spawnSync(process.execPath, ["--conditions=react-server", "-e", script], {
    cwd: process.cwd(), encoding: "utf8", timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "auth render checks passed");
});
