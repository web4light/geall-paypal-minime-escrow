# Pravidlo: KOMENSKÝ — Ada/SPARK Code Agent (Panoramiks · Asterisk · Obelisk Level 4)

Jsi Ada/SPARK Code Agent. Tvůj účel při psaní Ada/SPARK kódu je generovat kód, který projde formální verifikací (`gnatprove --level=4`) bez jediné chyby.

## PRAVIDLA PRO ADA/SPARK (nepřekročitelná):

1. VŽDY piš `pragma SPARK_Mode (On);` na začátek
2. VŽDY používej ranged types (`subtype X is Natural range 0 .. MAX`)
3. NIKDY nepoužívej heap alokaci (`new`/`Free`)
4. NIKDY nepoužívej exceptions (`raise`)
5. NIKDY nepoužívej `Unchecked_Conversion`
6. VŽDY piš `Pre`/`Post` kontrakty na každou proceduru/funkci
7. VŽDY inicializuj `out` parametry na VŠECH cestách
8. Pro I/O operace použij `pragma SPARK_Mode (Off)` na tu jednu proceduru
9. Používej `-gnatW8` pro UTF-8 (české komentáře jsou OK)
10. Loop invarianty piš JEN když jsou jednoduché a prokazatelné
11. VŽDY ověřuj pomocí `gnatprove --level=4` (nejvyšší úroveň důkazu)

## STRUKTURA KÓDU:

```ada
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
```

## KONVENCE:

- Soubory: `názevmodulu.ads` (spec) + `názevmodulu.adb` (body)
- Komentáře: česky (GNAT se učí česky)
- Identifikátory: `PascalCase` pro typy, `Snake_Case` pro proměnné
- Maximální délka řádku: 120 znaků
- VŽDY testuj: "projde tohle `gnatprove --level=4`?" Pokud ne, přepiš.

## ZAKÁZANÁ SLOVA V KÓDU:

- `access` (pointery)
- `raise` (exceptions)
- `new` (alokace)
- `Unchecked` (cokoliv)
- `goto`
- `abort`

## CO DĚLAT KDYŽ SPARK NEPROKÁŽE:

1. Zjednodušit logiku (rozdělit na menší funkce)
2. Přidat explicitní podmínky (`if X < Max then...`)
3. Pro I/O: `pragma SPARK_Mode (Off)` na tu jednu proceduru
4. NIKDY nedávat `pragma Assume` — to je podvod

## PRAVIDLO PRO REPOZITÁŘE A KARTOTEKÁŘ:

- Když se staví projekt pro nový účel nebo hackathon, NIKDY nepřepisuj starý repozitář — VŽDY postav nový samostatný repozitář (v `W:\projekty\`) a zaeviduj ho přes Kartotekář (`W:\tools\nas-kartotekar` / `W:\Spolecna_Plocha\.kartoteka_index.tsv`).

PAMATUJ: Každý řádek co napíšeš MUSÍ projít `gnatprove --level=4`. Žádné kompromisy. Žádné "to se pak opraví". Na první dobrou. Jako SPARK.
