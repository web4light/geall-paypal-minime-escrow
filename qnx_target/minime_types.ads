-- ============================================================================
--  MiniMe_Types — Základní datové typy pro MiniMe Token v Ada 2022 / SPARK
--  Původní koncept: Giveth & Aragon (Jordi Baylina)
--  Formální SPARK verifikace: Zero heap allocation, ranged types, overflow proofs
-- ============================================================================

pragma SPARK_Mode (On);

with Interfaces; use type Interfaces.Unsigned_8;

package MiniMe_Types is

   -- -------------------------------------------------------------------------
   -- 1. Bloky, čas a adresy
   -- -------------------------------------------------------------------------
   type Block_Number is range 0 .. 2**62 - 1;

   Address_Length : constant := 20;
   subtype Address_Index is Positive range 1 .. Address_Length;
   type Address_Bytes is array (Address_Index) of Interfaces.Unsigned_8;

   type Address is record
      Bytes : Address_Bytes := (others => 0);
   end record;

   Zero_Address : constant Address := (Bytes => (others => 0));

   function Equal_Address (A, B : Address) return Boolean is
     (for all I in Address_Index => A.Bytes (I) = B.Bytes (I));

   -- -------------------------------------------------------------------------
   -- 2. Peněžní jednotky a zůstatky
   -- -------------------------------------------------------------------------
   -- Maximální nabídka tokenů (např. 10 miliard tokenů s 8 desetinnými místy)
   -- Omezeno tak, aby součet a násobení nikdy nepřetekly 64-bitový Integer
   Max_Total_Supply : constant := 10_000_000_000_000_000; -- 10^16

   subtype Token_Amount is Long_Long_Integer range 0 .. Max_Total_Supply;

   -- -------------------------------------------------------------------------
   -- 3. Historické kontrolní body (Checkpoints)
   -- -------------------------------------------------------------------------
   type Checkpoint is record
      From_Block : Block_Number := 0;
      Value      : Token_Amount := 0;
   end record;

   Max_Checkpoints : constant := 512;
   subtype Checkpoint_Count is Natural range 0 .. Max_Checkpoints;
   subtype Checkpoint_Index is Positive range 1 .. Max_Checkpoints;
   type Checkpoint_Array is array (Checkpoint_Index) of Checkpoint;

   type History_Buffer is record
      List  : Checkpoint_Array := (others => (From_Block => 0, Value => 0));
      Count : Checkpoint_Count := 0;
   end record;

   -- Predikát: Historie je ostře rostoucí v číslech bloků
   function Is_Monotonic (H : History_Buffer) return Boolean is
     (H.Count <= 1
      or else (for all I in 1 .. H.Count - 1 =>
                 H.List (I).From_Block < H.List (I + 1).From_Block))
   with Ghost;

   -- -------------------------------------------------------------------------
   -- 4. Kapacity a limity pro formální důkaz
   -- -------------------------------------------------------------------------
   Max_Accounts : constant := 64;
   subtype Account_Count is Natural range 0 .. Max_Accounts;
   subtype Account_Index is Positive range 1 .. Max_Accounts;

   Max_Tokens : constant := 8;
   subtype Token_Id is Natural range 0 .. Max_Tokens;
   subtype Valid_Token_Id is Positive range 1 .. Max_Tokens;

end MiniMe_Types;
