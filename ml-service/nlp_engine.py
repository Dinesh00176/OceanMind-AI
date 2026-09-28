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

        # Determine if query explicitly refers to previous conversation context (anaphoric)
        is_context_ref = self._has_context_reference(q_lower)

        # Check domain relevance guardrail
        if self._is_unrelated(q_lower, context, is_context_ref):
            print(f"\n[NLP]\nQuery: {query}\nIntent: unrelated\nMode: 0\nRequires RAG: false\nRequires Data Analysis: false\nContext Inheritance: false\nActive Context: None\n")
            return {
                "intent": "unrelated",
                "valid": False,
                "requiresRAG": False,
                "requiresDataAnalysis": False,
                "requiresClarification": False,
                "missingFields": [],
                "message": "I am an oceanographic AI assistant specialized in ARGO float observations, physical oceanography (temperature, salinity, pressure), and marine data analysis. Please ask an oceanographic or ARGO-related question."
            }

        # Initialize ambiguity fields
        is_ambiguous = False
        clarification_message = None
        missing_fields = []

        # -----------------------------------------------------------------
        # 1. Detect Mode 2 (Knowledge) vs Mode 3 (Hybrid) vs Mode 1 (Data)
        # -----------------------------------------------------------------
        
        # Check explanation / causal questions
        explanation_triggers = [
            r"\b(why is|why does|why are|why was|explain why|how come|cause of|reasons? for|mechanism of|what causes)\b",
            r"\b(why temperature decreases|why does temperature decrease|why is ocean temperature lower|why is it colder)\b",
            r"\b(explain the importance|importance of|why is argo important|role of argo in)\b"
        ]
        has_explanation_request = any(re.search(pat, q_lower) for pat in explanation_triggers)

        # Check pure knowledge topics (Program, Float operation, Data system, Quality Control, Sensors, Conceptual)
        is_pure_knowledge = self._is_pure_knowledge_query(q_lower, context, is_context_ref)

        # Check explicit regional constraints in query
        explicit_regions = self._extract_explicit_regions(q_lower)
        has_regional_constraint = len(explicit_regions) > 0

        # Extract float_id early
        float_id = None
        float_match = re.search(r"\bfloat\s*(?:id|number|#)?\s*([0-9]{7})\b", q_lower)
        if float_match:
            float_id = float_match.group(1)

        # Check explicit observational data operations or filters
        has_data_operation = bool(
            re.search(r"\b(average|mean|avg|max|maximum|min|minimum|profile|vertical profile|water column|trend|forecast|predict|prediction|spatial map|pins|locations|records|data near)\b", q_lower) or
            re.search(r"\b(between \d{4} and \d{4}|in 20\d\d|during 20\d\d|past \d+ years|last \d+ years)\b", q_lower) or
            float_id is not None
        )

        # Explicit numerical depth request for observational data (e.g. "at 500m", "500 meters depth", "at 1000m")
        # Excludes conceptual float depth phrases like "parking depth", "why 1000m", "why does the float park at 1000m"
        has_obs_depth = bool(
            re.search(r"\b(?:at|depth of)\s*\d{1,4}\s*(?:m|meters?|dbar)\b", q_lower) and
            not re.search(r"\b(parking|float park|cycle|dive to)\b", q_lower)
        )

        # Multi-basin comparison request
        is_basin_comparison = len(explicit_regions) >= 2 or bool(
            re.search(r"\b(compare|comparison|versus|vs|difference between)\b", q_lower) and
            (has_regional_constraint or (is_context_ref and context and context.get("region")))
        )

        # -----------------------------------------------------------------
        # Routing Decision
        # -----------------------------------------------------------------
        if has_explanation_request and (has_regional_constraint or is_basin_comparison or has_obs_depth):
            # Hybrid Mode 3: User is asking for both observational data in a region/depth and physical explanation
            intent = "hybrid"
            mode = 3
            requires_rag = True
            requires_data_analysis = True
        elif is_pure_knowledge:
            # Knowledge Mode 2: Pure conceptual, operational, structural, or programmatic question
            intent = "knowledge"
            mode = 2
            requires_rag = True
            requires_data_analysis = False
        elif has_explanation_request and not has_regional_constraint and not has_data_operation:
            # Pure physical oceanography question without specific observational request (e.g. "Why is 500m colder?")
            intent = "knowledge"
            mode = 2
            requires_rag = True
            requires_data_analysis = False
        else:
            # Data Mode 1: Observational analysis, profiles, trends, forecasts, maps, averages
            mode = 1
            requires_rag = False
            requires_data_analysis = True
            intent = None

        # -----------------------------------------------------------------
        # 2. Parameter Extraction
        # -----------------------------------------------------------------
        parameters = []
        if mode == 2:
            # Mode 2 is pure knowledge: DO NOT populate numerical observational parameters
            parameters = []
            primary_parameter = None
        else:
            for param, pattern in self.param_patterns.items():
                if param != "depth" and re.search(pattern, q_lower):
                    parameters.append(param)

            # Context inheritance for parameters ONLY if query explicitly refers to context
            if not parameters and is_context_ref and context and context.get("parameters"):
                parameters = list(context.get("parameters"))
            elif not parameters and is_context_ref and context and context.get("parameter"):
                parameters = [context.get("parameter")]
            
            # Default parameter for Data or Hybrid queries
            if not parameters:
                if any(w in q_lower for w in ["salin", "salt", "psu"]):
                    parameters = ["salinity"]
                else:
                    parameters = ["temperature"]

            primary_parameter = parameters[0] if parameters else "temperature"

        # -----------------------------------------------------------------
        # 3. Region Extraction
        # -----------------------------------------------------------------
        regions = []
        landmark_info = None
        bounds = None
        context_inherited = False

        if mode == 2:
            # Mode 2 is pure knowledge: NEVER inherit or default ocean region!
            regions = []
            primary_region = None
            final_region = None
        else:
            # Check coastal landmarks first
            for landmark_key, info in COASTAL_LANDMARKS.items():
                if re.search(r"\b" + landmark_key + r"\b", q_lower):
                    landmark_info = info
                    regions.append(info["region"])
                    bounds = info["bounds"]
                    break

            # Add explicit ocean basins in query order
            for r in explicit_regions:
                if r not in regions:
                    regions.append(r)

            # Context inheritance for region ONLY if query explicitly refers to context (anaphoric)
            # Standalone queries (e.g., "What is the temperature in the Arabian Sea?") do NOT inherit previous region!
            if is_context_ref and context and context.get("region"):
                prev_region = context.get("region")
                if re.search(r"\b(compare|versus|vs|difference)\b", q_lower) and prev_region not in regions:
                    regions.insert(0, prev_region)
                    context_inherited = True
                elif not regions:
                    regions = [prev_region]
                    bounds = context.get("bounds")
                    context_inherited = True

            primary_region = regions[0] if regions else None
            if primary_region and not bounds:
                bounds = OCEAN_BOUNDING_BOXES.get(primary_region)

            # Check for generalized ocean queries lacking a specific basin (e.g. "the temp at ocean", "ocean temperature")
            generalized_ocean_patterns = [
                r"\b(the\s+)?(temp|temperature|salinity|conditions?|heat|warmth)\s+(at|in|of|for)?\s*(the\s+)?(ocean|sea)\b",
                r"\b(ocean|sea)\s+(temp|temperature|salinity|conditions?)\b",
                r"\bwhat (is|was) the (temp|temperature|salinity)\s+(at|in|of)\s+(the\s+)?(ocean|sea)\b",
                r"\bwhat (is|was) the (ocean|sea) (temp|temperature|salinity)\b",
                r"\b(average|mean)\s+(temp|temperature|salinity)\s+(at|in|of)?\s*(the\s+)?(ocean|sea)\b",
                r"\b(the\s+)?temp\s+(at|in|of)\s+(the\s+)?(ocean|sea)\b",
                r"\btemperature\s+(at|in|of)\s+(the\s+)?(ocean|sea)\b",
                r"\b(the\s+)?salinity\s+(at|in|of)\s+(the\s+)?(ocean|sea)\b",
                r"\bshow\s+(the\s+)?(temp|temperature|salinity|ocean conditions?|data)\b",
                r"\b(ocean conditions?|show ocean conditions|show temperature|show data)\b"
            ]
            is_generalized_ocean = any(re.search(pat, q_lower) for pat in generalized_ocean_patterns)

            # If user asks a generalized question without specifying an ocean basin, do NOT default to Indian Ocean
            if is_generalized_ocean and not primary_region and not landmark_info and not float_id and not has_obs_depth:
                default_region = None
                final_region = None
                is_ambiguous = True
                missing_fields = ["region"]
                clarification_message = "Which ocean region or depth layer would you like to analyze? You can specify the Indian Ocean, Arabian Sea, Bay of Bengal, Pacific, or Atlantic Ocean."
            else:
                # Default region for Mode 1 or Mode 3 if none specified: Indian Ocean
                default_region = "Indian Ocean" if not landmark_info and mode != 2 else None
                final_region = primary_region or default_region

        # -----------------------------------------------------------------
        # 4. Data Operation & Intent Refinement (for Mode 1)
        # -----------------------------------------------------------------
        is_prediction = False
        is_profile = False
        is_map = False
        is_compare = False
        is_trend = False

        if mode == 1:
            is_prediction = bool(re.search(r"\b(predict|prediction|forecast|forecasting|project|future|next \d+ (months|years)|trend prediction)\b", q_lower))
            is_profile = bool(re.search(r"\b(profile|profiles|vertical profile|water column|depth profile|different depths|vs depth)\b", q_lower))
            is_map = bool(re.search(r"\b(map|where|locations?|pins|coordinates|spatial|distribution|observations?)\b", q_lower)) and not is_profile
            is_compare = len(regions) >= 2 or bool(re.search(r"\b(compare|comparison|versus|vs|difference between)\b", q_lower))
            is_trend = bool(re.search(r"\b(trend|trends|change|changed|evolution|over time|variability|over the last)\b", q_lower)) and not is_prediction

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
        elif mode == 2:
            operation = "knowledge_retrieval"
            aggregation = "none"
        else: # Mode 3 (Hybrid)
            operation = "hybrid_analysis"
            aggregation = "mean"

        # -----------------------------------------------------------------
        # 5. Depth Extraction
        # -----------------------------------------------------------------
        depth_val = None
        depth_min = None
        depth_max = None
        depth_is_default = False
        depth_label = None
        depth_obj = None

        if mode == 2:
            # Mode 2 is pure knowledge: NO numerical observational depth!
            depth_label = "N/A (Conceptual Knowledge)"
            depth_obj = None
        elif is_profile:
            depth_label = "Vertical water column (0–2000m)"
            depth_obj = {
                "value": None,
                "unit": "m",
                "isDefault": False,
                "isProfile": True,
                "min": 0,
                "max": 2000,
                "label": depth_label
            }
        else:
            # Check explicit depth in query
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
                context_inherited = True
            else:
                # Standalone query without depth: default to surface layer 0m with explicit disclosure
                # DO NOT leak previous depth from context!
                depth_val = 0
                depth_is_default = True
                depth_label = "Surface layer (0m) [Default: Not specified in query]"

            depth_obj = {
                "value": depth_val,
                "unit": "m",
                "isDefault": depth_is_default,
                "isProfile": False,
                "min": depth_min,
                "max": depth_max,
                "label": depth_label
            }

        # -----------------------------------------------------------------
        # 6. Time Range Extraction
        # -----------------------------------------------------------------
        if mode == 2:
            time_range = None
        else:
            time_range = self._extract_time_range(q_lower, is_context_ref, context)

        # -----------------------------------------------------------------
        # 7. Float ID Extraction
        # -----------------------------------------------------------------
        float_id = None
        if mode != 2:
            float_match = re.search(r"\bfloat\s*(?:id|number|#)?\s*([0-9]{7})\b", q_lower)
            if float_match:
                float_id = float_match.group(1)

        # -----------------------------------------------------------------
        # 8. Ambiguity & Clarification Detection
        # -----------------------------------------------------------------
        if not is_ambiguous and mode == 1:
            if not primary_region and not landmark_info and not float_id and len(regions) == 0 and not has_obs_depth:
                if not is_map and (is_generalized_ocean or q_lower in ["show ocean conditions", "show temperature", "show data", "ocean conditions"]):
                    is_ambiguous = True
                    missing_fields.append("region")
                    clarification_message = "Which ocean region or depth layer would you like to analyze? You can specify the Indian Ocean, Arabian Sea, Bay of Bengal, Pacific, or Atlantic Ocean."

        if is_ambiguous:
            requires_data_analysis = False
            visualization = "none"
            active_context = "Region Clarification Needed"

        # -----------------------------------------------------------------
        # 9. Visualization Mapping & Active Context Label
        # -----------------------------------------------------------------
        if mode == 2:
            visualization = "none"
            active_context = "Global / ARGO Knowledge"
        elif mode == 3:
            visualization = "time_series"
            active_context = f"{final_region} @ {depth_val if depth_val is not None else 500}m • {primary_parameter} (Hybrid)"
        else:
            visualization = self._determine_visualization(intent, is_profile, is_prediction, is_compare, is_map, is_trend)
            depth_str = f" @ {depth_val}m" if depth_val is not None else ""
            active_context = f"{final_region}{depth_str} • {primary_parameter}"

        # Structured Development Log (Section 39)
        print(f"\n[NLP]\nQuery: {query}\nIntent: {intent}\nMode: {mode}\nRequires RAG: {str(requires_rag).lower()}\nRequires Data Analysis: {str(requires_data_analysis).lower()}\nContext Inheritance: {str(context_inherited).lower()}\nActive Context: {active_context}\n")

        return {
            "valid": True,
            "intent": intent,
            "mode": mode,
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
            "start_year": time_range.get("start_year") if time_range else None,
            "end_year": time_range.get("end_year") if time_range else None,
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
            "context_inherited": context_inherited,
            "active_context": active_context,
            "raw_query": query
        }

    def _is_pure_knowledge_query(self, q_lower: str, context: Optional[Dict[str, Any]], is_context_ref: bool) -> bool:
        """
        Determines whether a natural-language question represents a pure RAG knowledge query.
        Covers the ARGO program, float operation/buoyancy mechanisms, data systems,
        quality control, sensor technology, conceptual parameter definitions, and climate importance.
        """
        # Follow-up query in an active knowledge context
        if is_context_ref and context and (context.get("intent") == "knowledge" or context.get("mode") == 2):
            if any(w in q_lower for w in ["it", "this", "that", "move", "work", "sink", "ascend", "measure", "send", "cycle", "where", "why", "how"]):
                return True

        knowledge_patterns = [
            # 1. ARGO program, mission, history, array scale, sponsors, Deep/BGC Argo
            r"\b(what is (the )?argo program|what is argo\b|tell me about argo\b|overview of argo|history of argo|argo mission|who sponsors argo)\b",
            r"\b(what does argo stand for|what does argo mean|global observing array|how many (argo )?floats (are there|exist|in the ocean|deployed))\b",
            r"\b(deep argo|bgc-argo|biogeochemical argo)\b",

            # 2. Float operation, mechanics, buoyancy engine, movement, 10-day cycle
            r"\b(what is an? argo float|what are argo floats|what is a float\b|tell me about (the )?argo floats?)\b",
            r"\bhow does (an? argo float|the float|a float|it) work\b",
            r"\bhow (does|do) (the float|argo floats?|floats?|it) (move|sink|ascend|dive|rise|come back to the surface|surface|reach the surface|control buoyancy)\b",
            r"\bwhy (does|do) (the float|argo floats?|floats?|it) (go deeper|sink|ascend|dive|park|descend|drop)\b",
            r"\b(variable buoyancy engine|buoyancy engine|buoyancy mechanism|hydraulic pump|external (rubber )?bladder|internal (oil )?reservoir|mineral oil)\b",
            r"\b(10-day cycle|profiling cycle|parking depth|why 1000m|operational lifespan|battery lifespan)\b",

            # 3. Data management, GDAC, DAC, NetCDF, telemetry
            r"\b(what is (gdac|dac|dacs|the argo data system|argo data management|argo data pipeline))\b",
            r"\b(coriolis|fnmoc|incois|aoml)\b(?=.*\b(gdac|dac|data|center|role)\b)",
            r"\b(what is gdac|what are gdacs|what is a dac|what are dacs)\b",
            r"\b(real-time data vs delayed-mode data|difference between rt and dm|what is netcdf|how do floats transmit data|satellite telemetry|iridium antenna)\b",

            # 4. Quality Control, RTQC, DMQC, 19 tests, flags
            r"\b(what are argo quality-control|what is (argo )?qc|argo quality control|qc procedures|qc flags?|quality control procedures|flag scale)\b",
            r"\b(what is (rtqc|dmqc|real-time qc|delayed-mode qc))\b",
            r"\b(19 (automated )?tests|owens and wong|wjo method|sensor drift correction|spike test|density inversion)\b",

            # 5. Sensors & measurement rationale / concepts
            r"\b(what is ctd|what are ctd sensors?|ctd sensor|sbe-41|sbe41|seabird)\b",
            r"\bwhy (does argo|do floats|does the float|measure) (salinity|temperature|pressure)\b",
            r"\bwhy (is )?salinity (measured|important)\b",
            r"\bwhat sensors? (do|does|are on) (the |argo )?floats?\b",
            r"\bhow does argo measure (salinity|temperature|pressure)\b",
            r"\bwhat is salinity\b",
            r"\bwhat is (a )?(thermocline|halocline|pycnocline|barrier layer)\b",

            # 6. Scientific Importance, climate research, ocean heat, weather
            r"\b(why is argo important|importance of argo|benefit of argo|why do we need argo|role of argo in climate|climate research)\b",
            r"\b(ocean heat content|ohc|thermosteric sea level rise|earth'?s energy imbalance)\b",
            r"\bhow does argo (help|contribute to|support) (monsoon|cyclone|weather forecasting)\b"
        ]

        return any(re.search(pat, q_lower) for pat in knowledge_patterns)

    def _extract_explicit_regions(self, q_lower: str) -> List[str]:
        """Extracts all explicit ocean basins mentioned in query in order of appearance."""
        basin_candidates = [
            "Arabian Sea", "Bay of Bengal", "Indian Ocean", 
            "Pacific Ocean", "Equatorial Pacific", "Atlantic Ocean", 
            "North Atlantic", "Southern Ocean"
        ]
        matches = []
        for b in basin_candidates:
            pattern = r"\b" + re.escape(b.lower()) + r"\b"
            m = re.search(pattern, q_lower)
            if m:
                matches.append((m.start(), b))

        # Check landmarks
        for lk, linfo in COASTAL_LANDMARKS.items():
            pattern = r"\b" + re.escape(lk) + r"\b"
            m = re.search(pattern, q_lower)
            if m:
                matches.append((m.start(), linfo["region"]))

        matches.sort(key=lambda x: x[0])
        result = []
        for _, b in matches:
            if b not in result:
                result.append(b)
        return result

    def _extract_time_range(self, q_lower: str, is_context_ref: bool, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Extracts temporal boundaries from natural language expressions."""
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

    def _is_unrelated(self, text: str, context: Optional[Dict[str, Any]] = None, is_context_ref: bool = False) -> bool:
        unrelated_triggers = [
            r"\b(cook|cooking|bake|baking|cake|recipe|food|football|cricket|crypto|bitcoin|stock market|movie|actor|song|lyrics|joke|poem)\b",
            r"\b(who is the president|write python code|binary tree|solve math|capital of|tell me a story)\b"
        ]
        if any(re.search(trig, text) for trig in unrelated_triggers):
            return True

        # If there is active context and query is anaphoric, allow it through
        if is_context_ref and context and (context.get("region") or context.get("parameter") or context.get("intent") or context.get("topic")):
            return False

        ocean_keywords = [
            "ocean", "sea", "temp", "thermal", "salin", "argo", "float", "floats", "depth", "pressure",
            "dbar", "water", "marine", "basin", "profile", "omz", "oxygen", "chennai", "mumbai",
            "kochi", "atlantic", "pacific", "indian", "bengal", "arabian", "meter", "meters", "psu", "ctd",
            "gdac", "dac", "buoyancy", "quality control", "qc", "thermocline", "halocline", "pycnocline",
            "barrier layer", "upwelling", "climate", "monsoon", "cyclone", "sbe-41", "incois", "coriolis",
            "fnmoc", "netcdf", "sensor", "telemetry", "iridium", "archimedes", "ohc", "heat content"
        ]
        has_ocean_keyword = any(kw in text for kw in ocean_keywords)
        if not has_ocean_keyword and len(text.split()) > 3:
            return True

        return False


# Module singleton
nlp_engine = OceanNlpEngine()
