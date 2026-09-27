# ARGO Float Operation, Mechanics, and CTD Sensors

## 1. What is an ARGO Float?
An Argo float is an autonomous, free-drifting oceanographic robot designed to collect vertical profiles of temperature, salinity, and pressure down to 2,000 meters depth in the open ocean. 

Unlike oceanographic survey ships or tethered moorings, Argo floats are completely untethered and uncrewed. They drift freely with deep ocean currents for their entire operational lifespan (typically 4 to 6 years, completing 150 to 220 dive cycles) before battery exhaustion.

Key commercial float platforms include:
- APEX (Teledyne Webb Research)
- PROVOR and ARVOR (NKE Marine Electronics / Ifremer)
- SOLO and SOLO-II (Scripps Institution of Oceanography)
- NAVIS (Sea-Bird Scientific)

## 2. Variable Buoyancy Engine: How an ARGO Float Works
Argo floats do not use propellers or thrusters to ascend or descend. Instead, they control their vertical movement using Archimedes' principle of buoyancy via a hydraulic variable buoyancy engine.

The buoyancy mechanism works as follows:
- **Internal Reservoir and External Bladder**: The float contains an internal hydraulic fluid (mineral oil) reservoir, an electric hydraulic pump, an internal control valve, and an external polyurethane rubber bladder.
- **Descending (Increasing Density)**: To sink, the float opens an internal valve. High ambient seawater pressure forces oil from the external rubber bladder back into the internal rigid aluminum hull. The float's mass remains constant, but its external volume decreases, causing its mean density to exceed the surrounding seawater density, so the float sinks smoothly.
- **Ascending (Decreasing Density)**: To rise, the electric pump forces oil from inside the rigid hull out into the flexible external bladder. Expanding the external bladder increases the float's volume, decreasing its overall density below that of the surrounding seawater, which propels the float upward.

## 3. The Standard 10-Day Profiling Cycle
Each Argo float repeats an autonomous 10-day operational cycle throughout its deployment:

1. **Descent from Surface (Hour 0 to 6)**:
   - The float releases oil from the external bladder into the internal reservoir, sinking slowly at ~10 cm/s toward its designated parking depth.
2. **Subsurface Drift at Parking Depth (Days 1 to 9)**:
   - The float stabilizes at a neutral buoyancy parking depth, typically 1,000 meters (1,000 dbar).
   - Over ~9 days, the float drifts passively with intermediate ocean currents. Tracking successive surfacing positions provides direct measurement of subsurface oceanic velocity.
3. **Descent to Profiling Depth (Day 10, ~Hour 220 to 226)**:
   - The float drops further oil to descend from 1,000 meters to its maximum profiling depth, typically 2,000 meters (2,000 dbar).
4. **Ascent and CTD Sampling (Day 10, ~Hour 226 to 232)**:
   - The float activates its hydraulic pump to begin ascending at ~10 cm/s toward the sea surface.
   - During this 6-hour climb, onboard sensors sample conductivity, temperature, and pressure continuously or at discretized vertical intervals (e.g., 2 dbar resolution in upper waters, 10–20 dbar at depth).
5. **Surface Telemetry & GPS Fix (Day 10, ~Hour 232 to 240)**:
   - Upon breaking the surface, the float inflates its external bladder to maximum buoyancy to raise its antenna above the waves.
   - It acquires a GPS satellite fix, measures surface barometric pressure for sensor tare calibration, and transmits all stored vertical profile data via satellite. Modern floats using Iridium bidirectional telemetry complete data transfer in 15 to 30 minutes before diving again.

## 4. CTD Sensor Package & Measurements
The primary scientific instrument payload on standard Argo floats is a high-precision CTD sensor package, commonly the Sea-Bird Electronics SBE-41 or SBE-41CP:

- **Conductivity (Salinity)**:
  - Measured using a flow-through toroidal inductive or conductive quartz conductivity cell.
  - Salinity is calculated from the conductivity ratio, temperature, and pressure using the Practical Salinity Scale 1978 (PSS-78), expressed in Practical Salinity Units (PSU).
  - Accuracy: ±0.003 PSU.
- **Temperature**:
  - Measured with a high-stability aged thermistor sensor.
  - Temperature is recorded on the International Temperature Scale 1990 (ITS-90) in degrees Celsius (°C).
  - Accuracy: ±0.002 °C.
- **Pressure (Depth)**:
  - Measured with a micromachined silicon strain gauge or resonant quartz pressure transducer.
  - Hydrostatic pressure is recorded in decibars (dbar), where 1 dbar corresponds approximately to 1 meter depth.
  - Accuracy: ±2.4 dbar.
