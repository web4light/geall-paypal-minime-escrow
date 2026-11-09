-- ============================================================================
--  MiniMe_Controller — Správce kampaně a emise tokenů (SampleCampaign)
--  Původní specifikace: TokenController.sol, Controlled.sol & SampleCampaign.sol
-- ============================================================================

pragma SPARK_Mode (On);

with MiniMe_Types; use MiniMe_Types;
with MiniMe_Token; use MiniMe_Token;

package MiniMe_Controller is

   subtype Native_Currency is Long_Long_Integer range 0 .. 100_000_000_000_000_000; -- wei / satoshi

   -- Kurz emise: 1 jednotka měny = 100 tokenů
   Tokens_Per_Unit : constant := 100;

   type Campaign_State is record
      Active           : Boolean         := False;
      Owner            : Address         := Zero_Address;
      Controlled_Token : Valid_Token_Id  := 1;
      Vault_Address    : Address         := Zero_Address;
      Start_Block      : Block_Number    := 0;
      End_Block        : Block_Number    := 0;
      Maximum_Funding  : Native_Currency := 0;
      Total_Collected  : Native_Currency := 0;
   end record;

   -- Inicializace kampaně s validací časového okna a stropu financování
   procedure Init_Campaign
     (Campaign        : out Campaign_State;
      Owner           : in  Address;
      Token_Id        : in  Valid_Token_Id;
      Vault           : in  Address;
      Start_Block     : in  Block_Number;
      End_Block       : in  Block_Number;
      Maximum_Funding : in  Native_Currency;
      Success         : out Boolean)
   with
     Post => (if Success then
                Campaign.Active = True
                and Campaign.Start_Block < Campaign.End_Block
                and Campaign.Total_Collected = 0);

   -- Zpracování platby a emise tokenů pro podporovatele (proxyPayment v Solidity)
   procedure Proxy_Payment
     (Campaign      : in out Campaign_State;
      Token         : in out MiniMe_Token_State;
      Registry      : in     Token_Registry;
      Beneficiary   : in     Address;
      Amount_Paid   : in     Native_Currency;
      Current_Block : in     Block_Number;
      Success       :    out Boolean)
   with
     Pre => Campaign.Active;

   -- Bezpečnostní hooky TokenControlleru pro kontrolu převodů
   function On_Transfer
     (Campaign : Campaign_State;
      From     : Address;
      To       : Address;
      Amount   : Token_Amount) return Boolean;

   function On_Approve
     (Campaign : Campaign_State;
      Owner    : Address;
      Spender  : Address;
      Amount   : Token_Amount) return Boolean;

   -- Změna správce kampaně (Controlled.changeController)
   procedure Change_Campaign_Owner
     (Campaign  : in out Campaign_State;
      Caller    : in     Address;
      New_Owner : in     Address;
      Success   :    out Boolean);

end MiniMe_Controller;
