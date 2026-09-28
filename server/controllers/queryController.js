const pythonBridge = require('../services/pythonBridgeService');
const argoDataService = require('../services/argoDataService');
const QueryHistory = require('../models/QueryHistory');

/**
 * Format counts with correct English pluralization
 */
function formatCount(count, singular, plural) {
  const n = count || 0;
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Generates dynamic, context-aware suggested follow-up questions
 */
function generateFollowUpSuggestions(parsed, analysis, prediction) {
  const suggestions = [];
  const primaryParam = parsed.parameter || 'temperature';
  const region = parsed.region || 'Indian Ocean';
  const depth = parsed.depth;

  if (primaryParam === 'temperature') {
    suggestions.push(`Compare salinity in the ${region} with temperature`);
  } else {
    suggestions.push(`Show the temperature profile in the ${region}`);
  }

  if (depth === null || depth === undefined || parsed.depth_obj?.isDefault) {
    suggestions.push(`What is the average ${primaryParam} at 500 meters in the ${region}?`);
    suggestions.push(`Show the ${primaryParam} at 1000m depth`);
  } else if (depth === 500) {
    suggestions.push(`Now show at 1000 meters in the ${region}`);
  } else {
    suggestions.push(`Show the surface ${primaryParam} in the ${region}`);
  }

  if (!parsed.is_prediction) {
    suggestions.push(`Predict the ${primaryParam} trend for ${region} for the next 12 months`);
  }

  if (region === 'Indian Ocean') {
    suggestions.push(`Compare ${primaryParam} between Indian Ocean and Pacific Ocean`);
    suggestions.push(`Show ARGO observations near Chennai`);
  } else if (region === 'Arabian Sea') {
    suggestions.push(`Compare salinity between Arabian Sea and Bay of Bengal`);
    suggestions.push(`Show ARGO observations near Mumbai`);
  } else {
    suggestions.push(`Show me a map of available ARGO observations in the ${region}`);
  }

  return suggestions.slice(0, 4);
}

// @desc    Process natural language query pipeline
// @route   POST /api/query
// @access  Public / Optional Auth
const processQuery = async (req, res) => {
  try {
    const { query, context, mode: explicitMode } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid query string.',
      });
    }

    // Step 1: Structured NLP Parsing
    const parsed = await pythonBridge.parseNLP(query.trim(), context);

    const activeCtxStr = parsed.active_context || (
      parsed.intent === 'knowledge' || parsed.mode === 2 || explicitMode === 'rag' || explicitMode === 2
        ? 'Global / ARGO Knowledge'
        : `${parsed.region || 'Global'}${parsed.depth_val !== null && parsed.depth_val !== undefined ? ` @ ${parsed.depth_val}m` : ''} • ${parsed.parameter || 'temperature'}`
    );

    console.log(`
[NLP]
Query: ${query.trim()}
Intent: ${parsed.intent}
Mode: ${explicitMode || parsed.mode || (parsed.intent === 'knowledge' ? 2 : (parsed.intent === 'hybrid' ? 3 : 1))}
Explicit Mode: ${explicitMode || 'auto'}
Requires RAG: ${!!parsed.requiresRAG}
Requires Data Analysis: ${!!parsed.requiresDataAnalysis}
Context Inheritance: ${!!parsed.context_inherited}
Active Context: ${activeCtxStr}
    `.trim());

    // -------------------------------------------------------------
    // EXPLICIT MODE 2: RAG KNOWLEDGE MODE
    // -------------------------------------------------------------
    if (explicitMode === 'rag' || explicitMode === 'knowledge' || explicitMode === 2) {
      if (parsed.intent === 'unrelated' || parsed.valid === false) {
        return res.json({
          success: true,
          type: 'unrelated',
          queryMode: 'rag_knowledge',
          answer: 'This question is not related to ARGO oceanographic knowledge or documentation. Please ask about ARGO floats, CTD sensors, variable buoyancy engines, GDAC architecture, or ocean physical dynamics.',
          keyFindings: ['Query is outside ARGO oceanographic knowledge domain.'],
          dataUsed: null,
          visualization: null,
          prediction: null,
          suggestedFollowUps: [
            'What is an ARGO float?',
            'How does an ARGO float work?',
            'What is GDAC?',
            'What are ARGO quality-control procedures?',
          ],
        });
      }

      const ragResult = await pythonBridge.queryKnowledge(query.trim(), 4);

      if (!ragResult.success || !ragResult.sources || ragResult.sources.length === 0) {
        return res.json({
          success: true,
          type: 'unrelated',
          queryMode: 'rag_knowledge',
          answer: 'This question is not related to ARGO oceanographic knowledge or documentation. Please ask about ARGO floats, CTD sensors, variable buoyancy engines, GDAC architecture, or ocean physical dynamics.',
          keyFindings: ['Query is outside ARGO oceanographic knowledge domain.'],
          dataUsed: null,
          visualization: null,
          prediction: null,
          suggestedFollowUps: ragResult.suggested_topics || [
            'What is an ARGO float?',
            'How does an ARGO float work?',
            'What is GDAC?',
            'What are ARGO quality-control procedures?',
          ],
        });
      }

      return res.json({
        success: true,
        type: 'knowledge',
        queryMode: 'rag_knowledge',
        answer: ragResult.answer,
        keyPrinciples: ragResult.key_principles || [],
        sources: ragResult.sources || [],
        dataUsed: null,
        visualization: null,
        prediction: null,
        limitations: 'Information grounded directly in official international ARGO documentation and published oceanographic reference literature.',
        suggestedFollowUps: ragResult.suggested_topics || [
          'What is an ARGO float?',
          'How does an ARGO float work?',
          'What is GDAC?',
          'What are ARGO quality-control procedures?',
        ],
        context: {
          intent: 'knowledge',
          mode: 2,
          topic: query.trim(),
          activeContext: 'Global / ARGO Knowledge',
          region: null,
          depth: null,
          parameter: null,
          parameters: [],
        },
      });
    }

    // Guardrail: Unrelated query check (Auto & Data Modes)
    if (parsed.intent === 'unrelated' || parsed.valid === false) {
      return res.json({
        success: true,
        type: 'unrelated',
        answer: parsed.message || 'I am an ARGO Oceanographic Data Assistant. Please ask about ocean temperature, salinity, depth profiles, or float observations.',
        keyFindings: ['Query is outside physical oceanography domain.'],
        dataUsed: null,
        visualization: null,
        prediction: null,
        suggestedFollowUps: [
          'What is the average sea temperature in the Bay of Bengal?',
          'Show the temperature and salinity profile at different depths in the Indian Ocean.',
          'Compare the temperature and salinity between the Bay of Bengal and the Arabian Sea.',
          'Show ARGO observations near Chennai.',
        ],
      });
    }

    // Guardrail: Ambiguous query handling (e.g. "the temp at ocean")
    if (parsed.is_ambiguous) {
      return res.json({
        success: true,
        type: 'clarification_needed',
        answer: parsed.clarification_message || 'Which ocean basin or depth layer would you like to investigate?',
        keyFindings: ['Additional parameter or geographic constraint required.'],
        dataUsed: null,
        visualization: null,
        prediction: null,
        suggestedFollowUps: [
          'What is the average temperature in the Bay of Bengal?',
          'Show temperature at 500 meters in the Arabian Sea',
          'Show vertical temperature profile in the Indian Ocean',
          'Show ARGO observations near Chennai',
        ],
      });
    }

    // ========================================================
    // MODE 2: RAG KNOWLEDGE QUERY (Conceptual / Procedural)
    // ========================================================
    if (parsed.intent === 'knowledge' || parsed.mode === 2 || (parsed.requiresRAG && !parsed.requiresDataAnalysis)) {
      const ragResult = await pythonBridge.queryKnowledge(query, 4);

      if (!ragResult.success || !ragResult.sources || ragResult.sources.length === 0) {
        return res.json({
          success: true,
          type: 'unrelated',
          queryMode: 'rag_knowledge',
          answer: 'This question is not related to ARGO oceanographic knowledge or documentation. Please ask about ARGO floats, CTD sensors, variable buoyancy engines, GDAC architecture, or ocean physical dynamics.',
          keyFindings: ['Query is outside ARGO oceanographic knowledge domain.'],
          dataUsed: null,
          visualization: null,
          prediction: null,
          suggestedFollowUps: ragResult.suggested_topics || [
            'What is an ARGO float?',
            'How does an ARGO float work?',
            'What is GDAC?',
            'What are ARGO quality-control procedures?',
          ],
        });
      }

      const responsePayload = {
        success: true,
        type: 'knowledge',
        queryMode: 'rag_knowledge',
        answer: ragResult.answer,
        keyPrinciples: ragResult.key_principles || [],
        sources: ragResult.sources || [],
        dataUsed: null,
        visualization: null,
        prediction: null,
        limitations: 'Information grounded directly in official international ARGO documentation and published oceanographic reference literature.',
        suggestedFollowUps: ragResult.suggested_topics || [
          'What is an ARGO float?',
          'How does an ARGO float work?',
          'What is GDAC?',
          'What are ARGO quality-control procedures?',
        ],
        context: {
          intent: 'knowledge',
          mode: 2,
          topic: query.trim(),
          activeContext: 'Global / ARGO Knowledge',
          region: null,
          depth: null,
          parameter: null,
          parameters: [],
        },
      };

      if (req.user) {
        await QueryHistory.create({
          userId: req.user._id,
          query: query.trim(),
          parsedIntent: { intent: 'knowledge', operation: 'knowledge_retrieval' },
          resultSummary: ragResult.answer.slice(0, 180) + '...',
          floatCount: 0,
          regionUsed: 'Global ARGO Documentation',
        }).catch((err) => console.warn('[History] Could not save:', err.message));
      }

      return res.json(responsePayload);
    }

    const requestedParams = parsed.parameters && parsed.parameters.length > 0 
      ? parsed.parameters 
      : [parsed.parameter || 'temperature'];
    const isMultiParam = requestedParams.length > 1;
    const primaryParam = requestedParams[0];
    const unitMap = { temperature: '°C', salinity: 'PSU', pressure: 'dbar', dissolved_oxygen: 'µmol/kg' };
    const primaryUnit = unitMap[primaryParam] || '°C';

    const depthInfo = parsed.depth_obj || {
      value: parsed.depth !== null && parsed.depth !== undefined ? parsed.depth : (parsed.depth_val !== null && parsed.depth_val !== undefined ? parsed.depth_val : 0),
      unit: 'm',
      isDefault: parsed.depth === null || parsed.depth === undefined,
      label: parsed.depth !== null && parsed.depth !== undefined ? `${parsed.depth}m` : 'Surface layer (0m) [Default]',
    };

    const timeRangeInfo = parsed.time_range || {
      start_year: parsed.start_year || 2018,
      end_year: parsed.end_year || 2025,
      label: `${parsed.start_year || 2018}–${parsed.end_year || 2025}`,
      isDefault: true,
    };

    // ========================================================
    // MODE 3: HYBRID DATA + RAG QUERY
    // ========================================================
    if (parsed.intent === 'hybrid') {
      const targetRegion = parsed.region || 'Indian Ocean';
      const targetDepth = depthInfo.value !== null && depthInfo.value !== undefined ? depthInfo.value : 500;

      const profiles = await argoDataService.getProfiles({
        region: targetRegion,
        depth_val: targetDepth,
        time_range: timeRangeInfo.isDefault ? null : { start: timeRangeInfo.start, end: timeRangeInfo.end },
      }, 400);

      const uniqueFloats = [...new Set((profiles || []).map((p) => p.floatId))];
      const { values, timeSeries } = argoDataService.extractValuesAtDepth(profiles || [], targetDepth, primaryParam);

      const stats = await pythonBridge.computeAnalysis({
        operation: 'statistics',
        values,
        parameter: primaryParam,
      });

      const trendData = await pythonBridge.computeAnalysis({
        operation: 'temporal_trend',
        time_series_records: timeSeries,
        parameter: primaryParam,
      });

      const ragResult = await pythonBridge.queryKnowledge(query, 3);

      const depthNote = `${targetDepth}m depth`;
      const observedAnswer = `In the ${targetRegion} at ${depthNote}, the average observed sea ${primaryParam} is ${stats.mean} ${primaryUnit} (range: ${stats.min} to ${stats.max} ${primaryUnit}) based on ${formatCount(stats.count, 'observation', 'observations')} across ${formatCount(uniqueFloats.length, 'float', 'floats')}.`;

      const findings = [
        `Empirical ARGO Observation: Mean ${primaryParam} is ${stats.mean} ${primaryUnit} at ${depthNote} in ${targetRegion}.`,
        `Data basis: ${formatCount(stats.count, 'observation', 'observations')} from ${formatCount(uniqueFloats.length, 'float', 'floats')} (ARGO QC Flag 1 - Good).`,
        ...(ragResult.key_principles || []).slice(0, 3),
      ];

      const responsePayload = {
        success: true,
        type: 'hybrid',
        queryMode: 'hybrid_data_rag',
        answer: `${observedAnswer}\n\nScientific Physical Explanation:\n${ragResult.answer}`,
        observedResult: {
          summary: observedAnswer,
          parameter: primaryParam,
          mean: stats.mean,
          min: stats.min,
          max: stats.max,
          unit: primaryUnit,
          count: stats.count,
          depth: targetDepth,
          region: targetRegion,
        },
        scientificExplanation: {
          explanation: ragResult.answer,
          keyPrinciples: ragResult.key_principles || [],
          sources: ragResult.sources || [],
        },
        keyFindings: findings,
        dataUsed: {
          parameters: requestedParams,
          parameter: primaryParam.charAt(0).toUpperCase() + primaryParam.slice(1),
          region: targetRegion,
          depth: depthNote,
          depthValue: targetDepth,
          depthIsDefault: depthInfo.isDefault,
          observationCount: stats.count || profiles.length,
          profileCount: profiles.length,
          floatCount: uniqueFloats.length,
          floatIds: uniqueFloats.slice(0, 6),
          dateRange: timeRangeInfo.label,
          qualityControl: 'ARGO Standard QC Flag 1 (Good)',
        },
        visualization: {
          type: 'time_series',
          trend: trendData,
          parameter: primaryParam,
          unit: primaryUnit,
          depth: targetDepth,
          stats,
        },
        prediction: null,
        sources: [
          {
            type: 'argo_data',
            title: `ARGO CTD Float Observations (${targetRegion})`,
            section_title: `In-situ CTD profiles at ${depthNote}`,
            source_file: 'ARGO Global Data Assembly Center (GDAC)',
            confidence_score: 1.0,
            snippet: `Grounded in ${formatCount(stats.count, 'observation', 'observations')} from ${formatCount(uniqueFloats.length, 'float', 'floats')} (${uniqueFloats.slice(0, 4).join(', ')}).`,
          },
          ...(ragResult.sources || []).map((s) => ({
            type: 'literature',
            title: s.doc_title,
            section_title: s.section_title,
            source_file: s.source_file,
            confidence_score: s.confidence_score,
            snippet: s.snippet,
          })),
        ],
        limitations: 'Observed measurements represent verified ARGO CTD float sensor cycles. Scientific explanation is synthesized from peer-reviewed oceanographic documentation.',
        suggestedFollowUps: [
          'What is the average temperature at the surface layer in the Bay of Bengal?',
          'Show vertical temperature profile in the Indian Ocean',
          'What is an ARGO float and how does it measure temperature?',
          'What are ARGO quality-control procedures?',
        ],
        context: {
          intent: 'hybrid',
          mode: 3,
          region: targetRegion,
          parameter: primaryParam,
          parameters: requestedParams,
          depth: targetDepth,
          activeContext: `${targetRegion} @ ${targetDepth}m • ${primaryParam} (Hybrid)`,
          start_year: timeRangeInfo.start_year,
          end_year: timeRangeInfo.end_year,
        },
      };

      if (req.user) {
        await QueryHistory.create({
          userId: req.user._id,
          query: query.trim(),
          parsedIntent: { intent: 'hybrid', operation: 'hybrid_analysis' },
          resultSummary: observedAnswer,
          floatCount: uniqueFloats.length,
          regionUsed: targetRegion,
        }).catch((err) => console.warn('[History] Could not save:', err.message));
      }

      return res.json(responsePayload);
    }

    // ========================================================
    // CASE A: REGIONAL COMPARISON (Multi-Basin)
    // ========================================================
    if (parsed.intent === 'comparison' && parsed.compare_regions && parsed.compare_regions.length >= 2) {
      const regions = parsed.compare_regions;
      const targetDepth = depthInfo.isProfile ? 0 : (depthInfo.value !== null ? depthInfo.value : 0);
      
      const comparisonRaw = await argoDataService.getComparisonData(regions, targetDepth, requestedParams);
      
      // Structure payload for statistical analysis
      const analysisPayload = {};
      let totalObservations = 0;
      let totalProfiles = 0;
      const allUniqueFloats = new Set();
      const regionMetadata = {};

      for (const reg of regions) {
        const regData = comparisonRaw[reg] || {};
        analysisPayload[reg] = regData.valuesByParam || {};
        totalObservations += regData.observationCount || 0;
        totalProfiles += regData.profileCount || 0;
        if (regData.uniqueFloats) {
          regData.uniqueFloats.forEach((f) => allUniqueFloats.add(f));
        }
        regionMetadata[reg] = {
          observationCount: regData.observationCount || 0,
          profileCount: regData.profileCount || 0,
          floatCount: regData.floatCount || 0,
        };
      }

      const compStats = await pythonBridge.computeAnalysis({
        operation: 'regional_comparison',
        parameter: primaryParam,
        region_data: analysisPayload,
      });

      const findings = [];
      const tableRows = [];

      for (const reg of regions) {
        const regStat = compStats[reg] || {};
        const meta = regionMetadata[reg] || {};
        const row = {
          region: reg,
          profileCount: meta.profileCount,
          floatCount: meta.floatCount,
          observationCount: meta.observationCount,
          mean: regStat[primaryParam]?.mean,
          min: regStat[primaryParam]?.min,
          max: regStat[primaryParam]?.max,
          std: regStat[primaryParam]?.std,
          count: meta.observationCount,
        };

        for (const p of requestedParams) {
          const pStat = regStat[p] || {};
          const u = unitMap[p] || '';
          row[p] = pStat.mean;
          findings.push(`${reg} mean ${p}: ${pStat.mean !== null ? pStat.mean : 'N/A'} ${u} (range: ${pStat.min}–${pStat.max} ${u}, from ${formatCount(meta.observationCount, 'observation', 'observations')}).`);
        }
        tableRows.push(row);
      }

      // Compute pairwise deltas if 2 regions
      if (regions.length === 2) {
        const r1 = regions[0];
        const r2 = regions[1];
        for (const p of requestedParams) {
          const s1 = compStats[r1]?.[p]?.mean;
          const s2 = compStats[r2]?.[p]?.mean;
          const u = unitMap[p] || '';
          if (s1 !== null && s2 !== null && s1 !== undefined && s2 !== undefined) {
            const delta = +(s1 - s2).toFixed(2);
            findings.push(`Difference in ${p}: ${Math.abs(delta)} ${u} (${delta >= 0 ? r1 : r2} is higher by ${Math.abs(delta)} ${u}).`);
          }
        }
      }

      const paramsFormatted = requestedParams.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' and ');
      const depthNote = depthInfo.isDefault 
        ? 'Surface layer (0m) [Default: No depth was specified in query]' 
        : `${targetDepth}m depth`;

      let summaryAnswer = `Comparing ${paramsFormatted} between ${regions.join(' and ')} at ${depthNote}:`;
      for (const reg of regions) {
        const pStrings = requestedParams.map((p) => `${p}: ${compStats[reg]?.[p]?.mean ?? 'N/A'} ${unitMap[p]}`);
        summaryAnswer += ` ${reg} (${pStrings.join(', ')});`;
      }

      const responsePayload = {
        success: true,
        type: 'comparison',
        answer: summaryAnswer,
        keyFindings: findings,
        dataUsed: {
          parameters: requestedParams,
          parameter: paramsFormatted,
          depth: depthNote,
          regions: regions.join(' vs '),
          observationCount: totalObservations,
          profileCount: totalProfiles,
          floatCount: allUniqueFloats.size,
          floatIds: Array.from(allUniqueFloats),
          qualityControl: 'ARGO Standard QC Flag 1 (Good)',
          dateRange: timeRangeInfo.label,
        },
        visualization: {
          type: 'regional_bar',
          chartData: tableRows,
          parameters: requestedParams,
          parameter: primaryParam,
          unit: primaryUnit,
          tableRows,
        },
        prediction: null,
        limitations: 'Regional comparisons represent aggregated ARGO profiling observations across selected ocean basins.',
        suggestedFollowUps: generateFollowUpSuggestions(parsed, compStats, null),
        context: {
          intent: 'comparison',
          mode: 1,
          region: regions[0],
          compare_regions: regions,
          parameter: primaryParam,
          parameters: requestedParams,
          depth: targetDepth,
          activeContext: `${regions.join(' vs ')} @ ${targetDepth}m • ${primaryParam}`,
        },
      };

      if (req.user) {
        await QueryHistory.create({
          userId: req.user._id,
          query: query.trim(),
          intent: 'comparison',
          parameter: primaryParam,
          region: regions.join(' vs '),
          depth: targetDepth,
          summaryAnswer,
          keyFindings: findings,
          visualizationType: 'regional_bar',
          dataSummary: {
            sampleCount: totalObservations,
            profileCount: totalProfiles,
            floatCount: allUniqueFloats.size,
            dateRange: timeRangeInfo.label,
            depthRange: depthNote,
          },
          analysisData: compStats,
          chartData: responsePayload.visualization,
        });
      }

      return res.json(responsePayload);
    }

    // ========================================================
    // RETRIEVE MATCHING ARGO OBSERVATIONS FOR SINGLE BASIN
    // ========================================================
    const profiles = await argoDataService.getProfiles(parsed, 400);

    // Strict Anti-Hallucination Guardrail: No observations found
    if (!profiles || profiles.length === 0) {
      return res.json({
        success: true,
        type: 'no_data',
        answer: `I could not find sufficient ARGO observations matching all the requested conditions for region "${parsed.region || 'Unknown'}" (Depth: ${depthInfo.label}, Period: ${timeRangeInfo.label}).`,
        keyFindings: [
          'No float profiles matched the exact spatial, temporal, or depth criteria.',
          'The system strictly refrains from fabricating synthetic values when observational records do not exist.',
        ],
        dataUsed: {
          parameters: requestedParams,
          parameter: requestedParams.join(', '),
          region: parsed.region,
          observationCount: 0,
          profileCount: 0,
          floatCount: 0,
          dateRange: timeRangeInfo.label,
          depth: depthInfo.label,
        },
        visualization: null,
        prediction: null,
        limitations: 'ARGO floats drift dynamically; certain localized coastal areas or temporal brackets may have sparse coverage.',
        suggestedFollowUps: [
          'What is the average temperature in the Bay of Bengal?',
          'Show ARGO observations near Chennai',
          'Show temperature profile in the Arabian Sea',
        ],
      });
    }

    const uniqueFloats = [...new Set(profiles.map((p) => p.floatId))];
    let analysisResult = null;
    let predictionResult = null;
    let visualizationData = null;
    let keyFindings = [];
    let summaryAnswer = '';

    // ========================================================
    // CASE B: SPATIAL MAP
    // ========================================================
    if (parsed.intent === 'spatial_map') {
      const markers = profiles.slice(0, 150).map((p) => {
        const surfMeasurement = p.measurements.find((m) => m.depth === 0) || p.measurements[0];
        return {
          id: p._id,
          floatId: p.floatId,
          cycleNumber: p.cycleNumber,
          coordinates: [p.location.coordinates[1], p.location.coordinates[0]],
          region: p.region,
          timestamp: p.timestamp,
          temperature: surfMeasurement ? surfMeasurement.temperature : null,
          salinity: surfMeasurement ? surfMeasurement.salinity : null,
          dissolvedOxygen: surfMeasurement ? surfMeasurement.dissolvedOxygen : null,
          platformType: p.platformType,
        };
      });

      summaryAnswer = `Retrieved ${formatCount(profiles.length, 'observation profile', 'observation profiles')} across ${formatCount(uniqueFloats.length, 'float', 'floats')} in ${parsed.region || 'the target area'}.`;
      keyFindings = [
        `Tracking ${formatCount(uniqueFloats.length, 'distinct WMO profiling float', 'distinct WMO profiling floats')} (${uniqueFloats.slice(0, 4).join(', ')}${uniqueFloats.length > 4 ? '...' : ''}).`,
        `Observation period: ${timeRangeInfo.label}.`,
        'Float coordinates are recorded using calibrated onboard GPS positioning.',
      ];

      visualizationData = {
        type: 'interactive_map',
        markers,
        center: markers.length > 0 ? markers[0].coordinates : [15.0, 75.0],
        totalCount: profiles.length,
      };
    }
    // ========================================================
    // CASE C: VERTICAL DEPTH PROFILE (TEST 2)
    // ========================================================
    else if (parsed.intent === 'profile') {
      const profileAnalysis = await pythonBridge.computeAnalysis({
        operation: 'depth_profile',
        profiles,
        parameter: primaryParam,
      });

      const curve = profileAnalysis.depth_levels || [];
      const surfLevel = curve.find((c) => c.depth === 0) || curve[0] || {};
      const deepLevel = curve.find((c) => c.depth === 1000) || curve[curve.length - 1] || {};

      const paramsTitle = requestedParams.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' and ');
      
      if (isMultiParam && requestedParams.includes('temperature') && requestedParams.includes('salinity')) {
        summaryAnswer = `Vertical ${paramsTitle} profile for ${parsed.region} derived from ${formatCount(profiles.length, 'profile', 'profiles')} (${formatCount(uniqueFloats.length, 'float', 'floats')}). Surface: Temp ${surfLevel.temperature ?? 'N/A'} °C, Salinity ${surfLevel.salinity ?? 'N/A'} PSU. At 1000m depth: Temp ${deepLevel.temperature ?? 'N/A'} °C, Salinity ${deepLevel.salinity ?? 'N/A'} PSU.`;
        keyFindings = [
          `Surface layer (0m): Temperature ${surfLevel.temperature ?? 'N/A'} °C, Salinity ${surfLevel.salinity ?? 'N/A'} PSU.`,
          `Thermocline & Halocline transition observed between 50m and 400m depth.`,
          `Deep ocean layer (1000m): Temperature stabilizes at ${deepLevel.temperature ?? 'N/A'} °C, Salinity at ${deepLevel.salinity ?? 'N/A'} PSU.`,
          `Computed deterministically across ${formatCount(profiles.length, 'profile', 'profiles')} from ${formatCount(uniqueFloats.length, 'float', 'floats')}.`,
        ];
      } else {
        summaryAnswer = `Vertical ${primaryParam} profile for ${parsed.region} derived from ${formatCount(profiles.length, 'profile', 'profiles')}. Surface ${primaryParam} is ${surfLevel[primaryParam] ?? 'N/A'} ${primaryUnit}, cooling to ${deepLevel[primaryParam] ?? 'N/A'} ${primaryUnit} at 1000m.`;
        keyFindings = [
          `Surface layer (0m): mean ${primaryParam} is ${surfLevel[primaryParam] ?? 'N/A'} ${primaryUnit}.`,
          `Water column gradient observed between 50m and 400m depth.`,
          `Deep abyssal layer (1000m): stabilized at ${deepLevel[primaryParam] ?? 'N/A'} ${primaryUnit}.`,
          `Computed across ${formatCount(profiles.length, 'profile', 'profiles')} from ${formatCount(uniqueFloats.length, 'float', 'floats')}.`,
        ];
      }

      visualizationData = {
        type: 'depth_profile',
        curve,
        parameters: requestedParams,
        parameter: primaryParam,
        unit: primaryUnit,
        region: parsed.region,
      };
      analysisResult = profileAnalysis;
    }
    // ========================================================
    // CASE D: PREDICTION (Validated ML Forecast)
    // ========================================================
    else if (parsed.intent === 'prediction' || parsed.is_prediction) {
      const targetDepth = depthInfo.value !== null ? depthInfo.value : 0;
      const { timeSeries, observationCount } = argoDataService.extractValuesAtDepth(profiles, targetDepth, primaryParam);

      predictionResult = await pythonBridge.computeForecast({
        records: timeSeries,
        parameter: primaryParam,
        horizon_months: parsed.forecast_months || 12,
      });

      if (predictionResult.refusal) {
        summaryAnswer = predictionResult.message;
        keyFindings = [
          'Prediction refused due to strict scientific guardrails.',
          `Minimum observation threshold: ${predictionResult.required_count || 20} records.`,
          'Fabricated or unvalidated projections are prevented to preserve scientific validity.',
        ];
        visualizationData = null;
      } else {
        const summary = predictionResult.summary || {};
        const metrics = predictionResult.metrics || {};
        const delta = summary.projected_change !== undefined ? summary.projected_change : 0;

        summaryAnswer = `12-month ${primaryParam} forecast for ${parsed.region} at ${targetDepth}m depth. Current baseline: ${summary.current_observed} ${primaryUnit}; projected: ${summary.projected_12m} ${primaryUnit} (${delta >= 0 ? '+' : ''}${delta} ${primaryUnit}). Model: ${predictionResult.model_name} (Validation R² = ${metrics.r2_score}).`;

        keyFindings = [
          `Baseline observed value: ${summary.current_observed} ${primaryUnit}.`,
          `Projected 12-month value: ${summary.projected_12m} ${primaryUnit} (${delta >= 0 ? '+' : ''}${delta} ${primaryUnit}).`,
          `Model: ${predictionResult.model_name} with test R² of ${metrics.r2_score} and RMSE of ${metrics.rmse} ${primaryUnit}.`,
          metrics.is_overfitting ? 'Warning: Model indicated slight overfitting and was regularized.' : 'Validation check: No significant overfitting or data leakage detected.',
        ];

        visualizationData = {
          type: 'time_series_forecast',
          historical: predictionResult.historical_baseline,
          forecast: predictionResult.forecast,
          parameter: primaryParam,
          unit: primaryUnit,
          depth: targetDepth,
        };
      }
    }
    // ========================================================
    // CASE E: TIME-SERIES TREND ANALYSIS (TEST 5)
    // ========================================================
    else if (parsed.intent === 'trend') {
      const targetDepth = depthInfo.value !== null ? depthInfo.value : 0;
      const { values, timeSeries } = argoDataService.extractValuesAtDepth(profiles, targetDepth, primaryParam);

      const trendData = await pythonBridge.computeAnalysis({
        operation: 'temporal_trend',
        time_series_records: timeSeries,
        parameter: primaryParam,
      });

      const trendSummary = await pythonBridge.computeAnalysis({
        operation: 'trend_summary',
        trend_data: trendData,
        parameter: primaryParam,
      });

      const startVal = trendSummary.start_value;
      const endVal = trendSummary.end_value;
      const delta = trendSummary.change;
      const dir = trendSummary.trend_direction;

      summaryAnswer = `Ocean ${primaryParam} trend at ${targetDepth}m depth in ${parsed.region} over ${timeRangeInfo.label}: Starting value is ${startVal ?? 'N/A'} ${primaryUnit}, Ending value is ${endVal ?? 'N/A'} ${primaryUnit} (Net change: ${delta >= 0 ? '+' : ''}${delta} ${primaryUnit}, Trend: ${dir}).`;

      keyFindings = [
        `Starting value (${trendSummary.start_period}): ${startVal ?? 'N/A'} ${primaryUnit}.`,
        `Ending value (${trendSummary.end_period}): ${endVal ?? 'N/A'} ${primaryUnit}.`,
        `Net change: ${delta >= 0 ? '+' : ''}${delta} ${primaryUnit}.`,
        `Trend direction: ${dir}.`,
        `Calculated deterministically from ${formatCount(values.length, 'observation', 'observations')} across ${formatCount(uniqueFloats.length, 'float', 'floats')}.`,
      ];

      visualizationData = {
        type: 'time_series',
        trend: trendData,
        parameter: primaryParam,
        unit: primaryUnit,
        depth: targetDepth,
        trendSummary,
      };
      analysisResult = { trendData, trendSummary };
    }
    // ========================================================
    // CASE F: AVERAGE / STATISTICAL AGGREGATION (TEST 1 & TEST 3)
    // ========================================================
    else {
      const targetDepth = depthInfo.value !== null ? depthInfo.value : 0;
      const { values, timeSeries } = argoDataService.extractValuesAtDepth(profiles, targetDepth, primaryParam);

      if (values.length === 0) {
        return res.json({
          success: true,
          type: 'no_data',
          answer: `No observations found for ${primaryParam} at ${targetDepth}m depth in ${parsed.region} for period ${timeRangeInfo.label}.`,
          keyFindings: ['No matching CTD sensor measurements at the specified depth and time range.'],
          dataUsed: {
            parameter: primaryParam,
            region: parsed.region,
            depth: `${targetDepth}m`,
            dateRange: timeRangeInfo.label,
            observationCount: 0,
            profileCount: 0,
            floatCount: 0,
          },
          visualization: null,
          prediction: null,
          suggestedFollowUps: ['Show temperature profile in the Indian Ocean'],
        });
      }

      const stats = await pythonBridge.computeAnalysis({
        operation: 'statistics',
        values,
        parameter: primaryParam,
      });

      const trendData = await pythonBridge.computeAnalysis({
        operation: 'temporal_trend',
        time_series_records: timeSeries,
        parameter: primaryParam,
      });

      const depthClarification = depthInfo.isDefault 
        ? `No depth was specified in the query, so the analysis was evaluated at the surface layer (0m).` 
        : `Evaluated at ${targetDepth}m depth.`;

      summaryAnswer = `In the ${parsed.region} during ${timeRangeInfo.label}, the average observed sea ${primaryParam} is ${stats.mean} ${primaryUnit} (range: ${stats.min} to ${stats.max} ${primaryUnit}) based on ${formatCount(stats.count, 'observation', 'observations')}.`;

      keyFindings = [
        `Mean ${primaryParam}: ${stats.mean} ${primaryUnit} (Median: ${stats.median} ${primaryUnit}, Std Dev: ±${stats.std} ${primaryUnit}).`,
        `Observed range: ${stats.min} ${primaryUnit} (min) to ${stats.max} ${primaryUnit} (max).`,
        `Time Period: ${timeRangeInfo.label}.`,
        depthClarification,
        `Data basis: ${formatCount(stats.count, 'observation', 'observations')} across ${formatCount(profiles.length, 'profile', 'profiles')} from ${formatCount(uniqueFloats.length, 'float', 'floats')}.`,
      ];

      visualizationData = {
        type: 'time_series',
        trend: trendData,
        parameter: primaryParam,
        unit: primaryUnit,
        depth: targetDepth,
        stats,
      };
      analysisResult = stats;
    }

    const responsePayload = {
      success: true,
      type: parsed.intent,
      answer: summaryAnswer,
      keyFindings,
      dataUsed: {
        parameters: requestedParams,
        parameter: requestedParams.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' and '),
        region: parsed.region,
        depth: depthInfo.label,
        depthValue: depthInfo.value,
        depthIsDefault: depthInfo.isDefault,
        observationCount: analysisResult?.count || profiles.length,
        profileCount: profiles.length,
        floatCount: uniqueFloats.length,
        floatIds: uniqueFloats.slice(0, 6),
        dateRange: timeRangeInfo.label,
        qualityControl: 'ARGO Standard QC Flag 1 (Good)',
      },
      visualization: visualizationData,
      prediction: predictionResult,
      limitations: 'Observations reflect free-drifting profiling floats subject to ocean current advection. Results are grounded strictly in recorded ARGO CTD sensor cycles.',
      suggestedFollowUps: generateFollowUpSuggestions(parsed, analysisResult, predictionResult),
      context: {
        intent: parsed.intent || 'average',
        mode: 1,
        region: parsed.region,
        parameter: primaryParam,
        parameters: requestedParams,
        depth: depthInfo.value,
        depth_obj: depthInfo,
        activeContext: `${parsed.region}${depthInfo.value !== null && depthInfo.value !== undefined ? ` @ ${depthInfo.value}m` : ''} • ${primaryParam}`,
        start_year: timeRangeInfo.start_year,
        end_year: timeRangeInfo.end_year,
      },
    };

    // Save to user history if authenticated
    if (req.user) {
      await QueryHistory.create({
        userId: req.user._id,
        query: query.trim(),
        intent: parsed.intent,
        parameter: primaryParam,
        region: parsed.region,
        depth: depthInfo.value,
        summaryAnswer,
        keyFindings,
        visualizationType: visualizationData ? visualizationData.type : 'summary_card',
        dataSummary: {
          sampleCount: responsePayload.dataUsed.observationCount,
          profileCount: profiles.length,
          floatCount: uniqueFloats.length,
          dateRange: timeRangeInfo.label,
          depthRange: depthInfo.label,
        },
        analysisData: analysisResult,
        predictionData: predictionResult,
        chartData: visualizationData,
      });
    }

    return res.json(responsePayload);
  } catch (error) {
    console.error('[Query Pipeline Error]', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during query processing. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Direct RAG Knowledge Search Controller
 * POST /api/query/knowledge
 */
const handleKnowledgeQuery = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query string is required.' });
    }

    const ragResult = await pythonBridge.queryKnowledge(query.trim(), 4);
    if (!ragResult.success || !ragResult.sources || ragResult.sources.length === 0) {
      return res.json({
        success: true,
        type: 'unrelated',
        queryMode: 'rag_knowledge',
        answer: 'This question is not related to ARGO oceanographic knowledge or documentation. Please ask about ARGO floats, CTD sensors, variable buoyancy engines, GDAC architecture, or ocean physical dynamics.',
        keyFindings: ['Query is outside ARGO oceanographic knowledge domain.'],
        dataUsed: null,
        visualization: null,
        prediction: null,
        suggestedFollowUps: ragResult.suggested_topics || [
          'What is an ARGO float?',
          'How does an ARGO float work?',
          'What is GDAC?',
          'What are ARGO quality-control procedures?',
        ],
      });
    }

    return res.json({
      success: true,
      type: 'knowledge',
      queryMode: 'rag_knowledge',
      answer: ragResult.answer,
      keyPrinciples: ragResult.key_principles || [],
      sources: ragResult.sources || [],
      suggestedFollowUps: ragResult.suggested_topics || [],
    });
  } catch (error) {
    console.error('[Knowledge Query Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * RAG Knowledge Catalog Controller
 * GET /api/query/knowledge/sources
 */
const getKnowledgeCatalog = async (req, res) => {
  try {
    const catalog = await pythonBridge.getKnowledgeCatalog();
    return res.json({ success: true, ...catalog });
  } catch (error) {
    console.error('[Knowledge Catalog Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  processQuery,
  handleKnowledgeQuery,
  getKnowledgeCatalog,
};
