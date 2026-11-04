/* ==========================================================================
   LASSO Evaluation Results Application
   - Navigation: Left Sidebar only (no top tabs)
     * 1st item in sidebar: Overview (not open by default)
     * Default open tab on load: 1. Bar Charts
   - Overview View:
     * Two-Column Structured List (No Table) explaining Evaluated Tools & Benchmarks:
       1. Name used in results
       2. Full name & description (no full form for "LASSO"; Gemini results noted as verified with Gemini 4 Argon model)
       3. Source (where we obtained it from, with informative text and links naming the tool/artifact, not conference names)
     * Analysis Sections: Simple one-line list of links (no large cards)
     * No separate Reference Links section
   - Tables:
     * Numbers use the exact same font as the row heading (Plus Jakarta Sans)
     * Whole-cell background highlighting (td.best-td-cell, td.cost-td-cell)
     * Centered data columns and headers
   ========================================================================== */

(function () {
  const e = React.createElement;
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const {
    ConfigProvider,
    Table,
    Tag,
    Button,
    Select,
    Input,
    InputNumber,
    Checkbox,
    Modal,
    Descriptions,
    Alert,
    Space,
    Spin,
    Empty,
    message,
  } = antd;

  const PAPER_URL = "https://arxiv.org/abs/2610.38294";
  const REPO_URL = "https://github.com/xdata-lasso/lasso";
  const CEX_FOLDER_URL = "https://github.com/xdata-lasso/lasso/tree/main/experiments/results/reproducible_cex";
  const LASSO_GOLD_CEX_URL = "https://github.com/xdata-lasso/lasso/tree/main/experiments/results/reproducible_cex/lasso_gold";
  const LASSO_EXCLUSIVE_CEX_URL = "https://github.com/xdata-lasso/lasso/tree/main/experiments/results/lasso_exclusive";
  const RESULTS_FOLDER_URL = "https://github.com/xdata-lasso/lasso/tree/main/experiments/results";

  function GitHubLogo({ size = 14 }) {
    return e(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "currentColor",
        style: { verticalAlign: "-2px", marginRight: 4, flexShrink: 0 },
      },
      e("path", {
        d: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z",
      })
    );
  }

  function extLink(text, url) {
    return e(
      "a",
      {
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
      },
      text
    );
  }

  const LLM_ER_GREEN = "#22c55e";
  const LLM_TDG_GREEN = "#15803d";
  const LASSO_BLUE = "#3b82f6";
  const LASSO_CC_DARK_BLUE = "#1e40af";

  function isLlmTool(toolKey) {
    const k = String(toolKey || "").trim().toLowerCase();
    if (k === "parseval-tdg" || k === "parseval_tdg") return false;
    return k.startsWith("gemini") || k.endsWith("-er") || k.endsWith("-tdg");
  }

  function getLlmToolColor(toolKey) {
    const k = String(toolKey || "").trim().toLowerCase();
    if (k.endsWith("-tdg") || k.endsWith("_tdg")) return LLM_TDG_GREEN;
    return LLM_ER_GREEN;
  }

  function buildLlmCostMap(summary, inputRate = 2.0, outputRate = 10.0, thinkingRate = 10.0) {
    const costMap = {};
    (summary?.tables || []).forEach((t) => {
      const tid = String(t.id || "");
      if (!tid.endsWith("-token-usage-analysis")) return;
      const toolKey = tid.slice(0, -"-token-usage-analysis".length);
      const headersLower = (t.headers || []).map((h) => String(h).trim().toLowerCase());
      const inpIdx = headersLower.indexOf("input tokens") !== -1 ? headersLower.indexOf("input tokens") : 2;
      const outIdx = headersLower.indexOf("output tokens") !== -1 ? headersLower.indexOf("output tokens") : 3;
      const thinkIdx = headersLower.indexOf("thinking tokens");
      const totIdx = headersLower.indexOf("total tokens") !== -1 ? headersLower.indexOf("total tokens") : (thinkIdx !== -1 ? 5 : 4);

      costMap[toolKey] = {};
      (t.rows || []).forEach((r) => {
        const expKey = String(r[0] || "").trim().toLowerCase();
        const inp = parseInt(String(r[inpIdx] ?? 0).replace(/,/g, ""), 10) || 0;
        const out = parseInt(String(r[outIdx] ?? 0).replace(/,/g, ""), 10) || 0;
        const tot = parseInt(String(r[totIdx] ?? 0).replace(/,/g, ""), 10) || 0;
        const think = thinkIdx !== -1
          ? (parseInt(String(r[thinkIdx] ?? 0).replace(/,/g, ""), 10) || 0)
          : Math.max(0, tot - inp - out);
        const cost = (inp / 1e6) * inputRate + (out / 1e6) * outputRate + (think / 1e6) * thinkingRate;
        costMap[toolKey][expKey] = cost;
      });
    });
    return costMap;
  }

  function formatCostBracket(cost) {
    if (cost === undefined || cost === null || isNaN(cost)) return "";
    return `($${cost.toFixed(2)})`;
  }

  // Tool metadata with distinct colors and rich overview provenance
  // Note: No full form for "LASSO"; LLM -er uses medium-light green and -tdg uses dark green; LASSO and LASSO-CC use related blue and dark blue shades.
  const TOOL_META = {
    lasso: {
      label: "LASSO",
      fullName: null,
      color: LASSO_BLUE,
      desc: "Single-query (1-way) test data generator using fast heuristics and targeted AST-driven attack strategies to kill semantic mutations.",
      renderSource: () =>
        e(
          "span",
          null,
          "Developed as part of this work and available in the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          "."
        ),
    },
    lasso_cc: {
      label: "LASSO-CC",
      fullName: "LASSO with Two-Way Cross-Checking",
      color: LASSO_CC_DARK_BLUE,
      desc: "Pairwise extension of LASSO that synthesizes test datasets from both the reference query and the candidate prediction query.",
      renderSource: () =>
        e(
          "span",
          null,
          "Developed as part of this work and available in the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          "."
        ),
    },
    "gemini-4-argon-high-er": {
      label: "gemini-4-argon-high-er",
      fullName: "Gemini 4 Argon (High Thinking) Pairwise Equivalence Refutation",
      color: LLM_ER_GREEN,
      desc: "Direct LLM baseline prompted with both reference and candidate queries to synthesize a distinguishing counterexample database (evaluated with gemini-4-argon-high).",
      renderSource: () =>
        e(
          "span",
          null,
          "Implemented in our evaluation harness in the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          " using the Google Gemini API (gemini-4-argon-high)."
        ),
    },
    "gemini-4-argon-high-tdg": {
      label: "gemini-4-argon-high-tdg",
      fullName: "Gemini 4 Argon (High Thinking) Single-Query Test Data Generation",
      color: LLM_TDG_GREEN,
      desc: "Direct LLM baseline prompted with only the single reference query to synthesize a suite of test databases (evaluated with gemini-4-argon-high).",
      renderSource: () =>
        e(
          "span",
          null,
          "Implemented in our evaluation harness in the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          " using the Google Gemini API (gemini-4-argon-high)."
        ),
    },
    "gemini-4-argon-medium-er": {
      label: "gemini-4-argon-medium-er",
      fullName: "Gemini 4 Argon (Medium Thinking) Pairwise Equivalence Refutation",
      color: LLM_ER_GREEN,
      desc: "Direct LLM baseline prompted with both reference and candidate queries to synthesize a distinguishing counterexample database (evaluated with gemini-4-argon-medium).",
      renderSource: () =>
        e(
          "span",
          null,
          "Implemented in our evaluation harness in the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          " using the Google Gemini API (gemini-4-argon-medium)."
        ),
    },
    "gemini-4-argon-medium-tdg": {
      label: "gemini-4-argon-medium-tdg",
      fullName: "Gemini 4 Argon (Medium Thinking) Single-Query Test Data Generation",
      color: LLM_TDG_GREEN,
      desc: "Direct LLM baseline prompted with only the single reference query to synthesize a suite of test databases (evaluated with gemini-4-argon-medium).",
      renderSource: () =>
        e(
          "span",
          null,
          "Implemented in our evaluation harness in the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          " using the Google Gemini API (gemini-4-argon-medium)."
        ),
    },
    "gemini-4-argon-low-er": {
      label: "gemini-4-argon-low-er",
      fullName: "Gemini 4 Argon (Low Thinking) Pairwise Equivalence Refutation",
      color: LLM_ER_GREEN,
      desc: "Direct LLM baseline prompted with both reference and candidate queries to synthesize a distinguishing counterexample database (evaluated with gemini-4-argon-low).",
      renderSource: () =>
        e(
          "span",
          null,
          "Implemented in our evaluation harness in the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          " using the Google Gemini API (gemini-4-argon-low)."
        ),
    },
    "gemini-4-argon-low-tdg": {
      label: "gemini-4-argon-low-tdg",
      fullName: "Gemini 4 Argon (Low Thinking) Single-Query Test Data Generation",
      color: LLM_TDG_GREEN,
      desc: "Direct LLM baseline prompted with only the single reference query to synthesize a suite of test databases (evaluated with gemini-4-argon-low).",
      renderSource: () =>
        e(
          "span",
          null,
          "Implemented in our evaluation harness in the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          " using the Google Gemini API (gemini-4-argon-low)."
        ),
    },
    sqlwitness: {
      label: "SQLWitness",
      fullName: "SQLWitness: Efficient Dialect-Agnostic SQL Equivalence Refutation",
      color: "#dc2626",
      desc: "Rule-based counterexample search engine using 1-way Boolean coverage and Laplace termination.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from the ",
          extLink("SQLWitness GitHub Repository", "https://github.com/wanteatfruit/SQLWitness"),
          " accompanying the ",
          extLink("SQLWitness Paper", "https://www.semanticscholar.org/paper/c32ff3da6b766095f9d2bc9dd01dfe0c699c6d3d"),
          "."
        ),
    },
    parseval: {
      label: "ParSEval",
      fullName: "ParSEval: Plan-Aware Test Database Generation for SQL Equivalence Evaluation",
      color: "#ea580c",
      desc: "Two-way query-pair equivalence disprover using branch-coverage-driven symbolic reasoning and Z3 SMT solving.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from the ",
          extLink("ParSEval GitHub Repository", "https://github.com/sfu-db/ParSEval"),
          " accompanying the ",
          extLink("ParSEval Paper", "https://doi.org/10.14778/3749646.3749727"),
          "."
        ),
    },
    "parseval-tdg": {
      label: "ParSEval-TDG",
      fullName: "ParSEval Single-Query Test Data Generation Mode",
      color: "#eab308",
      desc: "Single-query database generator invoking ParSEval's instantiate_db interface on the reference query alone.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from the instantiate_db module in the ",
          extLink("ParSEval GitHub Repository", "https://github.com/sfu-db/ParSEval"),
          "."
        ),
    },
    polygon: {
      label: "Polygon",
      fullName: "Polygon: Symbolic Reasoning for SQL using Conflict-Driven Under-Approximation Search",
      color: "#7c3aed",
      desc: "Symbolic SQL reasoning and counterexample search engine using conflict-driven under-approximation over Z3.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from the ",
          extLink("Polygon Evaluation Artifact", "https://doi.org/10.5281/zenodo.15059866"),
          " accompanying the ",
          extLink("Polygon Paper", "https://doi.org/10.1145/3729303"),
          "."
        ),
    },
    spotit: {
      label: "SpotIT",
      fullName: "SpotIt+: Verification-based Text-to-SQL Evaluation with Database Constraints",
      color: "#c026d3",
      desc: "Bounded SMT equivalence verification tool built on VeriEQL with mined database integrity constraints.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from the ",
          extLink("SpotIt+ GitHub Repository", "https://github.com/ai-ar-research/SpotIt-plus"),
          " accompanying the ",
          extLink("SpotIt+ Paper", "https://arxiv.org/abs/2603.04334"),
          "."
        ),
    },
    xdatapublic_cc: {
      label: "XData-CC",
      fullName: "XData Constraint-Based Test Data Generator with Two-Way Cross-Checking",
      color: "#92400e",
      desc: "Pairwise extension of XData that generates mutation-killing datasets from both the reference and candidate queries.",
      renderSource: () =>
        e(
          "span",
          null,
          "Extended with 2-way cross-checking in our evaluation pipeline using the ",
          extLink("XData Public Repository", "https://gitlab.com/xdata/xdatapublic"),
          "."
        ),
    },
    xdatapublic: {
      label: "XData",
      fullName: "XData: Constraint-Based Test Data Generation for Killing SQL Mutants",
      color: "#0d9488",
      desc: "Single-query (1-way) SMT constraint-based test data generator designed to kill SQL query mutations.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from the Docker distribution in the ",
          extLink("XData Public Repository", "https://gitlab.com/xdata/xdatapublic"),
          " accompanying the ",
          extLink("XData Complex SQL Paper", "https://doi.org/10.1145/3769832"),
          "."
        ),
    },
    xdata_cc: {
      label: "XData-Legacy-CC",
      fullName: "Legacy XData Internal Prototype with Two-Way Cross-Checking",
      color: "#be185d",
      desc: "Two-way cross-checking variant of the earlier internal XData prototype on its supported subset.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from the internal XData prototype based on the ",
          extLink("XData Data Generation Paper", "https://doi.org/10.1109/ICDE.2011.5767876"),
          "."
        ),
    },
    xdata_gold: {
      label: "XData-Legacy",
      fullName: "Legacy XData Internal Prototype (1-Way)",
      color: "#64748b",
      desc: "Single-query (1-way) earlier internal XData prototype evaluated on its supported subset.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from the internal XData prototype based on the ",
          extLink("XData Data Generation Paper", "https://doi.org/10.1109/ICDE.2011.5767876"),
          "."
        ),
    },
  };

  // Benchmark metadata with exact result names, full names, and artifact provenance
  const BENCHMARK_META = {
    bird: {
      label: "BIRD",
      pairs: 10153,
      fullName: "Big Bench for Large-Scale Database Grounded Text-to-SQL Evaluation",
      shortDesc: "Large-scale database-grounded text-to-SQL benchmark pairing gold queries with candidate LLM predictions.",
      renderSource: () =>
        e(
          "span",
          null,
          "Schemas, dev gold queries, and DAIL-SQL predictions obtained from data/sqlite in the ",
          extLink("ParSEval GitHub Repository", "https://github.com/sfu-db/ParSEval"),
          ", combined with additional LLM predictions from verieql/predictions in the ",
          extLink("SpotIt+ GitHub Repository", "https://github.com/ai-ar-research/SpotIt-plus"),
          " (originally from the ",
          extLink("BIRD Benchmark", "https://bird-bench.github.io/"),
          ")."
        ),
    },
    cubes: {
      label: "Cubes",
      pairs: 3108,
      fullName: "Cubes Analytical OLAP and Aggregation Query Suite",
      shortDesc: "Analytical OLAP grouping and aggregation query pairs.",
      renderSource: () =>
        e(
          "span",
          null,
          "Extracted from benchmarks/cubes in the ",
          extLink("Polygon Evaluation Artifact", "https://doi.org/10.5281/zenodo.15059866"),
          " accompanying the ",
          extLink("Polygon Paper", "https://doi.org/10.1145/3729303"),
          "."
        ),
    },
    leetcode: {
      label: "LeetCode",
      pairs: 21963,
      fullName: "LeetCode Database Problem SQL Query Pairs",
      shortDesc: "Reference SQL solutions paired with candidate submissions across LeetCode database problems.",
      renderSource: () =>
        e(
          "span",
          null,
          "Extracted from benchmarks/leetcode (groundtruths and VeriEQL query pairs) in the ",
          extLink("Polygon Evaluation Artifact", "https://doi.org/10.5281/zenodo.15059866"),
          "."
        ),
    },
    literature: {
      label: "Literature",
      pairs: 51,
      fullName: "SQL Query Equivalence Benchmark from Prior Database Literature",
      shortDesc: "SQL query equivalence and rewrite benchmark curated from prior database research papers.",
      renderSource: () =>
        e(
          "span",
          null,
          "Extracted from benchmarks/literature in the ",
          extLink("Polygon Evaluation Artifact", "https://doi.org/10.5281/zenodo.15059866"),
          "."
        ),
    },
    calcite: {
      label: "Calcite",
      pairs: 221,
      fullName: "Apache Calcite Query Optimizer Rewrite Suite",
      shortDesc: "Apache Calcite query optimizer rewrite rules and mutated SQL query pairs.",
      renderSource: () =>
        e(
          "span",
          null,
          "Extracted from benchmarks/calcite in the ",
          extLink("Polygon Evaluation Artifact", "https://doi.org/10.5281/zenodo.15059866"),
          "."
        ),
    },
    xdata: {
      label: "XData-BM",
      pairs: 343,
      fullName: "XData Student SQL Grading and Mutation Benchmark",
      shortDesc: "Reference course queries paired with student submissions and semantic mutations.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from benchmarks/XData-BM in the ",
          extLink("XData Public Repository", "https://gitlab.com/xdata/xdatapublic"),
          " accompanying the ",
          extLink("XData Complex SQL Paper", "https://doi.org/10.1145/3769832"),
          "."
        ),
    },
    tpch: {
      label: "TPC-H",
      pairs: 198,
      fullName: "TPC-H Decision Support Queries with Semantic Mutations",
      shortDesc: "Standard TPC-H decision support queries paired with non-equivalent semantic mutations.",
      renderSource: () =>
        e(
          "span",
          null,
          "Reference queries and manually constructed semantic mutants obtained from benchmarks/TPCH in the ",
          extLink("XData Public Repository", "https://gitlab.com/xdata/xdatapublic"),
          "."
        ),
    },
    largejoin: {
      label: "LargeJoin",
      pairs: 10,
      fullName: "LargeJoin Multi-Relation Join Stress Benchmark",
      shortDesc: "Multi-way join queries (joining up to 10 relational tables) paired with semantic mutations.",
      renderSource: () =>
        e(
          "span",
          null,
          "Obtained from benchmarks/LargeJoin in the ",
          extLink("XData Public Repository", "https://gitlab.com/xdata/xdatapublic"),
          "."
        ),
    },
    "lasso-bm": {
      label: "LASSO-BM",
      pairs: 362,
      fullName: "Semantic Mutation Test Suite",
      shortDesc: "Targeted semantic mutation suite covering joins, aggregates, NULLs, subqueries, windows, and predicates.",
      renderSource: () =>
        e(
          "span",
          null,
          "Constructed in test_cases/ of the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          ", informed by semantic fault categories from the ",
          extLink("NL2SQL-BUGs Taxonomy", "https://doi.org/10.1145/3711896.3737427"),
          "."
        ),
    },
    "mm-bm": {
      label: "MM-BM",
      pairs: 75,
      fullName: "Many Mutants Benchmark",
      shortDesc: "Three complex multi-table queries paired with 75 non-equivalent semantic mutants (25 mutants per query).",
      renderSource: () =>
        e(
          "span",
          null,
          "Constructed as part of this work in experiments/originals/MM-BM of the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          "."
        ),
    },
    "mmo-bm": {
      label: "MMO-BM",
      pairs: 75,
      fullName: "Many Mutants Obfuscated Benchmark",
      shortDesc: "Variant of MM-BM with table and column names renamed to deterministic pseudo-random dictionary words.",
      renderSource: () =>
        e(
          "span",
          null,
          "Generated via our identifier-obfuscation script in experiments/originals/MM-BM of the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          "."
        ),
    },
    "mmro-bm": {
      label: "MMRO-BM",
      pairs: 75,
      fullName: "Many Mutants Random-Obfuscated Benchmark",
      shortDesc: "Variant of MM-BM with table and column names renamed to random character strings to ablate identifier priors.",
      renderSource: () =>
        e(
          "span",
          null,
          "Generated via our identifier-obfuscation script in experiments/originals/MM-BM of the ",
          extLink("LASSO GitHub Repository", REPO_URL),
          "."
        ),
    },
  };

  const TOOL_PRIORITY_ORDER = [
    "lasso",
    "lasso_cc",
    "gemini-4-argon-medium-er",
    "gemini-4-argon-low-er",
    "gemini-4-argon-high-er",
    "gemini-4-argon-low-tdg",
    "gemini-4-argon-medium-tdg",
    "gemini-4-argon-high-tdg",
    "sqlwitness",
    "parseval",
    "parseval-tdg",
    "polygon",
    "spotit",
    "xdatapublic_cc",
    "xdatapublic",
    "xdata_cc",
    "xdata_gold",
  ];

  function getToolTiePriority(toolKey) {
    const k = String(toolKey || "").trim().toLowerCase();
    const idx = TOOL_PRIORITY_ORDER.indexOf(k);
    return idx === -1 ? 999 : idx;
  }

  function compareToolsOnTie(toolA, toolB) {
    const pa = getToolTiePriority(toolA);
    const pb = getToolTiePriority(toolB);
    if (pa !== pb) return pa - pb;
    return formatToolName(toolA).localeCompare(formatToolName(toolB));
  }

  function formatToolName(t) {
    return TOOL_META[t]?.label || t;
  }

  function formatBenchmarkName(b) {
    if (!b) return "";
    const s = String(b).trim();
    const m = s.match(/^([a-z0-9_-]+)(\s*\(.*\))$/i);
    if (m) {
      const k = m[1].toLowerCase();
      if (BENCHMARK_META[k]) {
        return BENCHMARK_META[k].label + m[2];
      }
    }
    return BENCHMARK_META[s.toLowerCase()]?.label || b;
  }

  function getToolColor(toolKey) {
    const k = String(toolKey).toLowerCase();
    if (isLlmTool(k)) return getLlmToolColor(k);
    return TOOL_META[k]?.color || "#64748b";
  }

  function renderToolLabelNode(toolKey) {
    const k = String(toolKey).toLowerCase();
    const meta = TOOL_META[k];
    const dotColor = isLlmTool(k) ? getLlmToolColor(k) : meta?.color;
    if (!meta && !isLlmTool(k)) return toolKey;
    return e(
      "span",
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontWeight: k.startsWith("lasso") ? 700 : 600,
          color: "#0f172a",
        },
      },
      e("span", {
        style: {
          width: 9,
          height: 9,
          borderRadius: 2,
          background: dotColor,
          display: "inline-block",
          flexShrink: 0,
        },
      }),
      meta ? meta.label : toolKey
    );
  }

  function parseCellFloat(val) {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    if (!s || s === "--" || s === "*") return null;
    if (s.startsWith("<")) {
      const n = parseFloat(s.slice(1));
      return isNaN(n) ? null : n * 0.5;
    }
    const compMatch = s.match(/^([\d\.,]+)\s*\(.*?\)$/);
    const baseStr = compMatch ? compMatch[1] : s;
    const clean = baseStr.replace(/,/g, "").replace(/%$/, "").replace(/^\+/, "");
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }

  function formatSqlText(sql) {
    if (!sql) return "";
    let s = String(sql).trim();
    if (!s.includes("\n") && s.length > 75 && !s.toUpperCase().startsWith("INSERT")) {
      s = s.replace(
        /\b(FROM|LEFT\s+OUTER\s+JOIN|RIGHT\s+OUTER\s+JOIN|FULL\s+OUTER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|CROSS\s+JOIN|JOIN|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|UNION\s+ALL|UNION|INTERSECT|EXCEPT)\b/gi,
        "\n$1"
      );
    }
    return s;
  }

  function renderHighlightedSql(sqlText) {
    if (!sqlText) return null;
    const formatted = formatSqlText(sqlText);
    const tokenRegex =
      /(--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|\b(?:SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|AS|AND|OR|NOT|IN|EXISTS|IS|NULL|CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|INSERT|INTO|VALUES|CASE|WHEN|THEN|ELSE|END|UNION|ALL|INTERSECT|EXCEPT|ASC|DESC|NULLS|LAST|FIRST|BETWEEN|LIKE|CAST|PRAGMA|CHECK|UNIQUE|DEFAULT|INT|INTEGER|TEXT|VARCHAR|REAL|FLOAT|DATE|BOOLEAN)\b|\b(?:COUNT|SUM|AVG|MIN|MAX|COALESCE|IFNULL|NULLIF|ROUND|ABS|UPPER|LOWER|LENGTH|SUBSTR|STRFTIME)\b|\b\d+(?:\.\d+)?\b)/gi;

    const kwSet = new Set([
      "SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "CROSS",
      "ON", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "DISTINCT", "AS", "AND",
      "OR", "NOT", "IN", "EXISTS", "IS", "NULL", "CREATE", "TABLE", "PRIMARY", "KEY",
      "FOREIGN", "REFERENCES", "INSERT", "INTO", "VALUES", "CASE", "WHEN", "THEN", "ELSE",
      "END", "UNION", "ALL", "INTERSECT", "EXCEPT", "ASC", "DESC", "NULLS", "LAST", "FIRST",
      "BETWEEN", "LIKE", "CAST", "PRAGMA", "CHECK", "UNIQUE", "DEFAULT", "INT", "INTEGER",
      "TEXT", "VARCHAR", "REAL", "FLOAT", "DATE", "BOOLEAN",
    ]);

    const parts = formatted.split(tokenRegex);
    return e(
      "pre",
      { className: "sql-highlighted-block" },
      parts.map((part, idx) => {
        if (!part) return null;
        if (part.startsWith("--") || part.startsWith("/*")) {
          return e("span", { key: idx, className: "sql-cmt" }, part);
        }
        if (part.startsWith("'")) {
          return e("span", { key: idx, className: "sql-str" }, part);
        }
        if (/^\d+(?:\.\d+)?$/.test(part)) {
          return e("span", { key: idx, className: "sql-num" }, part);
        }
        const up = part.toUpperCase();
        if (kwSet.has(up)) {
          return e("span", { key: idx, className: "sql-kw" }, up);
        }
        if (/^(COUNT|SUM|AVG|MIN|MAX|COALESCE|IFNULL|NULLIF|ROUND|ABS|UPPER|LOWER|LENGTH|SUBSTR|STRFTIME)$/i.test(part)) {
          return e("span", { key: idx, className: "sql-fn" }, up);
        }
        return part;
      })
    );
  }

  function RelationalGrid({ title, columns = [], rows = [], rawText = "", error = null }) {
    if (error && (!columns || columns.length === 0)) {
      return e(
        "div",
        { style: { border: "1px solid #cbd5e1", borderRadius: 5, padding: 10, background: "#fff" } },
        title ? e("div", { style: { fontWeight: 700, marginBottom: 4 } }, title) : null,
        rawText
          ? e("pre", { className: "code-font", style: { margin: 0, fontSize: "12px", whiteSpace: "pre-wrap" } }, rawText)
          : e("span", { style: { color: "#dc2626" } }, error)
      );
    }

    if (!columns || columns.length === 0) {
      return e(
        "div",
        {
          style: {
            border: "1px solid #cbd5e1",
            borderRadius: 5,
            overflow: "hidden",
            background: "#fff",
            textAlign: "center",
          },
        },
        title
          ? e(
              "div",
              {
                style: {
                  background: "#f1f5f9",
                  padding: "6px 12px",
                  borderBottom: "1px solid #cbd5e1",
                  fontWeight: 700,
                  fontSize: "13px",
                },
              },
              title
            )
          : null,
        e(
          "div",
          { className: "code-font", style: { padding: "10px 12px", fontSize: "12px", color: "#475569" } },
          rawText || "0 rows (Empty Result)"
        )
      );
    }

    const antCols = columns.map((colName, cIdx) => ({
      title: colName,
      dataIndex: String(cIdx),
      key: String(cIdx),
      align: "center",
      render: (val) =>
        val === null || val === undefined
          ? e(Tag, { className: "code-font", style: { fontSize: "11px", color: "#64748b", margin: 0 } }, "NULL")
          : e("span", { style: { fontSize: "13px" } }, String(val)),
    }));

    const dataSource = rows.map((r, rIdx) => {
      const obj = { key: String(rIdx) };
      columns.forEach((_, cIdx) => {
        obj[String(cIdx)] = r[cIdx];
      });
      return obj;
    });

    return e(
      "div",
      { style: { border: "1px solid #cbd5e1", borderRadius: 5, overflow: "hidden", background: "#fff" } },
      title
        ? e(
            "div",
            {
              style: {
                background: "#f1f5f9",
                padding: "6px 12px",
                borderBottom: "1px solid #cbd5e1",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                justifyContent: "space-between",
              },
            },
            e("span", null, title),
            e("span", { style: { color: "#475569", fontWeight: 500, fontSize: "12px" } }, `${rows.length} row(s)`)
          )
        : null,
      e(Table, {
        columns: antCols,
        dataSource,
        size: "small",
        pagination: rows.length > 6 ? { pageSize: 6, size: "small" } : false,
        scroll: { x: "max-content" },
      })
    );
  }

  function NonEquivalenceBoundAlert() {
    return e(Alert, {
      type: "warning",
      showIcon: true,
      style: {
        marginBottom: 18,
        border: "1px solid #f59e0b",
        background: "#fffbeb",
        borderRadius: 6,
      },
      message: e(
        "span",
        { style: { fontWeight: 700, fontSize: "14px" } },
        "Important Note on Benchmark Query Equivalence"
      ),
      description:
        "Not all candidate query pairs in the benchmarks are known to be non-equivalent. Some candidate predictions are semantically equivalent to the reference query (particularly in text-to-SQL benchmarks such as BIRD and LeetCode). Consequently, a 100% refutation rate is not achievable even by an ideal oracle; higher confirmed refutation counts directly indicate stronger bug-detection capability.",
    });
  }

  const BarValueLabelsPlugin = {
    id: "barValueLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data) return;
      const dataset = chart.data.datasets[0];
      const rawLabels = dataset.displayLabels || [];
      const isHorizontal = chart.options.indexAxis === "y";

      ctx.save();

      meta.data.forEach((bar, idx) => {
        const txt = rawLabels[idx] !== undefined ? String(rawLabels[idx]) : String(dataset.data[idx] ?? "");
        if (!txt) return;
        const costMatch = txt.match(/^(.*?\s+)(\(\$[^)]+\))$/);
        if (isHorizontal) {
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          if (costMatch) {
            const basePart = costMatch[1];
            const costPart = costMatch[2];
            ctx.font = '600 11px "Plus Jakarta Sans", -apple-system, sans-serif';
            ctx.fillStyle = "#0f172a";
            ctx.fillText(basePart, bar.x + 6, bar.y);
            const baseWidth = ctx.measureText(basePart).width;
            ctx.font = '700 11px "Plus Jakarta Sans", -apple-system, sans-serif';
            ctx.fillStyle = "#c2410c";
            ctx.fillText(costPart, bar.x + 6 + baseWidth, bar.y);
          } else {
            ctx.font = '600 11px "Plus Jakarta Sans", -apple-system, sans-serif';
            ctx.fillStyle = "#0f172a";
            ctx.fillText(txt, bar.x + 6, bar.y);
          }
        } else {
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.font = '600 11px "Plus Jakarta Sans", -apple-system, sans-serif';
          ctx.fillStyle = "#0f172a";
          ctx.fillText(txt, bar.x, bar.y - 4);
        }
      });
      ctx.restore();
    },
  };

  function BarChartCanvas({ labels, values, displayLabels, colors, horizontal = false, height = 260, yMax = null, logScale = false }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
      if (!canvasRef.current || typeof Chart === "undefined") return;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const ctx = canvasRef.current.getContext("2d");
      const maxVal = values.length ? Math.max(...values) : 10;

      const valueScaleConfig = logScale
        ? {
            type: "logarithmic",
            grid: { display: false },
            ticks: {
              font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 },
              color: "#334155",
              callback: function (val) {
                if ([0.01, 0.1, 1, 10, 100, 1000].includes(val)) return val + "s";
                return "";
              },
            },
          }
        : {
            beginAtZero: true,
            suggestedMax: yMax || maxVal * 1.18,
            grid: { display: false },
            ticks: {
              font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 },
              color: "#334155",
            },
          };

      const categoryScaleConfig = {
        grid: { display: false },
        ticks: {
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11.5, weight: "600" },
          color: "#0f172a",
          autoSkip: false,
        },
      };

      chartRef.current = new Chart(ctx, {
        type: "bar",
        plugins: [BarValueLabelsPlugin],
        data: {
          labels,
          datasets: [
            {
              data: values,
              displayLabels,
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1,
              borderRadius: 4,
              maxBarThickness: horizontal ? 22 : 36,
            },
          ],
        },
        options: {
          indexAxis: horizontal ? "y" : "x",
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          layout: {
            padding: horizontal
              ? { top: 4, right: 120, bottom: 4, left: 4 }
              : { top: 24, right: 10, bottom: 4, left: 4 },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const i = context.dataIndex;
                  return displayLabels && displayLabels[i]
                    ? displayLabels[i]
                    : String(context.raw);
                },
              },
            },
          },
          scales: horizontal
            ? { x: valueScaleConfig, y: categoryScaleConfig }
            : { x: categoryScaleConfig, y: valueScaleConfig },
        },
      });

      return () => {
        if (chartRef.current) {
          chartRef.current.destroy();
          chartRef.current = null;
        }
      };
    }, [labels, values, displayLabels, colors, horizontal, yMax, logScale]);

    return e(
      "div",
      { style: { position: "relative", height: height + "px", width: "100%" } },
      e("canvas", { ref: canvasRef })
    );
  }

  const ANALYSIS_SECTIONS = [
    {
      key: "charts",
      num: "1",
      shortTitle: "Bar Charts",
      title: "Benchmark Bar Charts",
      desc: "Side-by-side refutation count and average time per refutation bar charts for the overall suite and all 12 benchmarks.",
    },
    {
      key: "refutations",
      num: "2",
      shortTitle: "Equivalence Refutations",
      title: "Equivalence Refutations",
      desc: "Refutations on the unified benchmark, common supported queries, queries excluding ORDER BY and LIMIT, and LASSO-CC origin.",
    },
    {
      key: "efficiency",
      num: "3",
      shortTitle: "Execution Time",
      title: "Execution Time & Latency",
      desc: "Average time per refutation (seconds) and total execution time across all benchmarks, sorted from best at top.",
    },
    {
      key: "tokens",
      num: "4",
      shortTitle: "LLM Tokens & Cost",
      title: "LLM Token & Cost Breakdown",
      desc: "Input, output, and thinking token usage and cost breakdown for Gemini-ER and Gemini-TDG (verified with Gemini 4 Argon).",
    },
    {
      key: "strategies",
      num: "5",
      shortTitle: "Attack Strategies",
      title: "Attack Strategies & Dataset Statistics",
      desc: "Ranked effectiveness of LASSO's attack strategies and generated dataset/row statistics.",
    },
    {
      key: "status",
      num: "6",
      shortTitle: "Status Breakdown",
      title: "Status & Dialect Breakdown",
      desc: "Consolidated and per-tool execution status breakdown and SQLite vs. PostgreSQL dialect comparison.",
    },
  ];

  // ========================================================================
  // View 0: Academic Overview Page
  // - Single-column layout without cards or name boxes
  // - First explains Evaluation Benchmarks, then Evaluated Tools & Baselines
  // ========================================================================
  function InfoOverviewSection() {
    const bmKeysOrder = [
      "bird",
      "cubes",
      "leetcode",
      "literature",
      "calcite",
      "xdata",
      "tpch",
      "largejoin",
      "lasso-bm",
      "mm-bm",
      "mmo-bm",
      "mmro-bm",
    ];

    const toolKeysOrder = [
      "lasso",
      "lasso_cc",
      "gemini-4-argon-high-er",
      "gemini-4-argon-high-tdg",
      "gemini-4-argon-medium-er",
      "gemini-4-argon-medium-tdg",
      "gemini-4-argon-low-er",
      "gemini-4-argon-low-tdg",
      "sqlwitness",
      "parseval",
      "parseval-tdg",
      "polygon",
      "spotit",
      "xdatapublic_cc",
      "xdatapublic",
      "xdata_cc",
      "xdata_gold",
    ];

    return e(
      "div",
      { className: "overview-clean-wrap" },
      // 1. First: Evaluation Benchmarks
      e(
        "section",
        { className: "overview-section-block" },
        e("h3", { className: "overview-col-heading" }, "Evaluation Benchmarks (12 Suites, 36,634 Pairs)"),
        e(
          "p",
          { className: "overview-col-lead" },
          "Listed by the benchmark name used in result tables, followed by its full name, scope, and the artifact or repository from which we obtained the schemas and query pairs."
        ),
        e(
          "ul",
          { className: "overview-prose-list" },
          bmKeysOrder.map((k) => {
            const b = BENCHMARK_META[k];
            return e(
              "li",
              { key: k },
              e("span", { className: "overview-item-name" }, `${b.label} (${b.pairs.toLocaleString()} pairs)`),
              b.fullName
                ? e("span", { className: "overview-item-fullname" }, `: ${b.fullName}. `)
                : ": ",
              b.shortDesc,
              " ",
              e(
                "span",
                { className: "overview-item-source" },
                e("strong", null, "Source: "),
                b.renderSource()
              )
            );
          })
        )
      ),

      // 2. Second: Evaluated Tools & Baselines
      e(
        "section",
        { className: "overview-section-block" },
        e("h3", { className: "overview-col-heading" }, "Evaluated Tools & Baselines"),
        e(
          "p",
          { className: "overview-col-lead" },
          "Listed by the name used in result tables, followed by its full name (where applicable), methodology, and the source repository or artifact used in our evaluation."
        ),
        e(
          "ul",
          { className: "overview-prose-list" },
          toolKeysOrder.map((k) => {
            const t = TOOL_META[k];
            return e(
              "li",
              { key: k },
              e("span", { className: "overview-item-name" }, t.label),
              t.fullName
                ? e("span", { className: "overview-item-fullname" }, `: ${t.fullName}. `)
                : ": ",
              t.desc,
              " ",
              e(
                "span",
                { className: "overview-item-source" },
                e("strong", null, "Source: "),
                t.renderSource()
              )
            );
          })
        )
      ),

      // 3. Third: Reproducible Counterexamples & Evaluation CSVs in Repository
      e(
        "section",
        { className: "overview-section-block" },
        e("h3", { className: "overview-col-heading" }, "Reproducible Counterexample Scripts (.sql) & Raw Results"),
        e(
          "p",
          { className: "overview-col-lead" },
          "All synthesized counterexample database scripts (.sql) and per-tool evaluation CSV files are available directly in the GitHub repository:"
        ),
        e(
          "ul",
          { className: "overview-prose-list" },
          e(
            "li",
            null,
            e("span", { className: "overview-item-name" }, "Reproducible Counterexamples (.sql): "),
            extLink("experiments/results/reproducible_cex/", CEX_FOLDER_URL),
            " — self-contained SQLite/PostgreSQL database scripts (DDL, INSERT statements, and divergent query outputs) demonstrating query non-equivalence across all tools and benchmarks."
          ),
          e(
            "li",
            null,
            e("span", { className: "overview-item-name" }, "Precomputed Benchmark CSVs: "),
            extLink("experiments/results/", RESULTS_FOLDER_URL),
            " — per-benchmark evaluation results, dataset generation logs, and cross-checking study outputs."
          )
        )
      )
    );
  }

  // ========================================================================
  // View 1: Benchmark Bar Charts
  // - "Important Note on Benchmark Query Equivalence" shown ONLY when showPercent is enabled
  // ========================================================================
  function BenchmarkChartsSection({ summary }) {
    const [showPercent, setShowPercent] = useState(false);
    const [logScaleTime, setLogScaleTime] = useState(false);

    const chartData = useMemo(() => {
      if (!summary || !summary.tables) return null;
      const benchmarks = summary.benchmarks || [];
      const benchTotals = summary.bench_totals || {};
      const overallPairs = benchmarks.reduce((acc, b) => acc + (benchTotals[b] || 0), 0);

      const refTable = summary.tables.find((t) => t.id === "refutations-on-the-unified-benchmark");
      const timeTable = summary.tables.find((t) => t.id === "total-execution-time-seconds");
      const avgTimeTable = summary.tables.find((t) => t.id === "average-time-per-refutation-seconds");
      if (!refTable) return null;

      const toolStats = {};
      const hiddenTools = new Set(["xdata_gold", "xdata_cc"]);

      refTable.rows.forEach((row) => {
        const tool = row[0];
        if (hiddenTools.has(tool)) return;
        toolStats[tool] = {
          tool,
          label: formatToolName(tool),
          byBm: {},
          totalNeq: 0,
          totalTime: 0,
        };
        benchmarks.forEach((bm, idx) => {
          const rawVal = row[idx + 1];
          const neq = parseCellFloat(rawVal);
          if (neq !== null) {
            toolStats[tool].byBm[bm] = { neq, rawNeq: rawVal };
            toolStats[tool].totalNeq += neq;
          }
        });
      });

      if (timeTable) {
        timeTable.rows.forEach((row) => {
          const tool = row[0];
          if (!toolStats[tool]) return;
          benchmarks.forEach((bm, idx) => {
            const tVal = parseCellFloat(row[idx + 1]);
            if (tVal !== null && toolStats[tool].byBm[bm]) {
              toolStats[tool].byBm[bm].totalTime = tVal;
              toolStats[tool].totalTime += tVal;
            }
          });
        });
      }

      if (avgTimeTable) {
        avgTimeTable.rows.forEach((row) => {
          const tool = row[0];
          if (!toolStats[tool]) return;
          benchmarks.forEach((bm, idx) => {
            const rawAvg = row[idx + 1];
            const aVal = parseCellFloat(rawAvg);
            if (aVal !== null && toolStats[tool].byBm[bm]) {
              toolStats[tool].byBm[bm].avgTime = aVal;
              toolStats[tool].byBm[bm].avgTimeStr = String(rawAvg).trim() + "s";
            }
          });
        });
      }

      const sortRefEntries = (a, b) => {
        const diff = showPercent
          ? Number(b.rate.toFixed(1)) - Number(a.rate.toFixed(1))
          : b.neq - a.neq;
        if (Math.abs(diff) > 1e-9) return diff;
        return compareToolsOnTie(a.tool, b.tool);
      };

      const sortTimeEntries = (a, b) => {
        const diff = a.avgTime - b.avgTime;
        if (Math.abs(diff) > 1e-9) return diff;
        return compareToolsOnTie(a.tool, b.tool);
      };

      const llmCostMap = buildLlmCostMap(summary);

      const overallRefEntries = Object.values(toolStats)
        .filter((ts) => ts.totalNeq > 0)
        .map((ts) => {
          const isLlm = isLlmTool(ts.tool);
          const overallCost = isLlm ? llmCostMap[ts.tool]?.overall : undefined;
          return {
            tool: ts.tool,
            label: ts.label,
            neq: ts.totalNeq,
            rate: overallPairs > 0 ? (ts.totalNeq / overallPairs) * 100 : 0,
            color: getToolColor(ts.tool),
            costStr: isLlm && overallCost !== undefined ? formatCostBracket(overallCost) : "",
          };
        })
        .sort(sortRefEntries);

      const overallTimeEntries = Object.values(toolStats)
        .filter((ts) => ts.totalNeq > 0 && ts.totalTime > 0)
        .map((ts) => {
          const avgT = ts.totalTime / ts.totalNeq;
          const roundedAvg = avgT < 0.01 ? 0.005 : Number(avgT.toFixed(2));
          return {
            tool: ts.tool,
            label: ts.label,
            avgTime: roundedAvg,
            avgTimeStr: avgT < 0.01 ? "<0.01s" : avgT.toFixed(2) + "s",
            color: getToolColor(ts.tool),
          };
        })
        .sort(sortTimeEntries);

      const perBenchmark = benchmarks.map((bm) => {
        const bmTotal = benchTotals[bm] || 0;
        const refEntries = Object.values(toolStats)
          .filter((ts) => ts.byBm[bm] !== undefined)
          .map((ts) => {
            const neq = ts.byBm[bm].neq;
            const isLlm = isLlmTool(ts.tool);
            const bmCost = isLlm ? llmCostMap[ts.tool]?.[bm.toLowerCase()] : undefined;
            return {
              tool: ts.tool,
              label: ts.label,
              neq,
              rate: bmTotal > 0 ? (neq / bmTotal) * 100 : 0,
              color: getToolColor(ts.tool),
              costStr: isLlm && bmCost !== undefined ? formatCostBracket(bmCost) : "",
            };
          })
          .sort(sortRefEntries);

        const timeEntries = Object.values(toolStats)
          .filter((ts) => ts.byBm[bm] !== undefined && ts.byBm[bm].avgTime !== undefined)
          .map((ts) => ({
            tool: ts.tool,
            label: ts.label,
            avgTime: Math.max(ts.byBm[bm].avgTime, 0.005),
            avgTimeStr: ts.byBm[bm].avgTimeStr,
            color: getToolColor(ts.tool),
          }))
          .sort(sortTimeEntries);

        return {
          benchmark: bm,
          title: formatBenchmarkName(bm),
          shortDesc: BENCHMARK_META[bm]?.shortDesc || "",
          totalPairs: bmTotal,
          refEntries,
          timeEntries,
        };
      });

      return {
        overallPairs,
        overallRefEntries,
        overallTimeEntries,
        perBenchmark,
      };
    }, [summary, showPercent]);

    if (!chartData) {
      return e(Empty, { description: "No benchmark chart data available." });
    }

    const toolLegendOrder = [
      "lasso", "lasso_cc",
      "gemini-4-argon-high-er", "gemini-4-argon-high-tdg",
      "gemini-4-argon-medium-er", "gemini-4-argon-medium-tdg",
      "gemini-4-argon-low-er", "gemini-4-argon-low-tdg",
      "sqlwitness", "parseval", "parseval-tdg", "polygon",
      "spotit", "xdatapublic_cc", "xdatapublic",
    ];

    return e(
      "div",
      null,
      // Options & Tool Color Legend Bar
      e(
        "div",
        {
          style: {
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "14px 20px",
            marginBottom: "18px",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
          },
        },
        e(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: 10,
              marginBottom: 10,
            },
          },
          e("span", { style: { fontWeight: 700, fontSize: "14px" } }, "Display Options:"),
          e(
            Space,
            { size: 24, wrap: true },
            e(
              Checkbox,
              {
                checked: showPercent,
                onChange: (ev) => setShowPercent(ev.target.checked),
                style: { fontWeight: 600 },
              },
              "Show Refutations as Percentage (%) of Benchmark Queries"
            ),
            e(
              Checkbox,
              {
                checked: logScaleTime,
                onChange: (ev) => setLogScaleTime(ev.target.checked),
                style: { fontWeight: 600 },
              },
              "Logarithmic Scale for Time per Refutation (s)"
            )
          )
        ),
        e(
          "div",
          { style: { display: "flex", flexWrap: "wrap", gap: "8px 18px", alignItems: "center", justifyContent: "center" } },
          toolLegendOrder.map((tk) => {
            const m = TOOL_META[tk];
            return e(
              "span",
              {
                key: tk,
                style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: "12.5px", fontWeight: 600 },
              },
              e("span", {
                style: {
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: m.color,
                  display: "inline-block",
                },
              }),
              m.label
            );
          })
        )
      ),

      // Show "Important Note on Benchmark Query Equivalence" ONLY when showPercent is ticked
      showPercent ? e(NonEquivalenceBoundAlert) : null,

      // 1. Overall Side-by-Side Box
      e(
        "div",
        { className: "chart-pair-box" },
        e(
          "div",
          { className: "chart-pair-header" },
          e("h3", null, `Overall Benchmark Suite (${chartData.overallPairs.toLocaleString()} Query Pairs)`),
          e("span", { style: { fontSize: "13px", color: "#475569" } }, "Aggregated across all 12 benchmarks")
        ),
        e(
          "div",
          { className: "chart-pair-grid" },
          e(
            "div",
            { className: "sub-chart-panel" },
            e(
              "h4",
              null,
              showPercent
                ? "Overall Refutation Rate (%) (Higher is Better)"
                : "Overall Confirmed Refutations (NEQ Count, Higher is Better)"
            ),
            e(BarChartCanvas, {
              labels: chartData.overallRefEntries.map((d) => d.label),
              values: chartData.overallRefEntries.map((d) =>
                showPercent ? Number(d.rate.toFixed(1)) : d.neq
              ),
              displayLabels: chartData.overallRefEntries.map((d) => {
                const base = showPercent ? `${d.rate.toFixed(1)}%` : d.neq.toLocaleString();
                return d.costStr ? `${base} ${d.costStr}` : base;
              }),
              colors: chartData.overallRefEntries.map((d) => d.color),
              horizontal: true,
              height: Math.max(320, chartData.overallRefEntries.length * 26 + 34),
              yMax: showPercent ? 100 : null,
            })
          ),
          e(
            "div",
            { className: "sub-chart-panel" },
            e("h4", null, "Overall Average Time per Refutation (seconds, Lower is Faster)"),
            e(BarChartCanvas, {
              labels: chartData.overallTimeEntries.map((d) => d.label),
              values: chartData.overallTimeEntries.map((d) => d.avgTime),
              displayLabels: chartData.overallTimeEntries.map((d) => d.avgTimeStr),
              colors: chartData.overallTimeEntries.map((d) => d.color),
              horizontal: true,
              height: Math.max(320, chartData.overallTimeEntries.length * 26 + 34),
              logScale: logScaleTime,
            })
          )
        )
      ),

      // 2. All 12 Individual Benchmarks
      chartData.perBenchmark.map((bmCard) => {
        const chartH = Math.max(210, bmCard.refEntries.length * 26 + 34);
        return e(
          "div",
          { key: bmCard.benchmark, className: "chart-pair-box" },
          e(
            "div",
            { className: "chart-pair-header" },
            e("h3", null, `${bmCard.title} (${bmCard.totalPairs.toLocaleString()} Query Pairs)`),
            e("span", { style: { fontSize: "13px", color: "#475569" } }, bmCard.shortDesc)
          ),
          e(
            "div",
            { className: "chart-pair-grid" },
            e(
              "div",
              { className: "sub-chart-panel" },
              e(
                "h4",
                null,
                showPercent
                  ? `${bmCard.title}: Refutation Rate (%)`
                  : `${bmCard.title}: Confirmed Refutations`
              ),
              e(BarChartCanvas, {
                labels: bmCard.refEntries.map((d) => d.label),
                values: bmCard.refEntries.map((d) =>
                  showPercent ? Number(d.rate.toFixed(1)) : d.neq
                ),
                displayLabels: bmCard.refEntries.map((d) => {
                  const base = showPercent ? `${d.rate.toFixed(1)}%` : d.neq.toLocaleString();
                  return d.costStr ? `${base} ${d.costStr}` : base;
                }),
                colors: bmCard.refEntries.map((d) => d.color),
                horizontal: true,
                height: chartH,
                yMax: showPercent ? 100 : null,
              })
            ),
            e(
              "div",
              { className: "sub-chart-panel" },
              e("h4", null, `${bmCard.title}: Average Time per Refutation (seconds)`),
              e(BarChartCanvas, {
                labels: bmCard.timeEntries.map((d) => d.label),
                values: bmCard.timeEntries.map((d) => d.avgTime),
                displayLabels: bmCard.timeEntries.map((d) => d.avgTimeStr),
                colors: bmCard.timeEntries.map((d) => d.color),
                horizontal: true,
                height: chartH,
                logScale: logScaleTime,
              })
            )
          )
        );
      })
    );
  }

  // ========================================================================
  // Sortable & Checkbox-Filterable Academic Table Card
  // - Numbers use the exact same font as the row heading (var(--font-sans))
  // - Whole-cell background highlighting (td.best-td-cell)
  // - Centered data cells
  // ========================================================================
  function AcademicTableCard({ tableObj, subtitle = null, defaultSortBestTotal = false, llmCostMap = null }) {
    const [filterText, setFilterText] = useState("");
    const [showCheckboxes, setShowCheckboxes] = useState(false);

    const headers = tableObj?.headers || [];
    const rawRows = tableObj?.rows || [];
    const highlight = tableObj?.highlight;

    const isToolTable = String(headers[0] || "").trim().toLowerCase() === "tool";

    const allRowKeys = useMemo(() => {
      const keys = rawRows
        .map((r) => String(r[0] || ""))
        .filter((k) => !["overall", "total"].includes(k.toLowerCase()));
      if (isToolTable) {
        return [...keys].sort(compareToolsOnTie);
      }
      return keys;
    }, [rawRows, isToolTable]);

    const middleColIndices = useMemo(() => {
      if (headers.length <= 3) return [];
      const indices = [];
      for (let i = 1; i < headers.length - 1; i++) {
        indices.push(i);
      }
      return indices;
    }, [headers]);

    const [selectedRowKeys, setSelectedRowKeys] = useState(null);
    const [selectedColIndices, setSelectedColIndices] = useState(null);

    const activeRowSet = useMemo(
      () => new Set(selectedRowKeys !== null ? selectedRowKeys : allRowKeys),
      [selectedRowKeys, allRowKeys]
    );
    const activeColSet = useMemo(
      () => new Set(selectedColIndices !== null ? selectedColIndices : middleColIndices),
      [selectedColIndices, middleColIndices]
    );

    if (!tableObj || !headers.length || !rawRows.length) return null;

    let processedRows = rawRows.filter((r) => {
      const first = String(r[0] || "");
      const isSum = ["overall", "total"].includes(first.toLowerCase());
      if (!isSum && !activeRowSet.has(first)) return false;
      if (!filterText.trim()) return true;
      const q = filterText.toLowerCase();
      return r.some(
        (cell) => String(cell).toLowerCase().includes(q) || formatToolName(cell).toLowerCase().includes(q)
      );
    });

    const lastColIdx = headers.length - 1;
    const isMinBetter = highlight === "min";

    const getRowSortStats = (r) => {
      const directLast = parseCellFloat(r[lastColIdx]);
      let sum = 0;
      let validCount = 0;
      middleColIndices.forEach((cIdx) => {
        if (activeColSet.has(cIdx)) {
          const v = parseCellFloat(r[cIdx]);
          if (v !== null) {
            sum += v;
            validCount += 1;
          }
        }
      });
      const allColsSelected = activeColSet.size === middleColIndices.length;
      const hasFullTotal = allColsSelected
        ? directLast !== null
        : validCount > 0 && validCount === activeColSet.size;
      const mean = validCount > 0 ? sum / validCount : null;
      const primaryVal = allColsSelected && directLast !== null
        ? directLast
        : isMinBetter
        ? mean
        : sum;
      return {
        hasFullTotal,
        primaryVal,
        validCount,
        sum,
        mean,
      };
    };

    if (defaultSortBestTotal) {
      processedRows = [...processedRows].sort((a, b) => {
        const aSumRow = ["overall", "total"].includes(String(a[0] || "").toLowerCase());
        const bSumRow = ["overall", "total"].includes(String(b[0] || "").toLowerCase());
        if (aSumRow) return 1;
        if (bSumRow) return -1;

        const sa = getRowSortStats(a);
        const sb = getRowSortStats(b);

        if (isMinBetter) {
          if (sa.hasFullTotal !== sb.hasFullTotal) {
            return sa.hasFullTotal ? -1 : 1;
          }
          if (sa.hasFullTotal && sb.hasFullTotal) {
            const diff = (sa.primaryVal ?? 1e15) - (sb.primaryVal ?? 1e15);
            if (Math.abs(diff) > 1e-9) return diff;
            return compareToolsOnTie(a[0], b[0]);
          }
          if (sa.validCount !== sb.validCount) {
            return sb.validCount - sa.validCount;
          }
          const diff = (sa.mean ?? 1e15) - (sb.mean ?? 1e15);
          if (Math.abs(diff) > 1e-9) return diff;
          return compareToolsOnTie(a[0], b[0]);
        } else {
          if (sa.hasFullTotal !== sb.hasFullTotal) {
            return sa.hasFullTotal ? -1 : 1;
          }
          if (sa.hasFullTotal && sb.hasFullTotal) {
            const diff = (sb.primaryVal ?? -1) - (sa.primaryVal ?? -1);
            if (Math.abs(diff) > 1e-9) return diff;
            return compareToolsOnTie(a[0], b[0]);
          }
          const diff = (sb.sum ?? -1) - (sa.sum ?? -1);
          if (Math.abs(diff) > 1e-9) return diff;
          return compareToolsOnTie(a[0], b[0]);
        }
      });
    } else if (isToolTable) {
      processedRows = [...processedRows].sort((a, b) => {
        const aSumRow = ["overall", "total"].includes(String(a[0] || "").toLowerCase());
        const bSumRow = ["overall", "total"].includes(String(b[0] || "").toLowerCase());
        if (aSumRow) return 1;
        if (bSumRow) return -1;
        return compareToolsOnTie(a[0], b[0]);
      });
    }

    const visibleColIndices = headers
      .map((_, idx) => idx)
      .filter((idx) => {
        if (idx === 0 || idx === lastColIdx) return true;
        if (middleColIndices.length === 0) return true;
        return activeColSet.has(idx);
      });

    const colBestVals = {};
    if (highlight) {
      visibleColIndices.forEach((colIdx) => {
        if (colIdx === 0) return;
        const h = headers[colIdx];
        let mode = null;
        if (typeof highlight === "string") {
          mode = highlight;
        } else if (typeof highlight === "object" && highlight[h]) {
          mode = highlight[h];
        }
        if (!mode) return;

        const nums = [];
        processedRows.forEach((r) => {
          const first = String(r[0] || "").toLowerCase();
          if (first === "total" || first === "overall") return;
          const v = parseCellFloat(r[colIdx]);
          if (v !== null) nums.push(v);
        });
        if (nums.length > 0) {
          colBestVals[colIdx] = mode === "min" ? Math.min(...nums) : Math.max(...nums);
        }
      });
    }

    const isCellBest = (colIdx, record) => {
      if (colIdx === 0) return false;
      const firstCell = String(record["0"] || "").toLowerCase();
      const isSummaryRow = firstCell === "overall" || firstCell === "total";
      if (isSummaryRow) return false;
      const rawStr = String(record[String(colIdx)] ?? "--");
      const numVal = parseCellFloat(rawStr);
      const targetBest = colBestVals[colIdx];
      return numVal !== null && targetBest !== undefined && Math.abs(numVal - targetBest) < 1e-6;
    };

    const columns = visibleColIndices.map((colIdx) => {
      const h = headers[colIdx];
      return {
        title: colIdx === 0 ? h : formatBenchmarkName(h),
        dataIndex: String(colIdx),
        key: String(colIdx),
        fixed: colIdx === 0 ? "left" : undefined,
        width: colIdx === 0 ? 175 : undefined,
        align: colIdx === 0 ? "left" : "center",
        onCell: (record) => ({
          className: isCellBest(colIdx, record) ? "best-td-cell" : "",
        }),
        sortDirections: colIdx === 0 ? ["ascend", "descend"] : isMinBetter ? ["ascend", "descend"] : ["descend", "ascend"],
        sorter: (a, b) => {
          const aFirst = String(a["0"] || "").toLowerCase();
          const bFirst = String(b["0"] || "").toLowerCase();
          if (aFirst === "overall" || aFirst === "total") return 1;
          if (bFirst === "overall" || bFirst === "total") return -1;
          if (colIdx === 0) {
            if (isToolTable) {
              return compareToolsOnTie(a["0"], b["0"]);
            }
            return formatBenchmarkName(a["0"]).localeCompare(formatBenchmarkName(b["0"]));
          }
          const fallback = isMinBetter ? 1e15 : -1e15;
          const na = parseCellFloat(a[String(colIdx)]) ?? fallback;
          const nb = parseCellFloat(b[String(colIdx)]) ?? fallback;
          if (Math.abs(na - nb) > 1e-9) {
            return na - nb;
          }
          const tieDiff = compareToolsOnTie(a["0"], b["0"]);
          return isMinBetter ? tieDiff : -tieDiff;
        },
        render: (val, record) => {
          if (colIdx === 0) {
            const raw = String(val || "");
            const isSummaryRow = ["overall", "total"].includes(raw.toLowerCase());
            if (isSummaryRow) {
              return e("strong", null, raw);
            }
            if (TOOL_META[raw]) {
              return renderToolLabelNode(raw);
            }
            return e("span", { style: { fontWeight: 600 } }, formatBenchmarkName(raw));
          }
          const rawStr = String(val ?? "--");
          const firstCell = String(record["0"] || "").toLowerCase();
          const isSummaryRow = firstCell === "overall" || firstCell === "total";

          let costBadge = null;
          if (llmCostMap && isLlmTool(firstCell) && rawStr !== "--") {
            const hRaw = String(headers[colIdx] || "").trim();
            const bmMatch = hRaw.match(/^([a-z0-9_-]+)/i);
            const bmKey = colIdx === lastColIdx ? "overall" : (bmMatch ? bmMatch[1].toLowerCase() : "");
            const costVal = llmCostMap[firstCell]?.[bmKey];
            if (costVal !== undefined) {
              costBadge = e(
                "span",
                {
                  style: {
                    fontWeight: 700,
                    color: "#c2410c",
                    marginLeft: 4,
                  },
                },
                formatCostBracket(costVal)
              );
            }
          }

          return e(
            "span",
            {
              className: "num-cell",
              style: isSummaryRow ? { fontWeight: 700 } : undefined,
            },
            rawStr,
            costBadge
          );
        },
      };
    });

    const dataSource = processedRows.map((r, rIdx) => {
      const obj = { key: String(rIdx) };
      headers.forEach((_, cIdx) => {
        obj[String(cIdx)] = r[cIdx];
      });
      return obj;
    });

    return e(
      "div",
      { className: "booktabs-table-wrap" },
      e(
        "div",
        { className: "booktabs-caption" },
        e(
          "div",
          null,
          e("h3", null, tableObj.title),
          subtitle ? e("span", null, subtitle) : null
        ),
        e(
          Space,
          { size: 8, wrap: true },
          e(
            Button,
            {
              size: "small",
              type: showCheckboxes ? "primary" : "default",
              onClick: () => setShowCheckboxes(!showCheckboxes),
            },
            showCheckboxes ? "Hide Filters" : "Filter Tools / Benchmarks"
          ),
          e(Input.Search, {
            placeholder: "Search...",
            allowClear: true,
            value: filterText,
            onChange: (ev) => setFilterText(ev.target.value),
            style: { width: 185 },
            size: "small",
          })
        )
      ),

      showCheckboxes
        ? e(
            "div",
            { className: "table-checkbox-bar" },
            e(
              "div",
              { style: { marginBottom: middleColIndices.length > 0 ? 8 : 0 } },
              e(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 } },
                e("strong", null, `Select ${headers[0] || "Rows"}:`),
                e(
                  Button,
                  { size: "small", type: "link", style: { padding: 0 }, onClick: () => setSelectedRowKeys(allRowKeys) },
                  "Select All"
                ),
                e(
                  Button,
                  { size: "small", type: "link", style: { padding: 0 }, onClick: () => setSelectedRowKeys([]) },
                  "Clear"
                )
              ),
              e(Checkbox.Group, {
                value: Array.from(activeRowSet),
                onChange: (vals) => setSelectedRowKeys(vals),
                options: allRowKeys.map((k) => ({
                  label: TOOL_META[k] ? formatToolName(k) : formatBenchmarkName(k),
                  value: k,
                })),
              })
            ),
            middleColIndices.length > 0
              ? e(
                  "div",
                  null,
                  e(
                    "div",
                    { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 } },
                    e("strong", null, "Select Columns:"),
                    e(
                      Button,
                      { size: "small", type: "link", style: { padding: 0 }, onClick: () => setSelectedColIndices(middleColIndices) },
                      "Select All"
                    ),
                    e(
                      Button,
                      { size: "small", type: "link", style: { padding: 0 }, onClick: () => setSelectedColIndices([]) },
                      "Clear"
                    )
                  ),
                  e(Checkbox.Group, {
                    value: Array.from(activeColSet),
                    onChange: (vals) => setSelectedColIndices(vals),
                    options: middleColIndices.map((cIdx) => ({
                      label: formatBenchmarkName(headers[cIdx]),
                      value: cIdx,
                    })),
                  })
                )
              : null
          )
        : null,

      e(Table, {
        columns,
        dataSource,
        pagination: dataSource.length > 20 ? { pageSize: 20, showSizeChanger: true } : false,
        size: "small",
        scroll: { x: "max-content" },
        bordered: true,
      })
    );
  }

  // ========================================================================
  // View 2: Equivalence Refutations Section (Sorted by Best Total on Top)
  // ========================================================================
  function RefutationsSection({ summary }) {
    const byId = {};
    (summary?.tables || []).forEach((t) => {
      byId[t.id] = t;
    });
    const llmCostMap = useMemo(() => buildLlmCostMap(summary), [summary]);

    return e(
      "div",
      null,
      e(Alert, {
        type: "info",
        showIcon: true,
        style: {
          marginBottom: 18,
          border: "1px solid #93c5fd",
          background: "#eff6ff",
          borderRadius: 6,
        },
        message: e(
          "span",
          { style: { fontWeight: 700, fontSize: "14px", color: "#1e3a8a" } },
          "Reproducible Counterexamples (.sql) & Raw Evaluation CSVs"
        ),
        description: e(
          "span",
          null,
          "All counterexamples from the evaluation results are available to inspect and reproduce in the repository on ",
          extLink("GitHub", LASSO_GOLD_CEX_URL),
          ", and for inspecting LASSO-exclusive counterexamples see ",
          extLink("GitHub", LASSO_EXCLUSIVE_CEX_URL),
          "."
        ),
      }),
      e(AcademicTableCard, {
        tableObj: byId["refutations-on-the-unified-benchmark"],
        subtitle: "Sorted by highest total confirmed refutations from top.",
        defaultSortBestTotal: true,
        llmCostMap,
      }),
      e(AcademicTableCard, {
        tableObj: byId["refutations-on-common-supported-queries"],
        subtitle: "Refutations restricted to the common subset of query pairs where no baseline encountered a tool error.",
        defaultSortBestTotal: true,
      }),
      e(AcademicTableCard, {
        tableObj: byId["refutations-on-queries-excluding-order-by-and-limit"],
        subtitle: "Refutations on query pairs excluding ORDER BY and LIMIT clauses.",
        defaultSortBestTotal: true,
      }),
      e(AcademicTableCard, {
        tableObj: byId["refutation-origin-in-lasso-cc"],
        subtitle: "Breakdown of refutations in LASSO-CC originating from Gold query datasets (1-way) vs. Prediction query datasets (2-way cross-checking).",
      })
    );
  }

  // ========================================================================
  // View 3: Execution Time & Latency Section (Sorted by Best Overall/Total from Top)
  // ========================================================================
  function EfficiencySection({ summary }) {
    const byId = {};
    (summary?.tables || []).forEach((t) => {
      byId[t.id] = t;
    });

    return e(
      "div",
      null,
      e(AcademicTableCard, {
        tableObj: byId["average-time-per-refutation-seconds"],
        subtitle: "Mean tool execution time (in seconds) per confirmed refutation across each benchmark (sorted by fastest Overall from top).",
        defaultSortBestTotal: true,
      }),
      e(AcademicTableCard, {
        tableObj: byId["total-execution-time-seconds"],
        subtitle: "Total data generation / tool execution time (in seconds) spent on each benchmark (sorted by lowest Total Time from top).",
        defaultSortBestTotal: true,
      })
    );
  }

  // ========================================================================
  // View 4: LLM Token & Cost Breakdown Section (Whole-cell cost highlight + centered)
  // ========================================================================
  function LlmTokensCostSection({ summary }) {
    const [inputRate, setInputRate] = useState(2.0);
    const [outputRate, setOutputRate] = useState(10.0);
    const [thinkingRate, setThinkingRate] = useState(10.0);
    const [selectedBms, setSelectedBms] = useState(null);
    const [showCheckboxes, setShowCheckboxes] = useState(false);

    const byId = {};
    (summary?.tables || []).forEach((t) => {
      byId[t.id] = t;
    });

    function renderCompactTokenCostTable(rawTable, labelTitle, subtitle) {
      if (!rawTable || !rawTable.rows) return null;

      const allBmKeys = rawTable.rows
        .map((r) => String(r[0]))
        .filter((k) => k.toLowerCase() !== "overall");
      const activeBmSet = new Set(selectedBms !== null ? selectedBms : allBmKeys);

      const headersLower = (rawTable.headers || []).map((h) => String(h).trim().toLowerCase());
      const inpColIdx = headersLower.indexOf("input tokens") !== -1 ? headersLower.indexOf("input tokens") : 2;
      const outColIdx = headersLower.indexOf("output tokens") !== -1 ? headersLower.indexOf("output tokens") : 3;
      const thinkColIdx = headersLower.indexOf("thinking tokens");
      const totColIdx = headersLower.indexOf("total tokens") !== -1 ? headersLower.indexOf("total tokens") : (thinkColIdx !== -1 ? 5 : 4);

      const parsedRows = rawTable.rows
        .filter((r) => {
          const name = String(r[0]);
          if (name.toLowerCase() === "overall") return true;
          return activeBmSet.has(name);
        })
        .map((r, idx) => {
          const expName = r[0];
          const queries = parseInt(String(r[1]).replace(/,/g, ""), 10) || 0;
          const inp = parseInt(String(r[inpColIdx] ?? 0).replace(/,/g, ""), 10) || 0;
          const out = parseInt(String(r[outColIdx] ?? 0).replace(/,/g, ""), 10) || 0;
          const tot = parseInt(String(r[totColIdx] ?? 0).replace(/,/g, ""), 10) || 0;
          const think = thinkColIdx !== -1
            ? (parseInt(String(r[thinkColIdx] ?? 0).replace(/,/g, ""), 10) || 0)
            : Math.max(0, tot - inp - out);

          const costTotal =
            (inp / 1e6) * (inputRate || 0) +
            (out / 1e6) * (outputRate || 0) +
            (think / 1e6) * (thinkingRate || 0);

          return {
            key: String(idx),
            expName,
            queries,
            inp,
            out,
            think,
            tot,
            costTotal,
            isOverall: String(expName).toLowerCase() === "overall",
          };
        });

      const hasThinking = parsedRows.some((r) => r.think > 0);

      const columns = [
        {
          title: "Benchmark",
          dataIndex: "expName",
          key: "expName",
          width: 150,
          align: "left",
          render: (v, r) =>
            e(
              "span",
              { style: { fontWeight: r.isOverall ? 700 : 600 } },
              r.isOverall ? "Overall" : formatBenchmarkName(v)
            ),
        },
        {
          title: "Queries",
          dataIndex: "queries",
          key: "queries",
          align: "center",
          sorter: (a, b) => (a.isOverall ? 1 : b.isOverall ? -1 : a.queries - b.queries),
          render: (v, r) =>
            e("span", { className: "num-cell", style: r.isOverall ? { fontWeight: 700 } : null }, v.toLocaleString()),
        },
        {
          title: "Input Tokens",
          dataIndex: "inp",
          key: "inp",
          align: "center",
          sorter: (a, b) => (a.isOverall ? 1 : b.isOverall ? -1 : a.inp - b.inp),
          render: (v, r) =>
            e("span", { className: "num-cell", style: r.isOverall ? { fontWeight: 700 } : null }, v.toLocaleString()),
        },
        {
          title: "Output Tokens",
          dataIndex: "out",
          key: "out",
          align: "center",
          sorter: (a, b) => (a.isOverall ? 1 : b.isOverall ? -1 : a.out - b.out),
          render: (v, r) =>
            e("span", { className: "num-cell", style: r.isOverall ? { fontWeight: 700 } : null }, v.toLocaleString()),
        },
        ...(hasThinking
          ? [
              {
                title: "Thinking Tokens",
                dataIndex: "think",
                key: "think",
                align: "center",
                sorter: (a, b) => (a.isOverall ? 1 : b.isOverall ? -1 : a.think - b.think),
                render: (v, r) =>
                  e(
                    "span",
                    { className: "num-cell", style: r.isOverall ? { fontWeight: 700 } : null },
                    v.toLocaleString()
                  ),
              },
            ]
          : []),
        {
          title: "Total Tokens",
          dataIndex: "tot",
          key: "tot",
          align: "center",
          sorter: (a, b) => (a.isOverall ? 1 : b.isOverall ? -1 : a.tot - b.tot),
          render: (v, r) =>
            e("span", { className: "num-cell", style: r.isOverall ? { fontWeight: 700 } : null }, v.toLocaleString()),
        },
        {
          title: "Cost ($)",
          dataIndex: "costTotal",
          key: "costTotal",
          align: "center",
          width: 140,
          onCell: () => ({
            className: "cost-td-cell",
          }),
          sorter: (a, b) => (a.isOverall ? 1 : b.isOverall ? -1 : a.costTotal - b.costTotal),
          render: (v) =>
            e("span", { className: "num-cell" }, `$${v.toFixed(2)}`),
        },
      ];

      return e(
        "div",
        { className: "booktabs-table-wrap", style: { maxWidth: 960, margin: "0 auto 24px auto" } },
        e(
          "div",
          { className: "booktabs-caption" },
          e(
            "div",
            null,
            e("h3", null, labelTitle),
            e("span", null, subtitle)
          ),
          e(
            Button,
            {
              size: "small",
              type: showCheckboxes ? "primary" : "default",
              onClick: () => setShowCheckboxes(!showCheckboxes),
            },
            showCheckboxes ? "Hide Filters" : "Filter Benchmarks"
          )
        ),
        showCheckboxes
          ? e(
              "div",
              { className: "table-checkbox-bar" },
              e(Checkbox.Group, {
                value: Array.from(activeBmSet),
                onChange: (vals) => setSelectedBms(vals),
                options: allBmKeys.map((k) => ({ label: formatBenchmarkName(k), value: k })),
              })
            )
          : null,
        e(Table, {
          columns,
          dataSource: parsedRows,
          pagination: false,
          size: "small",
          bordered: true,
        })
      );
    }

    return e(
      "div",
      null,
      e(
        "div",
        {
          style: {
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "14px 20px",
            margin: "0 auto 20px auto",
            maxWidth: 960,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
          },
        },
        e(
          "div",
          null,
          e("div", { style: { fontWeight: 700, fontSize: "14px", color: "#0f172a" } }, "Token Cost Rates (USD per 1M Tokens)"),
          e("div", { style: { fontSize: "12.5px", color: "#64748b" } }, "Default: Gemini 4 Argon ($2.00 / 1M input, $10.00 / 1M output & thinking)")
        ),
        e(
          Space,
          { size: 16, wrap: true },
          e(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 6 } },
            e("span", { style: { fontWeight: 600, fontSize: "13px" } }, "Input ($/1M):"),
            e(InputNumber, {
              value: inputRate,
              min: 0,
              step: 0.25,
              prefix: "$",
              onChange: (v) => setInputRate(v ?? 0),
              size: "small",
              style: { width: 90 },
            })
          ),
          e(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 6 } },
            e("span", { style: { fontWeight: 600, fontSize: "13px" } }, "Output ($/1M):"),
            e(InputNumber, {
              value: outputRate,
              min: 0,
              step: 0.5,
              prefix: "$",
              onChange: (v) => setOutputRate(v ?? 0),
              size: "small",
              style: { width: 90 },
            })
          ),
          e(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 6 } },
            e("span", { style: { fontWeight: 600, fontSize: "13px" } }, "Thinking ($/1M):"),
            e(InputNumber, {
              value: thinkingRate,
              min: 0,
              step: 0.5,
              prefix: "$",
              onChange: (v) => setThinkingRate(v ?? 0),
              size: "small",
              style: { width: 90 },
            })
          )
        )
      ),

      ...(summary?.tables || [])
        .filter((t) => String(t.id || "").endsWith("-token-usage-analysis"))
        .map((t) =>
          renderCompactTokenCostTable(
            t,
            t.title || "LLM Token & Cost Breakdown",
            t.id.includes("-tdg-")
              ? "Single-query test data generation token consumption and cost."
              : "Pairwise equivalence refutation token consumption and cost."
          )
        )
    );
  }

  // ========================================================================
  // View 5: Attack Strategies & Dataset Statistics Section
  // ========================================================================
  function StrategiesSection({ summary }) {
    const byId = {};
    (summary?.tables || []).forEach((t) => {
      byId[t.id] = t;
    });

    return e(
      "div",
      null,
      summary?.strategy_data?.ranked
        ? e(AcademicTableCard, {
            tableObj: {
              title: "LASSO Attack Strategy Effectiveness (Ranked by Confirmed Kills)",
              headers: summary.strategy_data.ranked.headers,
              rows: summary.strategy_data.ranked.rows,
            },
            subtitle: "Contribution of individual imperative attack strategies in LASSO across the unified benchmark.",
          })
        : null,
      summary?.strategy_data?.matrix
        ? e(AcademicTableCard, {
            tableObj: {
              title: "Per-Benchmark Attack Strategy Kill Matrix",
              headers: summary.strategy_data.matrix.headers,
              rows: summary.strategy_data.matrix.rows,
            },
            subtitle: "Strategy-level kill counts broken down by individual benchmark.",
          })
        : null,
      e(AcademicTableCard, {
        tableObj: byId["lasso-generated-datasets-per-query-all-evaluated-queries"],
        subtitle: "Summary statistics of test datasets synthesized per query by LASSO.",
      }),
      e(AcademicTableCard, {
        tableObj: byId["lasso-counterexample-dataset-row-counts-confirmed-refutations"],
        subtitle: "Summary statistics of total INSERT row counts in LASSO's counterexample datasets.",
      })
    );
  }

  // ========================================================================
  // View 6: Status & Dialect Breakdown Section
  // ========================================================================
  function StatusSection({ summary }) {
    const [selectedToolStatus, setSelectedToolStatus] = useState("lasso");

    const byId = {};
    (summary?.tables || []).forEach((t) => {
      byId[t.id] = t;
    });
    const statusToolTables = (summary?.tables || [])
      .filter((t) => t.id.startsWith("status-breakdown-"))
      .sort((a, b) => {
        const toolA = a.title.replace("Status Breakdown: ", "").trim();
        const toolB = b.title.replace("Status Breakdown: ", "").trim();
        return compareToolsOnTie(toolA, toolB);
      });

    return e(
      "div",
      null,
      e(AcademicTableCard, {
        tableObj: byId["overall-status-breakdown"],
        subtitle: "Consolidated evaluation status counts across all tools.",
      }),
      e(
        "div",
        {
          style: {
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "12px 18px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          },
        },
        e("span", { style: { fontWeight: 700, fontSize: "14px" } }, "Select Tool for Per-Benchmark Status Breakdown:"),
        e(Select, {
          value: selectedToolStatus,
          onChange: (val) => setSelectedToolStatus(val),
          style: { width: 220 },
          options: statusToolTables.map((t) => {
            const rawTool = t.title.replace("Status Breakdown: ", "").trim();
            return {
              label: formatToolName(rawTool),
              value: rawTool,
            };
          }),
        })
      ),
      e(AcademicTableCard, {
        tableObj: statusToolTables.find(
          (t) => t.title.replace("Status Breakdown: ", "").trim() === selectedToolStatus
        ),
      }),
      byId["dialect-comparison-sqlite-vs-postgresql"]
        ? e(AcademicTableCard, {
            tableObj: byId["dialect-comparison-sqlite-vs-postgresql"],
            subtitle: "Comparison of refutation counts between SQLite and PostgreSQL execution environments.",
            defaultSortBestTotal: true,
          })
        : null
    );
  }

  // ========================================================================
  // View 7: LASSO-Exclusive Refutations (Optimized & Fixed-Layout No Overflow)
  // ========================================================================
  function ExclusiveSearchInput({ onCommitSearch }) {
    const [text, setText] = useState("");
    return e(Input.Search, {
      placeholder: "Search query ID, SQL construct, or strategy...",
      value: text,
      allowClear: true,
      onChange: (ev) => {
        const val = ev.target.value;
        setText(val);
        if (!val) {
          onCommitSearch("");
        }
      },
      onSearch: (val) => {
        onCommitSearch(val);
      },
      style: { flex: 1, minWidth: 220 },
    });
  }

  function LassoExclusiveQueriesSection({ summary }) {
    const [benchmark, setBenchmark] = useState("all");
    const [strategy, setStrategy] = useState("all");
    const [source, setSource] = useState("all");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    const [loading, setLoading] = useState(false);
    const [dataPayload, setDataPayload] = useState({
      total: 0,
      rows: [],
      summary_by_benchmark: [],
      strategies: [],
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [activeQuery, setActiveQuery] = useState(null);
    const [queryDetail, setQueryDetail] = useState(null);

    const fetchExclusiveQueries = useCallback(async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const params = new URLSearchParams({
          mode: "all",
          benchmark,
          strategy,
          source,
          search: appliedSearch,
          limit: String(pageSize),
          offset: String(offset),
        });
        const res = await fetch(`/api/lasso_exclusive?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setDataPayload(json);
        }
      } catch (err) {
        console.error("Failed to load LASSO-exclusive queries:", err);
      } finally {
        setLoading(false);
      }
    }, [benchmark, strategy, source, appliedSearch, page, pageSize]);

    useEffect(() => {
      fetchExclusiveQueries();
    }, [fetchExclusiveQueries]);

    const openSqlModal = useCallback(async (record) => {
      setActiveQuery(record);
      setQueryDetail(null);
      setModalOpen(true);
      setModalLoading(true);
      try {
        const params = new URLSearchParams({
          benchmark: record.benchmark || "",
          instance_id: record.instance_id || "",
          prediction_id: record.prediction_id || "",
          cex: record.reproducible_cex || "",
        });
        const res = await fetch(`/api/query_detail?${params.toString()}`);
        if (res.ok) {
          const detail = await res.json();
          setQueryDetail(detail);
        }
      } catch (err) {
        console.error("Failed to load .sql counterexample:", err);
      } finally {
        setModalLoading(false);
      }
    }, []);

    const handleCopySql = () => {
      if (!queryDetail || !queryDetail.cex_sql) return;
      navigator.clipboard.writeText(queryDetail.cex_sql).then(() => {
        message.success("Copied full .sql counterexample to clipboard");
      });
    };

    const handleDownloadSql = () => {
      if (!queryDetail || !queryDetail.cex_sql) return;
      const blob = new Blob([queryDetail.cex_sql], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${queryDetail.prediction_id || "counterexample"}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const bmSummary = dataPayload.summary_by_benchmark || summary?.lasso_exclusive_summary || [];

    const columns = useMemo(
      () => [
        {
          title: "Benchmark & Query ID",
          key: "id",
          width: "16%",
          align: "left",
          render: (_, r) =>
            e(
              "div",
              { style: { overflow: "hidden", textOverflow: "ellipsis" } },
              e(
                "div",
                { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } },
                e("span", { className: "status-chip chip-blue" }, formatBenchmarkName(r.benchmark)),
                r.database_id
                  ? e("span", { style: { fontSize: "11.5px", color: "#475569" } }, r.database_id)
                  : null
              ),
              e(
                "div",
                {
                  style: {
                    fontSize: "13px",
                    fontWeight: 700,
                    marginTop: 4,
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                  title: r.prediction_id,
                },
                r.prediction_id
              ),
              e("div", { style: { fontSize: "11.5px", color: "#64748b" } }, `Instance: ${r.instance_id}`)
            ),
        },
        {
          title: "LASSO Attack Strategy & Source",
          key: "strategy",
          width: "18%",
          align: "center",
          render: (_, r) =>
            e(
              "div",
              { style: { overflow: "hidden", textOverflow: "ellipsis" } },
              e(
                "div",
                {
                  style: {
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "#1e3a8a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                  title: r.strategy_class || "BaseDatasetStrategy",
                },
                r.strategy_class || "BaseDatasetStrategy"
              ),
              e(
                "div",
                { style: { marginTop: 4 } },
                e(
                  "span",
                  {
                    className: `status-chip ${r.dataset_source === "gold" ? "chip-blue" : "chip-purple"}`,
                  },
                  r.dataset_source === "gold" ? "Gold Query (1-Way)" : "Pred Query (2-Way CC)"
                )
              )
            ),
        },
        {
          title: "SQL Queries (Reference vs. Candidate)",
          key: "sql",
          width: "35%",
          align: "left",
          render: (_, r) =>
            e(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0, width: "100%" } },
              e(
                "div",
                { className: "sql-preview-snippet", title: r.gold_sql },
                e("strong", { style: { color: "#0f172a" } }, "Gold: "),
                r.gold_sql || "--"
              ),
              e(
                "div",
                { className: "sql-preview-snippet", title: r.prediction_sql },
                e("strong", { style: { color: "#1d4ed8" } }, "Pred: "),
                r.prediction_sql || "--"
              )
            ),
        },
        {
          title: "Other Tools' Outcomes",
          key: "others",
          width: "19%",
          align: "center",
          render: (_, r) => {
            const entries = Object.entries(r.other_statuses || {});
            return e(
              "div",
              { style: { display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" } },
              entries.map(([t, st]) =>
                e(
                  "span",
                  {
                    key: t,
                    className: "status-chip",
                  },
                  `${formatToolName(t)}: ${st}`
                )
              )
            );
          },
        },
        {
          title: "Counterexample",
          key: "action",
          width: "12%",
          align: "center",
          render: (_, r) =>
            e(
              Button,
              {
                type: "primary",
                size: "small",
                onClick: (ev) => {
                  ev.stopPropagation();
                  openSqlModal(r);
                },
              },
              "Inspect .sql"
            ),
        },
      ],
      [openSqlModal]
    );

    return e(
      "div",
      null,
      e(
        "div",
        {
          style: {
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "14px 20px",
            marginBottom: "18px",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
          },
        },
        e(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 6 } },
          e("span", { style: { fontWeight: 600, fontSize: "13px" } }, "Benchmark:"),
          e(Select, {
            value: benchmark,
            onChange: (val) => {
              setBenchmark(val);
              setPage(1);
            },
            style: { width: 185 },
            options: [
              { label: "All Benchmarks", value: "all" },
              ...bmSummary
                .filter((b) => b.exclusive_vs_all > 0)
                .map((b) => ({
                  label: `${formatBenchmarkName(b.benchmark)} (${b.exclusive_vs_all})`,
                  value: b.benchmark,
                })),
            ],
          })
        ),
        e(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 6 } },
          e("span", { style: { fontWeight: 600, fontSize: "13px" } }, "Attack Strategy:"),
          e(Select, {
            value: strategy,
            onChange: (val) => {
              setStrategy(val);
              setPage(1);
            },
            style: { width: 265 },
            showSearch: true,
            options: [
              { label: "All Attack Strategies", value: "all" },
              ...(dataPayload.strategies || []).map((s) => ({
                label: `${s.strategy} (${s.count})`,
                value: s.strategy,
              })),
            ],
          })
        ),
        e(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 6 } },
          e("span", { style: { fontWeight: 600, fontSize: "13px" } }, "Source:"),
          e(Select, {
            value: source,
            onChange: (val) => {
              setSource(val);
              setPage(1);
            },
            style: { width: 180 },
            options: [
              { label: "All Sources (Gold + CC)", value: "all" },
              { label: "Gold Query Only (1-Way)", value: "gold" },
              { label: "Pred Query (2-Way CC)", value: "pred" },
            ],
          })
        ),
        e(ExclusiveSearchInput, {
          onCommitSearch: (val) => {
            setAppliedSearch(val);
            setPage(1);
          },
        }),
        e(
          "span",
          { className: "status-chip chip-blue", style: { fontSize: "12.5px", padding: "3px 10px" } },
          `${dataPayload.total.toLocaleString()} LASSO-Only NEQ Queries`
        )
      ),

      e(
        "div",
        { className: "booktabs-table-wrap" },
        e(Table, {
          rowKey: (r) => `${r.benchmark}::${r.prediction_id}`,
          tableLayout: "fixed",
          columns,
          dataSource: dataPayload.rows,
          loading,
          size: "small",
          bordered: true,
          rowClassName: () => "clickable-row",
          onRow: (record) => ({
            onClick: () => openSqlModal(record),
          }),
          pagination: {
            current: page,
            pageSize: pageSize,
            total: dataPayload.total,
            showSizeChanger: true,
            pageSizeOptions: ["15", "25", "50", "100"],
            showTotal: (tot, range) => `${range[0]}-${range[1]} of ${tot.toLocaleString()} instances`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          },
        })
      ),

      e(
        Modal,
        {
          open: modalOpen,
          onCancel: () => setModalOpen(false),
          width: 1120,
          footer: [
            e(
              Button,
              { key: "copy", onClick: handleCopySql, disabled: !queryDetail?.cex_sql },
              "Copy Full .sql"
            ),
            e(
              Button,
              { key: "download", onClick: handleDownloadSql, disabled: !queryDetail?.cex_sql },
              "Download .sql File"
            ),
            queryDetail?.cex_path
              ? e(
                  Button,
                  {
                    key: "raw",
                    href: `/results/${queryDetail.cex_path}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  },
                  "Open Raw .sql in New Tab"
                )
              : null,
            e(
              Button,
              { key: "close", type: "primary", onClick: () => setModalOpen(false) },
              "Close"
            ),
          ],
          title: activeQuery
            ? `LASSO Counterexample Details: ${formatBenchmarkName(activeQuery.benchmark)} / ${activeQuery.prediction_id}`
            : "LASSO Counterexample Details",
        },
        modalLoading
          ? e("div", { style: { padding: "56px 0", textAlign: "center" } }, e(Spin, { size: "large" }))
          : queryDetail
          ? e(
              "div",
              null,
              e(
                Descriptions,
                {
                  bordered: true,
                  size: "small",
                  column: { xs: 1, sm: 2, md: 3 },
                  style: { marginBottom: 12 },
                },
                e(Descriptions.Item, { label: "Benchmark" }, formatBenchmarkName(queryDetail.benchmark)),
                e(Descriptions.Item, { label: "Instance / Schema" }, `${queryDetail.instance_id} (${queryDetail.database_id || "default"})`),
                e(Descriptions.Item, { label: "Prediction ID" }, e("code", null, queryDetail.prediction_id)),
                e(
                  Descriptions.Item,
                  { label: "LASSO Killing Strategy" },
                  e("code", { style: { fontSize: "12px", color: "#1e3a8a", fontWeight: 700 } }, activeQuery?.dataset_strategy || "BaseDatasetStrategy")
                ),
                e(
                  Descriptions.Item,
                  { label: "Dataset Source" },
                  activeQuery?.dataset_source === "gold" ? "Gold Query (1-Way LASSO)" : "Prediction Query (2-Way LASSO-CC)"
                ),
                e(
                  Descriptions.Item,
                  { label: ".sql File Path" },
                  e("code", { style: { fontSize: "11.5px" } }, queryDetail.cex_path || "--")
                )
              ),

              e(
                "div",
                {
                  style: {
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    padding: "8px 14px",
                    marginBottom: "18px",
                    borderRadius: 5,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    alignItems: "center",
                  },
                },
                e("span", { style: { fontWeight: 700, fontSize: "12.5px", marginRight: 4 } }, "Tool Evaluation Outcomes:"),
                (queryDetail.tool_comparison || []).map((tc) => {
                  const isLasso = tc.tool === "lasso";
                  const isNeq = tc.status === "NEQ" || tc.status === "NEQ_SCO";
                  return e(
                    Tag,
                    {
                      key: tc.tool,
                      color: isLasso ? "blue" : isNeq ? "green" : "default",
                      style: { margin: 0, fontWeight: isLasso ? 700 : 500 },
                    },
                    `${formatToolName(tc.tool)}: ${tc.status}`
                  );
                })
              ),

              e(
                "h4",
                { style: { fontFamily: "var(--font-serif)", fontSize: "16.5px", fontWeight: 700, margin: "0 0 8px 0" } },
                "1. SQL Queries (Reference vs. Candidate Mutant)"
              ),
              e(
                "div",
                { className: "chart-pair-grid", style: { marginBottom: 18 } },
                e(
                  "div",
                  null,
                  e("div", { style: { fontWeight: 600, fontSize: "13px", marginBottom: 4, color: "#0f172a" } }, "Reference (Gold) SQL Query:"),
                  renderHighlightedSql(queryDetail.gold_sql_pretty || queryDetail.gold_sql)
                ),
                e(
                  "div",
                  null,
                  e("div", { style: { fontWeight: 600, fontSize: "13px", marginBottom: 4, color: "#1d4ed8" } }, "Candidate (Prediction) SQL Query:"),
                  renderHighlightedSql(queryDetail.prediction_sql_pretty || queryDetail.prediction_sql)
                )
              ),

              e(
                "h4",
                { style: { fontFamily: "var(--font-serif)", fontSize: "16.5px", fontWeight: 700, margin: "0 0 8px 0" } },
                "2. Generated Counterexample Dataset (Populated Tables)"
              ),
              queryDetail.dataset_tables && queryDetail.dataset_tables.length > 0
                ? e(
                    "div",
                    {
                      style: {
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                        gap: 14,
                        marginBottom: 18,
                      },
                    },
                    queryDetail.dataset_tables.map((tbl) =>
                      e(RelationalGrid, {
                        key: tbl.table_name,
                        title: `Table: ${tbl.table_name}`,
                        columns: tbl.columns,
                        rows: tbl.rows,
                      })
                    )
                  )
                : e(
                    "div",
                    {
                      style: {
                        padding: "10px 14px",
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        borderRadius: 5,
                        marginBottom: 18,
                      },
                    },
                    "Empty Database Instance (0 rows across all schema tables)"
                  ),

              e(
                "h4",
                { style: { fontFamily: "var(--font-serif)", fontSize: "16.5px", fontWeight: 700, margin: "0 0 8px 0" } },
                "3. Divergent Query Execution Results on Counterexample Dataset"
              ),
              e(
                "div",
                { className: "chart-pair-grid", style: { marginBottom: 18 } },
                e(RelationalGrid, {
                  title: "Reference (Gold) Query Result",
                  columns: queryDetail.gold_result_table?.columns || [],
                  rows: queryDetail.gold_result_table?.rows || [],
                  rawText: queryDetail.gold_result_table?.raw_text || activeQuery?.gold_result,
                  error: queryDetail.gold_result_table?.error,
                }),
                e(RelationalGrid, {
                  title: "Candidate (Prediction) Query Result",
                  columns: queryDetail.pred_result_table?.columns || [],
                  rows: queryDetail.pred_result_table?.rows || [],
                  rawText: queryDetail.pred_result_table?.raw_text || activeQuery?.pred_result,
                  error: queryDetail.pred_result_table?.error,
                })
              ),

              e(
                "h4",
                { style: { fontFamily: "var(--font-serif)", fontSize: "16.5px", fontWeight: 700, margin: "0 0 8px 0" } },
                "4. Full Reproducible Counterexample Script (.sql)"
              ),
              renderHighlightedSql(queryDetail.cex_sql || "-- .sql file not found --")
            )
          : null
      )
    );
  }

  // ========================================================================
  // Root Results Application
  // - Uses Left Sidebar Only (no top tabs)
  // - 1st item in Sidebar: Overview (activeSection = "info")
  // - Default open tab when visiting /results: 1. Bar Charts (activeSection = "charts")
  // ========================================================================
  function ResultsApp() {
    const validSections = [
      "charts",
      "refutations",
      "efficiency",
      "tokens",
      "strategies",
      "status",
    ];

    const initialSection = () => {
      const h = (window.location.hash || "").replace("#", "").trim();
      if (validSections.includes(h)) return h;
      return "charts";
    };

    const [activeSection, setActiveSection] = useState(initialSection);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function loadSummary() {
        setLoading(true);
        try {
          let res = await fetch("/api/summary");
          if (!res.ok) {
            res = await fetch("/static/data/summary.json");
          }
          if (!res.ok) {
            res = await fetch("static/data/summary.json");
          }
          if (res.ok) {
            const data = await res.json();
            setSummary(data);
          }
        } catch (err) {
          console.error("Error fetching summary:", err);
        } finally {
          setLoading(false);
        }
      }
      loadSummary();
    }, []);

    const handleSectionChange = (key) => {
      setActiveSection(key);
      window.history.replaceState(null, "", `#${key}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const currentSectionMeta = ANALYSIS_SECTIONS.find((s) => s.key === activeSection);

    return e(
      ConfigProvider,
      {
        theme: {
          token: {
            colorPrimary: "#1d4ed8",
            borderRadius: 6,
            fontFamily: "var(--font-sans)",
            fontSize: 13.5,
          },
        },
      },
      e(
        "div",
        null,
        // Top Header Bar
        e(
          "div",
          { className: "results-topbar-wrap" },
          e(
            "header",
            { className: "results-topbar" },
            e("h1", { className: "results-brand-title" }, "LASSO: Experimental Evaluation & Analysis"),
            e(
              "div",
              { className: "results-topbar-links" },
              e("a", { href: "/", className: "topbar-btn" }, "\u2190 Demo (Home)"),
              e(
                "a",
                { href: CEX_FOLDER_URL, target: "_blank", rel: "noopener noreferrer", className: "topbar-btn" },
                "Counterexamples (.sql)"
              ),
              e(
                "a",
                { href: REPO_URL, target: "_blank", rel: "noopener noreferrer", className: "topbar-btn" },
                e(GitHubLogo, { size: 14 }),
                "GitHub"
              ),
              e(
                "a",
                { href: PAPER_URL, target: "_blank", rel: "noopener noreferrer", className: "topbar-btn" },
                "arXiv Preprint"
              )
            )
          )
        ),

        // Body Layout: Collapsible Left Sidebar (Overview 1st, 1. Bar Charts default open) + Main Content
        e(
          "div",
          { className: "results-body-layout" },
          // Left Sidebar Navigation
          e(
            "aside",
            { className: `results-sidebar ${sidebarCollapsed ? "collapsed" : ""}` },
            e(
              "div",
              { className: "sidebar-header-row" },
              !sidebarCollapsed
                ? e("span", { className: "sidebar-group-label" }, "Evaluation Sections")
                : null,
              e(
                "button",
                {
                  type: "button",
                  className: "sidebar-toggle-btn",
                  title: sidebarCollapsed ? "Expand Sidebar" : "Minimize Sidebar",
                  onClick: () => setSidebarCollapsed(!sidebarCollapsed),
                },
                sidebarCollapsed ? "\u00BB" : "\u00AB"
              )
            ),
            e(
              "nav",
              { className: "sidebar-nav-list" },
              // Analysis Sections 1 through 6 (1. Bar Charts is default open)
              ANALYSIS_SECTIONS.map((sec) =>
                e(
                  "button",
                  {
                    key: sec.key,
                    type: "button",
                    title: `${sec.num}. ${sec.title}`,
                    className: `sidebar-nav-btn ${activeSection === sec.key ? "active" : ""}`,
                    onClick: () => handleSectionChange(sec.key),
                  },
                  e("span", { className: "sidebar-num-pill" }, sec.num),
                  !sidebarCollapsed ? e("span", null, sec.shortTitle) : null
                )
              )
            )
          ),

          // Main Content Area
          e(
            "main",
            { className: "results-main-content" },
            loading
              ? e(
                  "div",
                  { style: { padding: "80px 0", textAlign: "center" } },
                  e(Spin, { size: "large" }),
                  e("div", { style: { marginTop: 12, color: "#475569" } }, "Loading experimental evaluation data...")
                )
              : e(
                  "div",
                  null,
                  currentSectionMeta
                    ? e(
                        "div",
                        { className: "section-header-bar" },
                        e("h2", null, `${currentSectionMeta.num}. ${currentSectionMeta.title}`),
                        e("p", null, currentSectionMeta.desc)
                      )
                    : null,

                  activeSection === "charts"
                    ? e(BenchmarkChartsSection, { summary })
                    : activeSection === "refutations"
                    ? e(RefutationsSection, { summary })
                    : activeSection === "efficiency"
                    ? e(EfficiencySection, { summary })
                    : activeSection === "tokens"
                    ? e(LlmTokensCostSection, { summary })
                    : activeSection === "strategies"
                    ? e(StrategiesSection, { summary })
                    : e(StatusSection, { summary })
                )
          )
        )
      )
    );
  }

  const rootEl = document.getElementById("root");
  if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(e(ResultsApp));
  }
})();
