# 🛡️ G(E)A(L)L — PayPal + MiniMe Ada Dual-Escrow Studio (GNATprove Level 4)

**G(E)A(L)L** (*Gallic Workflow & Formal Verification Studio*) — Samostatný repozitář pro **PayPal AI Hackathon (Agentic Commerce & Dual-Escrow Anti-Scam Engine)**:
- **Panoramiks (`Ada 2022`)** — Typově bezpečný a deterministický systémový jazyk bez haldy a bez výjimek
- **Asterisk (`SPARK 2022`)** — Formální kontrakty (`Pre` / `Post`), dvojitý zákon zachování hodnoty a ochrana proti podvodníkům
- **Obelisk (`GNATprove 16.1.0 --level=4` + `CVC5` / `Z3`)** — Matematický důkaz absence běhových chyb (AoRTE) na nejvyšší úrovni **Level 4**

---

## 🔒 Architektura Dvojité Mezischránky proti podvodníkům (`PayPal_Agentic_Settlement_Guard` + `MiniMe-Ada`)

Tento projekt propojuje **PayPal Orders v2 Sandbox** s formálně verifikovaným klonovatelným tokenem **MiniMe v Adě** (`MiniMe_Types`, `MiniMe_History`, `MiniMe_Token`, `MiniMe_Controller`) přes **Dvojitou Mezischránku (`Dual_Escrow_Chamber`)**:

1. **Mezischránka #1 (`Escrow_Fiat_Cents` — PayPal Peníze):**
   - Kupující složí peníze ze svého PayPal účtu do 1. mezischránky (`Deposit_Buyer_PayPal_To_Escrow`). Peníze odejdou z `Buyer_PayPal_Cents`, ale prodávající na ně nemůže sáhnout, dokud nedodá dohodnuté tokeny.
2. **Mezischránka #2 (`Escrow_MiniMe_Tokens` — MiniMe Ada Tokeny / Krypto / Herní Tokeny):**
   - Prodávající složí herní tokeny / klonované MiniMe tokeny (`MMT`, `CMMT`, `KingsStar`, `Standard700_Gros`) ověřené přes `MiniMe_Controller.On_Transfer` do 2. mezischránky (`Deposit_Seller_MiniMe_Tokens_To_Escrow`).
3. **Atomická Záměna Křížem (`Execute_Atomic_Dual_Escrow_Swap`):**
   - **Obelisk (`gnatprove --level=4`)** matematicky garantuje, že uvolnění prostředků nastane **výhradně tehdy**, když jsou obě mezischránky naplněné na 100 % (`Escrow_Fiat_Cents = Agreed_Fiat_Cents` a `Escrow_MiniMe_Tokens = Agreed_MiniMe_Tokens`).
   - V jediném neoddělitelném kroku odešle PayPal peníze prodávajícímu a MiniMe tokeny kupujícímu.
4. **Nouzové Vrácení (`Refund_Dual_Escrow`):**
   - Pokud kterákoliv strana nedodá svou část obchodu, mezischránka vrátí peníze kupujícímu a tokeny prodávajícímu s nulovou ztrátou.

---

## ✅ Výsledek verifikace Obelisk (`gnatprove --level=4`)

```text
gnatprove -P qnx_spark.gpr -u paypal_agentic_settlement_guard.adb --mode=all --report=all --level=4
Phase 1 of 3: generation of data representation information ...
Phase 2 of 3: generation of Global contracts ...
Phase 3 of 3: flow analysis and proof ...
Success: all checks proved (18 checks).
```
