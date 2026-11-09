-- ============================================================================
--  MiniMe_History — Správa historie zůstatků a checkpointů v čase
--  Původní koncept: getValueAt & updateValueAtNow z MiniMeToken.sol
-- ============================================================================

pragma SPARK_Mode (On);

with MiniMe_Types; use MiniMe_Types;

package MiniMe_History is

   -- Dotaz na hodnotu zůstatku nebo nabídky v daném bloku
   -- Pokud historie neexistuje, vrací 0.
   -- Pokud je blok před prvním checkpointem, vrací 0.
   -- Pokud je blok za posledním checkpointem, vrací poslední hodnotu.
   -- Jinak vrací hodnotu nejbližšího platného checkpointu.
   function Get_Value_At
     (H            : History_Buffer;
      Target_Block : Block_Number) return Token_Amount;

   -- Aktualizace hodnoty v aktuálním bloku
   -- Pokud v tomto bloku již existuje checkpoint, přepíše se jeho hodnota.
   -- Pokud je blok novější než poslední checkpoint, přidá se nový záznam.
   -- Pokud je historie plná nebo je blok v minulosti, vrací Success = False.
   procedure Update_Value_At_Now
     (H             : in out History_Buffer;
      Current_Block : in     Block_Number;
      New_Value     : in     Token_Amount;
      Success       :    out Boolean)
   with
     Post => (if Success then
                H.Count >= H.Count'Old
                and H.List (H.Count).Value = New_Value);

end MiniMe_History;
