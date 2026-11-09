# =========================================================================
# Makefile — QNX SDP 8.0 & GNATprove Formal Verification Build System
# Target Architectures: QNX 8.0 x86_64 (gcc_ntox86_64) & ARM64 (gcc_ntoaaarch64le)
# =========================================================================

QCC        ?= qcc
GNATPROVE  ?= gnatprove
QNX_ARCH   ?= gcc_ntox86_64
CFLAGS     := -Wall -Wextra -O2

.PHONY: all prove qnx-x86_64 qnx-aarch64 host-sim ifs clean

all: prove host-sim

# 1. Formal Verification of Ada 2022 / SPARK 2022 QNX IPC Guard
prove:
	$(GNATPROVE) -P qnx_spark.gpr -u qnx_neutrino_ipc_guard.adb --level=2 --report=all

# 2. Cross-compile native QNX 8.0 Resource Manager for x86_64 (QEMU / IPC Target)
qnx-x86_64:
	$(QCC) -Vgcc_ntox86_64 $(CFLAGS) -o spark_qnx_resmgr_x86_64 spark_qnx_resmgr.c

# 3. Cross-compile native QNX 8.0 Resource Manager for ARM64 (Raspberry Pi 4/5)
qnx-aarch64:
	$(QCC) -Vgcc_ntoaaarch64le $(CFLAGS) -o spark_qnx_resmgr_aarch64 spark_qnx_resmgr.c

# 4. Build QNX 8.0 Bootable Image File System (IFS) via mkifs
ifs: qnx-x86_64
	mkifs -v spark_qnx8.build spark_qnx8.ifs

# 5. Host Verification Harness (Windows / Linux)
host-sim:
	gcc $(CFLAGS) -o spark_qnx_resmgr_host spark_qnx_resmgr.c
	./spark_qnx_resmgr_host

clean:
	rm -rf obj spark_qnx_resmgr_x86_64 spark_qnx_resmgr_aarch64 spark_qnx_resmgr_host spark_qnx8.ifs
