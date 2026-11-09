# G(E)A(L)L — Panoramiks · Asterisk · Obelisk Studio for BlackBerry QNX SDP 8.0

**G(E)A(L)L** is a sovereign, zero-cloud-paywall visual workflow studio and formal verification environment engineered for **BlackBerry QNX Software Development Platform 8.0 (QNX Neutrino RTOS)**.

Unlike cloud-bound prototyping tools (such as Google AI Studio) that require paid API keys and non-deterministic remote LLMs, **G(E)A(L)L** operates **100% locally, deterministically, and offline** using our three-pillar architecture:

- **Panoramiks (`Ada 2022`)**: Strongly-typed, zero-heap systems implementation language (`new`, `Free`, `raise`, and `Unchecked_Conversion` strictly forbidden).
- **Asterisk (`SPARK 2022`)**: Formal contract specification engine (`pragma SPARK_Mode (On);`, `Pre`/`Post` contracts, bounded ranges, and state machine invariants).
- **Obelisk (`GNATprove 16.1.0` + `CVC5` / `Z3` SMT Provers)**: Mathematical verification gate proving **100% Absence of Run-Time Errors (AoRTE)** before a single binary is deployed to the QNX microkernel.

---

## 🎯 QNX SDP 8.0 Native Target Integration (`qnx_target/`)

All QNX 8.0 target artifacts live in [`qnx_target/`](./qnx_target):

1. **[`qnx_neutrino_ipc_guard.ads`](./qnx_target/qnx_neutrino_ipc_guard.ads) & [`qnx_neutrino_ipc_guard.adb`](./qnx_target/qnx_neutrino_ipc_guard.adb)**
   - **Asterisk / Panoramiks** formal specification and implementation of the QNX Neutrino synchronous IPC state machine (`MsgSend` / `MsgReceive` / `MsgReply`) and non-blocking pulses (`MsgSendPulse` / `MsgReceivePulse`).
   - Mathematically proves **QNX Priority Inheritance** (`Chan.Active_Priority >= Client_Priority` and `Chan.Active_Priority >= Chan.Server_Priority`), pulse code bounds (`0 .. 127`), scheduling priority bounds (`1 .. 255`), and zero buffer overflow (`0 .. 4096` bytes).
   - **Obelisk Proof Status**: `Success: all checks proved (26 checks)` via `gnatprove 16.1.0` + `CVC5`.
2. **[`spark_qnx_resmgr.c`](./qnx_target/spark_qnx_resmgr.c)**
   - Native **QNX SDP 8.0 POSIX Resource Manager** (`#include <sys/neutrino.h>`, `<sys/iofunc.h>`, `<sys/dispatch.h>`, `<sys/resmgr.h>`) mounting `/dev/spark_guard` inside the QNX pathname space and enforcing the formally proved priority-inheritance and payload invariants on every `_IO_READ` and `_IO_WRITE` frame.
3. **[`Makefile`](./qnx_target/Makefile)**
   - Cross-compiles `/dev/spark_guard` with QNX `qcc` for both **x86_64** (`qcc -Vgcc_ntox86_64`) and **ARM64 / Raspberry Pi 4 & 5** (`qcc -Vgcc_ntoaaarch64le`), runs `gnatprove` (`Obelisk`), and builds a host simulation binary.
4. **[`spark_qnx8.build`](./qnx_target/spark_qnx8.build)**
   - QNX `mkifs` Image File System buildfile booting `procnto-smp-instr` and automatically launching `spark_qnx_resmgr_x86_64` at `/dev/spark_guard`.

---

## 🚀 Quick Start (Local & Offline)

```bash
npm install
npm run build
npm start
```

### Verify QNX 8.0 Module with Obelisk (`gnatprove`)
```bash
cd qnx_target
gnatprove -P qnx_spark.gpr -u qnx_neutrino_ipc_guard.adb --level=2 --report=statistics
```

### Build for QNX SDP 8.0 (`qcc` & `mkifs`)
```bash
source ~/qnx800/qnxsdp-env.sh
cd qnx_target
make qnx-x86_64
make qnx-aarch64
make ifs
```

---

## 🎥 Demo Video
- **YouTube**: [https://youtu.be/0Xl1ExSktgg](https://youtu.be/0Xl1ExSktgg)

## 📜 License
Released under the **Apache-2.0** Open Source License (see [`LICENSE`](./LICENSE)).
