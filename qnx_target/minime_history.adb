-- ============================================================================
--  MiniMe_History — Implementace bezpečného vyhledávání a zápisu checkpointů
-- ============================================================================

pragma SPARK_Mode (On);

package body MiniMe_History is

   ------------------
   -- Get_Value_At --
   ------------------

   function Get_Value_At
     (H            : History_Buffer;
      Target_Block : Block_Number) return Token_Amount
   is
   begin
      if H.Count = 0 then
         return 0;
      end if;

      -- Rychlá kontrola posledního bloku
      if Target_Block >= H.List (H.Count).From_Block then
         return H.List (H.Count).Value;
      end if;

      -- Dotaz před vznikem tokenu
      if Target_Block < H.List (1).From_Block then
         return 0;
      end if;

      -- Zpětný průchod od nejnovějších checkpointů
      for I in reverse 1 .. H.Count loop
         if H.List (I).From_Block <= Target_Block then
            return H.List (I).Value;
         end if;
      end loop;

      return 0;
   end Get_Value_At;

   -------------------------
   -- Update_Value_At_Now --
   -------------------------

   procedure Update_Value_At_Now
     (H             : in out History_Buffer;
      Current_Block : in     Block_Number;
      New_Value     : in     Token_Amount;
      Success       :    out Boolean)
   is
   begin
      if H.Count = 0 or else H.List (H.Count).From_Block < Current_Block then
         -- Přidání nového checkpointu
         if H.Count < Max_Checkpoints then
            H.Count := H.Count + 1;
            H.List (H.Count) := (From_Block => Current_Block, Value => New_Value);
            Success := True;
         else
            -- Paměť pro checkpointy je vyčerpána
            Success := False;
         end if;
      elsif H.List (H.Count).From_Block = Current_Block then
         -- Přepis stávajícího checkpointu pro stejný blok
         H.List (H.Count).Value := New_Value;
         Success := True;
      else
         -- Pokus o zápis v rozporu s časovou kauzalitou
         Success := False;
      end if;
   end Update_Value_At_Now;

end MiniMe_History;
