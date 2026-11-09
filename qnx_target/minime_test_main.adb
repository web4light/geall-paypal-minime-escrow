-- ============================================================================
--  MiniMe_Test_Main — Testovací exekutor pro ověření chování MiniMe Tokenu
--  Replikuje testovací scénáře z `test/minimetoken_normal.js`
-- ============================================================================

with Ada.Text_IO; use Ada.Text_IO;
with MiniMe_Types; use MiniMe_Types;
with MiniMe_Token; use MiniMe_Token;
with MiniMe_Controller; use MiniMe_Controller;

procedure MiniMe_Test_Main is

   Registry : Token_Registry;

   -- Testovací adresy
   Controller_Addr : constant Address := (Bytes => (1 => 1, others => 0));
   Alice_Addr      : constant Address := (Bytes => (1 => 2, others => 0));
   Bob_Addr        : constant Address := (Bytes => (1 => 3, others => 0));
   Charlie_Addr    : constant Address := (Bytes => (1 => 4, others => 0));
   Campaign_Vault  : constant Address := (Bytes => (1 => 9, others => 0));

   Parent_Id : constant Valid_Token_Id := 1;
   Clone_Id  : Token_Id;
   Success   : Boolean;

   Name_Parent : String_Name := (others => ' ');
   Sym_Parent  : String_Symbol := (others => ' ');

   Name_Clone  : String_Name := (others => ' ');
   Sym_Clone   : String_Symbol := (others => ' ');

   procedure Assert (Condition : Boolean; Msg : String) is
   begin
      if Condition then
         Put_Line ("  [OK] " & Msg);
      else
         Put_Line ("  [FAIL] " & Msg);
         raise Program_Error with "Test selhal: " & Msg;
      end if;
   end Assert;

begin
   Put_Line ("==============================================================");
   Put_Line ("  SPARK MiniMe Token — Formální běhový test v Ada 2022");
   Put_Line ("==============================================================");

   Name_Parent (1 .. 12) := "MiniMe Token";
   Sym_Parent (1 .. 3)   := "MMT";

   Name_Clone (1 .. 18)  := "MiniMe Clone Token";
   Sym_Clone (1 .. 4)    := "CMMT";

   -- -------------------------------------------------------------------------
   -- 1. Inicializace mateřského tokenu na bloku 100
   -- -------------------------------------------------------------------------
   Put_Line ("1. Inicializace mateřského tokenu MMT...");
   Init_Token
     (Token                 => Registry (Parent_Id),
      Name                  => Name_Parent,
      Symbol                => Sym_Parent,
      Decimals              => 18,
      Controller            => Controller_Addr,
      Parent_Token          => 0,
      Parent_Snapshot_Block => 0,
      Creation_Block        => 100,
      Transfers_Enabled     => True);

   Assert (Registry (Parent_Id).Active, "Parent token je aktivní");

   -- Emise 1 000 tokenů pro Alici a 500 pro Boba na bloku 100
   Generate_Tokens (Registry (Parent_Id), Controller_Addr, Alice_Addr, 1_000, 100, Registry, Success);
   Assert (Success, "Emise 1 000 tokenů pro Alici");

   Generate_Tokens (Registry (Parent_Id), Controller_Addr, Bob_Addr, 500, 100, Registry, Success);
   Assert (Success, "Emise 500 tokenů pro Boba");

   Assert (Total_Supply (Registry (Parent_Id), 100, Registry) = 1_500, "Celková nabídka je 1 500 MMT");
   Assert (Balance_Of (Registry (Parent_Id), Alice_Addr, 100, Registry) = 1_000, "Alice má 1 000 MMT na bloku 100");
   Assert (Balance_Of (Registry (Parent_Id), Bob_Addr, 100, Registry) = 500, "Bob má 500 MMT na bloku 100");

   -- -------------------------------------------------------------------------
   -- 2. Převod na bloku 105: Alice pošle 200 tokenů Bobovi
   -- -------------------------------------------------------------------------
   Put_Line ("2. Převod 200 MMT od Alice Bobovi na bloku 105...");
   Transfer (Registry (Parent_Id), Alice_Addr, Bob_Addr, 200, 105, Registry, Success);
   Assert (Success, "Převod Alice -> Bob proběhl úspěšně");

   Assert (Balance_Of (Registry (Parent_Id), Alice_Addr, 105, Registry) = 800, "Alice má 800 MMT na bloku 105");
   Assert (Balance_Of (Registry (Parent_Id), Bob_Addr, 105, Registry) = 700, "Bob má 700 MMT na bloku 105");

   -- Kontrola historického dotazu: na bloku 101 měla Alice stále 1 000!
   Assert (Balance_Of_At (Registry (Parent_Id), Alice_Addr, 101, Registry) = 1_000,
           "Historický dotaz: Alice měla na bloku 101 stále 1 000 MMT");

   -- -------------------------------------------------------------------------
   -- 3. Klonování tokenu podle snapshotu na bloku 102!
   -- -------------------------------------------------------------------------
   Put_Line ("3. Klonování MiniMe tokenu se snapshotem na bloku 102...");
   Create_Clone_Token
     (Registry          => Registry,
      Parent_Id         => Parent_Id,
      Snapshot_Block    => 102,
      Name              => Name_Clone,
      Symbol            => Sym_Clone,
      Decimals          => 18,
      Transfers_Enabled => True,
      Controller        => Controller_Addr,
      Current_Block     => 110,
      New_Token_Id      => Clone_Id,
      Success           => Success);

   Assert (Success and Clone_Id > 0, "Klon vytvořen s ID " & Token_Id'Image (Clone_Id));

   -- Ověření, že v klonu se projevily zůstatky z bloku 102 (před převodem na bloku 105!)
   Assert (Balance_Of (Registry (Clone_Id), Alice_Addr, 110, Registry) = 1_000,
           "V klonovaném tokenu má Alice 1 000 CMMT (ze snapshotu bloku 102)!");
   Assert (Balance_Of (Registry (Clone_Id), Bob_Addr, 110, Registry) = 500,
           "V klonovaném tokenu má Bob 500 CMMT (ze snapshotu bloku 102)!");
   Assert (Total_Supply (Registry (Clone_Id), 110, Registry) = 1_500,
           "Celková nabídka klonu je 1 500 CMMT");

   -- -------------------------------------------------------------------------
   -- 4. Nezávislost klonu a mateřského tokenu
   -- -------------------------------------------------------------------------
   Put_Line ("4. V klonu pošle Bob 100 CMMT Charliemu na bloku 112...");
   Transfer (Registry (Clone_Id), Bob_Addr, Charlie_Addr, 100, 112, Registry, Success);
   Assert (Success, "Klonovaný převod Bob -> Charlie proběhl");

   Assert (Balance_Of (Registry (Clone_Id), Bob_Addr, 112, Registry) = 400, "V klonu má Bob 400 CMMT");
   Assert (Balance_Of (Registry (Clone_Id), Charlie_Addr, 112, Registry) = 100, "V klonu má Charlie 100 CMMT");

   -- Mateřský token MMT zůstal nezměněn!
   Assert (Balance_Of (Registry (Parent_Id), Bob_Addr, 112, Registry) = 700,
           "Mateřský token je nedotčen: Bob má v MMT stále 700 tokenů!");
   Assert (Balance_Of (Registry (Parent_Id), Charlie_Addr, 112, Registry) = 0,
           "Mateřský token je nedotčen: Charlie má v MMT 0 tokenů!");

   -- -------------------------------------------------------------------------
   -- 5. Kampaň a Token Controller (Proxy_Payment)
   -- -------------------------------------------------------------------------
   Put_Line ("5. Test TokenControlleru a kampaně financování...");
   declare
      Campaign : Campaign_State;
      Camp_Ok  : Boolean;
   begin
      Init_Campaign
        (Campaign        => Campaign,
         Owner           => Controller_Addr,
         Token_Id        => Parent_Id,
         Vault           => Campaign_Vault,
         Start_Block     => 120,
         End_Block       => 200,
         Maximum_Funding => 10_000,
         Success         => Camp_Ok);
      Assert (Camp_Ok, "Kampaň úspěšně inicializována pro bloky 120 .. 200");

      -- Přispěvatel Charlie pošle 5 jednotek na bloku 130
      Proxy_Payment
        (Campaign      => Campaign,
         Token         => Registry (Parent_Id),
         Registry      => Registry,
         Beneficiary   => Charlie_Addr,
         Amount_Paid   => 5,
         Current_Block => 130,
         Success       => Camp_Ok);

      Assert (Camp_Ok, "Platba 5 jednotek měny úspěšně přijata");
      Assert (Campaign.Total_Collected = 5, "Celkem vybráno 5 jednotek");
      Assert (Balance_Of (Registry (Parent_Id), Charlie_Addr, 130, Registry) = 500,
              "Charlie obdržel 500 MMT (kurz 1 : 100)!");
   end;

   Put_Line ("==============================================================");
   Put_Line ("  VŠECHNY TESTY MINIME V ADA/SPARK PROBĚHLY ÚSPĚŠNĚ (100% OK)");
   Put_Line ("==============================================================");

end MiniMe_Test_Main;
