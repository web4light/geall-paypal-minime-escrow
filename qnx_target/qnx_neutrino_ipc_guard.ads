pragma SPARK_Mode (On);

-- =========================================================================
-- QNX_Neutrino_IPC_Guard
-- Formally Verified SPARK 2022 Microkernel IPC & Resource Manager Guard
-- Target OS: BlackBerry QNX SDP 8.0 (QNX Neutrino RTOS Microkernel)
-- Standard: DO-178C DAL-A / ISO 26262 ASIL-D / IEC 62304 Class C
-- =========================================================================

package QNX_Neutrino_IPC_Guard is

   -- QNX Neutrino Scheduling Priority Bounds (POSIX / QNX 1 .. 255)
   Min_QNX_Priority : constant := 1;
   Max_QNX_Priority : constant := 255;

   -- QNX Pulse Code Bounds (_PULSE_CODE_MINAVAIL = 0 .. _PULSE_CODE_MAXAVAIL = 127)
   Min_Pulse_Code   : constant := 0;
   Max_Pulse_Code   : constant := 127;

   -- Deterministic IPC Payload Limits (Zero Dynamic Allocation)
   Max_IPC_Bytes    : constant := 4_096;
   Max_Channels     : constant := 64;

   subtype QNX_Priority_Type is Integer range Min_QNX_Priority .. Max_QNX_Priority;
   subtype QNX_Pulse_Code    is Integer range Min_Pulse_Code   .. Max_Pulse_Code;
   subtype IPC_Payload_Size  is Natural range 0 .. Max_IPC_Bytes;
   subtype Channel_Count     is Natural range 0 .. Max_Channels;
   subtype Channel_ID_Type   is Positive range 1 .. Max_Channels;

   -- QNX Synchronous Message Passing State (Send-Receive-Reply)
   type IPC_State_Type is (State_Idle, State_Send_Blocked, State_Receive_Blocked, State_Reply_Ready);

   type QNX_Channel_Descriptor is record
      Chid             : Channel_ID_Type   := 1;
      Server_Priority  : QNX_Priority_Type := 10;
      Active_Priority  : QNX_Priority_Type := 10;
      State            : IPC_State_Type    := State_Idle;
      Last_Pulse       : QNX_Pulse_Code    := 0;
      Pending_Bytes    : IPC_Payload_Size  := 0;
      Messages_Handled : Natural           := 0;
   end record;

   -- 1. Priority-Inheritance Synchronous MsgSend / MsgReceive Gate
   -- Guarantees QNX microkernel priority inheritance: Active_Priority >= Client_Priority
   procedure Receive_And_Inherit_Priority
     (Chan            : in out QNX_Channel_Descriptor;
      Client_Priority : in     QNX_Priority_Type;
      Payload_Bytes   : in     IPC_Payload_Size;
      Accepted        :    out Boolean)
     with Pre  => Chan.Messages_Handled < Natural'Last,
          Post => (if Accepted then
                     Chan.State = State_Reply_Ready and then
                     Chan.Pending_Bytes = Payload_Bytes and then
                     Chan.Active_Priority >= Client_Priority and then
                     Chan.Active_Priority >= Chan.Server_Priority and then
                     Chan.Messages_Handled = Chan.Messages_Handled'Old + 1
                   else
                     Chan.State = Chan.State'Old and then
                     Chan.Messages_Handled = Chan.Messages_Handled'Old);

   -- 2. Deterministic Non-Blocking Pulse Validator (MsgSendPulse / MsgReceivePulse)
   procedure Validate_QNX_Pulse
     (Chan       : in out QNX_Channel_Descriptor;
      Pulse_Code : in     Integer;
      Pulse_Prio : in     Integer;
      Valid      :    out Boolean)
     with Post => (if Valid then
                     Pulse_Code in Min_Pulse_Code .. Max_Pulse_Code and then
                     Pulse_Prio in Min_QNX_Priority .. Max_QNX_Priority and then
                     Chan.Last_Pulse = Pulse_Code and then
                     Chan.Active_Priority >= Pulse_Prio
                   else
                     Chan.Last_Pulse = Chan.Last_Pulse'Old);

   -- 3. Complete MsgReply & Restore Base Priority
   procedure Reply_And_Restore_Priority
     (Chan        : in out QNX_Channel_Descriptor;
      Reply_Bytes : in     IPC_Payload_Size;
      Success     :    out Boolean)
     with Post => (if Chan.State'Old = State_Reply_Ready and then Reply_Bytes <= Max_IPC_Bytes then
                     Success and then
                     Chan.State = State_Idle and then
                     Chan.Pending_Bytes = 0 and then
                     Chan.Active_Priority = Chan.Server_Priority
                   else
                     not Success and then
                     Chan.State = Chan.State'Old);

end QNX_Neutrino_IPC_Guard;
