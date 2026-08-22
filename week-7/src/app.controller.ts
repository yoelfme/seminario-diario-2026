import { Controller, Get, Header } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  getRoot(): string {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>NestJS lifecycle + Prisma 8</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #0f1419;
      --panel: #1a2332;
      --text: #e7ecf3;
      --muted: #8b9bb4;
      --line: #2c3a4f;
      --accent: #e85d3a;
      --ok: #3ecf8e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
      background: radial-gradient(circle at top, #1c2738, var(--bg));
      color: var(--text);
      min-height: 100vh;
      padding: 2rem;
    }
    h1 { font-size: 1.5rem; margin: 0 0 0.35rem; }
    p { color: var(--muted); margin: 0 0 1.5rem; }
    .timeline {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .step {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 0.75rem;
      text-align: center;
      font-size: 0.8rem;
    }
    .step strong { display: block; color: var(--accent); margin-bottom: 0.35rem; }
    .step.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 1rem;
    }
    button {
      background: var(--accent);
      color: white;
      border: 0;
      border-radius: 8px;
      padding: 0.6rem 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    pre {
      margin: 1rem 0 0;
      overflow: auto;
      background: #0b1017;
      border-radius: 8px;
      padding: 0.75rem;
      font-size: 0.85rem;
    }
    .ok { color: var(--ok); }
    @media (max-width: 900px) {
      .timeline { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <h1>NestJS request lifecycle</h1>
  <p>Middleware → Guards → Interceptors → Pipes → Controlador → Servicio → PostgreSQL (Prisma 8)</p>
  <div class="timeline" id="timeline">
    <div class="step" data-step="01 Middleware"><strong>01</strong>Middleware</div>
    <div class="step" data-step="02 Guards"><strong>02</strong>Guards</div>
    <div class="step" data-step="03 Interceptors"><strong>03</strong>Interceptors</div>
    <div class="step" data-step="04 Pipes"><strong>04</strong>Pipes</div>
    <div class="step" data-step="05 Controlador"><strong>05</strong>Controlador</div>
    <div class="step" data-step="06 Servicio"><strong>06</strong>Servicio</div>
  </div>
  <div class="panel">
    <button id="load">GET /talks</button>
    <span id="status" class="ok"></span>
    <pre id="out">Click the button to run the pipeline.</pre>
  </div>
  <script>
    const out = document.getElementById('out');
    const status = document.getElementById('status');
    const steps = [...document.querySelectorAll('.step')];
    document.getElementById('load').onclick = async () => {
      status.textContent = 'loading…';
      steps.forEach((el) => el.classList.remove('active'));
      try {
        const res = await fetch('/talks');
        const json = await res.json();
        out.textContent = JSON.stringify(json, null, 2);
        const lifecycle = json.lifecycle || [];
        steps.forEach((el) => {
          if (lifecycle.includes(el.dataset.step)) el.classList.add('active');
        });
        status.textContent = 'ok';
      } catch (error) {
        status.textContent = '';
        out.textContent = String(error);
      }
    };
  </script>
</body>
</html>`;
  }
}
