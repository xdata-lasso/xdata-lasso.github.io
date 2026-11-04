/* ==========================================================================
   LASSO Home Page (Academic Research Interface)
   - Full top-to-bottom academic layout (no top blue border, no side gaps or shadows)
   - Header Actions (with icons):
       1. GitLab Repository
       2. Try Out
       3. View Evaluation Results
       4. Paper (Coming Soon)
   - Prominent 50/50 Connected Custom Tabs:
       * Equivalence Refutation | Test Data Generation (connected directly to panel)
   - Live SQL Syntax-Highlighted Input Editors (Schema, Reference SQL, Candidate SQL)
   - Collapse for showing/hiding tables and hiding non-refuting datasets initially
   ========================================================================== */

(function () {
  const e = React.createElement;
  const { useState, useEffect, useRef } = React;
  const {
    ConfigProvider,
    Button,
    Select,
    Checkbox,
    Tag,
    Table,
    Collapse,
    Alert,
    Space,
    message,
  } = antd;

  const PAPER_URL = "https://arxiv.org/abs/2610.38294";
  const REPO_URL = "https://github.com/xdata-lasso/lasso";
  const LASSO_GOLD_CEX_URL =
    "https://github.com/xdata-lasso/lasso/tree/main/experiments/results/reproducible_cex/lasso_gold";
  const LASSO_EXCLUSIVE_CEX_URL =
    "https://github.com/xdata-lasso/lasso/tree/main/experiments/results/lasso_exclusive";

  function GitHubIcon({ size = 16 }) {
    return e(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "currentColor",
        style: { flexShrink: 0 },
      },
      e("path", {
        d: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z",
      })
    );
  }

  function TryOutIcon({ size = 16 }) {
    return e(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: { flexShrink: 0 },
      },
      e("polygon", { points: "5 3 19 12 5 21 5 3" })
    );
  }

  function ResultsChartIcon({ size = 16 }) {
    return e(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: { flexShrink: 0 },
      },
      e("line", { x1: "18", y1: "20", x2: "18", y2: "10" }),
      e("line", { x1: "12", y1: "20", x2: "12", y2: "4" }),
      e("line", { x1: "6", y1: "20", x2: "6", y2: "14" })
    );
  }

  function PaperDocIcon({ size = 16 }) {
    return e(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: { flexShrink: 0 },
      },
      e("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
      e("polyline", { points: "14 2 14 8 20 8" }),
      e("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
      e("line", { x1: "16", y1: "17", x2: "8", y2: "17" })
    );
  }

  const OVERALL_REF_DATA = [
    { label: "LASSO-CC", neq: 24899, rate: 68.0, color: "#1e40af", costStr: "" },
    { label: "gemini-4-argon-medium-er", neq: 22133, rate: 60.4, color: "#22c55e", costStr: "($139.06)" },
    { label: "gemini-4-argon-high-er", neq: 21943, rate: 59.9, color: "#22c55e", costStr: "($567.37)" },
    { label: "gemini-4-argon-low-er", neq: 21544, rate: 58.8, color: "#22c55e", costStr: "($90.36)" },
    { label: "LASSO", neq: 21348, rate: 58.3, color: "#3b82f6", costStr: "" },
    { label: "gemini-4-argon-low-tdg", neq: 20864, rate: 57.0, color: "#15803d", costStr: "($109.35)" },
    { label: "gemini-4-argon-high-tdg", neq: 20746, rate: 56.6, color: "#15803d", costStr: "($378.90)" },
    { label: "gemini-4-argon-medium-tdg", neq: 20421, rate: 55.7, color: "#15803d", costStr: "($106.71)" },
    { label: "SQLWitness", neq: 16252, rate: 44.4, color: "#dc2626", costStr: "" },
    { label: "ParSEval", neq: 12760, rate: 34.8, color: "#ea580c", costStr: "" },
    { label: "Polygon", neq: 9177, rate: 25.1, color: "#7c3aed", costStr: "" },
    { label: "SpotIT", neq: 3293, rate: 9.0, color: "#c026d3", costStr: "" },
    { label: "XData-CC", neq: 472, rate: 1.3, color: "#92400e", costStr: "" },
    { label: "XData", neq: 441, rate: 1.2, color: "#0d9488", costStr: "" },
    { label: "ParSEval-TDG", neq: 66, rate: 0.2, color: "#eab308", costStr: "" },
  ];

  const OVERALL_TIME_DATA = [
    { label: "LASSO", avgTime: 0.06, avgTimeStr: "0.06s", color: "#3b82f6" },
    { label: "LASSO-CC", avgTime: 0.14, avgTimeStr: "0.14s", color: "#1e40af" },
    { label: "ParSEval-TDG", avgTime: 0.19, avgTimeStr: "0.19s", color: "#eab308" },
    { label: "SQLWitness", avgTime: 0.88, avgTimeStr: "0.88s", color: "#dc2626" },
    { label: "Polygon", avgTime: 2.1, avgTimeStr: "2.10s", color: "#7c3aed" },
    { label: "XData", avgTime: 2.48, avgTimeStr: "2.48s", color: "#0d9488" },
    { label: "XData-CC", avgTime: 3.65, avgTimeStr: "3.65s", color: "#92400e" },
    { label: "ParSEval", avgTime: 3.72, avgTimeStr: "3.72s", color: "#ea580c" },
    { label: "gemini-4-argon-medium-tdg", avgTime: 5.22, avgTimeStr: "5.22s", color: "#15803d" },
    { label: "gemini-4-argon-low-tdg", avgTime: 5.28, avgTimeStr: "5.28s", color: "#15803d" },
    { label: "gemini-4-argon-low-er", avgTime: 11.49, avgTimeStr: "11.49s", color: "#22c55e" },
    { label: "gemini-4-argon-medium-er", avgTime: 13.18, avgTimeStr: "13.18s", color: "#22c55e" },
    { label: "gemini-4-argon-high-tdg", avgTime: 17.8, avgTimeStr: "17.80s", color: "#15803d" },
    { label: "SpotIT", avgTime: 27.61, avgTimeStr: "27.61s", color: "#c026d3" },
    { label: "gemini-4-argon-high-er", avgTime: 31.07, avgTimeStr: "31.07s", color: "#22c55e" },
  ];

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

  function OverallBenchmarkChartsBox() {
    const [showPercent, setShowPercent] = useState(false);
    const [logScaleTime, setLogScaleTime] = useState(true);
    const chartH = Math.max(320, OVERALL_REF_DATA.length * 24 + 34);

    return e(
      "div",
      { className: "chart-pair-box", style: { marginBottom: 32 } },
      e(
        "div",
        {
          className: "chart-pair-header",
          style: { flexWrap: "wrap", gap: 12 },
        },
        e(
          "div",
          null,
          e("h3", null, "Overall Benchmark Suite (36,634 Query Pairs)"),
          e("span", { style: { fontSize: "12.5px", color: "#475569" } }, "Aggregated across all 12 benchmarks")
        ),
        e(
          Space,
          { size: 16, wrap: true },
          e(
            Checkbox,
            {
              checked: showPercent,
              onChange: (ev) => setShowPercent(ev.target.checked),
              style: { fontWeight: 600, fontSize: "12.5px" },
            },
            "Show as %"
          ),
          e(
            Checkbox,
            {
              checked: logScaleTime,
              onChange: (ev) => setLogScaleTime(ev.target.checked),
              style: { fontWeight: 600, fontSize: "12.5px" },
            },
            "Log Scale Time"
          ),
          e(
            "a",
            { href: "/results", style: { fontWeight: 700, fontSize: "13px" } },
            "Full Results & 12 Benchmarks \u2192"
          )
        )
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
            labels: OVERALL_REF_DATA.map((d) => d.label),
            values: OVERALL_REF_DATA.map((d) => (showPercent ? d.rate : d.neq)),
            displayLabels: OVERALL_REF_DATA.map((d) => {
              const base = showPercent ? `${d.rate.toFixed(1)}%` : d.neq.toLocaleString();
              return d.costStr ? `${base} ${d.costStr}` : base;
            }),
            colors: OVERALL_REF_DATA.map((d) => d.color),
            horizontal: true,
            height: chartH,
            yMax: showPercent ? 100 : null,
          })
        ),
        e(
          "div",
          { className: "sub-chart-panel" },
          e("h4", null, "Overall Average Time per Refutation (seconds, Lower is Faster)"),
          e(BarChartCanvas, {
            labels: OVERALL_TIME_DATA.map((d) => d.label),
            values: OVERALL_TIME_DATA.map((d) => d.avgTime),
            displayLabels: OVERALL_TIME_DATA.map((d) => d.avgTimeStr),
            colors: OVERALL_TIME_DATA.map((d) => d.color),
            horizontal: true,
            height: chartH,
            logScale: logScaleTime,
          })
        )
      )
    );
  }

  const SAMPLE_EXAMPLES = [
    {
      key: "join_mismatch",
      label: "Example 1: Join Type Mismatch (LEFT JOIN vs. INNER JOIN)",
      schema:
        "CREATE TABLE departments (\n  dept_id INT PRIMARY KEY,\n  dept_name VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE employees (\n  emp_id INT PRIMARY KEY,\n  emp_name VARCHAR(50) NOT NULL,\n  dept_id INT,\n  salary INT,\n  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)\n);",
      gold_sql:
        "SELECT d.dept_name, COUNT(e.emp_id) AS emp_count\nFROM departments d\nLEFT JOIN employees e ON d.dept_id = e.dept_id\nGROUP BY d.dept_id, d.dept_name;",
      prediction_sql:
        "SELECT d.dept_name, COUNT(e.emp_id) AS emp_count\nFROM departments d\nINNER JOIN employees e ON d.dept_id = e.dept_id\nGROUP BY d.dept_id, d.dept_name;",
    },
    {
      key: "agg_null",
      label: "Example 2: Aggregate NULL Handling (COUNT(*) vs. COUNT(bonus))",
      schema:
        "CREATE TABLE staff (\n  id INT PRIMARY KEY,\n  department VARCHAR(40) NOT NULL,\n  salary INT NOT NULL,\n  bonus INT NULL\n);",
      gold_sql:
        "SELECT department, COUNT(*) AS total_staff, AVG(bonus) AS avg_bonus\nFROM staff\nGROUP BY department;",
      prediction_sql:
        "SELECT department, COUNT(bonus) AS total_staff, AVG(bonus) AS avg_bonus\nFROM staff\nGROUP BY department;",
    },
    {
      key: "null_in_subquery",
      label: "Example 3: NOT IN Subquery with Nullable Column (3VL Pitfall)",
      schema:
        "CREATE TABLE students (\n  student_id INT PRIMARY KEY,\n  student_name VARCHAR(50) NOT NULL\n);\n\nCREATE TABLE exam_submissions (\n  sub_id INT PRIMARY KEY,\n  student_id INT NULL,\n  score INT\n);",
      gold_sql:
        "SELECT s.student_name\nFROM students s\nLEFT JOIN exam_submissions e ON s.student_id = e.student_id\nWHERE e.student_id IS NULL;",
      prediction_sql:
        "SELECT student_name\nFROM students\nWHERE student_id NOT IN (SELECT student_id FROM exam_submissions);",
    },
    {
      key: "boundary_having",
      label: "Example 4: Comparison & HAVING Boundary (>= vs. >)",
      schema:
        "CREATE TABLE orders (\n  order_id INT PRIMARY KEY,\n  customer_id INT NOT NULL,\n  amount INT NOT NULL,\n  status VARCHAR(20) NOT NULL\n);",
      gold_sql:
        "SELECT customer_id, SUM(amount) AS total_spent\nFROM orders\nWHERE status = 'COMPLETED' AND amount >= 100\nGROUP BY customer_id\nHAVING COUNT(*) >= 2;",
      prediction_sql:
        "SELECT customer_id, SUM(amount) AS total_spent\nFROM orders\nWHERE status = 'COMPLETED' AND amount > 100\nGROUP BY customer_id\nHAVING COUNT(*) > 2;",
    },
  ];

  const SQL_TOKEN_REGEX =
    /(--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|\b(?:SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|CROSS|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|DISTINCT|AS|AND|OR|NOT|IN|EXISTS|IS|NULL|CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|INSERT|INTO|VALUES|CASE|WHEN|THEN|ELSE|END|UNION|ALL|INTERSECT|EXCEPT|ASC|DESC|NULLS|LAST|FIRST|BETWEEN|LIKE|CAST|PRAGMA|CHECK|UNIQUE|DEFAULT|INT|INTEGER|TEXT|VARCHAR|REAL|FLOAT|DATE|BOOLEAN)\b|\b(?:COUNT|SUM|AVG|MIN|MAX|COALESCE|IFNULL|NULLIF|ROUND|ABS|UPPER|LOWER|LENGTH|SUBSTR|STRFTIME)\b|\b\d+(?:\.\d+)?\b)/gi;

  const SQL_KW_SET = new Set([
    "SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "CROSS",
    "ON", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "DISTINCT", "AS", "AND",
    "OR", "NOT", "IN", "EXISTS", "IS", "NULL", "CREATE", "TABLE", "PRIMARY", "KEY",
    "FOREIGN", "REFERENCES", "INSERT", "INTO", "VALUES", "CASE", "WHEN", "THEN", "ELSE",
    "END", "UNION", "ALL", "INTERSECT", "EXCEPT", "ASC", "DESC", "NULLS", "LAST", "FIRST",
    "BETWEEN", "LIKE", "CAST", "PRAGMA", "CHECK", "UNIQUE", "DEFAULT", "INT", "INTEGER",
    "TEXT", "VARCHAR", "REAL", "FLOAT", "DATE", "BOOLEAN",
  ]);

  function tokenizeSqlNodes(rawText, preserveCase = false) {
    if (!rawText) return null;
    const parts = String(rawText).split(SQL_TOKEN_REGEX);
    return parts.map((part, idx) => {
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
      if (SQL_KW_SET.has(up)) {
        return e("span", { key: idx, className: "sql-kw" }, preserveCase ? part : up);
      }
      if (/^(COUNT|SUM|AVG|MIN|MAX|COALESCE|IFNULL|NULLIF|ROUND|ABS|UPPER|LOWER|LENGTH|SUBSTR|STRFTIME)$/i.test(part)) {
        return e("span", { key: idx, className: "sql-fn" }, preserveCase ? part : up);
      }
      return part;
    });
  }

  // Live Syntax-Highlighted SQL Input Textbox Component
  function SqlCodeEditor({ value, onChange, rows = 5, placeholder = "" }) {
    const preRef = useRef(null);
    const minH = Math.max(rows * 22 + 24, 96);

    const handleScroll = (ev) => {
      if (preRef.current) {
        preRef.current.scrollTop = ev.target.scrollTop;
        preRef.current.scrollLeft = ev.target.scrollLeft;
      }
    };

    const textVal = value || "";
    const displayNodes = textVal
      ? tokenizeSqlNodes(textVal + (textVal.endsWith("\n") ? " " : ""), true)
      : e("span", { style: { color: "#94a3b8" } }, placeholder);

    return e(
      "div",
      { className: "sql-editor-wrap", style: { minHeight: minH } },
      e(
        "pre",
        {
          ref: preRef,
          className: "sql-editor-highlight",
          "aria-hidden": "true",
          style: { minHeight: minH },
        },
        displayNodes
      ),
      e("textarea", {
        className: "sql-editor-textarea",
        value: textVal,
        onChange: (ev) => onChange(ev.target.value),
        onScroll: handleScroll,
        spellCheck: false,
        autoCapitalize: "off",
        autoComplete: "off",
        autoCorrect: "off",
        placeholder: "",
      })
    );
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
    return e("pre", { className: "sql-highlighted-block" }, tokenizeSqlNodes(formatted, false));
  }

  function RelationalGrid({ title, columns = [], rows = [], error = null, emptyText = "0 rows (Empty Result)" }) {
    if (error) {
      return e(Alert, {
        type: "warning",
        showIcon: true,
        message: title || "Query Execution Notice",
        description: error,
      });
    }
    if (!columns || columns.length === 0) {
      return e(
        "div",
        {
          style: {
            border: "1px solid #cbd5e1",
            padding: "8px 12px",
            background: "#f8fafc",
            borderRadius: 5,
            color: "#475569",
            textAlign: "center",
          },
        },
        title ? e("div", { style: { fontWeight: 700, marginBottom: 4, color: "#0f172a", fontSize: "13px" } }, title) : null,
        e("span", { className: "code-font", style: { fontSize: "12px" } }, emptyText)
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
        locale: { emptyText },
      })
    );
  }

  function DatasetCard({ ds, mode }) {
    const tableCount = (ds.tables || []).length;

    return e(
      "div",
      {
        style: {
          border: "1px solid #cbd5e1",
          borderRadius: 6,
          padding: "14px 16px",
          background: "#ffffff",
          marginBottom: "12px",
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
            gap: 10,
            marginBottom: 8,
          },
        },
        e(
          Space,
          { size: 8, wrap: true },
          e(
            Tag,
            { color: "#1d4ed8", style: { fontWeight: 700, fontSize: "12px" } },
            `Dataset #${ds.dataset_idx}`
          ),
          e(
            "span",
            { className: "code-font", style: { fontWeight: 700, fontSize: "13px", color: "#0f172a" } },
            ds.strategy
          ),
          ds.source === "pred"
            ? e(Tag, { color: "purple" }, "2-Way Candidate Query")
            : e(Tag, { color: "geekblue" }, "1-Way Reference Query"),
          e(Tag, null, `${ds.total_rows} row(s)`)
        )
      ),

      ds.description
        ? e(
            "div",
            { style: { marginBottom: 8, color: "#475569", fontSize: "13px" } },
            e("strong", { style: { color: "#0f172a" } }, "Target: "),
            ds.description
          )
        : null,

      renderHighlightedSql(ds.insert_sql || "-- Empty dataset (0 rows across all tables)"),

      // Collapse component for showing/hiding populated tables and query outputs
      e(
        "div",
        { style: { marginTop: 10 } },
        e(Collapse, {
          size: "small",
          items: [
            {
              key: "tables",
              label: `View in Tables (${tableCount} populated table${tableCount === 1 ? "" : "s"} & query output)`,
              children: e(
                "div",
                null,
                e(
                  "div",
                  { style: { fontWeight: 700, fontSize: "13px", marginBottom: 8, color: "#0f172a" } },
                  "Populated Database Tables:"
                ),
                ds.tables && ds.tables.length > 0
                  ? e(
                      "div",
                      {
                        style: {
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: 12,
                          marginBottom: 12,
                        },
                      },
                      ds.tables.map((tbl) =>
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
                      { style: { padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", marginBottom: 12 } },
                      "Empty Database Instance (0 rows)"
                    ),
                mode === "er"
                  ? e(
                      "div",
                      { className: "chart-pair-grid" },
                      e(RelationalGrid, {
                        title: "Reference Query Output",
                        columns: ds.gold_result?.columns || [],
                        rows: ds.gold_result?.rows || [],
                        error: ds.gold_result?.error,
                      }),
                      e(RelationalGrid, {
                        title: "Candidate Query Output",
                        columns: ds.pred_result?.columns || [],
                        rows: ds.pred_result?.rows || [],
                        error: ds.pred_result?.error,
                      })
                    )
                  : e(RelationalGrid, {
                      title: "Query Execution Output",
                      columns: ds.gold_result?.columns || [],
                      rows: ds.gold_result?.rows || [],
                      error: ds.gold_result?.error,
                    })
              ),
            },
          ],
        })
      )
    );
  }

  function HomeApp() {
    const [mode, setMode] = useState("er");
    const [selectedSample, setSelectedSample] = useState(SAMPLE_EXAMPLES[0].key);
    const [schema, setSchema] = useState(SAMPLE_EXAMPLES[0].schema);
    const [goldSql, setGoldSql] = useState(SAMPLE_EXAMPLES[0].gold_sql);
    const [predSql, setPredSql] = useState(SAMPLE_EXAMPLES[0].prediction_sql);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [resultData, setResultData] = useState(null);

    const trySectionRef = useRef(null);

    const handleSampleChange = (sampleKey) => {
      setSelectedSample(sampleKey);
      const found = SAMPLE_EXAMPLES.find((s) => s.key === sampleKey);
      if (found) {
        setSchema(found.schema);
        setGoldSql(found.gold_sql);
        setPredSql(found.prediction_sql);
        setResultData(null);
        setErrorMsg(null);
      }
    };

    const handleRunLasso = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/try_lasso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            schema,
            gold_sql: goldSql,
            prediction_sql: mode === "er" ? predSql : "",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.error) {
            setErrorMsg(data.error);
            setResultData(null);
          } else {
            setResultData(data);
          }
          return;
        }
        if (res.status === 404 || res.status === 405) {
          const matchedSample = SAMPLE_EXAMPLES.find(
            (s) =>
              s.schema.trim() === schema.trim() &&
              s.gold_sql.trim() === goldSql.trim() &&
              (mode !== "er" || s.prediction_sql.trim() === predSql.trim())
          );
          if (matchedSample) {
            let presetRes = await fetch("/static/data/preset_examples.json");
            if (!presetRes.ok) {
              presetRes = await fetch("static/data/preset_examples.json");
            }
            if (presetRes.ok) {
              const presets = await presetRes.json();
              const presetPayload = presets?.[matchedSample.key]?.[mode];
              if (presetPayload) {
                setResultData(presetPayload);
                return;
              }
            }
          }
          setErrorMsg(
            "Custom live SQL execution requires the Python backend server. On this static GitHub Pages site, you can run any of the 4 preset examples above, or clone https://github.com/xdata-lasso/lasso and run 'python3 web/server.py' locally to test custom schemas and queries."
          );
          setResultData(null);
          return;
        }
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Failed to execute LASSO.");
        setResultData(null);
      } catch (err) {
        setErrorMsg(String(err));
      } finally {
        setLoading(false);
      }
    };

    const handleScrollToTryOut = (ev) => {
      ev.preventDefault();
      if (trySectionRef.current) {
        trySectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const handlePaperClick = (ev) => {
      if (!PAPER_URL || PAPER_URL.trim() === "") {
        ev.preventDefault();
        message.info("Paper link will be available soon.");
      }
    };

    const kd = resultData?.killing_dataset;
    const otherDatasets = kd
      ? (resultData?.datasets || []).filter((d) => d.dataset_idx !== kd.dataset_idx)
      : resultData?.datasets || [];

    return e(
      ConfigProvider,
      {
        theme: {
          token: {
            colorPrimary: "#1d4ed8",
            borderRadius: 6,
            fontFamily: "var(--font-sans)",
            fontSize: 14,
          },
        },
      },
      e(
        "div",
        { className: "home-page-outer" },
        e(
          "main",
          { className: "home-wrapper" },
          // 1. Academic Header with Icons (1st: GitLab Repository, 2nd: View Evaluation Results highlighted, 3rd: Paper)
          e(
            "header",
            { className: "home-header" },
            e("h1", { className: "home-title" }, "LASSO"),
            e(
              "p",
              { className: "home-subtitle" },
              "An ",
              e("span", { className: "acro-letter" }, "L"),
              "LM-",
              e("span", { className: "acro-letter" }, "A"),
              "gent ",
              e("span", { className: "acro-letter" }, "S"),
              "ynthesized ",
              e("span", { className: "acro-letter" }, "S"),
              "ystem for SQL Validati",
              e("span", { className: "acro-letter" }, "O"),
              "n"
            ),
            e(
              "div",
              { className: "home-actions" },
              e(
                "a",
                {
                  href: REPO_URL,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "acad-btn",
                },
                e(GitHubIcon, { size: 16 }),
                "GitHub Repository"
              ),
              e(
                "a",
                {
                  href: "/results",
                  className: "acad-btn acad-btn-primary",
                },
                e(ResultsChartIcon, { size: 16 }),
                "View Evaluation Results"
              ),
              e(
                "a",
                {
                  href: PAPER_URL,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "acad-btn",
                },
                e(PaperDocIcon, { size: 16 }),
                "arXiv Preprint"
              )
            )
          ),

          // Key Highlights Box: Framework, Benchmarks & Evaluated Baselines
          e(
            "section",
            { className: "home-highlights-box" },
            e("h3", { className: "home-highlights-heading" }, "Key Highlights"),
            e(
              "ul",
              { className: "home-highlights-list" },
              e(
                "li",
                null,
                e("strong", { style: { color: "#0f172a" } }, "Test Data Generation"),
                " framework for catching errors in SQL queries. LASSO takes a database schema and a SQL query as input and generates multiple test datasets to expose subtle semantic bugs and edge cases. Designed to minimize the use of slow constraint solvers, LASSO prioritizes fast heuristics and deploys targeted ",
                e("strong", { style: { color: "#0f172a" } }, "attack strategies"),
                " to kill semantic mutations of SQL queries. It was developed using an ",
                e("strong", { style: { color: "#0f172a" } }, "LLM-based agentic coding"),
                " approach with structured workflows and regression tests to scale across a wide range of SQL features and query types."
              ),
              e(
                "li",
                null,
                "Contains a ",
                e("strong", { style: { color: "#0f172a" } }, "Unified Benchmark"),
                " combining queries from several benchmarks such as ",
                e("span", { className: "hl-name" }, "BIRD"),
                ", ",
                e("span", { className: "hl-name" }, "Cubes"),
                ", ",
                e("span", { className: "hl-name" }, "LeetCode"),
                ", ",
                e("span", { className: "hl-name" }, "Literature"),
                ", ",
                e("span", { className: "hl-name" }, "Calcite"),
                ", ",
                e("span", { className: "hl-name" }, "XData-BM"),
                ", ",
                e("span", { className: "hl-name" }, "TPC-H"),
                ", and ",
                e("span", { className: "hl-name" }, "LargeJoin"),
                ", along with internally developed benchmarks: ",
                e("span", { className: "hl-name" }, "LASSO-BM"),
                ", ",
                e("span", { className: "hl-name" }, "MM-BM"),
                " (Many Mutants Benchmark), ",
                e("span", { className: "hl-name" }, "MMO-BM"),
                " (Many Mutants Obfuscated Benchmark), and ",
                e("span", { className: "hl-name" }, "MMRO-BM"),
                " (Many Mutants Random-Obfuscated Benchmark)."
              ),
              e(
                "li",
                null,
                "Empirical evaluation against state-of-the-art tools including ",
                e("span", { className: "hl-name" }, "SpotIT"),
                ", ",
                e("span", { className: "hl-name" }, "Polygon"),
                ", ",
                e("span", { className: "hl-name" }, "ParSEval"),
                ", ",
                e("span", { className: "hl-name" }, "ParSEval-TDG"),
                ", ",
                e("span", { className: "hl-name" }, "SQLWitness"),
                ", ",
                e("span", { className: "hl-name" }, "XData"),
                ", ",
                e("span", { className: "hl-name" }, "XData-CC"),
                ", ",
                e("span", { className: "hl-name" }, "Gemini-ER"),
                ", and ",
                e("span", { className: "hl-name" }, "Gemini-TDG"),
                " demonstrates that LASSO outperforms the alternatives overall while taking significantly less execution time (",
                e(
                  "a",
                  {
                    href: "/results",
                    style: { fontWeight: 700, fontSize: "13.5px" },
                  },
                  "View Results \u2192"
                ),
                ")."
              ),
              e(
                "li",
                null,
                "All counterexamples from the evaluation results are available to inspect and reproduce in the repository on ",
                e(
                  "a",
                  {
                    href: LASSO_GOLD_CEX_URL,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    style: { fontWeight: 600 },
                  },
                  "GitHub"
                ),
                ", and for inspecting ",
                e("strong", { style: { color: "#0f172a" } }, "LASSO-exclusive counterexamples"),
                " see ",
                e(
                  "a",
                  {
                    href: LASSO_EXCLUSIVE_CEX_URL,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    style: { fontWeight: 600 },
                  },
                  "GitHub"
                ),
                "."
              )
            )
          ),

          // Overall Benchmark Suite Side-by-Side Bar Charts
          e(OverallBenchmarkChartsBox),

          // 2. Demo Section with Prominent Connected 50/50 Tabs
          e(
            "section",
            { id: "try-lasso", ref: trySectionRef },
            e(
              "div",
              { className: "tryout-section-header" },
              e("h2", { className: "tryout-section-title" }, "Demo"),
              e(
                "p",
                { className: "tryout-section-subtitle" },
                "Select a mode below to refute equivalence between two SQL queries or synthesize test databases from a single query."
              )
            ),

            // Connected 50% / 50% Custom Tab Header (No Ant Design Component)
            e(
              "div",
              { className: "tryout-tabs-header", role: "tablist" },
              e(
                "button",
                {
                  type: "button",
                  role: "tab",
                  "aria-selected": mode === "er",
                  className: `tryout-tab-btn ${mode === "er" ? "active" : ""}`,
                  onClick: () => {
                    setMode("er");
                    setResultData(null);
                  },
                },
                "Equivalence Refutation"
              ),
              e(
                "button",
                {
                  type: "button",
                  role: "tab",
                  "aria-selected": mode === "tdg",
                  className: `tryout-tab-btn ${mode === "tdg" ? "active" : ""}`,
                  onClick: () => {
                    setMode("tdg");
                    setResultData(null);
                  },
                },
                "Test Data Generation"
              )
            ),

            // Connected Tab Panel Body
            e(
              "div",
              { className: "tryout-tab-panel" },
              // Preset Example Selector Row
              e(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottom: "1px solid #e2e8f0",
                  },
                },
                e(
                  "span",
                  { style: { fontSize: "13.5px", color: "#334155", fontWeight: 500 } },
                  mode === "er"
                    ? "Synthesizes targeted databases to refute equivalence between Reference and Candidate SQL queries."
                    : "Synthesizes a suite of targeted test databases from a single SQL query and schema."
                ),
                e(
                  "div",
                  { style: { display: "flex", alignItems: "center", gap: 8 } },
                  e("span", { style: { fontWeight: 600, fontSize: "13px", color: "#0f172a" } }, "Preset Example:"),
                  e(Select, {
                    value: selectedSample,
                    onChange: handleSampleChange,
                    style: { width: 350 },
                    options: SAMPLE_EXAMPLES.map((s) => ({ label: s.label, value: s.key })),
                  })
                )
              ),

              // Database Schema Input (Live SQL Highlighting)
              e(
                "div",
                { style: { marginBottom: 16 } },
                e(
                  "label",
                  { style: { display: "block", fontWeight: 700, fontSize: "13.5px", marginBottom: 6, color: "#0f172a" } },
                  "Database Schema (DDL)"
                ),
                e(SqlCodeEditor, {
                  rows: 6,
                  value: schema,
                  onChange: setSchema,
                  placeholder: "CREATE TABLE ...",
                })
              ),

              // SQL Query Input(s) (Live SQL Highlighting)
              mode === "er"
                ? e(
                    "div",
                    { className: "chart-pair-grid", style: { marginBottom: 18 } },
                    e(
                      "div",
                      null,
                      e(
                        "label",
                        { style: { display: "block", fontWeight: 700, fontSize: "13.5px", marginBottom: 6, color: "#0f172a" } },
                        "Reference (Gold) SQL Query"
                      ),
                      e(SqlCodeEditor, {
                        rows: 4,
                        value: goldSql,
                        onChange: setGoldSql,
                        placeholder: "SELECT ...",
                      })
                    ),
                    e(
                      "div",
                      null,
                      e(
                        "label",
                        { style: { display: "block", fontWeight: 700, fontSize: "13.5px", marginBottom: 6, color: "#1d4ed8" } },
                        "Candidate (Prediction) SQL Query"
                      ),
                      e(SqlCodeEditor, {
                        rows: 4,
                        value: predSql,
                        onChange: setPredSql,
                        placeholder: "SELECT ...",
                      })
                    )
                  )
                : e(
                    "div",
                    { style: { marginBottom: 18 } },
                    e(
                      "label",
                      { style: { display: "block", fontWeight: 700, fontSize: "13.5px", marginBottom: 6, color: "#0f172a" } },
                      "SQL Query"
                    ),
                    e(SqlCodeEditor, {
                      rows: 4,
                      value: goldSql,
                      onChange: setGoldSql,
                      placeholder: "SELECT ...",
                    })
                  ),

              e(
                "div",
                { style: { display: "flex", justifyContent: "center" } },
                e(
                  Button,
                  {
                    type: "primary",
                    size: "large",
                    loading,
                    onClick: handleRunLasso,
                    style: { padding: "0 28px", height: 40, fontSize: "14.5px" },
                  },
                  mode === "er" ? "Run Equivalence Refutation" : "Generate Test Datasets"
                )
              )
            ),

            errorMsg
              ? e(Alert, {
                  type: "error",
                  showIcon: true,
                  message: "Execution Error",
                  description: errorMsg,
                  style: { marginBottom: 20 },
                })
              : null,

            // Results Display
            resultData
              ? e(
                  "div",
                  null,
                  resultData.mode === "er"
                    ? kd
                      ? e(
                          "div",
                          null,
                          // 1. Only the Refuting Counterexample Dataset is shown expanded initially
                          e(
                            "div",
                            { className: "neq-refuted-banner" },
                            e(
                              "div",
                              {
                                style: {
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 10,
                                  marginBottom: 12,
                                },
                              },
                              e(
                                Space,
                                { size: 8, wrap: true },
                                e(
                                  Tag,
                                  { color: "#059669", style: { fontSize: "12.5px", fontWeight: 700, padding: "2px 10px" } },
                                  `Equivalence Refuted (${resultData.verdict})`
                                ),
                                e(
                                  "span",
                                  { style: { fontWeight: 700, color: "#0f172a", fontSize: "14.5px" } },
                                  `Refuted by Dataset #${kd.dataset_idx}:`
                                ),
                                e("code", { style: { fontWeight: 700, color: "#065f46", fontSize: "13px" } }, kd.strategy),
                                e("span", { style: { color: "#475569", fontSize: "12.5px" } }, `(${resultData.elapsed_ms} ms)`)
                              )
                            ),

                            // Side-by-Side Divergent Outputs
                            e(
                              "div",
                              { className: "chart-pair-grid", style: { marginBottom: 14 } },
                              e(RelationalGrid, {
                                title: "Reference Query Output",
                                columns: kd.gold_result?.columns || [],
                                rows: kd.gold_result?.rows || [],
                                error: kd.gold_result?.error,
                              }),
                              e(RelationalGrid, {
                                title: "Candidate Query Output",
                                columns: kd.pred_result?.columns || [],
                                rows: kd.pred_result?.rows || [],
                                error: kd.pred_result?.error,
                              })
                            ),

                            // Counterexample SQL INSERTs
                            e(
                              "div",
                              { style: { fontWeight: 600, fontSize: "13px", marginBottom: 6, color: "#0f172a" } },
                              "Counterexample Dataset (SQL INSERT Statements):"
                            ),
                            renderHighlightedSql(kd.insert_sql || "-- Empty dataset (0 rows)"),

                            // Collapse for showing/hiding populated database tables of the refuting dataset
                            kd.tables && kd.tables.length > 0
                              ? e(
                                  "div",
                                  { style: { marginTop: 12 } },
                                  e(Collapse, {
                                    size: "small",
                                    items: [
                                      {
                                        key: "kill-tables",
                                        label: `View Dataset in Tables (${kd.tables.length} populated table${kd.tables.length === 1 ? "" : "s"}, ${kd.total_rows} total rows)`,
                                        children: e(
                                          "div",
                                          {
                                            style: {
                                              display: "grid",
                                              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                              gap: 12,
                                            },
                                          },
                                          kd.tables.map((tbl) =>
                                            e(RelationalGrid, {
                                              key: tbl.table_name,
                                              title: `Table: ${tbl.table_name}`,
                                              columns: tbl.columns,
                                              rows: tbl.rows,
                                            })
                                          )
                                        ),
                                      },
                                    ],
                                  })
                                )
                              : null
                          ),

                          // 2. Other Generated Datasets hidden inside Collapse initially
                          otherDatasets.length > 0
                            ? e(Collapse, {
                                size: "middle",
                                items: [
                                  {
                                    key: "other-datasets",
                                    label: `Other Generated Datasets (${otherDatasets.length} additional datasets synthesized in ${resultData.elapsed_ms} ms)`,
                                    children: e(
                                      "div",
                                      null,
                                      otherDatasets.map((ds) =>
                                        e(DatasetCard, {
                                          key: ds.dataset_idx,
                                          ds,
                                          mode: resultData.mode,
                                        })
                                      )
                                    ),
                                  },
                                ],
                              })
                            : null
                        )
                      : e(
                          "div",
                          null,
                          e(Alert, {
                            type: "info",
                            showIcon: true,
                            style: { marginBottom: 16 },
                            message: e(
                              "span",
                              { style: { fontWeight: 700 } },
                              `No Counterexample Found (${resultData.verdict}): Tested ${resultData.num_datasets} Datasets in ${resultData.elapsed_ms} ms`
                            ),
                            description: "Both queries produced identical outputs across all synthesized datasets.",
                          }),
                          e(Collapse, {
                            size: "middle",
                            items: [
                              {
                                key: "all-datasets",
                                label: `Inspect Tested Datasets (${resultData.num_datasets} datasets)`,
                                children: e(
                                  "div",
                                  null,
                                  (resultData.datasets || []).map((ds) =>
                                    e(DatasetCard, {
                                      key: ds.dataset_idx,
                                      ds,
                                      mode: resultData.mode,
                                    })
                                  )
                                ),
                              },
                            ],
                          })
                        )
                    : e(
                        // Test Data Generation mode (mode === "tdg")
                        "div",
                        null,
                        e(
                          "h3",
                          {
                            style: {
                              fontFamily: "var(--font-serif)",
                              fontSize: "19px",
                              fontWeight: 700,
                              borderBottom: "2px solid #cbd5e1",
                              paddingBottom: 6,
                              marginBottom: 14,
                              textAlign: "center",
                            },
                          },
                          `Generated Test Suite (${resultData.num_datasets} Datasets, ${resultData.elapsed_ms} ms)`
                        ),
                        (resultData.datasets || []).map((ds) =>
                          e(DatasetCard, {
                            key: ds.dataset_idx,
                            ds,
                            mode: resultData.mode,
                          })
                        )
                      )
                )
              : null
          ),

          // 3. Authors at the Bottom of the Page
          e(
            "footer",
            { className: "home-footer-authors" },
            e(
              "div",
              { style: { fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 700 } },
              "Authors"
            ),
            e(
              "div",
              { className: "authors-row" },
              e(
                "div",
                { className: "author-card-bottom" },
                e("div", { className: "name" }, "Shreyas Jadhav"),
                e("div", { className: "affil" }, "Indian Institute of Technology Bombay"),
                e("div", { className: "email" }, "shreyasj@cse.iitb.ac.in")
              ),
              e(
                "div",
                { className: "author-card-bottom" },
                e("div", { className: "name" }, "S. Sudarshan"),
                e("div", { className: "affil" }, "Indian Institute of Technology Bombay"),
                e("div", { className: "email" }, "sudarsha@cse.iitb.ac.in")
              )
            )
          )
        )
      )
    );
  }

  const rootEl = document.getElementById("home-root");
  if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(e(HomeApp));
  }
})();
