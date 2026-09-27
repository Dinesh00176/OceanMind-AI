# ARGO Data Management System & GDAC Architecture

## 1. Overview of the ARGO Data Pipeline
The Argo Data System is an internationally synchronized distributed computing infrastructure designed to ingest raw satellite transmissions, apply automated quality controls, package data into standardized formats, and disseminate profiles to global users within 24 to 48 hours of observation.

The data pipeline consists of four major stages:
1. **Float to Satellite Telemetry**:
   - The float surfaces and transmits compressed telemetry packets via the Iridium satellite constellation (or older System ARGOS) to commercial land Earth stations.
2. **National Data Assembly Centers (DACs)**:
   - Raw binary packets are forwarded to 11 National DACs representing deployment nations.
   - DACs ingest raw sensor counts, convert them to physical units (temperature, salinity, pressure), run automated Real-Time Quality Control (RTQC) tests, and package the profiles into standard NetCDF files.
3. **Global Data Assembly Centers (GDACs)**:
   - National DACs synchronize their NetCDF files with the two international mirror GDACs.
   - Profiles are also disseminated in BUFR format over the WMO Global Telecommunication System (GTS) for immediate operational numerical weather prediction.
4. **End-User Distribution**:
   - Researchers, operational weather agencies, and students access GDAC data via HTTPS, FTP, and OPeNDAP servers.

## 2. National Data Assembly Centers (DACs)
There are 11 National DACs operating globally:
- **INCOIS (India)**: Processes floats deployed by India in the Indian Ocean, Arabian Sea, and Bay of Bengal.
- **AOML / NOAA (USA)**: Processes US-deployed floats.
- **Coriolis (France / Euro-Argo)**: Processes European floats.
- **CSIRO (Australia)**: Processes Australian floats.
- **JMA (Japan)**: Processes Japanese floats.
- **MEDS (Canada)**: Processes Canadian floats.
- **BODC (UK)**: Processes British floats.
- **KMA (Korea)**: Processes South Korean floats.
- **CSIO (China)**: Processes Chinese floats.
- **BSH (Germany)**: Processes German floats.
- **INIDEP (Argentina)**: Processes Argentine floats.

## 3. Global Data Assembly Centers (GDACs)
There are exactly two Global Data Assembly Centers that function as complete, synchronized mirrors:
1. **French GDAC (Coriolis / Ifremer)** located in Brest, France.
2. **US GDAC (FNMOC - Fleet Numerical Meteorology and Oceanography Center)** located in Monterey, California, USA.

GDAC roles include:
- Ingesting and validating NetCDF profile, trajectory, metadata, and technical files from all 11 DACs.
- Maintaining the authoritative global catalog of all Argo profiles.
- Providing free, open public access with zero embargo period.
- Performing cross-DAC format integrity audits.

## 4. Real-Time Data (RT) vs. Delayed-Mode Data (DM)
Argo maintains two distinct data streams to balance operational timeliness with research-grade precision:

| Feature | Real-Time (RT) Data | Delayed-Mode (DM) Data |
| :--- | :--- | :--- |
| **Availability** | Available within 24 to 48 hours of surfacing | Available 6 to 12 months after profile collection |
| **Quality Control** | Automated 19 real-time QC tests | Oceanographer manual review + statistical salinity calibration |
| **Calibration** | Factory sensor calibration | Adjusted for conductivity sensor biofouling & drift |
| **Target Users** | Operational weather & ocean forecast models | Climate researchers, decadal trend analysis, ocean heat studies |
| **File Designation** | Prefix `R` in NetCDF filename (e.g. `R2903001_045.nc`) | Prefix `D` in NetCDF filename (e.g. `D2903001_045.nc`) |

## 5. Argo Data File Formats (NetCDF CF-1.6)
All Argo data is distributed in NetCDF (Network Common Data Form) version 3.1 format conforming to Climate and Forecast (CF) metadata conventions. Each float generates four file types:
- **Profile (`*prof.nc`)**: Contains vertical measurements of pressure, temperature, salinity, and QC flags for each dive.
- **Trajectory (`*traj.nc`)**: Contains positions, times, surface drift intervals, and subsurface drift records.
- **Technical (`*tech.nc`)**: Contains engineering diagnostics such as battery voltage, pump motor duration, and internal vacuum.
- **Metadata (`*meta.nc`)**: Contains float WMO identifier, serial number, sensor calibrations, launch coordinates, and mission configuration.
