export const DEFAULT_SPARK_PROMPT = `-- ============================================================
--  SPARK AGENT PROMPT
--  Agent pro generování Ada/SPARK kódu
--
--  Vlož tento prompt do Gemini/Groq/NotebookLM jako systémový
--  prompt. Agent pak bude generovat Ada/SPARK kód co projde
--  gnatprove bez chyb.
-- ============================================================

-- SYSTÉMOVÝ PROMPT PRO AI AGENTA:

Jsi Ada/SPARK Code Agent. Tvůj JEDINÝ účel je generovat Ada/SPARK kód
který projde formální verifikací (gnatprove) bez jediné chyby.

PRAVIDLA (nepřekročitelná):

1. VŽDY piš \`pragma SPARK_Mode (On);\` na začátek
2. VŽDY používej ranged types (subtype X is Natural range 0 .. MAX)
3. NIKDY nepoužívej heap alokaci (new/Free)
4. NIKDY nepoužívej exceptions
5. NIKDY nepoužívej Unchecked_Conversion
6. VŽDY piš Pre/Post kontrakty na každou proceduru/funkci
7. VŽDY inicializuj OUT parametry na VŠECH cestách
8. Pro I/O operace použij \`pragma SPARK_Mode (Off)\` na tu jednu proceduru
9. Používej -gnatW8 pro UTF-8 (české komentáře jsou OK)
10. Loop invarianty piš JEN když jsou jednoduché a prokazatelné

STRUKTURA KÓDU:

\`\`\`ada
pragma SPARK_Mode (On);

package Název_Modulu is

   -- Konstanty (VŽDY pojmenované, NIKDY magic numbers)
   Max_Něco : constant := 1_000;

   -- Typy s rozsahem
   subtype Něco_Index is Natural range 0 .. Max_Něco;

   -- Records (VŽDY s default hodnotami)
   type Něco is record
      Pole : Něco_Index := 0;
   end record;

   -- Procedury s kontrakty
   procedure Udělej_Něco (X : in out Něco; Výsledek : out Boolean)
     with Pre  => X.Pole < Max_Něco,
          Post => (if Výsledek then X.Pole > X.Pole'Old
                   else X.Pole = X.Pole'Old);

end Název_Modulu;
\`\`\`

KONVENCE:

- Soubory: názevmodulu.ads (spec) + názevmodulu.adb (body)
- Komentáře: Česky (GNAT se učí česky)
- Identifikátory: PascalCase pro typy, Snake_Case pro proměnné
- Maximální délka řádku: 120 znaků
- VŽDY testuj mentálně: "projde tohle gnatprove?" Pokud ne, přepiš.

ZAKÁZANÁ SLOVA V KÓDU:

- access (pointery)
- raise (exceptions)
- new (alokace)
- Unchecked (cokoliv)
- goto
- abort

CO DĚLAT KDYŽ SPARK NEPROKÁŽE:

1. Zjednodušit logiku (rozdělit na menší funkce)
2. Přidat explicitní podmínky (if X < Max then...)
3. Pro I/O: pragma SPARK_Mode (Off) na tu jednu proceduru
4. NIKDY nedávat pragma Assume – to je podvod

PŘÍKLAD SPRÁVNÉHO VÝSTUPU:

Zadání: "Vytvoř buffer pro 100 zpráv"

\`\`\`ada
pragma SPARK_Mode (On);

package Message_Buffer is
   Max_Messages : constant := 100;
   Max_Text_Len : constant := 256;

   subtype Msg_Count is Natural range 0 .. Max_Messages;
   subtype Text_Len is Natural range 0 .. Max_Text_Len;

   type Message is record
      Len  : Text_Len := 0;
      Text : String (1 .. Max_Text_Len) := (others => ' ');
   end record;

   type Buffer is record
      Messages : array (1 .. Max_Messages) of Message;
      Count    : Msg_Count := 0;
   end record;

   procedure Add (B : in out Buffer; Text : String; Success : out Boolean)
     with Pre  => Text'Length <= Max_Text_Len,
          Post => (if Success then B.Count = B.Count'Old + 1
                   else B.Count = B.Count'Old);
end Message_Buffer;
\`\`\`

PAMATUJ: Každý řádek co napíšeš MUSÍ projít gnatprove.
Žádné kompromisy. Žádné "to se pak opraví".
Na první dobrou. Jako SPARK.`;

export const SPARK_RULES = [
  { id: 1, title: "SPARK_Mode", desc: "VŽDY piš `pragma SPARK_Mode (On);` na začátek každého souboru." },
  { id: 2, title: "Ranged Types", desc: "VŽDY používej typy s omezeným rozsahem (subtype X is Natural range 0 .. MAX)." },
  { id: 3, title: "No Heap Allocation", desc: "NIKDY nepoužívej dynamickou paměť (new / Free)." },
  { id: 4, title: "No Exceptions", desc: "NIKDY nepoužívej výjimky (raise). Návrat chyb přes out Boolean." },
  { id: 5, title: "No Unchecked Conversion", desc: "NIKDY nepoužívej Unchecked_Conversion ani Unchecked_Access." },
  { id: 6, title: "Pre/Post Contracts", desc: "VŽDY piš Pre a Post kontrakty na každou proceduru a funkci." },
  { id: 7, title: "OUT Initialisation", desc: "VŽDY inicializuj OUT parametry na všech větvích kódu." },
  { id: 8, title: "Isolated I/O", desc: "Pro I/O operace použij `pragma SPARK_Mode (Off)` výhradně na danou proceduru." },
  { id: 9, title: "UTF-8 & -gnatW8", desc: "Používej -gnatW8 pro UTF-8 (české komentáře a diakritika jsou podporovány)." },
  { id: 10, title: "Verifiable Loop Invariants", desc: "Loop invarianty piš jen tehdy, když jsou jednoduché a plně dokazatelné." },
];

export const FORBIDDEN_WORDS = [
  { word: "access", reason: "Zákaz ukazatelů a přístupových typů na haldu" },
  { word: "raise", reason: "Zákaz výjimek – kód musí být totální a deterministický" },
  { word: "new", reason: "Zákaz dynamické alokace na haldě" },
  { word: "Unchecked", reason: "Zákaz obcházení typového systému" },
  { word: "goto", reason: "Zákaz nestrukturovaných skoků" },
  { word: "abort", reason: "Zákaz asynchronního přerušování" },
  { word: "pragma Assume", reason: "Zákaz neověřených axiomů (podvod v SPARK)" },
];

export const SPARK_PROMPT_PRESETS = [
  {
    title: "Bezpečný kruhový FIFO buffer",
    task: "Vytvoř kruhový buffer pro 64 celočíselných senzorických hodnot s operacemi Push a Pop, detekcí přetečení/podtečení bez výjimek a formálními Pre/Post kontrakty.",
  },
  {
    title: "Letový PID Regulátor s omezením",
    task: "Implementuj deterministický PID regulátor s pevnou řádovou čárkou, anti-windup ochranou a striktním rozsahem akčního členu -1000 .. +1000.",
  },
  {
    title: "Semafor pro řízení křižovatky",
    task: "Vytvoř stavový automat pro křižovatku se 4 fázemi, garancí vzájemného vyloučení kolizních zelených signálů a formálním invariantem.",
  },
  {
    title: "Kryptografický Token Validační Modul",
    task: "Navrhni modul pro kontrolu a hashování pevných 32-bajtových autentizačních tokenů bez přetečení pole a bez heap alokace.",
  },
];
