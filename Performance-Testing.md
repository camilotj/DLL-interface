# IO-Link Sensor Performance Test

- Context: device shows fixed slow cycle time (~230 ms). Goal: determine max/peak samples-per-second (sps) and reliability (jitter, overruns) when requesting high-rate streaming (example requested 1000 Hz).
- Test log highlights:
  - Requested: 1000 Hz (1 ms interval), buffer 8192 bytes.
  - Native streaming started; first two reads recorded:
    - Read 1: 1 sample, 11 bytes, read latency ~ 53 ms
    - Read 2: 1 sample, 11 bytes, read latency ~ 102 ms
  - Stop: 2 samples in 2.5 s → Effective rate ≈ 0.8 Hz (far below 1000 Hz)
  - Buffer status: running=true, moreData=false, overrun=false
  - Conclusion from vendor/device behavior: device enforces a minimum cycle ≈ 230 ms → theoretical ≈ 4.35 Hz maximum (device limitation, not software)

## Findings
- Measured effective throughput (this run): 0.8 Hz (2 samples / 2.5 s).
- Device minimum cycle observed/documented: ~230 ms → expected max ~ 4.35 Hz.
- Mismatch explanation: requesting 1000 Hz from master cannot override device min cycle; master + device negotiate real cycle (PortModeDetails = 0 = free running → max(device_min, master_min)).
- No buffer overruns seen in this short test; but small sample size — insufficient to conclude stability.

## Recommended next steps (tests to precisely quantify limits and reliability)
1. Controlled cycle-time sweep
   - For each IO‑Link standard cycle time: 147.2ms, 73.6ms, 36.8ms, 18.4ms, 9.2ms, 4.6ms, 2.3ms, 294.4ms:
     - Set PortModeDetails explicitly to that cycle time (not 0/free-running).
     - Start native streaming for a fixed duration (e.g., 60 s).
     - Record timestamps of each sample arrival.
     - Compute metrics (see below).
2. Measurement metrics to compute per test
   - Samples received (N)
   - Effective sps = N / duration
   - Mean inter-sample interval (ms)
   - Std dev of intervals (jitter)
   - Min / Max interval (observe spikes)
   - Overrun count and any error codes
   - Lost samples (expected samples vs received when cycle time fixed)
3. Short script to collect timestamps (run on the master side)
````js
// simple collector (run as Node.js)
const results = [];
startStreaming();
const start = Date.now();
const durationMs = 60000;
io.onSample = (sample) => results.push(Date.now());
setTimeout(() => {
  stopStreaming();
  const intervals = results.slice(1).map((t,i)=>t-results[i]);
  const mean = intervals.reduce((a,b)=>a+b,0)/intervals.length;
  const sd = Math.sqrt(intervals.map(x=>Math.pow(x-mean,2)).reduce((a,b)=>a+b,0)/intervals.length);
  console.log({samples:results.length, mean, sd, min:Math.min(...intervals), max:Math.max(...intervals)});
}, durationMs);
````
4. Interpretation rules
   - If mean ~ configured cycle and jitter low → device supports that rate reliably.
   - If mean >> configured cycle or many missed samples → device cannot support it; fall back to next slower cycle.
   - If overruns occur → reduce rate or increase buffer/transfer strategy.
5. Practical recommendations now
   - Expect realistic max ~ device min cycle (~230 ms → ~4.35 Hz). Use conservative setting (294.4 ms or 147.2 ms) and verify.
   - Do not expect 1000 Hz unless device is explicitly rated for that.
   - For high-resolution needs, check alternative sensors or hardware that support the IO‑Link fast cycles.
6. Actions to try
   - Change PortModeDetails to explicit IO‑Link cycle values and run 60s tests.
   - Collect and plot intervals to visualize jitter.
   - If needed, consult device vendor manual to confirm supported cycle times and any firmware constraints.

## Short conclusion
- Current run shows the device cannot deliver 1000 Hz; actual throughput is far lower (0.8 Hz in this session) because the sensor enforces a slow minimum cycle (~230 ms → ~4.35 Hz max). Run the controlled sweep above to determine the device’s reliable maximum and jitter characteristics.