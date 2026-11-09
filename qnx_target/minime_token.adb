-- ============================================================================
--  MiniMe_Token — Implementace těla balíčku klonovatelného tokenu v Adě/SPARK
-- ============================================================================

pragma SPARK_Mode (On);

package body MiniMe_Token is

   -- -------------------------------------------------------------------------
   -- Pomocné vyhledávání nebo registrace účtu
   -- -------------------------------------------------------------------------
   procedure Find_Or_Create_Account
     (Token   : in out MiniMe_Token_State;
      Owner   : in     Address;
      Idx     :    out Account_Index;
      Success :    out Boolean)
   is
   begin
      -- 1. Vyhledání existujícího účtu
      if Token.Num_Accounts > 0 then
         for I in 1 .. Token.Num_Accounts loop
            if Token.Accounts (I).Active and then Equal_Address (Token.Accounts (I).Owner, Owner) then
               Idx     := I;
               Success := True;
               return;
            end if;
         end loop;
      end if;

      -- 2. Vytvoření nového účtu
      if Token.Num_Accounts < Max_Accounts then
         Token.Num_Accounts := Token.Num_Accounts + 1;
         Idx := Token.Num_Accounts;
         Token.Accounts (Idx).Owner    := Owner;
         Token.Accounts (Idx).Active   := True;
         Token.Accounts (Idx).Balances := (List => (others => (From_Block => 0, Value => 0)), Count => 0);
         Token.Accounts (Idx).Allowed  := (others => (Spender => Zero_Address, Amount => 0));
         Success := True;
      else
         Idx     := 1;
         Success := False;
      end if;
   end Find_Or_Create_Account;

   ----------------
   -- Init_Token --
   ----------------

   procedure Init_Token
     (Token                 : out MiniMe_Token_State;
      Name                  : in  String_Name;
      Symbol                : in  String_Symbol;
      Decimals              : in  Natural;
      Controller            : in  Address;
      Parent_Token          : in  Token_Id;
      Parent_Snapshot_Block : in  Block_Number;
      Creation_Block        : in  Block_Number;
      Transfers_Enabled     : in  Boolean)
   is
   begin
      Token.Active                := True;
      Token.Name                  := Name;
      Token.Symbol                := Symbol;
      Token.Decimals              := Decimals;
      Token.Controller            := Controller;
      Token.Parent_Token          := Parent_Token;
      Token.Parent_Snapshot_Block := Parent_Snapshot_Block;
      Token.Creation_Block        := Creation_Block;
      Token.Transfers_Enabled     := Transfers_Enabled;
      Token.Total_Supply_History  := (List => (others => (From_Block => 0, Value => 0)), Count => 0);
      Token.Num_Accounts          := 0;
      Token.Accounts              := (others => (Owner    => Zero_Address,
                                                 Active   => False,
                                                 Balances => (List => (others => (From_Block => 0, Value => 0)), Count => 0),
                                                 Allowed  => (others => (Spender => Zero_Address, Amount => 0))));
   end Init_Token;

   -------------------
   -- Balance_Of_At --
   -------------------

   function Balance_Of_At
     (Token        : MiniMe_Token_State;
      Owner        : Address;
      Target_Block : Block_Number;
      Registry     : Token_Registry) return Token_Amount
   is
      Found : Boolean := False;
      Acc   : Account_Index := 1;
   begin
      if Token.Num_Accounts > 0 then
         for I in 1 .. Token.Num_Accounts loop
            if Token.Accounts (I).Active and then Equal_Address (Token.Accounts (I).Owner, Owner) then
               Acc   := I;
               Found := True;
               exit;
            end if;
         end loop;
      end if;

      if not Found or else Token.Accounts (Acc).Balances.Count = 0
         or else Token.Accounts (Acc).Balances.List (1).From_Block > Target_Block
      then
         -- Delegace na mateřský token, pokud existuje
         if Token.Parent_Token in Valid_Token_Id and then Registry (Token.Parent_Token).Active then
            declare
               Effective_Block : constant Block_Number :=
                 (if Target_Block < Token.Parent_Snapshot_Block then Target_Block else Token.Parent_Snapshot_Block);
            begin
               return Balance_Of_At (Registry (Token.Parent_Token), Owner, Effective_Block, Registry);
            end;
         else
            return 0;
         end if;
      else
         return Get_Value_At (Token.Accounts (Acc).Balances, Target_Block);
      end if;
   end Balance_Of_At;

   ----------------
   -- Balance_Of --
   ----------------

   function Balance_Of
     (Token         : MiniMe_Token_State;
      Owner         : Address;
      Current_Block : Block_Number;
      Registry      : Token_Registry) return Token_Amount
   is
   begin
      return Balance_Of_At (Token, Owner, Current_Block, Registry);
   end Balance_Of;

   ---------------------
   -- Total_Supply_At --
   ---------------------

   function Total_Supply_At
     (Token        : MiniMe_Token_State;
      Target_Block : Block_Number;
      Registry     : Token_Registry) return Token_Amount
   is
   begin
      if Token.Total_Supply_History.Count = 0
         or else Token.Total_Supply_History.List (1).From_Block > Target_Block
      then
         if Token.Parent_Token in Valid_Token_Id and then Registry (Token.Parent_Token).Active then
            declare
               Effective_Block : constant Block_Number :=
                 (if Target_Block < Token.Parent_Snapshot_Block then Target_Block else Token.Parent_Snapshot_Block);
            begin
               return Total_Supply_At (Registry (Token.Parent_Token), Effective_Block, Registry);
            end;
         else
            return 0;
         end if;
      else
         return Get_Value_At (Token.Total_Supply_History, Target_Block);
      end if;
   end Total_Supply_At;

   ------------------
   -- Total_Supply --
   ------------------

   function Total_Supply
     (Token         : MiniMe_Token_State;
      Current_Block : Block_Number;
      Registry      : Token_Registry) return Token_Amount
   is
   begin
      return Total_Supply_At (Token, Current_Block, Registry);
   end Total_Supply;

   -------------------
   -- Get_Allowance --
   -------------------

   function Get_Allowance
     (Token   : MiniMe_Token_State;
      Owner   : Address;
      Spender : Address) return Token_Amount
   is
   begin
      if Token.Num_Accounts > 0 then
         for I in 1 .. Token.Num_Accounts loop
            if Token.Accounts (I).Active and then Equal_Address (Token.Accounts (I).Owner, Owner) then
               for S in Spender_Index loop
                  if Equal_Address (Token.Accounts (I).Allowed (S).Spender, Spender) then
                     return Token.Accounts (I).Allowed (S).Amount;
                  end if;
               end loop;
               return 0;
            end if;
         end loop;
      end if;
      return 0;
   end Get_Allowance;

   --------------
   -- Transfer --
   --------------

   procedure Transfer
     (Token         : in out MiniMe_Token_State;
      Caller        : in     Address;
      To            : in     Address;
      Amount        : in     Token_Amount;
      Current_Block : in     Block_Number;
      Registry      : in     Token_Registry;
      Success       :    out Boolean)
   is
      From_Idx : Account_Index;
      To_Idx   : Account_Index;
      From_Bal : Token_Amount;
      To_Bal   : Token_Amount;
      Ok_From  : Boolean;
      Ok_To    : Boolean;
      Up_Ok    : Boolean;
   begin
      if not Token.Transfers_Enabled then
         Success := False;
         return;
      end if;

      if Equal_Address (To, Zero_Address) then
         Success := False;
         return;
      end if;

      if Amount = 0 then
         Success := True;
         return;
      end if;

      From_Bal := Balance_Of (Token, Caller, Current_Block, Registry);
      if From_Bal < Amount then
         Success := False;
         return;
      end if;

      To_Bal := Balance_Of (Token, To, Current_Block, Registry);
      if To_Bal > Max_Total_Supply - Amount then
         Success := False;
         return;
      end if;

      Find_Or_Create_Account (Token, Caller, From_Idx, Ok_From);
      if not Ok_From then
         Success := False;
         return;
      end if;

      Find_Or_Create_Account (Token, To, To_Idx, Ok_To);
      if not Ok_To then
         Success := False;
         return;
      end if;

      Update_Value_At_Now (Token.Accounts (From_Idx).Balances, Current_Block, From_Bal - Amount, Up_Ok);
      if not Up_Ok then
         Success := False;
         return;
      end if;

      Update_Value_At_Now (Token.Accounts (To_Idx).Balances, Current_Block, To_Bal + Amount, Up_Ok);
      if not Up_Ok then
         -- Rollback odesílatele v případě selhání kapacity
         declare
            Rollback_Ok : Boolean;
         begin
            Update_Value_At_Now (Token.Accounts (From_Idx).Balances, Current_Block, From_Bal, Rollback_Ok);
            pragma Unreferenced (Rollback_Ok);
         end;
         Success := False;
         return;
      end if;

      Success := True;
   end Transfer;

   -------------------
   -- Transfer_From --
   -------------------

   procedure Transfer_From
     (Token         : in out MiniMe_Token_State;
      Caller        : in     Address;
      From          : in     Address;
      To            : in     Address;
      Amount        : in     Token_Amount;
      Current_Block : in     Block_Number;
      Registry      : in     Token_Registry;
      Success       :    out Boolean)
   is
      Is_Controller : constant Boolean := Equal_Address (Caller, Token.Controller);
   begin
      if not Is_Controller then
         declare
            Allowed_Amt : constant Token_Amount := Get_Allowance (Token, From, Caller);
         begin
            if Allowed_Amt < Amount then
               Success := False;
               return;
            end if;

            -- Ponížení povoleného limitu
            for I in 1 .. Token.Num_Accounts loop
               if Token.Accounts (I).Active and then Equal_Address (Token.Accounts (I).Owner, From) then
                  for S in Spender_Index loop
                     if Equal_Address (Token.Accounts (I).Allowed (S).Spender, Caller) then
                        Token.Accounts (I).Allowed (S).Amount := Allowed_Amt - Amount;
                     end if;
                  end loop;
               end if;
            end loop;
         end;
      end if;

      Transfer (Token, From, To, Amount, Current_Block, Registry, Success);
   end Transfer_From;

   -------------
   -- Approve --
   -------------

   procedure Approve
     (Token   : in out MiniMe_Token_State;
      Owner   : in     Address;
      Spender : in     Address;
      Amount  : in     Token_Amount;
      Success :    out Boolean)
   is
      Acc_Idx : Account_Index;
      Found   : Boolean;
   begin
      if not Token.Transfers_Enabled then
         Success := False;
         return;
      end if;

      Find_Or_Create_Account (Token, Owner, Acc_Idx, Found);
      if not Found then
         Success := False;
         return;
      end if;

      -- Ochrana proti race condition z ERC20: změna limitu vyžaduje nejprve vynulování
      for S in Spender_Index loop
         if Equal_Address (Token.Accounts (Acc_Idx).Allowed (S).Spender, Spender) then
            if Amount > 0 and then Token.Accounts (Acc_Idx).Allowed (S).Amount > 0 then
               Success := False;
               return;
            end if;
            Token.Accounts (Acc_Idx).Allowed (S).Amount := Amount;
            Success := True;
            return;
         end if;
      end loop;

      -- Registrace nového spendera do volného slotu
      for S in Spender_Index loop
         if Equal_Address (Token.Accounts (Acc_Idx).Allowed (S).Spender, Zero_Address) then
            Token.Accounts (Acc_Idx).Allowed (S).Spender := Spender;
            Token.Accounts (Acc_Idx).Allowed (S).Amount  := Amount;
            Success := True;
            return;
         end if;
      end loop;

      Success := False;
   end Approve;

   ---------------------
   -- Generate_Tokens --
   ---------------------

   procedure Generate_Tokens
     (Token         : in out MiniMe_Token_State;
      Caller        : in     Address;
      Owner         : in     Address;
      Amount        : in     Token_Amount;
      Current_Block : in     Block_Number;
      Registry      : in     Token_Registry;
      Success       :    out Boolean)
   is
      Cur_Supply : Token_Amount;
      Cur_Bal    : Token_Amount;
      Acc_Idx    : Account_Index;
      Acc_Ok     : Boolean;
      Up_Ok      : Boolean;
   begin
      if not Equal_Address (Caller, Token.Controller) then
         Success := False;
         return;
      end if;

      Cur_Supply := Total_Supply (Token, Current_Block, Registry);
      if Cur_Supply > Max_Total_Supply - Amount then
         Success := False;
         return;
      end if;

      Cur_Bal := Balance_Of (Token, Owner, Current_Block, Registry);
      if Cur_Bal > Max_Total_Supply - Amount then
         Success := False;
         return;
      end if;

      Find_Or_Create_Account (Token, Owner, Acc_Idx, Acc_Ok);
      if not Acc_Ok then
         Success := False;
         return;
      end if;

      Update_Value_At_Now (Token.Total_Supply_History, Current_Block, Cur_Supply + Amount, Up_Ok);
      if not Up_Ok then
         Success := False;
         return;
      end if;

      Update_Value_At_Now (Token.Accounts (Acc_Idx).Balances, Current_Block, Cur_Bal + Amount, Up_Ok);
      if not Up_Ok then
         -- Rollback nabídky
         declare
            Rollback_Ok : Boolean;
         begin
            Update_Value_At_Now (Token.Total_Supply_History, Current_Block, Cur_Supply, Rollback_Ok);
            pragma Unreferenced (Rollback_Ok);
         end;
         Success := False;
         return;
      end if;

      Success := True;
   end Generate_Tokens;

   --------------------
   -- Destroy_Tokens --
   --------------------

   procedure Destroy_Tokens
     (Token         : in out MiniMe_Token_State;
      Caller        : in     Address;
      Owner         : in     Address;
      Amount        : in     Token_Amount;
      Current_Block : in     Block_Number;
      Registry      : in     Token_Registry;
      Success       :    out Boolean)
   is
      Cur_Supply : Token_Amount;
      Cur_Bal    : Token_Amount;
      Acc_Idx    : Account_Index;
      Acc_Ok     : Boolean;
      Up_Ok      : Boolean;
   begin
      if not Equal_Address (Caller, Token.Controller) then
         Success := False;
         return;
      end if;

      Cur_Supply := Total_Supply (Token, Current_Block, Registry);
      if Cur_Supply < Amount then
         Success := False;
         return;
      end if;

      Cur_Bal := Balance_Of (Token, Owner, Current_Block, Registry);
      if Cur_Bal < Amount then
         Success := False;
         return;
      end if;

      Find_Or_Create_Account (Token, Owner, Acc_Idx, Acc_Ok);
      if not Acc_Ok then
         Success := False;
         return;
      end if;

      Update_Value_At_Now (Token.Total_Supply_History, Current_Block, Cur_Supply - Amount, Up_Ok);
      if not Up_Ok then
         Success := False;
         return;
      end if;

      Update_Value_At_Now (Token.Accounts (Acc_Idx).Balances, Current_Block, Cur_Bal - Amount, Up_Ok);
      if not Up_Ok then
         -- Rollback
         declare
            Rollback_Ok : Boolean;
         begin
            Update_Value_At_Now (Token.Total_Supply_History, Current_Block, Cur_Supply, Rollback_Ok);
            pragma Unreferenced (Rollback_Ok);
         end;
         Success := False;
         return;
      end if;

      Success := True;
   end Destroy_Tokens;

   ----------------------
   -- Enable_Transfers --
   ----------------------

   procedure Enable_Transfers
     (Token   : in out MiniMe_Token_State;
      Caller  : in     Address;
      Enabled : in     Boolean;
      Success :    out Boolean)
   is
   begin
      if Equal_Address (Caller, Token.Controller) then
         Token.Transfers_Enabled := Enabled;
         Success := True;
      else
         Success := False;
      end if;
   end Enable_Transfers;

   -----------------------
   -- Change_Controller --
   -----------------------

   procedure Change_Controller
     (Token          : in out MiniMe_Token_State;
      Caller         : in     Address;
      New_Controller : in     Address;
      Success        :    out Boolean)
   is
   begin
      if Equal_Address (Caller, Token.Controller) then
         Token.Controller := New_Controller;
         Success          := True;
      else
         Success          := False;
      end if;
   end Change_Controller;

   -----------------------
   -- Create_Clone_Token --
   -----------------------

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
      Success           :    out Boolean)
   is
      Effective_Snapshot : constant Block_Number :=
        (if Snapshot_Block = 0 then Current_Block else Snapshot_Block);
   begin
      for Id in Valid_Token_Id loop
         if not Registry (Id).Active then
            Init_Token
              (Token                 => Registry (Id),
               Name                  => Name,
               Symbol                => Symbol,
               Decimals              => Decimals,
               Controller            => Controller,
               Parent_Token          => Parent_Id,
               Parent_Snapshot_Block => Effective_Snapshot,
               Creation_Block        => Current_Block,
               Transfers_Enabled     => Transfers_Enabled);

            New_Token_Id := Id;
            Success      := True;
            return;
         end if;
      end loop;

      New_Token_Id := 0;
      Success      := False;
   end Create_Clone_Token;

end MiniMe_Token;
