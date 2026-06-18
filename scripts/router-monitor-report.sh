#!/bin/sh

# Copy this file to your router, then change API_URL and ROUTER_TOKEN.
# Example cron:
# * * * * * /root/router-monitor-report.sh >/dev/null 2>&1

API_URL="https://mooncci.site/api/router-monitor/report"
ROUTER_TOKEN="98b7d47c074399677c7c1aead121747601a93fd1a226847bc5bb2103ca4b71d9"
DEVICE="${ROUTER_DEVICE:-main-router}"

to_mb() {
  awk "BEGIN { printf \"%d\", ($1 / 1024) }"
}

COUNT="$(cat /proc/sys/net/netfilter/nf_conntrack_count 2>/dev/null || echo 0)"
MAX="$(cat /proc/sys/net/netfilter/nf_conntrack_max 2>/dev/null || echo 0)"

LOAD="$(cut -d ' ' -f 1-3 /proc/loadavg 2>/dev/null || echo '0 0 0')"
LOAD1="$(echo "$LOAD" | awk '{print $1}')"
LOAD5="$(echo "$LOAD" | awk '{print $2}')"
LOAD15="$(echo "$LOAD" | awk '{print $3}')"

CPU_USAGE="$(
  top -bn1 2>/dev/null \
    | awk '/CPU:|Cpu\\(s\\)/ {
        for (i=1; i<=NF; i++) {
          if ($i ~ /idle|id/) {
            gsub(/[^0-9.]/, "", $(i-1));
            printf "%.2f", 100 - $(i-1);
            exit
          }
        }
      }'
)"
CPU_USAGE="${CPU_USAGE:-0}"

MEM_TOTAL_KB="$(awk '/MemTotal:/ {print $2}' /proc/meminfo 2>/dev/null)"
MEM_AVAILABLE_KB="$(awk '/MemAvailable:/ {print $2}' /proc/meminfo 2>/dev/null)"
MEM_FREE_KB="$(awk '/MemFree:/ {print $2}' /proc/meminfo 2>/dev/null)"
MEM_AVAILABLE_KB="${MEM_AVAILABLE_KB:-$MEM_FREE_KB}"
MEM_USED_KB="$((MEM_TOTAL_KB - MEM_AVAILABLE_KB))"
MEM_TOTAL_MB="$(to_mb "$MEM_TOTAL_KB")"
MEM_USED_MB="$(to_mb "$MEM_USED_KB")"
MEM_FREE_MB="$(to_mb "$MEM_AVAILABLE_KB")"

DISK_LINE="$(df -k / 2>/dev/null | awk 'NR==2 {print $2, $3, $4, $5}')"
DISK_TOTAL_KB="$(echo "$DISK_LINE" | awk '{print $1}')"
DISK_USED_KB="$(echo "$DISK_LINE" | awk '{print $2}')"
DISK_FREE_KB="$(echo "$DISK_LINE" | awk '{print $3}')"
DISK_USAGE="$(echo "$DISK_LINE" | awk '{gsub(/%/, "", $4); print $4}')"
DISK_TOTAL_MB="$(to_mb "${DISK_TOTAL_KB:-0}")"
DISK_USED_MB="$(to_mb "${DISK_USED_KB:-0}")"
DISK_FREE_MB="$(to_mb "${DISK_FREE_KB:-0}")"

UPTIME_SECONDS="$(cut -d ' ' -f 1 /proc/uptime 2>/dev/null | cut -d '.' -f 1)"

curl -sS -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "X-Router-Token: $ROUTER_TOKEN" \
  -d "{
    \"device\":\"$DEVICE\",
    \"conntrack_count\":$COUNT,
    \"conntrack_max\":$MAX,
    \"cpu_usage\":$CPU_USAGE,
    \"load_one\":$LOAD1,
    \"load_five\":$LOAD5,
    \"load_fifteen\":$LOAD15,
    \"memory_total_mb\":$MEM_TOTAL_MB,
    \"memory_used_mb\":$MEM_USED_MB,
    \"memory_free_mb\":$MEM_FREE_MB,
    \"disk_total_mb\":$DISK_TOTAL_MB,
    \"disk_used_mb\":$DISK_USED_MB,
    \"disk_free_mb\":$DISK_FREE_MB,
    \"disk_usage\":${DISK_USAGE:-0},
    \"uptime_seconds\":${UPTIME_SECONDS:-0}
  }"
