pragma SPARK_Mode (On);

-- =========================================================================
-- PayPal_Agentic_Settlement_Guard (Anti-Scam Dual-Escrow + MiniMe Ada Token)
-- G(E)A(L)L: Panoramiks (Ada 2022) & Asterisk (SPARK 2022) Formal Module
-- Verified by Obelisk (GNATprove 16.1.0 + CVC5 SMT Solver)
-- Connected to: MiniMe_Types, MiniMe_History, MiniMe_Token, MiniMe_Controller
-- (W:\projekty\_rozpracovane\minime-ada)
--
-- Architecture ("Dvojita Mezischranka proti podvodnikum"):
--   1. MEZISCHRANKA #1 (PayPal Fiat Escrow — Escrow_Fiat_Cents):
--      Buyer sends USD/CZK cents from PayPal Orders v2 into Mezischranka #1.
--   2. MEZISCHRANKA #2 (MiniMe Ada Token Escrow — Escrow_MiniMe_Tokens):
--      Seller sends game tokens / cloneable MiniMe tokens (MMT / CMMT / GRS)
--      verified by MiniMe_Controller.On_Transfer & MiniMe_History checkpoint
--      at Current_Block into Mezischranka #2.
--   3. OBELISK ATOMIC SWAP (Execute_Atomic_Dual_Escrow_Swap):
--      Mathematically forbids releasing either Mezischranka unless BOTH
--      hold the exact agreed amounts and MiniMe_Controller hook is True.
--      Simultaneously sends PayPal money to Seller and MiniMe tokens to Buyer.
--   4. ANTI-SCAM ROLLBACK (Refund_Dual_Escrow):
--      If either side fails to deposit or tries to scam, returns PayPal
--      money to Buyer and MiniMe tokens to Seller with 0 loss.
-- =========================================================================

package PayPal_Agentic_Settlement_Guard is

   -- Maximum Vault, Order & MiniMe Token Limits
   Max_Vault_Cents  : constant := 1_000_000_000;
   Max_Order_Cents  : constant := 10_000_000;
   Max_Agent_Budget : constant := 50_000_000;
   Max_Token_Supply : constant := 1_000_000_000;
   Max_Order_Tokens : constant := 10_000_000;
   Max_Daily_Orders : constant := 1_000;
   Max_MiniMe_Id    : constant := 8;

   subtype Balance_Cents_Type is Natural range 0 .. Max_Vault_Cents;
   subtype Order_Cents_Type   is Natural range 0 .. Max_Order_Cents;
   subtype Budget_Cents_Type  is Natural range 0 .. Max_Agent_Budget;
   subtype Token_Amount_Type  is Natural range 0 .. Max_Token_Supply;
   subtype Order_Tokens_Type  is Natural range 0 .. Max_Order_Tokens;
   subtype Order_Count_Type   is Natural range 0 .. Max_Daily_Orders;
   subtype Risk_Score_Type    is Natural range 0 .. 100;
   subtype MiniMe_Token_Id    is Positive range 1 .. Max_MiniMe_Id;
   subtype Block_Num_Type     is Natural range 0 .. 1_000_000_000;

   -- MiniMe Token / Mincovna Asset Kind (from minime-ada & Vakuova Mincovna)
   type MiniMe_Asset_Kind is
     (MiniMe_Parent_MMT,     -- Parent MiniMe Token (ID 1, main game/DAO token)
      MiniMe_Clone_CMMT,     -- Cloned MiniMe Token (ID 2..8, in-game season/quest clone)
      KingsStar_Game_Token,  -- Ks: 1g Wolfram micro-payment game token
      Standard700_Gros);     -- GRS: 12g Ag silver-backed Standard 700 coin

   -- Dual-Escrow ("Dvojita Mezischranka") Lifecycle State
   type Dual_Escrow_State is
     (Escrow_Idle,            -- No active trade
      Escrow_Terms_Locked,    -- AI Agent verified risk & locked trade terms
      Escrow_Partially_Funded,-- Only one party deposited so far (waiting)
      Escrow_Both_Deposited,  -- Both PayPal Fiat & MiniMe Tokens are in escrow
      Escrow_Swap_Completed,  -- Atomic swap executed: seller got money, buyer got tokens
      Escrow_Refunded);       -- Anti-scam rollback completed safely

   type Dual_Escrow_Chamber is record
      -- Buyer & Seller PayPal Fiat Balances (in Cents)
      Buyer_PayPal_Cents         : Balance_Cents_Type := 100_000;
      Seller_PayPal_Cents        : Balance_Cents_Type := 0;
      Remaining_AI_Budget        : Budget_Cents_Type  := 50_000;

      -- Buyer & Seller MiniMe Ada Token Balances (MiniMe_Token.Balance_Of_At)
      Buyer_MiniMe_Tokens        : Token_Amount_Type  := 0;
      Seller_MiniMe_Tokens       : Token_Amount_Type  := 5_000;

      -- MEZISCHRANKA #1: PayPal Fiat Escrow Compartment
      Escrow_Fiat_Cents          : Order_Cents_Type   := 0;
      Agreed_Fiat_Cents          : Order_Cents_Type   := 0;

      -- MEZISCHRANKA #2: MiniMe Ada Token Escrow Compartment
      Escrow_MiniMe_Tokens       : Order_Tokens_Type  := 0;
      Agreed_MiniMe_Tokens       : Order_Tokens_Type  := 0;
      Token_Id                   : MiniMe_Token_Id    := 1;
      Snapshot_Block             : Block_Num_Type     := 102;
      Asset_Kind                 : MiniMe_Asset_Kind  := MiniMe_Clone_CMMT;
      MiniMe_Controller_Approved : Boolean            := False;

      -- Audit & Security State
      State                      : Dual_Escrow_State  := Escrow_Idle;
      Swaps_Completed            : Order_Count_Type   := 0;
      Chamber_Locked             : Boolean            := False;
   end record;

   -- ======================================================================
   -- 1. Lock Trade Terms (AI Agent Risk Gate + MiniMe Token Snapshot Lock)
   -- ======================================================================
   procedure Lock_Trade_Terms
     (Chamber       : in out Dual_Escrow_Chamber;
      Fiat_Cents    : in     Order_Cents_Type;
      Token_Amount  : in     Order_Tokens_Type;
      Token_Id      : in     MiniMe_Token_Id;
      Block_Num     : in     Block_Num_Type;
      Asset         : in     MiniMe_Asset_Kind;
      Risk_Score    : in     Risk_Score_Type;
      Terms_Accepted:    out Boolean)
     with Pre  => not Chamber.Chamber_Locked and then
                  Chamber.State = Escrow_Idle and then
                  Chamber.Escrow_Fiat_Cents = 0 and then
                  Chamber.Escrow_MiniMe_Tokens = 0,
          Post => (if Terms_Accepted then
                     Fiat_Cents > 0 and then
                     Token_Amount > 0 and then
                     Risk_Score <= 25 and then
                     Fiat_Cents <= Chamber.Remaining_AI_Budget'Old and then
                     Fiat_Cents <= Chamber.Buyer_PayPal_Cents'Old and then
                     Token_Amount <= Chamber.Seller_MiniMe_Tokens'Old and then
                     Chamber.Agreed_Fiat_Cents = Fiat_Cents and then
                     Chamber.Agreed_MiniMe_Tokens = Token_Amount and then
                     Chamber.Token_Id = Token_Id and then
                     Chamber.Snapshot_Block = Block_Num and then
                     Chamber.Asset_Kind = Asset and then
                     Chamber.State = Escrow_Terms_Locked and then
                     Chamber.Escrow_Fiat_Cents = 0 and then
                     Chamber.Escrow_MiniMe_Tokens = 0
                   else
                     Chamber = Chamber'Old);

   -- ======================================================================
   -- 2. Deposit Buyer's PayPal Money into Mezischranka #1 (Escrow_Fiat_Cents)
   --    Proves strict conservation of fiat money:
   --    Buyer_PayPal_Cents + Escrow_Fiat_Cents == Old sum.
   -- ======================================================================
   procedure Deposit_Buyer_PayPal_To_Escrow
     (Chamber : in out Dual_Escrow_Chamber;
      Success :    out Boolean)
     with Pre  => not Chamber.Chamber_Locked and then
                  (Chamber.State = Escrow_Terms_Locked or else
                   Chamber.State = Escrow_Partially_Funded) and then
                  Chamber.Escrow_Fiat_Cents = 0 and then
                  Chamber.Agreed_Fiat_Cents > 0,
          Post => (if Success then
                     Chamber.Buyer_PayPal_Cents =
                       Chamber.Buyer_PayPal_Cents'Old - Chamber.Agreed_Fiat_Cents'Old and then
                     Chamber.Escrow_Fiat_Cents = Chamber.Agreed_Fiat_Cents'Old and then
                     Chamber.Remaining_AI_Budget =
                       Chamber.Remaining_AI_Budget'Old - Chamber.Agreed_Fiat_Cents'Old and then
                     Chamber.Seller_PayPal_Cents = Chamber.Seller_PayPal_Cents'Old and then
                     Chamber.Buyer_MiniMe_Tokens = Chamber.Buyer_MiniMe_Tokens'Old and then
                     Chamber.Seller_MiniMe_Tokens = Chamber.Seller_MiniMe_Tokens'Old and then
                     Chamber.Escrow_MiniMe_Tokens = Chamber.Escrow_MiniMe_Tokens'Old and then
                     (if Chamber.Escrow_MiniMe_Tokens > 0 and then
                         Chamber.Escrow_MiniMe_Tokens = Chamber.Agreed_MiniMe_Tokens and then
                         Chamber.MiniMe_Controller_Approved
                      then Chamber.State = Escrow_Both_Deposited
                      else Chamber.State = Escrow_Partially_Funded)
                   else
                     Chamber = Chamber'Old);

   -- ======================================================================
   -- 3. Deposit Seller's MiniMe Ada Tokens into Mezischranka #2
   --    Requires MiniMe_Controller.On_Transfer hook & History Checkpoint OK.
   --    Proves strict conservation of MiniMe tokens:
   --    Seller_MiniMe_Tokens + Escrow_MiniMe_Tokens == Old sum.
   -- ======================================================================
   procedure Deposit_Seller_MiniMe_Tokens_To_Escrow
     (Chamber              : in out Dual_Escrow_Chamber;
      Controller_Hook_OK   : in     Boolean;
      Transfers_Enabled_OK : in     Boolean;
      Success              :    out Boolean)
     with Pre  => not Chamber.Chamber_Locked and then
                  (Chamber.State = Escrow_Terms_Locked or else
                   Chamber.State = Escrow_Partially_Funded) and then
                  Chamber.Escrow_MiniMe_Tokens = 0 and then
                  Chamber.Agreed_MiniMe_Tokens > 0,
          Post => (if Success then
                     Controller_Hook_OK and then
                     Transfers_Enabled_OK and then
                     Chamber.MiniMe_Controller_Approved and then
                     Chamber.Seller_MiniMe_Tokens =
                       Chamber.Seller_MiniMe_Tokens'Old - Chamber.Agreed_MiniMe_Tokens'Old and then
                     Chamber.Escrow_MiniMe_Tokens = Chamber.Agreed_MiniMe_Tokens'Old and then
                     Chamber.Buyer_MiniMe_Tokens = Chamber.Buyer_MiniMe_Tokens'Old and then
                     Chamber.Buyer_PayPal_Cents = Chamber.Buyer_PayPal_Cents'Old and then
                     Chamber.Seller_PayPal_Cents = Chamber.Seller_PayPal_Cents'Old and then
                     Chamber.Escrow_Fiat_Cents = Chamber.Escrow_Fiat_Cents'Old and then
                     (if Chamber.Escrow_Fiat_Cents > 0 and then
                         Chamber.Escrow_Fiat_Cents = Chamber.Agreed_Fiat_Cents
                      then Chamber.State = Escrow_Both_Deposited
                      else Chamber.State = Escrow_Partially_Funded)
                   else
                     Chamber = Chamber'Old);

   -- ======================================================================
   -- 4. Execute Atomic Dual-Escrow Swap (Obelisk Anti-Scam Release Gate)
   --    Mathematically impossible to execute unless BOTH Mezischranky hold
   --    the exact agreed PayPal cents AND verified MiniMe Ada tokens.
   --    Simultaneously sends PayPal money to Seller and MiniMe Tokens to Buyer!
   -- ======================================================================
   procedure Execute_Atomic_Dual_Escrow_Swap
     (Chamber : in out Dual_Escrow_Chamber;
      Success :    out Boolean)
     with Pre  => not Chamber.Chamber_Locked and then
                  Chamber.State = Escrow_Both_Deposited and then
                  Chamber.MiniMe_Controller_Approved and then
                  Chamber.Agreed_Fiat_Cents > 0 and then
                  Chamber.Agreed_MiniMe_Tokens > 0 and then
                  Chamber.Escrow_Fiat_Cents = Chamber.Agreed_Fiat_Cents and then
                  Chamber.Escrow_MiniMe_Tokens = Chamber.Agreed_MiniMe_Tokens,
          Post => (if Success then
                     -- Seller receives exact PayPal Fiat from Mezischranka #1
                     Chamber.Seller_PayPal_Cents =
                       Chamber.Seller_PayPal_Cents'Old + Chamber.Escrow_Fiat_Cents'Old and then
                     -- Buyer receives exact MiniMe Ada Tokens from Mezischranka #2
                     Chamber.Buyer_MiniMe_Tokens =
                       Chamber.Buyer_MiniMe_Tokens'Old + Chamber.Escrow_MiniMe_Tokens'Old and then
                     -- Both Mezischranky are completely emptied (zero residual)
                     Chamber.Escrow_Fiat_Cents = 0 and then
                     Chamber.Escrow_MiniMe_Tokens = 0 and then
                     -- Non-participating balances remain untouched
                     Chamber.Buyer_PayPal_Cents = Chamber.Buyer_PayPal_Cents'Old and then
                     Chamber.Seller_MiniMe_Tokens = Chamber.Seller_MiniMe_Tokens'Old and then
                     Chamber.Swaps_Completed = Chamber.Swaps_Completed'Old + 1 and then
                     Chamber.State = Escrow_Swap_Completed
                   else
                     Chamber = Chamber'Old);

   -- ======================================================================
   -- 5. Anti-Scam Refund Rollback (if one side fails to deposit or times out)
   --    Returns any deposited PayPal cents to Buyer and MiniMe tokens to Seller.
   -- ======================================================================
   procedure Refund_Dual_Escrow
     (Chamber  : in out Dual_Escrow_Chamber;
      Refunded :    out Boolean)
     with Pre  => not Chamber.Chamber_Locked and then
                  (Chamber.State = Escrow_Terms_Locked or else
                   Chamber.State = Escrow_Partially_Funded),
          Post => (if Refunded then
                     Chamber.Buyer_PayPal_Cents =
                       Chamber.Buyer_PayPal_Cents'Old + Chamber.Escrow_Fiat_Cents'Old and then
                     Chamber.Seller_MiniMe_Tokens =
                       Chamber.Seller_MiniMe_Tokens'Old + Chamber.Escrow_MiniMe_Tokens'Old and then
                     Chamber.Escrow_Fiat_Cents = 0 and then
                     Chamber.Escrow_MiniMe_Tokens = 0 and then
                     Chamber.Seller_PayPal_Cents = Chamber.Seller_PayPal_Cents'Old and then
                     Chamber.Buyer_MiniMe_Tokens = Chamber.Buyer_MiniMe_Tokens'Old and then
                     Chamber.State = Escrow_Refunded
                   else
                     Chamber = Chamber'Old);

end PayPal_Agentic_Settlement_Guard;
