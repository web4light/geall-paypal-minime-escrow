import * as fs from "fs";
import * as path from "path";

export interface AgentHandoverDelta {
  shiftNumber: number;
  timestamp: string;
  decisions: string[];
  codeChanges: string[];
  activeTasks: string[];
  architecturalInvariants: string[];
  rawDeltaSummary: string;
}

export class SovereignContextVault {
  private readonly vaultPath: string;
  private readonly maxVaultBytes: number = 2 * 1024 * 1024 * 1024; // 2 GB
  private currentBytes: number = 0;

  constructor(vaultDir: string) {
    this.vaultPath = path.join(vaultDir, "sovereign_context_vault.jsonl");
    this.ensureVaultExists();
  }

  private ensureVaultExists(): void {
    const dir = path.dirname(this.vaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(this.vaultPath)) {
      const stats = fs.statSync(this.vaultPath);
      this.currentBytes = stats.size;
    } else {
      fs.writeFileSync(this.vaultPath, "", "utf-8");
      this.currentBytes = 0;
    }
  }

  public appendDelta(delta: AgentHandoverDelta): void {
    const line = JSON.stringify(delta) + "\n";
    const lineBytes = Buffer.byteLength(line, "utf-8");

    // Pokud by zápis překročil 2 GB, provedeme kompresi/rotaci
    if (this.currentBytes + lineBytes > this.maxVaultBytes) {
      this.rotateAndCompactVault();
    }

    fs.appendFileSync(this.vaultPath, line, "utf-8");
    this.currentBytes += lineBytes;
  }

  public getConsolidatedContextBriefing(): string {
    if (!fs.existsSync(this.vaultPath)) return "Čistý kontext. Žádná předchozí historie.";
    const content = fs.readFileSync(this.vaultPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return "Výchozí stav: Žádné záznamy.";

    // Vezmeme trvalé esence a posledních 5 směn s plným detailem
    const recentDeltas: AgentHandoverDelta[] = lines
      .slice(-5)
      .map((l) => JSON.parse(l));

    let briefing = "=== SOUHRNNÝ BRIEFING Z 2GB VAKUOVÉHO TREZORU ===\n";
    briefing += `Celkem archivováno směn: ${lines.length}\n`;
    briefing += "--- POSLEDNÍ STAV A ARCHITEKTONICKÁ ROZHODNUTÍ ---\n";

    for (const d of recentDeltas) {
      briefing += `\n[Směna #${d.shiftNumber} (${d.timestamp})]\n`;
      briefing += `Rozhodnutí: ${d.decisions.join("; ")}\n`;
      briefing += `Změny v kódu: ${d.codeChanges.join("; ")}\n`;
      briefing += `Rozpracované úkoly: ${d.activeTasks.join("; ")}\n`;
      briefing += `Shrnutí: ${d.rawDeltaSummary}\n`;
    }

    return briefing;
  }

  private rotateAndCompactVault(): void {
    console.log("⚡ [VAULT] Dosažen 2GB limit. Provádím hierarchické zhutnění...");
    const content = fs.readFileSync(this.vaultPath, "utf-8");
    const lines = content.trim().split("\n");
    // Ponecháme posledních 50 % záznamů, starší zredukujeme
    const half = Math.floor(lines.length / 2);
    const retained = lines.slice(half).join("\n") + "\n";
    fs.writeFileSync(this.vaultPath, retained, "utf-8");
    this.currentBytes = fs.statSync(this.vaultPath).size;
  }
}

export class AgentRelayOrchestrator {
  private shiftNumber: number = 1;
  private shiftTimer: NodeJS.Timeout | null = null;
  private readonly shiftDurationMs: number = 5 * 60 * 1000; // 5 minut
  private vault: SovereignContextVault;
  private onAgentSwap: (freshSystemPrompt: string) => Promise<void>;
  private callAgentForSummary: () => Promise<AgentHandoverDelta>;

  constructor(
    vaultDir: string,
    callAgentForSummary: () => Promise<AgentHandoverDelta>,
    onAgentSwap: (freshSystemPrompt: string) => Promise<void>
  ) {
    this.vault = new SovereignContextVault(vaultDir);
    this.callAgentForSummary = callAgentForSummary;
    this.onAgentSwap = onAgentSwap;
  }

  public start(): void {
    console.log("🛡️ [ORCHESTRATOR] 5minutová štafeta agentů spuštěna.");
    this.scheduleNextRelay();
  }

  private scheduleNextRelay(): void {
    if (this.shiftTimer) clearTimeout(this.shiftTimer);
    this.shiftTimer = setTimeout(async () => {
      await this.triggerHandover("5min_interval");
    }, this.shiftDurationMs);
  }

  public async triggerHandover(reason: "5min_interval" | "token_limit"): Promise<void> {
    console.log(`🔄 [HOT-SWAP] Zahajuji výměnu agenta. Důvod: ${reason} (Směna #${this.shiftNumber})`);
    try {
      // 1. Unavený agent vytvoří strukturovanou deltu
      const delta = await this.callAgentForSummary();
      delta.shiftNumber = this.shiftNumber;
      delta.timestamp = new Date().toISOString();

      // 2. Zápis do 2GB trezoru na lokálním hardwaru
      this.vault.appendDelta(delta);

      // 3. Příprava briefingu pro nového čerstvého agenta
      const freshContext = this.vault.getConsolidatedContextBriefing();
      this.shiftNumber++;

      // 4. Hot-Swap agenta s nulovou ztrátou spojení
      await this.onAgentSwap(freshContext);
      console.log(`✅ [HOT-SWAP] Čerstvý Agent #${this.shiftNumber} nastoupil do služby.`);

      // 5. Naplánování další směny
      this.scheduleNextRelay();
    } catch (err) {
      console.error("❌ [ORCHESTRATOR CHYBA] Štafeta selhala:", err);
      this.scheduleNextRelay();
    }
  }

  public stop(): void {
    if (this.shiftTimer) {
      clearTimeout(this.shiftTimer);
      this.shiftTimer = null;
    }
  }
}
