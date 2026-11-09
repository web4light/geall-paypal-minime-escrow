pragma SPARK_Mode (On);

package body QNX_Neutrino_IPC_Guard is

   procedure Receive_And_Inherit_Priority
     (Chan            : in out QNX_Channel_Descriptor;
      Client_Priority : in     QNX_Priority_Type;
      Payload_Bytes   : in     IPC_Payload_Size;
      Accepted        :    out Boolean)
   is
   begin
      if (Chan.State = State_Idle or else Chan.State = State_Receive_Blocked)
        and then Payload_Bytes > 0
      then
         if Client_Priority > Chan.Server_Priority then
            Chan.Active_Priority := Client_Priority;
         else
            Chan.Active_Priority := Chan.Server_Priority;
         end if;

         Chan.Pending_Bytes    := Payload_Bytes;
         Chan.State            := State_Reply_Ready;
         Chan.Messages_Handled := Chan.Messages_Handled + 1;
         Accepted              := True;
      else
         Accepted := False;
      end if;
   end Receive_And_Inherit_Priority;

   procedure Validate_QNX_Pulse
     (Chan       : in out QNX_Channel_Descriptor;
      Pulse_Code : in     Integer;
      Pulse_Prio : in     Integer;
      Valid      :    out Boolean)
   is
   begin
      if Pulse_Code >= Min_Pulse_Code
        and then Pulse_Code <= Max_Pulse_Code
        and then Pulse_Prio >= Min_QNX_Priority
        and then Pulse_Prio <= Max_QNX_Priority
      then
         Chan.Last_Pulse := Pulse_Code;
         if Pulse_Prio > Chan.Active_Priority then
            Chan.Active_Priority := Pulse_Prio;
         end if;
         Valid := True;
      else
         Valid := False;
      end if;
   end Validate_QNX_Pulse;

   procedure Reply_And_Restore_Priority
     (Chan        : in out QNX_Channel_Descriptor;
      Reply_Bytes : in     IPC_Payload_Size;
      Success     :    out Boolean)
   is
   begin
      if Chan.State = State_Reply_Ready and then Reply_Bytes <= Max_IPC_Bytes then
         Chan.State           := State_Idle;
         Chan.Pending_Bytes   := 0;
         Chan.Active_Priority := Chan.Server_Priority;
         Success              := True;
      else
         Success := False;
      end if;
   end Reply_And_Restore_Priority;

end QNX_Neutrino_IPC_Guard;
