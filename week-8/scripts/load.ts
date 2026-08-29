const baseUrl = process.env.API_URL ?? "http://localhost:8080";
const iterations = Number(process.env.LOAD_ITERATIONS ?? 30);
const delayMs = Number(process.env.LOAD_DELAY_MS ?? 200);
const cacheMode = process.env.LOAD_CACHE ?? "on";

const endpoints = [
  `/reports/top-products?limit=20&cache=${cacheMode}`,
  `/products/1?cache=${cacheMode}`,
  `/products/1/stats?cache=${cacheMode}`,
  `/customers/1?cache=${cacheMode}`,
  `/products/42/stats?cache=${cacheMode}`,
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Load script targeting ${baseUrl} (${iterations} rounds, cache=${cacheMode})`);

  for (let i = 1; i <= iterations; i += 1) {
    for (const path of endpoints) {
      const started = performance.now();
      try {
        const res = await fetch(`${baseUrl}${path}`);
        const body = (await res.json()) as {
          source?: string;
          durationMs?: number;
        };
        const wallMs = (performance.now() - started).toFixed(1);
        console.log(
          `[${i}/${iterations}] ${res.status} ${path} source=${body.source ?? "?"} apiMs=${body.durationMs ?? "?"} wallMs=${wallMs}`,
        );
      } catch (error) {
        console.error(`[${i}/${iterations}] FAILED ${path}`, error);
      }
      await sleep(delayMs);
    }
  }

  console.log("Load complete. Check Grafana at http://localhost:3001");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
