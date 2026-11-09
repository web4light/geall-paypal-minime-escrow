import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export interface ConsolidatedContext {
  shiftNumber: number;
  agentId: string;
  timestamp: string;
  coreInvariants: string[];
  architecturalDecisions: string[];
  activeCodeSnippets: Record<string, string>;
  pendingTasks: string[];
  fullSummary: string;
}

export interface HandshakeCache {
  generatedBy: string; // Nastupující agent ze střídačky
  forAgent: string;    // Odcházející agent na lavičku
  timestamp: string;
  contextDigest: string; // Rychlé shrnutí celkového kontextu z trezoru
  suggestedTargets: string[]; // Přesné cesty/soubory kam sáhnout na přepis
  rewriteVerdict: "NO_REWRITE_NEEDED" | "LIGHT_PATCH" | "FULL_REPLACE_AND_ZIP";
  rationale: string; // Odpověď na otázku: Má cenu vůbec přepisovat?
}

export class SovereignLocalVault {
  private readonly vaultFilePath: string;
  private readonly maxVaultBytes: number = 2 * 1024 * 1024 * 1024; // Přesně 2 GB
  private currentBytes: number = 0;

  constructor(customDir?: string) {
    const baseDir =
      customDir ||
      process.env.SOVEREIGN_VAULT_DIR ||
      path.join(process.env.USERPROFILE || process.env.HOME || ".", ".asgard_vault", "context_vault");

    this.vaultFilePath = path.join(baseDir, "sovereign_context_vault.jsonl");
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.vaultFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(this.vaultFilePath)) {
      this.currentBytes = fs.statSync(this.vaultFilePath).size;
    } else {
      fs.writeFileSync(this.vaultFilePath, "", "utf-8");
      this.currentBytes = 0;
    }
  }

  public getVaultInfo(): { path: string; currentBytes: number; maxBytes: number; percentage: number } {
    return {
      path: this.vaultFilePath,
      currentBytes: this.currentBytes,
      maxBytes: this.maxVaultBytes,
      percentage: Number(((this.currentBytes / this.maxVaultBytes) * 100).toFixed(2)),
    };
  }

  public appendContext(context: ConsolidatedContext): void {
    const line = JSON.stringify(context) + "\n";
    const lineSize = Buffer.byteLength(line, "utf-8");

    if (this.currentBytes + lineSize > this.maxVaultBytes) {
      this.compactVault();
    }

    fs.appendFileSync(this.vaultFilePath, line, "utf-8");
    this.currentBytes += lineSize;
  }

  public loadFullConsolidatedContext(): string {
    if (!fs.existsSync(this.vaultFilePath)) {
      return "Zatím žádný předchozí kontext. Jste první agent ve směně.";
    }

    const content = fs.readFileSync(this.vaultFilePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return "Výchozí kontext prázdný.";

    const recent: ConsolidatedContext[] = lines.slice(-10).map((l) => JSON.parse(l));

    let report = "=== 🏛️ CELKOVÝ KONTEXT ZE 2GB SVRCHOVANÉHO TREZORU ===\n";
    report += `Celkem archivováno směn: ${lines.length}\n`;
    report += `Zaplnění trezoru: ${(this.currentBytes / 1024 / 1024).toFixed(2)} MB / 2048 MB\n\n`;

    for (const shift of recent) {
      report += `--- [Směna #${shift.shiftNumber} | Agent: ${shift.agentId} | ${shift.timestamp}] ---\n`;
      report += `Axiomy & Invarianty: ${shift.coreInvariants.join(" | ")}\n`;
      report += `Architektonická rozhodnutí: ${shift.architecturalDecisions.join("; ")}\n`;
      report += `Rozpracované úkoly: ${shift.pendingTasks.join("; ")}\n`;
      report += `Souhrn kontextu: ${shift.fullSummary}\n\n`;
    }

    return report;
  }

  private compactVault(): void {
    console.log("⚡ [VAULT COMPACTION] Dosažen 2GB strop. Rotuji a zhutňuji staré směny...");
    const content = fs.readFileSync(this.vaultFilePath, "utf-8");
    const lines = content.trim().split("\n");
    const half = Math.floor(lines.length / 2);
    const retained = lines.slice(half).join("\n") + "\n";
    fs.writeFileSync(this.vaultFilePath, retained, "utf-8");
    this.currentBytes = fs.statSync(this.vaultFilePath).size;
  }
}

export class InfiniteRelayOrchestrator {
  private shiftNumber: number = 1;
  private currentAgentId: string = "Agent_1_Fresh";
  public vault: SovereignLocalVault;
  private nasArchiveDir: string = "W:\\archivy-zip\\orchestrace";
  public lastHandshake: HandshakeCache | null = null;
  private currentTextLength: number = 0;
  private readonly textCharLimit: number = 400_000; // Hranice textu, kdy se blíží limit paměti a spouští se střídání
  private agentsMdPath: string = "W:\\tools\\webmcp-mesh-sovereign\\AGENTS.md";

  constructor(vaultDir?: string, nasArchiveDir?: string, agentsMdPath?: string) {
    this.vault = new SovereignLocalVault(vaultDir);
    if (nasArchiveDir) this.nasArchiveDir = nasArchiveDir;
    if (agentsMdPath) this.agentsMdPath = agentsMdPath;
  }

  public start(): void {
    console.log(`🛡️ [GNAT WATCHDOG] Aktivován dohled nad délkou textu.`);
    console.log(`👁️ [SHADOW NODE] Stínový agent připraven v tichém režimu (Hot Standby).`);
    console.log(`📏 [HRANICE TEXTU] Střídání nastane POUZE když se text přiblíží k limitu (${this.textCharLimit} znaků).`);
  }

  public registerTextDelta(text: string): void {
    this.currentTextLength += text.length;

    // Kontrola, zda se text blíží k hranici
    if (this.currentTextLength >= this.textCharLimit) {
      console.log(`⚠️ [GNAT WATCHDOG] Text se přiblížil k limitu (${this.currentTextLength} / ${this.textCharLimit} znaků).`);
      console.log(`📢 [POVOLÁN STÍNOVÝ AGENT] Druhý agent se připravuje na převzetí štafety...`);
      this.performContextTriggeredHandover("text_limit_reached");
    }
  }

  public getStatus(): {
    shiftNumber: number;
    currentAgentId: string;
    currentTextLength: number;
    textCharLimit: number;
    vaultInfo: any;
    lastHandshake: HandshakeCache | null;
  } {
    return {
      shiftNumber: this.shiftNumber,
      currentAgentId: this.currentAgentId,
      currentTextLength: this.currentTextLength,
      textCharLimit: this.textCharLimit,
      vaultInfo: this.vault.getVaultInfo(),
      lastHandshake: this.lastHandshake,
    };
  }

  public async performContextTriggeredHandover(
    reason: string,
    activeTasks: string[] = ["Pokračovat v implementaci dle AGENTS.md"],
    achievedSummary: string = "Konsolidace celkového stavu před výmazem historie"
  ): Promise<{ status: string; freshAgentId: string; agentsMdUpdated: boolean; handshake: HandshakeCache }> {
    const nextAgentId = `Agent_${this.shiftNumber + 1}_Fresh`;
    console.log(`💥 [BUM - STŘÍDÁNÍ] Text dosáhl hranice. Agent #${this.shiftNumber} (${this.currentAgentId}) předává štafetu.`);
    console.log(`📝 [GNAT WATCHDOG] Zapisuji celkový kontext do AGENTS.md a trezoru...`);

    // 1. Vygenerování a aktualizace konsolidovaného AGENTS.md pro nového agenta
    const consolidatedMd = this.generateConsolidatedAgentsMd(nextAgentId, achievedSummary, activeTasks);
    let mdUpdated = false;
    try {
      fs.writeFileSync(this.agentsMdPath, consolidatedMd, "utf-8");
      mdUpdated = true;
      console.log(`✅ [AGENTS.md AKTUALIZOVÁN] Cesta: ${this.agentsMdPath}`);
    } catch (e: any) {
      console.warn(`⚠️ Nelze zapsat AGENTS.md přímo na původní cestu:`, e.message);
    }

    // 2. Zápis do trvalého 2GB trezoru
    const delta: ConsolidatedContext = {
      shiftNumber: this.shiftNumber,
      agentId: this.currentAgentId,
      timestamp: new Date().toISOString(),
      coreInvariants: ["SPARK_Mode On", "Text Limit Trigger", "No Exceptions", "Ranged Types"],
      architecturalDecisions: [
        "Žádný hloupý časovač – střídání pouze při naplnění textu",
        "Nový agent přichází se smazanou historií + načítá AGENTS.md",
        "GNAT Watchdog zajišťuje dohled a zápis do trezoru",
      ],
      activeCodeSnippets: {},
      pendingTasks: activeTasks,
      fullSummary: achievedSummary,
    };
    this.vault.appendContext(delta);

    // 3. Handshake pro nového agenta
    this.lastHandshake = {
      generatedBy: nextAgentId,
      forAgent: this.currentAgentId,
      timestamp: new Date().toISOString(),
      contextDigest: achievedSummary,
      suggestedTargets: [this.agentsMdPath],
      rewriteVerdict: "NO_REWRITE_NEEDED",
      rationale: "Kontext zhutněn do AGENTS.md. Historie aktivního agenta smazána pro maximální rychlost a nulový balast.",
    };

    // 4. Reset délky textu pro nového agenta (smazaná historie, čistá hlava!)
    this.currentTextLength = 0;
    this.shiftNumber++;
    this.currentAgentId = nextAgentId;

    console.log(`🚀 [NASTUPUJE ČERSTVÝ AGENT] ${this.currentAgentId} nastoupil se SMAZANOU historií!`);
    console.log(`📖 [KONTEXT NAČTEN] Čte aktuální AGENTS.md a pokračuje bez zátěže starého balastu.`);

    return {
      status: "success",
      freshAgentId: this.currentAgentId,
      agentsMdUpdated: mdUpdated,
      handshake: this.lastHandshake,
    };
  }

  private generateConsolidatedAgentsMd(agentId: string, summary: string, tasks: string[]): string {
    return `# Asterisk WebMCP 2026 — Sovereign Agent Guidance

> **Aktuální směna:** #${this.shiftNumber + 1} (${agentId})
> **Režim:** Fresh Memory Window (předchozí historie smazána, kontinuita zachována v tomto souboru)
> **Poslední aktualizace kontextu (GNAT Watchdog):** ${new Date().toISOString()}

## Přehled stavu a konsolidovaný kontext
${summary}

## Architektura a základní principy
- **Frontend:** React 18 + TypeScript + Vite, Three.js 3D Avatar (v \`src/components/Avatar3DCanvas.tsx\`)
- **Verifikované jádro:** Ada 2022 / SPARK s nulovou tolerancí chyb (\`pragma SPARK_Mode (On);\`)
- **Soukromí:** In-Memory provedení, protokol Ash Sweeper (výmaz v RAM)
- **WebMCP:** Autonomní systémové nástroje pro asistenci a znakový jazyk
- **Tandemový Shadow Node:** Tichý záložní agent na lavičce pro okamžitý zástup bez spamování konzole

## Aktivní úkoly pro nastupujícího agenta
${tasks.map((t) => `- [ ] ${t}`).join("\n")}

## Pravidla kontinuity
1. Nevytvářet zbytečné nové soubory tam, kde už existuje oficiální modul.
2. Před přetečením kontextu předat stav GNAT Watchdogu k zápisu do tohoto souboru.
3. Kód psát formálně verifikovatelný pro \`gnatprove\`.
`;
  }

  public stop(): void {
    if (this.shiftTimer) clearTimeout(this.shiftTimer);
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    console.log(`🛑 [GNAT WATCHDOG] Zastaven.`);
  }

  private async zipOldOrchestrationToNAS(filePath: string): Promise<string> {
    try {
      if (!fs.existsSync(this.nasArchiveDir)) {
        fs.mkdirSync(this.nasArchiveDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      const baseName = path.basename(filePath, path.extname(filePath));
      const zipFileName = `${baseName}_${timestamp}.zip`;
      const zipFullPath = path.join(this.nasArchiveDir, zipFileName);

      const cmd = `powershell -NoProfile -Command "Compress-Archive -Path '${filePath}' -DestinationPath '${zipFullPath}' -Force"`;
      await execAsync(cmd);
      return zipFullPath;
    } catch (err: any) {
      console.warn("⚠️ [ZIP NAS VAROVÁNÍ] Nelze zazipovat na NAS:", err.message);
      return "";
    }
  }
}
