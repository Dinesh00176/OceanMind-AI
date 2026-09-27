"""
ARGO Oceanographic Scientific Analysis Engine
Performs statistical moments, vertical depth stratification,
T-S oceanographic water mass analysis, and regional/temporal aggregations.
Strictly grounded in retrieved ARGO observational records.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

STANDARD_DEPTH_LEVELS = [0, 10, 25, 50, 100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000]

class OceanAnalysisEngine:
    def compute_statistics(self, values: List[float], param_name: str = "temperature") -> Dict[str, Any]:
        """
        Calculates descriptive scientific statistics on numeric observations.
        """
        arr = np.array([v for v in values if v is not None and not np.isnan(v)])
        if len(arr) == 0:
            return {
                "count": 0,
                "mean": None,
                "median": None,
                "min": None,
                "max": None,
                "std": None,
                "p25": None,
                "p75": None,
                "unit": "°C" if param_name == "temperature" else ("PSU" if param_name == "salinity" else "dbar")
            }

        unit = "°C" if param_name == "temperature" else ("PSU" if param_name == "salinity" else ("µmol/kg" if param_name == "dissolved_oxygen" else "dbar"))
        
        return {
            "count": int(len(arr)),
            "mean": round(float(np.mean(arr)), 2),
            "median": round(float(np.median(arr)), 2),
            "min": round(float(np.min(arr)), 2),
            "max": round(float(np.max(arr)), 2),
            "std": round(float(np.std(arr)), 2),
            "p25": round(float(np.percentile(arr, 25)), 2),
            "p75": round(float(np.percentile(arr, 75)), 2),
            "unit": unit
        }

    def compute_depth_profile(self, profiles_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregates vertical measurements into standard oceanographic depth bins.
        Returns mean vertical curves for temperature, salinity, and dissolved oxygen.
        """
        records = []
        for prof in profiles_data:
            measurements = prof.get("measurements", [])
            for m in measurements:
                records.append({
                    "depth": m.get("depth", 0),
                    "temperature": m.get("temperature"),
                    "salinity": m.get("salinity"),
                    "dissolvedOxygen": m.get("dissolvedOxygen"),
                    "pressure": m.get("pressure")
                })

        if not records:
            return {"depth_levels": [], "profile_count": 0}

        df = pd.DataFrame(records)
        df = df.dropna(subset=["depth"])

        # Map to closest standard depth level
        def find_nearest_depth(d):
            return min(STANDARD_DEPTH_LEVELS, key=lambda x: abs(x - d))

        df["depth_bin"] = df["depth"].apply(find_nearest_depth)

        profile_curve = []
        for depth_bin in sorted(STANDARD_DEPTH_LEVELS):
            sub = df[df["depth_bin"] == depth_bin]
            if len(sub) > 0:
                t_mean = round(float(sub["temperature"].mean()), 2) if "temperature" in sub and sub["temperature"].notna().any() else None
                s_mean = round(float(sub["salinity"].mean()), 2) if "salinity" in sub and sub["salinity"].notna().any() else None
                o_mean = round(float(sub["dissolvedOxygen"].mean()), 2) if "dissolvedOxygen" in sub and sub["dissolvedOxygen"].notna().any() else None
                t_std = round(float(sub["temperature"].std()), 2) if len(sub) > 1 and sub["temperature"].notna().any() else 0.0

                profile_curve.append({
                    "depth": depth_bin,
                    "temperature": t_mean,
                    "salinity": s_mean,
                    "dissolvedOxygen": o_mean,
                    "temp_std": t_std,
                    "samples": len(sub)
                })

        return {
            "depth_levels": profile_curve,
            "total_profiles_analyzed": len(profiles_data),
            "total_samples": len(df)
        }

    def compute_ts_diagram(self, profiles_data: List[Dict[str, Any]], sample_limit: int = 400) -> List[Dict[str, Any]]:
        """
        Prepares Temperature vs Salinity scatter pairs for water mass identification.
        """
        pairs = []
        for prof in profiles_data:
            region = prof.get("region", "Ocean")
            for m in prof.get("measurements", []):
                t = m.get("temperature")
                s = m.get("salinity")
                d = m.get("depth", 0)
                if t is not None and s is not None and not np.isnan(t) and not np.isnan(s):
                    pairs.append({
                        "temperature": round(float(t), 2),
                        "salinity": round(float(s), 2),
                        "depth": int(d),
                        "region": region,
                        "floatId": prof.get("floatId")
                    })
                    if len(pairs) >= sample_limit:
                        break
            if len(pairs) >= sample_limit:
                break
        return pairs

    def compute_regional_comparison(self, region_data: Dict[str, Any], param_name: str = "temperature") -> Dict[str, Any]:
        """
        Compares statistical distributions between two or more ocean basins across one or multiple parameters.
        """
        results = {}
        for region_name, values in region_data.items():
            if isinstance(values, dict):
                # Multiple parameters provided for this region: { temperature: [...], salinity: [...] }
                region_stats = {}
                for p_name, p_vals in values.items():
                    region_stats[p_name] = self.compute_statistics(p_vals, p_name)
                results[region_name] = region_stats
            else:
                # Single parameter list of numbers
                results[region_name] = self.compute_statistics(values, param_name)
        return results

    def compute_temporal_trend(self, time_series_records: List[Dict[str, Any]], param_name: str = "temperature") -> List[Dict[str, Any]]:
        """
        Groups observations by Year-Month to show temporal evolution.
        """
        if not time_series_records:
            return []

        df = pd.DataFrame(time_series_records)
        df["date"] = pd.to_datetime(df["timestamp"], utc=True).dt.tz_convert(None)
        df["year_month"] = df["date"].dt.to_period("M").astype(str)

        trend_data = []
        for period, group in df.groupby("year_month"):
            val_mean = group[param_name].mean()
            val_count = len(group)
            if not np.isnan(val_mean):
                trend_data.append({
                    "period": period,
                    "date": f"{period}-01",
                    "observed": round(float(val_mean), 2),
                    "count": int(val_count)
                })

        trend_data.sort(key=lambda x: x["period"])
        return trend_data

    def compute_trend_summary(self, trend_data: List[Dict[str, Any]], param_name: str = "temperature") -> Dict[str, Any]:
        """
        Calculates starting value, ending value, net change, and deterministic trend direction.
        """
        unit = "°C" if param_name == "temperature" else ("PSU" if param_name == "salinity" else "")
        if not trend_data or len(trend_data) < 2:
            return {
                "start_period": trend_data[0]["period"] if trend_data else "N/A",
                "start_value": trend_data[0]["observed"] if trend_data else None,
                "end_period": trend_data[-1]["period"] if trend_data else "N/A",
                "end_value": trend_data[-1]["observed"] if trend_data else None,
                "change": 0.0,
                "trend_direction": "Relatively Stable",
                "unit": unit,
                "data_points": len(trend_data)
            }

        start_pt = trend_data[0]
        end_pt = trend_data[-1]
        start_val = start_pt["observed"]
        end_val = end_pt["observed"]
        delta = round(float(end_val - start_val), 2)

        thresh = 0.10 if param_name == "temperature" else 0.05
        if delta > thresh:
            direction = "Increasing"
        elif delta < -thresh:
            direction = "Decreasing"
        else:
            direction = "Relatively Stable"

        return {
            "start_period": start_pt["period"],
            "start_value": start_val,
            "end_period": end_pt["period"],
            "end_value": end_val,
            "change": delta,
            "unit": unit,
            "trend_direction": direction,
            "data_points": len(trend_data)
        }


# Module singleton
analysis_engine = OceanAnalysisEngine()

