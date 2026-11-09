pragma SPARK_Mode (On);

package body PayPal_Agentic_Settlement_Guard is

   procedure Lock_Trade_Terms
     (Chamber       : in out Dual_Escrow_Chamber;
      Fiat_Cents    : in     Order_Cents_Type;
      Token_Amount  : in     Order_Tokens_Type;
      Token_Id      : in     MiniMe_Token_Id;
      Block_Num     : in     Block_Num_Type;
      Asset         : in     MiniMe_Asset_Kind;
      Risk_Score    : in     Risk_Score_Type;
      Terms_Accepted:    out Boolean)
   is
   begin
      if Fiat_Cents > 0
        and then Token_Amount > 0
        and then Risk_Score <= 25
        and then Fiat_Cents <= Chamber.Remaining_AI_Budget
        and then Fiat_Cents <= Chamber.Buyer_PayPal_Cents
        and then Token_Amount <= Chamber.Seller_MiniMe_Tokens
        and then Chamber.Swaps_Completed < Max_Daily_Orders
      then
         Chamber.Agreed_Fiat_Cents          := Fiat_Cents;
         Chamber.Agreed_MiniMe_Tokens       := Token_Amount;
         Chamber.Token_Id                   := Token_Id;
         Chamber.Snapshot_Block             := Block_Num;
         Chamber.Asset_Kind                 := Asset;
         Chamber.MiniMe_Controller_Approved := False;
         Chamber.State                      := Escrow_Terms_Locked;
         Terms_Accepted                     := True;
      else
         Terms_Accepted := False;
      end if;
   end Lock_Trade_Terms;

   procedure Deposit_Buyer_PayPal_To_Escrow
     (Chamber : in out Dual_Escrow_Chamber;
      Success :    out Boolean)
   is
   begin
      if Chamber.Agreed_Fiat_Cents > 0
        and then Chamber.Agreed_Fiat_Cents <= Chamber.Buyer_PayPal_Cents
        and then Chamber.Agreed_Fiat_Cents <= Chamber.Remaining_AI_Budget
      then
         Chamber.Buyer_PayPal_Cents  :=
           Chamber.Buyer_PayPal_Cents - Chamber.Agreed_Fiat_Cents;
         Chamber.Remaining_AI_Budget :=
           Chamber.Remaining_AI_Budget - Chamber.Agreed_Fiat_Cents;
         Chamber.Escrow_Fiat_Cents   := Chamber.Agreed_Fiat_Cents;

         if Chamber.Escrow_MiniMe_Tokens > 0
           and then Chamber.Escrow_MiniMe_Tokens = Chamber.Agreed_MiniMe_Tokens
           and then Chamber.MiniMe_Controller_Approved
         then
            Chamber.State := Escrow_Both_Deposited;
         else
            Chamber.State := Escrow_Partially_Funded;
         end if;

         Success := True;
      else
         Success := False;
      end if;
   end Deposit_Buyer_PayPal_To_Escrow;

   procedure Deposit_Seller_MiniMe_Tokens_To_Escrow
     (Chamber              : in out Dual_Escrow_Chamber;
      Controller_Hook_OK   : in     Boolean;
      Transfers_Enabled_OK : in     Boolean;
      Success              :    out Boolean)
   is
   begin
      if Controller_Hook_OK
        and then Transfers_Enabled_OK
        and then Chamber.Agreed_MiniMe_Tokens > 0
        and then Chamber.Agreed_MiniMe_Tokens <= Chamber.Seller_MiniMe_Tokens
      then
         Chamber.Seller_MiniMe_Tokens       :=
           Chamber.Seller_MiniMe_Tokens - Chamber.Agreed_MiniMe_Tokens;
         Chamber.Escrow_MiniMe_Tokens       := Chamber.Agreed_MiniMe_Tokens;
         Chamber.MiniMe_Controller_Approved := True;

         if Chamber.Escrow_Fiat_Cents > 0
           and then Chamber.Escrow_Fiat_Cents = Chamber.Agreed_Fiat_Cents
         then
            Chamber.State := Escrow_Both_Deposited;
         else
            Chamber.State := Escrow_Partially_Funded;
         end if;

         Success := True;
      else
         Success := False;
      end if;
   end Deposit_Seller_MiniMe_Tokens_To_Escrow;

   procedure Execute_Atomic_Dual_Escrow_Swap
     (Chamber : in out Dual_Escrow_Chamber;
      Success :    out Boolean)
   is
   begin
      if Chamber.Seller_PayPal_Cents <= Max_Vault_Cents - Chamber.Escrow_Fiat_Cents
        and then Chamber.Buyer_MiniMe_Tokens <= Max_Token_Supply - Chamber.Escrow_MiniMe_Tokens
        and then Chamber.Swaps_Completed < Max_Daily_Orders
      then
         Chamber.Seller_PayPal_Cents  :=
           Chamber.Seller_PayPal_Cents + Chamber.Escrow_Fiat_Cents;
         Chamber.Buyer_MiniMe_Tokens  :=
           Chamber.Buyer_MiniMe_Tokens + Chamber.Escrow_MiniMe_Tokens;
         Chamber.Escrow_Fiat_Cents    := 0;
         Chamber.Escrow_MiniMe_Tokens := 0;
         Chamber.Swaps_Completed      := Chamber.Swaps_Completed + 1;
         Chamber.State                := Escrow_Swap_Completed;
         Success                      := True;
      else
         Success := False;
      end if;
   end Execute_Atomic_Dual_Escrow_Swap;

   procedure Refund_Dual_Escrow
     (Chamber  : in out Dual_Escrow_Chamber;
      Refunded :    out Boolean)
   is
   begin
      if Chamber.Buyer_PayPal_Cents <= Max_Vault_Cents - Chamber.Escrow_Fiat_Cents
        and then Chamber.Seller_MiniMe_Tokens <= Max_Token_Supply - Chamber.Escrow_MiniMe_Tokens
      then
         Chamber.Buyer_PayPal_Cents   :=
           Chamber.Buyer_PayPal_Cents + Chamber.Escrow_Fiat_Cents;
         Chamber.Seller_MiniMe_Tokens :=
           Chamber.Seller_MiniMe_Tokens + Chamber.Escrow_MiniMe_Tokens;
         Chamber.Escrow_Fiat_Cents    := 0;
         Chamber.Escrow_MiniMe_Tokens := 0;
         Chamber.State                := Escrow_Refunded;
         Refunded                     := True;
      else
         Refunded := False;
      end if;
   end Refund_Dual_Escrow;

end PayPal_Agentic_Settlement_Guard;
