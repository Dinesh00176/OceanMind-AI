# ARGO Quality Control Procedures and Quality Flags

## 1. Overview of Quality Control in ARGO
Because Argo floats operate autonomously at sea for up to 6 years without manual servicing, rigorous quality control (QC) is essential to eliminate bad sensor readings, identify physical sensor drift, and ensure that only scientifically trustworthy data is used in research and operational models.

Argo implements a two-tier quality control architecture:
1. **Real-Time Quality Control (RTQC)**: Automated screening performed at DACs within 24 hours of data reception.
2. **Delayed-Mode Quality Control (DMQC)**: Expert oceanographer validation and statistical calibration performed 6 to 12 months later.

## 2. Standard Real-Time Quality Control (RTQC) Tests
The automated real-time QC suite runs a sequential battery of 19 tests on every profile:

1. **Platform Identification Test**: Verifies that the float's WMO platform identifier is valid and registered in the international database.
2. **Impossible Date Test**: Checks that the year is ≥ 1997, month is 1–12, day is 1–31, hour is 0–23, and minutes are 0–59.
3. **Impossible Location Test**: Ensures latitude is between -90° and +90°, and longitude between -180° and +180°.
4. **Position on Land Test**: Checks float coordinates against high-resolution topographic bathymetry (GEBCO / ETOPO) to ensure the float is in open water and not aground on land.
5. **Impossible Speed Test**: Verifies that drift speed between successive surfacing cycles does not exceed 3.0 m/s (~6 knots), which would indicate an invalid satellite fix.
6. **Global Range Test**: Confirms values fall within physical bounds:
   - Temperature: -2.5 °C to +40.0 °C
   - Practical Salinity: 2.0 to 41.0 PSU
   - Pressure: > -5 dbar
7. **Regional Range Test**: Applies stricter basin-specific limits (e.g., Red Sea, Mediterranean, Baltic Sea).
8. **Pressure-Increasing Test**: Ensures pressure measurements increase monotonically down the profile.
9. **Spike Test**: Identifies unrealistic localized spikes in temperature or salinity using second-difference thresholds:
   - Test value: $|V_2 - (V_3 + V_1) / 2| - |(V_3 - V_1) / 2|$
   - Exceeding threshold marks the sample as bad.
10. **Top and Bottom Spike Test**: Examines the uppermost and lowermost measurements of a profile where standard three-point spike tests cannot be evaluated.
11. **Gradient Test**: Flags unrealistic vertical gradients between successive depth levels.
12. **Digit Rollover Test**: Detects transmission bit errors or sensor counter overflows.
13. **Stuck Value Test**: Identifies sensor malfunction where consecutive measurements repeat identical values within machine precision.
14. **Density Inversion Test**: Calculates potential density ($\sigma_\theta$) to ensure the water column is hydrostatically stable. Any significant density inversion ($\Delta \sigma_\theta < -0.03 \text{ kg/m}^3$) is flagged.
15. **Grey List Test**: Checks the float WMO against the international Argo "Grey List" of floats suspected of sensor malfunctions or chronic calibration drift.
16. **Gross Salinity / Temperature Drift Test**: Detects long-term sensor drift by comparing surface values to historical climatology.
17. **Visual QC**: Optional manual inspection by DAC operators for suspicious profiles.
18. **Frozen Profile Test**: Flags floats that report identical temperature profiles across consecutive 10-day cycles.
19. **Deepest Pressure Test**: Verifies that maximum profile pressure does not exceed float rated depth by more than 10%.

## 3. The ARGO Quality Control Flagging Scale
Every single temperature, salinity, and pressure measurement in an Argo profile is assigned an individual numerical QC flag from 1 to 9:

| QC Flag | Meaning | Scientific Definition & Recommended Usage |
| :---: | :--- | :--- |
| **Flag 1** | **Good Data** | Passed all real-time and delayed-mode QC tests. Recommended for all scientific analyses. |
| **Flag 2** | **Probably Good** | Small anomalies detected, but within acceptable oceanographic tolerances. Safe for most analyses. |
| **Flag 3** | **Bad Data (Potentially Correctable)** | Measurement exhibits anomalies or uncalibrated sensor drift. Requires delayed-mode adjustment. |
| **Flag 4** | **Bad Data** | Sensor malfunction, severe spike, or corrupted data. **Must be rejected from all scientific calculations.** |
| **Flag 5** | **Value Changed** | Adjusted value in delayed-mode processing. |
| **Flag 8** | **Estimated Value** | Value interpolated or estimated through objective mapping. |
| **Flag 9** | **Missing Value** | No measurement recorded at this depth level. |

## 4. Delayed-Mode Quality Control (DMQC)
Conductivity sensors can suffer minute calibration drift over years due to biological fouling or micro-leaks in the conductivity cell. 

In DMQC:
- Principal investigators and oceanographers use statistical methods such as the **Owens & Wong (2009)** and **WJO (Wong, Johnson, Owens)** algorithms.
- Float profiles are objectively mapped against high-quality reference shipboard CTD casts and historical deep-water climatologies (where deep water properties below 1,500m are stable over decades).
- A linear or piecewise correction factor is computed for salinity and stored in the `salinity_adjusted` variable along with an explicit error estimate (`salinity_adjusted_error`).
