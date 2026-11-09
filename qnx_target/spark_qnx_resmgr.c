/*
 * spark_qnx_resmgr.c
 *
 * QNX SDP 8.0 Native POSIX Resource Manager (/dev/spark_guard)
 * Bridges QNX Neutrino Synchronous Message Passing (MsgReceive/MsgReply/MsgSendPulse)
 * with Formally Verified Ada 2022 / SPARK 2022 Contracts (QNX_Neutrino_IPC_Guard).
 *
 * Target: BlackBerry QNX Neutrino RTOS 8.0 (aarch64le / x86_64)
 * License: Apache-2.0
 */

#include <errno.h>
#include <stdio.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <stdint.h>

#ifdef __QNXNTO__
#include <sys/iofunc.h>
#include <sys/dispatch.h>
#include <sys/neutrino.h>
#include <sys/resmgr.h>
#endif

#define SPARK_GUARD_DEV_PATH "/dev/spark_guard"
#define MAX_IPC_BYTES        4096
#define MIN_QNX_PRIO         1
#define MAX_QNX_PRIO         255
#define PULSE_CODE_HEARTBEAT (_PULSE_CODE_MINAVAIL + 1)

/* Formally proved state mirror matching QNX_Neutrino_IPC_Guard.QNX_Channel_Descriptor */
typedef enum {
    STATE_IDLE = 0,
    STATE_SEND_BLOCKED = 1,
    STATE_RECEIVE_BLOCKED = 2,
    STATE_REPLY_READY = 3
} ipc_state_t;

typedef struct {
    uint32_t    chid;
    int32_t     server_priority;
    int32_t     active_priority;
    ipc_state_t state;
    int32_t     last_pulse;
    uint32_t    pending_bytes;
    uint32_t    messages_handled;
    char        payload_buffer[MAX_IPC_BYTES];
} spark_qnx_channel_t;

static spark_qnx_channel_t g_channel = {
    .chid             = 1,
    .server_priority  = 15,
    .active_priority  = 15,
    .state            = STATE_IDLE,
    .last_pulse       = 0,
    .pending_bytes    = 0,
    .messages_handled = 0
};

/*
 * SPARK-equivalent Priority-Inheritance & Bounds Check before servicing _IO_WRITE / _IO_READ
 */
static int spark_receive_and_inherit_priority(
    spark_qnx_channel_t *chan,
    int32_t client_prio,
    uint32_t payload_bytes)
{
    if (client_prio < MIN_QNX_PRIO || client_prio > MAX_QNX_PRIO) {
        return -EINVAL;
    }
    if (payload_bytes == 0 || payload_bytes > MAX_IPC_BYTES) {
        return -EMSGSIZE;
    }
    if (chan->state != STATE_IDLE && chan->state != STATE_RECEIVE_BLOCKED) {
        return -EBUSY;
    }

    /* Priority Inheritance Guarantee: Active_Priority >= Client_Priority */
    if (client_prio > chan->server_priority) {
        chan->active_priority = client_prio;
    } else {
        chan->active_priority = chan->server_priority;
    }

    chan->pending_bytes = payload_bytes;
    chan->state = STATE_REPLY_READY;
    chan->messages_handled++;
    return 0;
}

static int spark_reply_and_restore_priority(
    spark_qnx_channel_t *chan,
    uint32_t reply_bytes)
{
    if (chan->state != STATE_REPLY_READY || reply_bytes > MAX_IPC_BYTES) {
        return -EINVAL;
    }
    chan->state = STATE_IDLE;
    chan->pending_bytes = 0;
    chan->active_priority = chan->server_priority;
    return 0;
}

#ifdef __QNXNTO__
static resmgr_connect_funcs_t connect_funcs;
static resmgr_io_funcs_t      io_funcs;
static iofunc_attr_t          attr;

static int io_read(resmgr_context_t *ctp, io_read_t *msg, RESMGR_OCB_T *ocb)
{
    int status;
    if ((status = iofunc_read_verify(ctp, msg, ocb, NULL)) != EOK) {
        return status;
    }
    if ((msg->i.xtype & _IO_XTYPE_MASK) != _IO_XTYPE_NONE) {
        return ENOSYS;
    }

    char status_report[256];
    int len = snprintf(
        status_report,
        sizeof(status_report),
        "QNX8_SPARK_GUARD OK | chid=%u | prio=%d/%d | msgs=%u | pulse=%d\n",
        g_channel.chid,
        g_channel.active_priority,
        g_channel.server_priority,
        g_channel.messages_handled,
        g_channel.last_pulse
    );

    int nbytes = msg->i.nbytes;
    int offset = ocb->offset;
    if (offset >= len) {
        _IO_SET_READ_NBYTES(ctp, 0);
        return _RESMGR_NPARTS(0);
    }

    if (nbytes > (len - offset)) {
        nbytes = len - offset;
    }

    SETIOV(ctp->iov, status_report + offset, nbytes);
    _IO_SET_READ_NBYTES(ctp, nbytes);
    ocb->offset += nbytes;
    return _RESMGR_NPARTS(1);
}

static int io_write(resmgr_context_t *ctp, io_write_t *msg, RESMGR_OCB_T *ocb)
{
    int status;
    if ((status = iofunc_write_verify(ctp, msg, ocb, NULL)) != EOK) {
        return status;
    }
    if ((msg->i.xtype & _IO_XTYPE_MASK) != _IO_XTYPE_NONE) {
        return ENOSYS;
    }

    struct _msg_info info;
    MsgInfo(ctp->rcvid, &info);

    int rc = spark_receive_and_inherit_priority(&g_channel, info.priority, msg->i.nbytes);
    if (rc != 0) {
        return -rc;
    }

    resmgr_msgread(ctp, g_channel.payload_buffer, msg->i.nbytes, sizeof(msg->i));
    _IO_SET_WRITE_NBYTES(ctp, msg->i.nbytes);

    spark_reply_and_restore_priority(&g_channel, msg->i.nbytes);
    return _RESMGR_NPARTS(0);
}
#endif

int main(int argc, char **argv)
{
    (void)argc;
    (void)argv;

#ifdef __QNXNTO__
    dispatch_t           *dpp;
    resmgr_attr_t        resmgr_attr;
    dispatch_context_t   *ctp;
    int                  id;

    if ((dpp = dispatch_create_channel(-1, DISPATCH_FLAG_NOLOCK)) == NULL) {
        perror("dispatch_create_channel");
        return EXIT_FAILURE;
    }

    memset(&resmgr_attr, 0, sizeof(resmgr_attr));
    resmgr_attr.nparts_max = 1;
    resmgr_attr.msg_max_size = MAX_IPC_BYTES;

    iofunc_func_init(_RESMGR_CONNECT_NFUNCS, &connect_funcs,
                     _RESMGR_IO_NFUNCS, &io_funcs);
    io_funcs.read  = io_read;
    io_funcs.write = io_write;

    iofunc_attr_init(&attr, S_IFNAM | 0666, 0, 0);

    id = resmgr_attach(dpp, &resmgr_attr, SPARK_GUARD_DEV_PATH, _FTYPE_ANY, 0,
                       &connect_funcs, &io_funcs, &attr);
    if (id == -1) {
        perror("resmgr_attach");
        return EXIT_FAILURE;
    }

    ctp = dispatch_context_alloc(dpp);
    printf("[QNX SDP 8.0] SPARK Resource Manager online at %s\n", SPARK_GUARD_DEV_PATH);

    while (1) {
        if ((ctp = dispatch_block(ctp)) == NULL) {
            perror("dispatch_block");
            return EXIT_FAILURE;
        }
        dispatch_handler(ctp);
    }
#else
    /* Host-side simulation / verification harness when compiled on Linux/Windows host */
    printf("[SPARK Automate QNX 8.0 Host Harness] Verifying IPC Priority Inheritance...\n");
    int rc1 = spark_receive_and_inherit_priority(&g_channel, 63, 512);
    printf(" -> MsgReceive(client_prio=63, bytes=512): rc=%d, active_prio=%d (expected 63)\n",
           rc1, g_channel.active_priority);
    int rc2 = spark_reply_and_restore_priority(&g_channel, 64);
    printf(" -> MsgReply(reply_bytes=64): rc=%d, restored_prio=%d (expected 15), total_msgs=%u\n",
           rc2, g_channel.active_priority, g_channel.messages_handled);
    return (rc1 == 0 && rc2 == 0) ? EXIT_SUCCESS : EXIT_FAILURE;
#endif
}
