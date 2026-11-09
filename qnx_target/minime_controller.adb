-- ============================================================================
--  MiniMe_Controller — Implementace kampaně a bezpečnostních pravidel
-- ============================================================================

pragma SPARK_Mode (On);

package body MiniMe_Controller is

   -------------------
   -- Init_Campaign --
   -------------------

   procedure Init_Campaign
     (Campaign        : out Campaign_State;
      Owner           : in  Address;
      Token_Id        : in  Valid_Token_Id;
      Vault           : in  Address;
      Start_Block     : in  Block_Number;
      End_Block       : in  Block_Number;
      Maximum_Funding : in  Native_Currency;
      Success         : out Boolean)
   is
   begin
      if Start_Block < End_Block
         and then not Equal_Address (Vault, Zero_Address)
         and then Maximum_Funding > 0
      then
         Campaign.Active           := True;
         Campaign.Owner            := Owner;
         Campaign.Controlled_Token := Token_Id;
         Campaign.Vault_Address    := Vault;
         Campaign.Start_Block      := Start_Block;
         Campaign.End_Block        := End_Block;
         Campaign.Maximum_Funding  := Maximum_Funding;
         Campaign.Total_Collected  := 0;
         Success                   := True;
      else
         Campaign := (Active           => False,
                      Owner            => Zero_Address,
                      Controlled_Token => Token_Id,
                      Vault_Address    => Zero_Address,
                      Start_Block      => 0,
                      End_Block        => 0,
                      Maximum_Funding  => 0,
                      Total_Collected  => 0);
         Success  := False;
      end if;
   end Init_Campaign;

   -------------------
   -- Proxy_Payment --
   -------------------

   procedure Proxy_Payment
     (Campaign      : in out Campaign_State;
      Token         : in out MiniMe_Token_State;
      Registry      : in     Token_Registry;
      Beneficiary   : in     Address;
      Amount_Paid   : in     Native_Currency;
      Current_Block : in     Block_Number;
      Success       :    out Boolean)
   is
      Tokens_To_Mint : Token_Amount;
      Gen_Ok         : Boolean;
      Token_Ctrl     : constant Address := Token.Controller;
   begin
      -- 1. Kontrola časového okna financování
      if Current_Block < Campaign.Start_Block or else Current_Block > Campaign.End_Block then
         Success := False;
         return;
      end if;

      if Amount_Paid = 0 then
         Success := False;
         return;
      end if;

      -- 2. Kontrola nepřekročení maximálního stropu financování
      if Amount_Paid > Campaign.Maximum_Funding - Campaign.Total_Collected then
         Success := False;
         return;
      end if;

      -- 3. Výpočet počtu tokenů a ochrana proti přetečení
      if Amount_Paid > Native_Currency (Max_Total_Supply / Tokens_Per_Unit) then
         Success := False;
         return;
      end if;

      Tokens_To_Mint := Token_Amount (Amount_Paid * Tokens_Per_Unit);

      -- 4. Emise tokenů přes MiniMe Token (kampaň vystupuje jako Controller)
      Generate_Tokens
        (Token         => Token,
         Caller        => Token_Ctrl,
         Owner         => Beneficiary,
         Amount        => Tokens_To_Mint,
         Current_Block => Current_Block,
         Registry      => Registry,
         Success       => Gen_Ok);

      if Gen_Ok then
         Campaign.Total_Collected := Campaign.Total_Collected + Amount_Paid;
         Success                  := True;
      else
         Success                  := False;
      end if;
   end Proxy_Payment;

   -----------------
   -- On_Transfer --
   -----------------

   function On_Transfer
     (Campaign : Campaign_State;
      From     : Address;
      To       : Address;
      Amount   : Token_Amount) return Boolean
   is
      pragma Unreferenced (From, To, Amount);
   begin
      -- Standardní kampaň povoluje všechny převody, pokud je kampaň aktivní
      return Campaign.Active;
   end On_Transfer;

   ----------------
   -- On_Approve --
   ----------------

   function On_Approve
     (Campaign : Campaign_State;
      Owner    : Address;
      Spender  : Address;
      Amount   : Token_Amount) return Boolean
   is
      pragma Unreferenced (Owner, Spender, Amount);
   begin
      return Campaign.Active;
   end On_Approve;

   ---------------------------
   -- Change_Campaign_Owner --
   ---------------------------

   procedure Change_Campaign_Owner
     (Campaign  : in out Campaign_State;
      Caller    : in     Address;
      New_Owner : in     Address;
      Success   :    out Boolean)
   is
   begin
      if Equal_Address (Caller, Campaign.Owner) then
         Campaign.Owner := New_Owner;
         Success        := True;
      else
         Success        := False;
      end if;
   end Change_Campaign_Owner;

end MiniMe_Controller;
