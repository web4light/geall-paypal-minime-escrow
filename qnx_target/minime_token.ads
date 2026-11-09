-- ============================================================================
--  MiniMe_Token — Kompletní implementace ERC20 klonovatelného tokenu v Adě/SPARK
--  Původní specifikace: MiniMeToken.sol (Giveth / Aragon)
-- ============================================================================

pragma SPARK_Mode (On);

with MiniMe_Types;   use MiniMe_Types;
with MiniMe_History; use MiniMe_History;

package MiniMe_Token is

   -- -------------------------------------------------------------------------
   -- Datové struktury pro účty a povolená čerpání (ERC20 Allowance)
   -- -------------------------------------------------------------------------
   type Allowance_Entry is record
      Spender : Address      := Zero_Address;
      Amount  : Token_Amount := 0;
   end record;

   Max_Spenders : constant := 8;
   subtype Spender_Index is Positive range 1 .. Max_Spenders;
   type Allowance_Array is array (Spender_Index) of Allowance_Entry;

   type Account_Record is record
      Owner    : Address         := Zero_Address;
      Active   : Boolean         := False;
      Balances : History_Buffer;
      Allowed  : Allowance_Array := (others => (Spender => Zero_Address, Amount => 0));
   end record;

   type Account_Table is array (Account_Index) of Account_Record;

   type String_Symbol is array (1 .. 8) of Character;
   type String_Name   is array (1 .. 32) of Character;

   -- -------------------------------------------------------------------------
   -- Stav instance MiniMe Tokenu
   -- -------------------------------------------------------------------------
   type MiniMe_Token_State is record
      Active                : Boolean         := False;
      Name                  : String_Name     := (others => ' ');
      Symbol                : String_Symbol   := (others => ' ');
      Decimals              : Natural         := 18;
      Controller            : Address         := Zero_Address;
      Parent_Token          : Token_Id        := 0;
      Parent_Snapshot_Block : Block_Number    := 0;
      Creation_Block        : Block_Number    := 0;
      Transfers_Enabled     : Boolean         := True;
      Total_Supply_History  : History_Buffer;
      Accounts              : Account_Table;
      Num_Accounts          : Account_Count   := 0;
   end record;

   type Token_Registry is array (Valid_Token_Id) of MiniMe_Token_State;

   -- -------------------------------------------------------------------------
   -- Základní inicializace
   -- -------------------------------------------------------------------------
   procedure Init_Token
     (Token                 : out MiniMe_Token_State;
      Name                  : in  String_Name;
      Symbol                : in  String_Symbol;
      Decimals              : in  Natural;
      Controller            : in  Address;
      Parent_Token          : in  Token_Id;
      Parent_Snapshot_Block : in  Block_Number;
      Creation_Block        : in  Block_Number;
      Transfers_Enabled     : in  Boolean);

   -- -------------------------------------------------------------------------
   -- Dotazy na zůstatky a nabídku (s delegací na rodičovský token)
   -- -------------------------------------------------------------------------
   function Balance_Of_At
     (Token        : MiniMe_Token_State;
      Owner        : Address;
      Target_Block : Block_Number;
      Registry     : Token_Registry) return Token_Amount;

   function Balance_Of
     (Token         : MiniMe_Token_State;
      Owner         : Address;
      Current_Block : Block_Number;
      Registry      : Token_Registry) return Token_Amount;

   function Total_Supply_At
     (Token        : MiniMe_Token_State;
      Target_Block : Block_Number;
      Registry     : Token_Registry) return Token_Amount;

   function Total_Supply
     (Token         : MiniMe_Token_State;
      Current_Block : Block_Number;
      Registry      : Token_Registry) return Token_Amount;

   function Get_Allowance
     (Token   : MiniMe_Token_State;
      Owner   : Address;
      Spender : Address) return Token_Amount;

   -- -------------------------------------------------------------------------
   -- ERC20 Převody
   -- -------------------------------------------------------------------------
   procedure Transfer
     (Token         : in out MiniMe_Token_State;
      Caller        : in     Address;
      To            : in     Address;
      Amount        : in     Token_Amount;
      Current_Block : in     Block_Number;
      Registry      : in     Token_Registry;
      Success       :    out Boolean);

   procedure Transfer_From
     (Token         : in out MiniMe_Token_State;
      Caller        : in     Address;
      From          : in     Address;
      To            : in     Address;
      Amount        : in     Token_Amount;
      Current_Block : in     Block_Number;
      Registry      : in     Token_Registry;
      Success       :    out Boolean);

   procedure Approve
     (Token   : in out MiniMe_Token_State;
      Owner   : in     Address;
      Spender : in     Address;
      Amount  : in     Token_Amount;
      Success :    out Boolean);

   -- -------------------------------------------------------------------------
   -- Správa emise (Pouze Controller)
   -- -------------------------------------------------------------------------
   procedure Generate_Tokens
     (Token         : in out MiniMe_Token_State;
      Caller        : in     Address;
      Owner         : in     Address;
      Amount        : in     Token_Amount;
      Current_Block : in     Block_Number;
      Registry      : in     Token_Registry;
      Success       :    out Boolean);

   procedure Destroy_Tokens
     (Token         : in out MiniMe_Token_State;
      Caller        : in     Address;
      Owner         : in     Address;
      Amount        : in     Token_Amount;
      Current_Block : in     Block_Number;
      Registry      : in     Token_Registry;
      Success       :    out Boolean);

   procedure Enable_Transfers
     (Token   : in out MiniMe_Token_State;
      Caller  : in     Address;
      Enabled : in     Boolean;
      Success :    out Boolean);

   procedure Change_Controller
     (Token          : in out MiniMe_Token_State;
      Caller         : in     Address;
      New_Controller : in     Address;
      Success        :    out Boolean);

   -- -------------------------------------------------------------------------
   -- Klonování tokenu (MiniMeTokenFactory ekvivalent)
   -- -------------------------------------------------------------------------
   procedure Create_Clone_Token
     (Registry          : in out Token_Registry;
      Parent_Id         : in     Valid_Token_Id;
      Snapshot_Block    : in     Block_Number;
      Name              : in     String_Name;
      Symbol            : in     String_Symbol;
      Decimals          : in     Natural;
      Transfers_Enabled : in     Boolean;
      Controller        : in     Address;
      Current_Block     : in     Block_Number;
      New_Token_Id      :    out Token_Id;
      Success           :    out Boolean);

end MiniMe_Token;
