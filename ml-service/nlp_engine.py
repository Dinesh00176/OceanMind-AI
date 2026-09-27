"""
ARGO Oceanographic NLP Engine
Converts natural-language queries into structured execution specifications.
Supports intent recognition across three distinct modes:
1. ARGO Data Analysis (Numerical Truth from observations)
2. RAG Knowledge (Document/literature knowledge with citations)
3. Hybrid Data + RAG (Observational numerical truth combined with physical explanation)

Strictly prevents silent context leakage, handles multi-parameter extraction,
temporal resolution, depth stratification, and ambiguity detection.
"""

import re
from typing import Dict, Any, Optional, List

# Ocean basin bounding boxes [min_lat, max_lat, min_lon, max_lon]
OCEAN_BOUNDING_BOXES = {
    "Indian Ocean": [-45.0, 30.0, 20.0, 120.0],
    "Arabian Sea": [8.0, 26.0, 50.0, 77.5],
    "Bay of Bengal": [5.0, 23.0, 80.0, 98.0],
    "Pacific Ocean": [-55.0, 60.0, 120.0, -70.0],
    "Equatorial Pacific": [-10.0, 10.0, 140.0, -80.0],
    "Atlantic Ocean": [-50.0, 65.0, -80.0, 20.0],
    "North Atlantic": [10.0, 65.0, -80.0, 0.0],
    "Southern Ocean": [-75.0, -50.0, -180.0, 180.0],
}

# Coastal reference landmarks mapped to approximate coordinates and bounding boxes
COASTAL_LANDMARKS = {
    "chennai": {
        "region": "Bay of Bengal",
        "lat": 13.08,
        "lon": 80.27,
        "bounds": [10.0, 16.0, 78.0, 84.0],
        "name": "near Chennai (Bay of Bengal)"
    },
    "mumbai": {
        "region": "Arabian Sea",
        "lat": 18.92,
        "lon": 72.83,
        "bounds": [15.0, 22.0, 70.0, 75.5],
        "name": "near Mumbai (Arabian Sea)"
    },
    "kochi": {
        "region": "Arabian Sea",
        "lat": 9.93,
        "lon": 76.26,
        "bounds": [7.0, 12.0, 73.0, 78.0],
        "name": "near Kochi (SE Arabian Sea)"
    },
    "goa": {
        "region": "Arabian Sea",
        "lat": 15.29,
        "lon": 73.98,
        "bounds": [13.0, 17.5, 71.0, 75.5],
        "name": "near Goa (Arabian Sea)"
    },
    "kolkata": {
        "region": "Bay of Bengal",
        "lat": 22.57,
        "lon": 88.36,
        "bounds": [18.0, 22.5, 86.0, 92.0],
        "name": "near Kolkata (Northern Bay of Bengal)"
    },
    "colombo": {
        "region": "Indian Ocean",
        "lat": 6.92,
        "lon": 79.86,
        "bounds": [4.0, 10.0, 77.0, 83.0],
        "name": "near Colombo (Sri Lanka / Indian Ocean)"
    }
}

class OceanNlpEngine:
    def __init__(self):
        self.param_patterns = {
            "temperature": r"\b(temp|temperature|temperatures|thermal|warmth|heat|sst)\b",
            "salinity": r"\b(salinity|salinities|salt|psu|haline|saline)\b",
            "pressure": r"\b(pressure|pres|dbar|decibar)\b",
            "depth": r"\b(depth|depths|bathymetry)\b",
            "dissolved_oxygen": r"\b(oxygen|dissolved oxygen|doxy|o2|hypoxia)\b"
        }

    def parse_query(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Converts a user natural language query into a structured query object.
        Accurately routes between Data Analysis (Mode 1), RAG Knowledge (Mode 2), and Hybrid (Mode 3).
        """
        q = query.strip()
        q_lower = q.lower()

        # Check domain relevance guardrail
        if self._is_unrelated(q_lower, context):
            return {
                "intent": "unrelated",
                "valid": False,
                "requiresRAG": False,
                "requiresDataAnalysis": False,
                "requiresClarification": False,
                "missingFields": [],
                "message": "I am an oceanographic AI assistant specialized in ARGO float observations, physical oceanography (temperature, salinity, pressure), and marine data analysis. Please ask an oceanographic or ARGO-related question."
            }

        # Determine if query explicitly refers to previous conversation context (anaphoric)
        is_context_ref = self._has_context_reference(q_lower)

        # -----------------------------------------------------------------
        # 1. Detect Mode 2 (RAG Knowledge) vs Mode 3 (Hybrid) vs Mode 1 (Data)
        # -----------------------------------------------------------------
        explanation_triggers = [
            r"\b(why is|why does|why are|why was|explain why|how come|cause of|reasons? for|mechanism of|what causes)\b",
            r"\b(why is it|why temperature decreases|why does temperature decrease)\b"
        ]
        has_explanation_request = any(re.search(pat, q_lower) for pat in explanation_triggers)

        knowledge_triggers = [
            r"\b(what is an argo float|what is argo float|what are argo floats|what is argo)\b",
            r"\b(how does an? argo float work|how do argo floats work|how does it work)\b",
            r"\b(what is (gdac|dac|dacs|the argo data system|argo data management))\b",
            r"\b(how does argo measure|how do floats measure)\b",
            r"\b(what are argo quality-control|what is quality control|quality control procedures|qc flags?)\b",
            r"\b(explain the importance|importance of argo|why is argo important)\b",
            r"\b(what is (a )?(thermocline|halocline|pycnocline|ctd|buoyancy engine|10-day cycle))\b",
            r"\b(what are (delayed mode|real time) quality controls?)\b"
        ]
        is_pure_knowledge_question = any(re.search(pat, q_lower) for pat in knowledge_triggers)

        # Check explicit observational depth or measurement numbers (e.g. "at 500m", "500 meters", "is 2.34°C", "in the bay of bengal")
        has_numerical_observation = bool(
            re.search(r"\b(\d{1,4}\s*(?:m|meters?|dbar)|is\s+\d+(\.\d+)?\s*(?:°c|c|psu))\b", q_lower) or
            re.search(r"\b(average|profile|trend|compare|observations? near|in 2024|during \d{4})\b", q_lower)
        )

        # Determine core query mode
        if has_explanation_request and has_numerical_observation:
            intent = "hybrid"
            requires_rag = True
            requires_data_analysis = True
        elif is_pure_knowledge_question or (has_explanation_request and not has_numerical_observation):
            intent = "knowledge"
            requires_rag = True
            requires_data_analysis = False
        else:
            intent = None
            requires_rag = False
            requires_data_analysis = True

        # -----------------------------------------------------------------
        # 2. Multi-Parameter extraction
        # -----------------------------------------------------------------
        parameters = []
        for param, pattern in self.param_patterns.items():
            if param != "depth" and re.search(pattern, q_lower):
                parameters.append(param)

        # Context inheritance for parameters only if query refers to context
        if not parameters and is_context_ref and context and context.get("parameters"):
            parameters = list(context.get("parameters"))
        elif not parameters and is_context_ref and context and context.get("parameter"):
            parameters = [context.get("parameter")]
        
        # Default parameter if none specified
        if not parameters:
            if any(w in q_lower for w in ["salin", "salt", "psu"]):
                parameters = ["salinity"]
            else:
                parameters = ["temperature"]

        primary_parameter = parameters[0] if parameters else "temperature"

        # -----------------------------------------------------------------
        # 3. Region & Coastal Location extraction
        # -----------------------------------------------------------------
        regions = []
        landmark_info = None
        bounds = None

        # Check coastal landmarks first
        for landmark_key, info in COASTAL_LANDMARKS.items():
            if re.search(r"\b" + landmark_key + r"\b", q_lower):
                landmark_info = info
                regions.append(info["region"])
                bounds = info["bounds"]
                break

        # Check major ocean basins by order of appearance in query
        basin_matches = []
        for basin in ["Arabian Sea", "Bay of Bengal", "Indian Ocean", "Pacific Ocean", "Atlantic Ocean", "Southern Ocean"]:
            m = re.search(r"\b" + basin.lower() + r"\b", q_lower)
            if m:
                basin_matches.append((m.start(), basin))
        basin_matches.sort(key=lambda x: x[0])
        for _, basin in basin_matches:
            if basin not in regions:
                regions.append(basin)

        # Context inheritance for regions ONLY if query explicitly refers to context or is a fragment
        if is_context_ref and context and context.get("region"):
            prev_region = context.get("region")
            if re.search(r"\b(compare|versus|vs|difference)\b", q_lower) and prev_region not in regions:
                regions.insert(0, prev_region)
            elif not regions:
                regions = [prev_region]
                bounds = context.get("bounds")

        primary_region = regions[0] if regions else None
        if primary_region and not bounds:
            bounds = OCEAN_BOUNDING_BOXES.get(primary_region)

        # -----------------------------------------------------------------
        # 4. Data Operation & Intent Refinement (for Mode 1 and Mode 3)
        # -----------------------------------------------------------------
        is_prediction = bool(re.search(r"\b(predict|prediction|forecast|forecasting|project|future|next \d+ (months|years)|trend prediction)\b", q_lower))
        is_profile = bool(re.search(r"\b(profile|profiles|vertical profile|water column|depth profile|different depths|vs depth)\b", q_lower))
        is_map = bool(re.search(r"\b(map|where|locations?|pins|coordinates|spatial|distribution|observations?)\b", q_lower)) and not is_profile
        is_compare = len(regions) >= 2 or bool(re.search(r"\b(compare|comparison|versus|vs|difference between)\b", q_lower))
        is_trend = bool(re.search(r"\b(trend|trends|change|changed|evolution|over time|variability|over the last)\b", q_lower)) and not is_prediction

        if intent not in ["knowledge", "hybrid"]:
            if is_prediction:
                intent = "prediction"
                operation = "forecast"
                aggregation = "forecast"
            elif is_compare:
                intent = "comparison"
                operation = "compare"
                aggregation = "mean"
            elif is_profile:
                intent = "profile"
                operation = "depth_profile"
                aggregation = "profile"
            elif is_trend:
                intent = "trend"
                operation = "trend"
                aggregation = "trend"
            elif is_map:
                intent = "spatial_map"
                operation = "map"
                aggregation = "none"
            elif re.search(r"\b(average|mean|avg)\b", q_lower) or re.search(r"\bwhat (is|was) the (average|mean|sea temperature|temperature|salinity)\b", q_lower):
                intent = "average"
                operation = "average"
                aggregation = "mean"
            elif re.search(r"\b(max|maximum|highest)\b", q_lower):
                intent = "statistics"
                operation = "max"
                aggregation = "max"
            elif re.search(r"\b(min|minimum|lowest)\b", q_lower):
                intent = "statistics"
                operation = "min"
                aggregation = "min"
            else:
                intent = "average" if not is_map else "spatial_map"
                operation = "average"
                aggregation = "mean"
        else:
            operation = "hybrid_analysis" if intent == "hybrid" else "knowledge_retrieval"
            aggregation = "mean" if intent == "hybrid" else "none"

        # -----------------------------------------------------------------
        # 5. Depth extraction
        # -----------------------------------------------------------------
        depth_val = None
        depth_min = None
        depth_max = None
        depth_is_default = False
        depth_label = None

        if is_profile:
            depth_label = "Vertical water column (0–2000m)"
        elif intent == "knowledge":
            depth_label = "N/A (Conceptual Knowledge)"
        else:
            # Check explicit depth e.g. "500m", "at 500 meters", "depth of 500 m", "at 500m depth"
            depth_match = re.search(r"\b(?:at|depth of)?\s*(\d{1,4})\s*(?:m|meters?|dbar)\b", q_lower)
            if depth_match:
                depth_val = int(depth_match.group(1))
                depth_label = f"{depth_val}m"
            elif re.search(r"\b(surface|sea surface|upper layer|0m)\b", q_lower):
                depth_val = 0
                depth_label = "Surface layer (0m)"
            elif re.search(r"between\s+(\d+)\s*(?:m|meters?)?\s+and\s+(\d+)\s*(?:m|meters?)", q_lower):
                d_match = re.search(r"between\s+(\d+)\s*(?:m|meters?)?\s+and\s+(\d+)\s*(?:m|meters?)", q_lower)
                depth_min = int(d_match.group(1))
                depth_max = int(d_match.group(2))
                depth_label = f"{depth_min}–{depth_max}m"
            elif is_context_ref and context and context.get("depth") is not None:
                # Inherit depth ONLY if query explicitly refers to previous context (anaphoric)
                depth_val = context.get("depth")
                depth_label = f"{depth_val}m"
            else:
                # Standalone query without depth: default to surface layer 0m with explicit disclosure
                depth_val = 0
                depth_is_default = True
                depth_label = "Surface layer (0m) [Default: Not specified in query]"

        depth_obj = {
            "value": depth_val,
            "unit": "m",
            "isDefault": depth_is_default,
            "isProfile": is_profile,
            "min": depth_min,
            "max": depth_max,
            "label": depth_label
        }

        # -----------------------------------------------------------------
        # 6. Time Range Extraction
        # -----------------------------------------------------------------
        time_range = self._extract_time_range(q_lower, is_context_ref, context)

        # -----------------------------------------------------------------
        # 7. Float ID extraction
        # -----------------------------------------------------------------
        float_id = None
        float_match = re.search(r"\bfloat\s*(?:id|number|#)?\s*([0-9]{7})\b", q_lower)
        if float_match:
            float_id = float_match.group(1)

        # -----------------------------------------------------------------
        # 8. Ambiguity & Clarification detection
        # -----------------------------------------------------------------
        is_ambiguous = False
        clarification_message = None
        missing_fields = []

        if intent not in ["knowledge", "hybrid"]:
            if not primary_region and not landmark_info and not float_id and len(regions) == 0:
                if not is_map and q_lower in ["show ocean conditions", "show temperature", "what is salinity", "show data", "ocean conditions"]:
                    is_ambiguous = True
                    missing_fields.append("region")
                    clarification_message = "Which ocean region or depth layer would you like to analyze? You can specify the Indian Ocean, Arabian Sea, Bay of Bengal, Pacific, or Atlantic Ocean."

        # -----------------------------------------------------------------
        # 9. Visualization mapping
        # -----------------------------------------------------------------
        if intent == "knowledge":
            visualization = "none"
        else:
            visualization = self._determine_visualization(intent, is_profile, is_prediction, is_compare, is_map, is_trend)

        default_region = "Indian Ocean" if not float_id and not is_ambiguous and intent != "knowledge" else None
        final_region = primary_region or default_region

        return {
            "valid": True,
            "intent": intent,
            "operation": operation,
            "parameters": parameters,
            "parameter": primary_parameter,
            "regions": regions if regions else ([final_region] if final_region else []),
            "region": final_region,
            "landmark": landmark_info,
            "bounds": bounds,
            "compare_regions": regions if len(regions) >= 2 else None,
            "depth": depth_obj,
            "depth_val": depth_val,
            "depth_obj": depth_obj,
            "timeRange": time_range,
            "time_range": time_range,
            "start_year": time_range.get("start_year"),
            "end_year": time_range.get("end_year"),
            "float_id": float_id,
            "aggregation": aggregation,
            "visualization": visualization,
            "requiresRAG": requires_rag,
            "requiresDataAnalysis": requires_data_analysis,
            "requiresClarification": is_ambiguous,
            "missingFields": missing_fields,
            "is_prediction": is_prediction,
            "forecast_months": 12 if is_prediction else 0,
            "is_ambiguous": is_ambiguous,
            "clarification_message": clarification_message,
            "raw_query": query
        }

    def _extract_time_range(self, q_lower: str, is_context_ref: bool, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extracts temporal boundaries from natural language expressions.
        """
        # Exact year, e.g. "during 2024", "in 2024", "for 2024"
        single_year_match = re.search(r"\b(?:in|during|for)\s+(\d{4})\b", q_lower)
        if single_year_match:
            year = int(single_year_match.group(1))
            return {
                "start": f"{year}-01-01T00:00:00.000Z",
                "end": f"{year}-12-31T23:59:59.999Z",
                "start_year": year,
                "end_year": year,
                "type": "exact_year",
                "isDefault": False,
                "label": str(year)
            }

        # Between year and year, e.g. "between 2022 and 2025"
        between_match = re.search(r"between\s+(\d{4})\s+and\s+(\d{4})", q_lower)
        if between_match:
            y1 = int(between_match.group(1))
            y2 = int(between_match.group(2))
            startY = min(y1, y2)
            endY = max(y1, y2)
            return {
                "start": f"{startY}-01-01T00:00:00.000Z",
                "end": f"{endY}-12-31T23:59:59.999Z",
                "start_year": startY,
                "end_year": endY,
                "type": "year_range",
                "isDefault": False,
                "label": f"{startY}–{endY}"
            }

        # Relative years, e.g. "last 5 years", "past 3 years"
        last_years_match = re.search(r"(?:last|past)\s+(\d+)\s+years?", q_lower)
        if last_years_match:
            num_years = int(last_years_match.group(1))
            endY = 2025
            startY = max(2018, endY - num_years)
            return {
                "start": f"{startY}-01-01T00:00:00.000Z",
                "end": f"{endY}-12-31T23:59:59.999Z",
                "start_year": startY,
                "end_year": endY,
                "type": "relative_years",
                "isDefault": False,
                "label": f"Last {num_years} years ({startY}–{endY})"
            }

        # Context inheritance if anaphoric
        if is_context_ref and context and context.get("start_year"):
            sy = context.get("start_year")
            ey = context.get("end_year")
            return {
                "start": f"{sy}-01-01T00:00:00.000Z",
                "end": f"{ey}-12-31T23:59:59.999Z",
                "start_year": sy,
                "end_year": ey,
                "type": "context_inherited",
                "isDefault": False,
                "label": f"{sy}–{ey}"
            }

        # Default: Full observational range
        return {
            "start": "2018-01-01T00:00:00.000Z",
            "end": "2025-12-31T23:59:59.999Z",
            "start_year": 2018,
            "end_year": 2025,
            "type": "all_available",
            "isDefault": True,
            "label": "2018–2025 (Full observational history)"
        }

    def _has_context_reference(self, q_lower: str) -> bool:
        """
        Determines if the query explicitly refers to previous context (anaphoric reference).
        A full, complete sentence without anaphoric pronouns does NOT inherit previous state.
        """
        anaphora = [
            r"\b(it|that|this|same|also|again|there)\b",
            r"\b(now show|now compare|what about|how about|now at)\b",
            r"\b(at that depth|same depth|in that region|same region)\b"
        ]
        if any(re.search(pat, q_lower) for pat in anaphora):
            return True

        # Short fragments e.g. "Now show 1000 meters", "Compare with Pacific"
        words = q_lower.split()
        if len(words) <= 4 and any(w in words for w in ["now", "compare", "meters", "depth"]):
            return True

        return False

    def _determine_visualization(self, intent: str, is_profile: bool, is_prediction: bool, 
                                 is_compare: bool, is_map: bool, is_trend: bool) -> str:
        if is_map or intent == "spatial_map":
            return "interactive_map"
        if is_profile or intent == "profile":
            return "depth_profile"
        if is_compare or intent == "comparison":
            return "regional_bar"
        if is_prediction or intent == "prediction":
            return "time_series_forecast"
        if is_trend or intent == "trend":
            return "time_series"
        return "time_series"

    def _is_unrelated(self, text: str, context: Optional[Dict[str, Any]] = None) -> bool:
        unrelated_triggers = [
            r"\b(cook|cooking|bake|baking|cake|recipe|food|football|cricket|crypto|bitcoin|stock market|movie|actor|song|lyrics|joke|poem)\b",
            r"\b(who is the president|write python code|binary tree|solve math|capital of|tell me a story)\b"
        ]
        if any(re.search(trig, text) for trig in unrelated_triggers):
            return True

        if context and (context.get("region") or context.get("parameter")):
            return False

        ocean_keywords = [
            "ocean", "sea", "temp", "thermal", "salin", "argo", "float", "depth", "pressure",
            "dbar", "water", "marine", "basin", "profile", "omz", "oxygen", "chennai", "mumbai",
            "kochi", "atlantic", "pacific", "indian", "bengal", "arabian", "meter", "meters", "psu", "ctd",
            "gdac", "dac", "buoyancy", "quality control", "qc", "thermocline", "halocline"
        ]
        has_ocean_keyword = any(kw in text for kw in ocean_keywords)
        if not has_ocean_keyword and len(text.split()) > 3:
            return True

        return False


# Module singleton
nlp_engine = OceanNlpEngine()
