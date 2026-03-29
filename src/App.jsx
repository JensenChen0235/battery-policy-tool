import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeDollarSign, Battery, ChevronDown, Gift, Layers3, SlidersHorizontal, TrendingDown } from "lucide-react";
import "./App.css";

const MOBILE_BREAKPOINT = 720;

const defaults = {
  lang: "zh",
  modulePrice: 1817.4,
  paidModules: 5,
  capacityPerModule: 3.2,
  oldFactor: 8.4,
  newFactor: 6.8,
  stcPrice: 40,
  gstRate: 10,
  buyQty: 5,
  getQty: 1,
};

const tiers = [
  { start: 0, end: 14, multiplier: 1 },
  { start: 14, end: 28, multiplier: 0.6 },
  { start: 28, end: 50, multiplier: 0.15 },
];

const copy = {
  zh: {
    title: "电池补贴对比工具",
    settingsTitle: "参数设置",
    settingsOpen: "展开参数",
    settingsClose: "收起参数",
    subtitle: "用户视角 · 看装多少 kWh 更划算",
    language: "语言",
    inputDesc:
      "左边只改核心参数。系统会自动算出买几块、送几块、总 kWh、实际花费，以及旧政策和新政策下分别能拿多少补贴。",
    paidModules: "付费模块数",
    modulePrice: "单块电池价格",
    capacityPerModule: "单块容量",
    oldFactor: "原政策 factor",
    newFactor: "新政策 factor",
    stcPrice: "STC 单价",
    gstRate: "GST 税率",
    buyQty: "买",
    getQty: "送",
    totalModules: "实际到手模块数",
    freeModules: "赠送模块数",
    totalCapacity: "总容量",
    totalSpend: "实际花费",
    spendWithGst: "实际花费（含 GST）",
    oldPolicy: "之前政策",
    newPolicy: "政策变化后",
    rebateAmount: "补贴金额",
    outOfPocket: "补贴后还需支付",
    effectivePerKwh: "每 kWh 实际到手成本",
    reset: "默认",
    formulaOld: "旧政策按总容量统一计算补贴。",
    formulaNew: "新政策按分档累加：0–14 kWh 为 100%，14–28 kWh 为 60%，28–50 kWh 为 15%，且支持买5送1。",
    formulaSpendOld: "旧政策下实际花费 = 付费模块数 × 单块价格；旧政策没有买5送1，实际到手模块数 = 付费模块数。",
    formulaSpendNew: "新政策下实际花费 = 付费模块数 × 单块价格；新政策支持买5送1，到手模块数 = 付费模块数 + 赠送模块数。",
    gstIncluded: "GST 税率 included",
    costChartTitle: "每 kWh 实际到手成本",
    costChartDesc: "横坐标为付费模块数，比较旧政策与新政策下每 kWh 实际到手成本。",
    oldPolicyLine: "旧政策",
    newPolicyLine: "新政策",
    paidModulesAxis: "付费模块数",
    effectiveCostAxis: "每 kWh 实际到手成本（AUD）",
    giftedOne: "含赠送 1 块",
    giftedMany: "含赠送 {count} 块",
    aud: "AUD",
    kwh: "kWh",
    modules: "块",
    percent: "%",
  },
  en: {
    title: "Battery Rebate Comparison Tool",
    settingsTitle: "Parameters",
    settingsOpen: "Open Parameters",
    settingsClose: "Close Parameters",
    subtitle: "Customer View · Find the most cost-effective kWh setup",
    language: "Language",
    inputDesc:
      "Edit the core assumptions on the left. The page then calculates paid modules, free modules, total kWh, actual spend, and the rebate under both the old and new policy.",
    paidModules: "Paid Modules",
    modulePrice: "Module Price",
    capacityPerModule: "Capacity per Module",
    oldFactor: "Old Policy Factor",
    newFactor: "New Policy Factor",
    stcPrice: "STC Price",
    gstRate: "GST Rate",
    buyQty: "Buy",
    getQty: "Get Free",
    totalModules: "Modules Received",
    freeModules: "Free Modules",
    totalCapacity: "Total Capacity",
    totalSpend: "Actual Spend",
    spendWithGst: "Actual Spend (inc. GST)",
    oldPolicy: "Old Policy",
    newPolicy: "New Policy",
    rebateAmount: "Rebate Amount",
    outOfPocket: "Out-of-Pocket After Rebate",
    effectivePerKwh: "Effective Cost per kWh",
    reset: "Default",
    formulaOld: "The old policy applies one rebate rate to the whole capacity.",
    formulaNew:
      "The new policy accumulates rebates by tiers: 0-14 kWh at 100%, 14-28 kWh at 60%, and 28-50 kWh at 15%, with buy-5-get-1 applied.",
    formulaSpendOld:
      "Under the old policy, actual spend = paid modules × module price. There is no buy-5-get-1, so modules received = paid modules.",
    formulaSpendNew:
      "Under the new policy, actual spend = paid modules × module price. Buy-5-get-1 applies, so modules received = paid modules + free modules.",
    gstIncluded: "GST included",
    costChartTitle: "Effective Cost per kWh",
    costChartDesc: "The x-axis shows paid modules, comparing effective cost per kWh under the old and new policy.",
    oldPolicyLine: "Old Policy",
    newPolicyLine: "New Policy",
    paidModulesAxis: "Paid Modules",
    effectiveCostAxis: "Effective Cost per kWh (AUD)",
    giftedOne: "Includes 1 free module",
    giftedMany: "Includes {count} free modules",
    aud: "AUD",
    kwh: "kWh",
    modules: "modules",
    percent: "%",
  },
};

function formatCurrency(value, lang) {
  return new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value, digits = 1, lang = "zh") {
  return new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-AU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

function calculateFreeModules(paidModules, buyQty, getQty) {
  if (buyQty <= 0 || getQty <= 0) return 0;
  return Math.floor(paidModules / buyQty) * getQty;
}

function calculateTieredRebate(totalCapacity, factor, stcPrice) {
  return tiers.reduce((sum, tier) => {
    const overlap = Math.max(0, Math.min(totalCapacity, tier.end) - tier.start);
    return sum + overlap * factor * stcPrice * tier.multiplier;
  }, 0);
}

function evaluatePolicyScenario({
  policy,
  paidModules,
  modulePrice,
  capacityPerModule,
  oldFactor,
  newFactor,
  stcPrice,
  gstRate,
  buyQty,
  getQty,
}) {
  const safePaidModules = Math.max(0, paidModules);
  const freeModules = policy === "new" ? calculateFreeModules(safePaidModules, buyQty, getQty) : 0;
  const totalModules = safePaidModules + freeModules;
  const totalCapacity = totalModules * capacityPerModule;
  const totalSpend = safePaidModules * modulePrice;
  const spendWithGst = totalSpend * (1 + gstRate / 100);
  const rebate =
    policy === "old"
      ? totalCapacity * oldFactor * stcPrice
      : calculateTieredRebate(totalCapacity, newFactor, stcPrice);
  const outOfPocket = totalSpend - rebate;
  const effectivePerKwh = totalCapacity > 0 ? outOfPocket / totalCapacity : 0;

  return {
    freeModules,
    totalModules,
    totalCapacity,
    totalSpend,
    spendWithGst,
    rebate,
    outOfPocket,
    effectivePerKwh,
  };
}

function NumberField({ label, value, suffix, onChange }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">
        <input
          className="field__input"
          type="number"
          step="any"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="field__suffix">{suffix}</span>
      </span>
    </label>
  );
}

function SummaryItem({ label, value, detail, icon: Icon }) {
  return (
    <div className="summary-item">
      <div className="summary-item__label">
        {Icon ? <Icon size={16} /> : null}
        <span>{label}</span>
      </div>
      <strong className="summary-item__value">{value}</strong>
      {detail ? <p className="summary-item__detail">{detail}</p> : null}
    </div>
  );
}

function CostPerKwhChart({ data, t, lang }) {
  const [tooltip, setTooltip] = useState(null);
  const width = 920;
  const height = 280;
  const padding = { top: 44, right: 18, bottom: 42, left: 78 };
  const minY = 200;
  const maxY = 400;
  const yTicks = [200, 240, 280, 320, 360, 400];
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xMin = 1;
  const xMax = 14;
  const xSpan = xMax - xMin;

  const clampY = (value) => Math.min(maxY, Math.max(minY, value));
  const xScale = (value) => padding.left + ((value - xMin) / xSpan) * plotWidth;
  const yScale = (value) => padding.top + plotHeight - ((clampY(value) - minY) / (maxY - minY)) * plotHeight;

  const oldPoints = data.map((item) => `${xScale(item.paidModules)},${yScale(item.oldEffectivePerKwh)}`).join(" ");
  const newPoints = data.map((item) => `${xScale(item.paidModules)},${yScale(item.newEffectivePerKwh)}`).join(" ");

  return (
    <section className="chart-card">
      <div className="chart-card__header">
        <div>
          <h3>{t.costChartTitle}</h3>
          <p>{t.costChartDesc}</p>
        </div>
        <div className="chart-card__legend">
          <span className="chart-legend-item">
            <i className="legend-dot legend-dot--policy-old" />
            {t.oldPolicyLine}
          </span>
          <span className="chart-legend-item">
            <i className="legend-dot legend-dot--policy-new" />
            {t.newPolicyLine}
          </span>
        </div>
      </div>

      <div className="chart-frame">
        <div className="chart-y-title">{t.effectiveCostAxis}</div>
        {tooltip ? (
          <div
            className="chart-tooltip"
            style={{
              left: `${tooltip.left}%`,
              top: `${tooltip.top}%`,
            }}
          >
            {tooltip.text}
          </div>
        ) : null}
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={t.costChartTitle}>
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={width - padding.right}
                y2={yScale(tick)}
                className="chart-grid-line"
              />
              <text x={10} y={yScale(tick) + 4} className="chart-axis-label">
                {`AU$${formatNumber(tick, 0, lang)}`}
              </text>
            </g>
          ))}

          <polyline points={oldPoints} className="chart-line chart-line--policy-old" />
          <polyline points={newPoints} className="chart-line chart-line--policy-new" />

          {data.map((item) => (
            <text
              key={`x-${item.paidModules}`}
              x={xScale(item.paidModules)}
              y={height - 12}
              textAnchor="middle"
              className="chart-axis-label"
            >
              {item.paidModules}
            </text>
          ))}

          {data
            .filter((item) => item.freeModules > 0)
            .map((item) => {
              const hoverText =
                item.freeModules === 1
                  ? t.giftedOne
                  : t.giftedMany.replace("{count}", formatNumber(item.freeModules, 0, lang));

              return (
                <g key={`gift-${item.paidModules}`}>
                  <circle
                    cx={xScale(item.paidModules)}
                    cy={yScale(item.newEffectivePerKwh)}
                    r="7"
                    className="chart-gift-point"
                    onMouseEnter={() =>
                      setTooltip({
                        left: ((xScale(item.paidModules) + 8) / width) * 100,
                        top: ((yScale(item.newEffectivePerKwh) - 18) / height) * 100,
                        text: hoverText,
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                  <circle
                    cx={xScale(item.paidModules)}
                    cy={yScale(item.newEffectivePerKwh)}
                    r="3"
                    className="chart-gift-point__center"
                    aria-hidden="true"
                  />
                </g>
              );
            })}
        </svg>
      </div>

      <div className="chart-card__axis-note">
        <span>{t.paidModulesAxis}</span>
      </div>
    </section>
  );
}

function ResultPanel({
  title,
  spendWithGst,
  rebate,
  outOfPocket,
  effectivePerKwh,
  totalModules,
  freeModules,
  totalCapacity,
  basis,
  tone,
  lang,
  t,
  activePolicy,
  onPolicyChange,
}) {
  return (
    <motion.section
      className={`result-panel result-panel--${tone}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
    >
      <div className="result-panel__header">
        <div>
          <h2>{title}</h2>
        </div>
        <div className="policy-toggle" role="tablist" aria-label={title}>
          <button
            className={activePolicy === "old" ? "policy-toggle__button is-active" : "policy-toggle__button"}
            onClick={() => onPolicyChange("old")}
          >
            {t.oldPolicy}
          </button>
          <button
            className={activePolicy === "new" ? "policy-toggle__button is-active" : "policy-toggle__button"}
            onClick={() => onPolicyChange("new")}
          >
            {t.newPolicy}
          </button>
        </div>
      </div>

      <div className="result-panel__grid">
        <SummaryItem
          label={t.totalModules}
          value={`${totalModules} ${t.modules}`}
          detail=""
          icon={Layers3}
        />
        <SummaryItem
          label={t.freeModules}
          value={`${freeModules} ${t.modules}`}
          detail=""
          icon={Gift}
        />
        <SummaryItem
          label={t.totalCapacity}
          value={`${formatNumber(totalCapacity, 1, lang)} ${t.kwh}`}
          detail=""
          icon={Battery}
        />
        <SummaryItem
          label={t.spendWithGst}
          value={formatCurrency(spendWithGst, lang)}
          detail={`${tone === "old" ? t.formulaSpendOld : t.formulaSpendNew} ${t.gstIncluded}`}
          icon={BadgeDollarSign}
        />
        <SummaryItem
          label={t.rebateAmount}
          value={formatCurrency(rebate, lang)}
          detail={basis}
          icon={Gift}
        />
        <SummaryItem
          label={t.outOfPocket}
          value={formatCurrency(outOfPocket, lang)}
          detail={`${t.rebateAmount} = ${formatCurrency(rebate, lang)}`}
          icon={TrendingDown}
        />
      </div>

      <div className="result-panel__footer">
        <div>
          <span>{t.effectivePerKwh}</span>
          <strong>{formatCurrency(effectivePerKwh, lang)}</strong>
        </div>
      </div>
    </motion.section>
  );
}

export default function App() {
  const [lang, setLang] = useState(defaults.lang);
  const [activePolicy, setActivePolicy] = useState("old");
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );
  const [isControlsOpen, setIsControlsOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth > MOBILE_BREAKPOINT : true
  );
  const [modulePrice, setModulePrice] = useState(defaults.modulePrice);
  const [paidModules, setPaidModules] = useState(defaults.paidModules);
  const [capacityPerModule, setCapacityPerModule] = useState(defaults.capacityPerModule);
  const [oldFactor, setOldFactor] = useState(defaults.oldFactor);
  const [newFactor, setNewFactor] = useState(defaults.newFactor);
  const [stcPrice, setStcPrice] = useState(defaults.stcPrice);
  const [gstRate, setGstRate] = useState(defaults.gstRate);
  const [buyQty, setBuyQty] = useState(defaults.buyQty);
  const [getQty, setGetQty] = useState(defaults.getQty);

  const t = copy[lang];

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(nextIsMobile);
      setIsControlsOpen(nextIsMobile ? false : true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const oldScenario = useMemo(
    () =>
      evaluatePolicyScenario({
        policy: "old",
        paidModules,
        modulePrice,
        capacityPerModule,
        oldFactor,
        newFactor,
        stcPrice,
        gstRate,
        buyQty,
        getQty,
      }),
    [paidModules, modulePrice, capacityPerModule, oldFactor, newFactor, stcPrice, gstRate, buyQty, getQty]
  );

  const newScenario = useMemo(
    () =>
      evaluatePolicyScenario({
        policy: "new",
        paidModules,
        modulePrice,
        capacityPerModule,
        oldFactor,
        newFactor,
        stcPrice,
        gstRate,
        buyQty,
        getQty,
      }),
    [paidModules, modulePrice, capacityPerModule, oldFactor, newFactor, stcPrice, gstRate, buyQty, getQty]
  );

  const calculated = activePolicy === "old" ? oldScenario : newScenario;

  const currentPolicy =
    activePolicy === "old"
      ? {
          title: t.oldPolicy,
          totalSpend: oldScenario.totalSpend,
          rebate: oldScenario.rebate,
          outOfPocket: oldScenario.outOfPocket,
          effectivePerKwh: oldScenario.effectivePerKwh,
          basis: t.formulaOld,
          tone: "old",
        }
      : {
          title: t.newPolicy,
          totalSpend: newScenario.totalSpend,
          rebate: newScenario.rebate,
          outOfPocket: newScenario.outOfPocket,
          effectivePerKwh: newScenario.effectivePerKwh,
          basis: t.formulaNew,
          tone: "new",
        };

  const resetDefaults = () => {
    setLang(defaults.lang);
    setModulePrice(defaults.modulePrice);
    setPaidModules(defaults.paidModules);
    setCapacityPerModule(defaults.capacityPerModule);
    setOldFactor(defaults.oldFactor);
    setNewFactor(defaults.newFactor);
    setStcPrice(defaults.stcPrice);
    setGstRate(defaults.gstRate);
    setBuyQty(defaults.buyQty);
    setGetQty(defaults.getQty);
  };

  const chartData = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const planPaidModules = index + 1;
        const oldPlan = evaluatePolicyScenario({
          policy: "old",
          paidModules: planPaidModules,
          modulePrice,
          capacityPerModule,
          oldFactor,
          newFactor,
          stcPrice,
          gstRate,
          buyQty,
          getQty,
        });
        const newPlan = evaluatePolicyScenario({
          policy: "new",
          paidModules: planPaidModules,
          modulePrice,
          capacityPerModule,
          oldFactor,
          newFactor,
          stcPrice,
          gstRate,
          buyQty,
          getQty,
        });

        return {
          paidModules: planPaidModules,
          oldEffectivePerKwh: oldPlan.effectivePerKwh,
          newEffectivePerKwh: newPlan.effectivePerKwh,
          freeModules: newPlan.freeModules,
        };
      }),
    [modulePrice, capacityPerModule, oldFactor, newFactor, stcPrice, gstRate, buyQty, getQty]
  );

  return (
    <div className="app-shell">
      <div className="app-shell__glow" />

      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-copy">
            <p className="app-header__title">{t.title}</p>
            <p className="app-header__subtitle">{t.subtitle}</p>
          </div>
        </div>
        <div className="lang-switch" aria-label={t.language}>
          <button
            className={lang === "zh" ? "lang-switch__button is-active" : "lang-switch__button"}
            onClick={() => setLang("zh")}
          >
            中文
          </button>
          <button
            className={lang === "en" ? "lang-switch__button is-active" : "lang-switch__button"}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
      </header>

      <main className="app-layout">
        <motion.aside
          className="control-panel"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="control-panel__head">
            <div>
              <h1>{t.settingsTitle}</h1>
            </div>
            <div className="control-panel__actions">
              <button
                className={`mobile-controls-toggle ${isControlsOpen ? "is-open" : ""}`}
                onClick={() => setIsControlsOpen((current) => !current)}
                aria-expanded={isControlsOpen}
                aria-controls="parameter-panel"
                type="button"
              >
                <SlidersHorizontal size={16} />
                <span>{isControlsOpen ? t.settingsClose : t.settingsOpen}</span>
                <ChevronDown size={16} />
              </button>
              <button className="reset-button" onClick={resetDefaults} type="button">
                {t.reset}
              </button>
            </div>
          </div>

          <div
            id="parameter-panel"
            className={`control-panel__body ${isMobile && !isControlsOpen ? "is-collapsed" : ""}`}
          >
            <div className="control-panel__body-inner">
              <p className="control-panel__desc">{t.inputDesc}</p>

              <div className="field-grid">
                <NumberField
                  label={t.paidModules}
                  value={paidModules}
                  suffix={t.modules}
                  onChange={setPaidModules}
                />
                <NumberField
                  label={t.modulePrice}
                  value={modulePrice}
                  suffix={t.aud}
                  onChange={setModulePrice}
                />
                <NumberField
                  label={t.capacityPerModule}
                  value={capacityPerModule}
                  suffix={t.kwh}
                  onChange={setCapacityPerModule}
                />
                <NumberField
                  label={t.stcPrice}
                  value={stcPrice}
                  suffix={t.aud}
                  onChange={setStcPrice}
                />
                <NumberField
                  label={t.oldFactor}
                  value={oldFactor}
                  suffix="x"
                  onChange={setOldFactor}
                />
                <NumberField
                  label={t.newFactor}
                  value={newFactor}
                  suffix="x"
                  onChange={setNewFactor}
                />
                <NumberField
                  label={t.buyQty}
                  value={buyQty}
                  suffix={t.modules}
                  onChange={setBuyQty}
                />
                <NumberField
                  label={t.getQty}
                  value={getQty}
                  suffix={t.modules}
                  onChange={setGetQty}
                />
                <NumberField
                  label={t.gstRate}
                  value={gstRate}
                  suffix={t.percent}
                  onChange={setGstRate}
                />
              </div>
            </div>
          </div>
        </motion.aside>

        <section className="results-layout">
          <ResultPanel
            title={currentPolicy.title}
            spendWithGst={calculated.spendWithGst}
            rebate={currentPolicy.rebate}
            outOfPocket={currentPolicy.outOfPocket}
            effectivePerKwh={currentPolicy.effectivePerKwh}
            totalModules={calculated.totalModules}
            freeModules={calculated.freeModules}
            totalCapacity={calculated.totalCapacity}
            basis={currentPolicy.basis}
            tone={currentPolicy.tone}
            lang={lang}
            t={t}
            activePolicy={activePolicy}
            onPolicyChange={setActivePolicy}
          />
          <CostPerKwhChart data={chartData} t={t} lang={lang} />
        </section>
      </main>
    </div>
  );
}
