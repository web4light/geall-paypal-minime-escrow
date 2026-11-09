pragma SPARK_Mode (On);

package body PayPal_Agentic_Settlement_Guard is

   procedure Authorize_Agentic_Order
     (Wallet      : in out Agentic_Wallet_Account;
      Amount      : in     Order_Cents_Type;
      Risk_Score  : in     Risk_Score_Type;
      Authorized  :    out Boolean)
   is
   begin
      if Amount > 0
        and then Risk_Score <= 25
        and then Amount <= Wallet.Remaining_Budget
        and then Amount <= Wallet.Buyer_Balance
        and then Wallet.Orders_Processed < Max_Daily_Orders
      then
         Wallet.Last_Order_State := Order_Approved;
         Authorized              := True;
      else
         Authorized := False;
      end if;
   end Authorize_Agentic_Order;

   procedure Capture_PayPal_Settlement
     (Wallet  : in out Agentic_Wallet_Account;
      Amount  : in     Order_Cents_Type;
      Success :    out Boolean)
   is
   begin
      if Amount > 0
        and then Amount <= Wallet.Buyer_Balance
        and then Amount <= Wallet.Remaining_Budget
        and then Wallet.Merchant_Balance <= Max_Vault_Cents - Amount
        and then Wallet.Orders_Processed < Max_Daily_Orders
      then
         Wallet.Buyer_Balance    := Wallet.Buyer_Balance - Amount;
         Wallet.Merchant_Balance := Wallet.Merchant_Balance + Amount;
         Wallet.Remaining_Budget := Wallet.Remaining_Budget - Amount;
         Wallet.Orders_Processed := Wallet.Orders_Processed + 1;
         Wallet.Last_Order_State := Order_Completed;
         Success                 := True;
      else
         Success := False;
      end if;
   end Capture_PayPal_Settlement;

end PayPal_Agentic_Settlement_Guard;
