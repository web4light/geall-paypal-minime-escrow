pragma SPARK_Mode (On);

-- =========================================================================
-- PayPal_Agentic_Settlement_Guard
-- G(E)A(L)L: Panoramiks (Ada 2022) & Asterisk (SPARK 2022) Formal Module
-- Verified by Obelisk (GNATprove 16.1.0 + CVC5 SMT Solver)
-- Target: PayPal AI Hackathon (Agentic Commerce & PayPal Orders v2 Sandbox)
-- =========================================================================

package PayPal_Agentic_Settlement_Guard is

   -- Maximum Vault & Agentic Order Limits in Cents (10,000,000 = $100,000.00)
   Max_Vault_Cents       : constant := 1_000_000_000;
   Max_Order_Cents       : constant := 10_000_000;
   Max_Agent_Budget      : constant := 50_000_000;
   Max_Daily_Orders      : constant := 1_000;

   subtype Balance_Cents_Type is Natural range 0 .. Max_Vault_Cents;
   subtype Order_Cents_Type   is Natural range 0 .. Max_Order_Cents;
   subtype Budget_Cents_Type  is Natural range 0 .. Max_Agent_Budget;
   subtype Order_Count_Type   is Natural range 0 .. Max_Daily_Orders;
   subtype Risk_Score_Type    is Natural range 0 .. 100;

   -- PayPal Orders v2 Lifecycle States
   type PayPal_Order_State is
     (Order_Created,
      Order_Saved,
      Order_Approved,
      Order_Completed,
      Order_Voided);

   type Agentic_Wallet_Account is record
      Merchant_Balance : Balance_Cents_Type := 0;
      Buyer_Balance    : Balance_Cents_Type := 100_000;
      Remaining_Budget : Budget_Cents_Type  := 50_000;
      Orders_Processed : Order_Count_Type   := 0;
      Last_Order_State : PayPal_Order_State := Order_Created;
      Account_Locked   : Boolean            := False;
   end record;

   -- 1. AI Agent Autonomous Order Authorization Gate (PayPal Orders v2 CREATE/APPROVE)
   -- Mathematically guarantees that an AI Agent NEVER exceeds its Remaining_Budget,
   -- NEVER authorizes high-risk orders (Risk_Score > 25), and NEVER overflows balances.
   procedure Authorize_Agentic_Order
     (Wallet      : in out Agentic_Wallet_Account;
      Amount      : in     Order_Cents_Type;
      Risk_Score  : in     Risk_Score_Type;
      Authorized  :    out Boolean)
     with Pre  => not Wallet.Account_Locked,
          Post => (if Authorized then
                     Amount > 0 and then
                     Risk_Score <= 25 and then
                     Amount <= Wallet.Remaining_Budget'Old and then
                     Amount <= Wallet.Buyer_Balance'Old and then
                     Wallet.Last_Order_State = Order_Approved
                   else
                     Wallet.Remaining_Budget = Wallet.Remaining_Budget'Old and then
                     Wallet.Buyer_Balance = Wallet.Buyer_Balance'Old);

   -- 2. PayPal Orders v2 CAPTURE & Atomic Settlement (Conservation of Money Proof)
   -- Proves strict conservation of funds:
   -- Buyer_Balance + Merchant_Balance == Buyer_Balance'Old + Merchant_Balance'Old
   procedure Capture_PayPal_Settlement
     (Wallet  : in out Agentic_Wallet_Account;
      Amount  : in     Order_Cents_Type;
      Success :    out Boolean)
     with Pre  => not Wallet.Account_Locked and then
                  Wallet.Last_Order_State = Order_Approved,
          Post => (if Success then
                     Wallet.Buyer_Balance = Wallet.Buyer_Balance'Old - Amount and then
                     Wallet.Merchant_Balance = Wallet.Merchant_Balance'Old + Amount and then
                     Wallet.Remaining_Budget = Wallet.Remaining_Budget'Old - Amount and then
                     Wallet.Orders_Processed = Wallet.Orders_Processed'Old + 1 and then
                     Wallet.Last_Order_State = Order_Completed
                   else
                     Wallet.Buyer_Balance = Wallet.Buyer_Balance'Old and then
                     Wallet.Merchant_Balance = Wallet.Merchant_Balance'Old and then
                     Wallet.Remaining_Budget = Wallet.Remaining_Budget'Old and then
                     Wallet.Orders_Processed = Wallet.Orders_Processed'Old);

end PayPal_Agentic_Settlement_Guard;
