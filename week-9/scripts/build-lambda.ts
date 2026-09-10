import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "build", "lambda");

const SHARP_VERSION = "0.35.4";
const TARGET_LIBC = "glibc";
const TARGET_BINARY = "@img/sharp-linux-arm64";
const FORBIDDEN_BINARY = "@img/sharp-darwin-arm64";

async function main(): Promise<void> {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  await build({
    entryPoints: [join(root, "lambda", "handler.ts")],
    outfile: join(outDir, "index.mjs"),
    bundle: true,
    platform: "node",
    target: "node24",
    format: "esm",
    minify: true,
    sourcemap: false,
    external: ["sharp"],
    logLevel: "info",
  });

  writeFileSync(
    join(outDir, "package.json"),
    `${JSON.stringify(
      {
        name: "resize-lambda",
        version: "1.0.0",
        private: true,
        type: "module",
        dependencies: { sharp: SHARP_VERSION },
        pnpm: {
          supportedArchitectures: {
            os: ["linux"],
            cpu: ["arm64"],
            libc: ["glibc"],
          },
        },
      },
      null,
      2,
    )}\n`,
  );

  execFileSync(
    "pnpm",
    ["install", "--dir", outDir, "--node-linker=hoisted", "--ignore-workspace", "--prod"],
    { stdio: "inherit", cwd: root },
  );

  pruneBinDirs(outDir);
  pruneForeignLibc();
  assertPackaging();
}

function pruneForeignLibc(): void {
  for (const path of foreignLibcPackages()) {
    rmSync(path, { recursive: true, force: true });
    console.log(`prune ${relative(outDir, path)} (wrong libc)`);
  }
}

function foreignLibcPackages(): string[] {
  const scope = join(outDir, "node_modules", "@img");
  if (!exists(scope)) return [];

  return readdirSync(scope, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(scope, entry.name))
    .filter((path) => {
      const manifest = join(path, "package.json");
      if (!exists(manifest)) return false;
      const { libc } = JSON.parse(readFileSync(manifest, "utf8")) as { libc?: string[] };
      return Array.isArray(libc) && !libc.includes(TARGET_LIBC);
    });
}

function pruneBinDirs(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name);
    if (entry.name === ".bin") {
      rmSync(path, { recursive: true, force: true });
    } else {
      pruneBinDirs(path);
    }
  }
}

function assertPackaging(): void {
  const modules = join(outDir, "node_modules");

  assert(exists(join(modules, TARGET_BINARY)), `missing ${TARGET_BINARY}`);
  assert(!exists(join(modules, FORBIDDEN_BINARY)), `bundled host binary ${FORBIDDEN_BINARY}`);

  const foreign = foreignLibcPackages();
  assert(
    foreign.length === 0,
    `packages for a non-${TARGET_LIBC} libc survived: ${foreign
      .map((path) => relative(outDir, path))
      .join(", ")}`,
  );

  const symlinks = findSymlinks(outDir);
  assert(
    symlinks.length === 0,
    `Lambda zips cannot contain symlinks, found ${symlinks.length}: ${symlinks
      .slice(0, 5)
      .join(", ")}`,
  );

  console.log(`ok  ${TARGET_BINARY} present`);
  console.log(`ok  ${FORBIDDEN_BINARY} absent`);
  console.log(`ok  only ${TARGET_LIBC} binaries present`);
  console.log("ok  no symlinks in the deployment package");
}

function exists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function findSymlinks(dir: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      found.push(relative(outDir, path));
    } else if (entry.isDirectory()) {
      found.push(...findSymlinks(path));
    }
  }

  return found;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
