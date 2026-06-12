import { localPoint } from "@visx/event";
import { LinearGradient as VisxLinearGradient } from "@visx/gradient";
import { GridRows } from "@visx/grid";
import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AnimatePresence, motion } from "framer-motion";
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useMeasure from "react-use-measure";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

// ─── CSS Vars ────────────────────────────────────────────────────────────────
export const chartCssVars = {
  background: "var(--chart-background)",
  foreground: "var(--chart-foreground)",
  foregroundMuted: "var(--chart-foreground-muted)",
  label: "var(--chart-label)",
  linePrimary: "var(--chart-line-primary)",
  lineSecondary: "var(--chart-line-secondary)",
  crosshair: "var(--chart-crosshair)",
  grid: "var(--chart-grid)",
};

// ─── Bar Chart Context ───────────────────────────────────────────────────────
const BarChartContext = createContext(null);

function BarChartProvider({ children, value }) {
  return <BarChartContext.Provider value={value}>{children}</BarChartContext.Provider>;
}

export function useChart() {
  const context = useContext(BarChartContext);
  if (!context) {
    throw new Error("useChart must be used within a BarChartProvider");
  }
  return context;
}

// ─── Tooltip Components ──────────────────────────────────────────────────────
function TooltipContent({ title, rows, children }) {
  const [measureRef, bounds] = useMeasure({ debounce: 0, scroll: false });
  const [committedHeight, setCommittedHeight] = useState(null);
  const committedChildrenStateRef = useRef(null);
  const frameRef = useRef(null);
  const hasChildren = !!children;
  const markerKey = hasChildren ? "has-marker" : "no-marker";
  const isWaitingForSettlement =
    committedChildrenStateRef.current !== null &&
    committedChildrenStateRef.current !== hasChildren;

  useEffect(() => {
    if (bounds.height <= 0) return;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (isWaitingForSettlement) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = requestAnimationFrame(() => {
          setCommittedHeight(bounds.height);
          committedChildrenStateRef.current = hasChildren;
        });
      });
    } else {
      setCommittedHeight(bounds.height);
      committedChildrenStateRef.current = hasChildren;
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [bounds.height, hasChildren, isWaitingForSettlement]);

  const shouldAnimate = committedHeight !== null;
  return (
    <motion.div
      animate={committedHeight !== null ? { height: committedHeight } : undefined}
      className="overflow-hidden"
      initial={false}
      transition={
        shouldAnimate
          ? { type: "spring", stiffness: 500, damping: 35, mass: 0.8 }
          : { duration: 0 }
      }
    >
      <div className="px-3 py-2.5" ref={measureRef}>
        {title && (
          <div className="mb-2 font-medium text-xs" style={{ color: "#1f2937" }}>
            {title}
          </div>
        )}
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div
              className="flex items-center justify-between gap-4"
              key={`${row.label}-${row.color}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-sm" style={{ color: "#6b7280" }}>
                  {row.label}
                </span>
              </div>
              <span
                className="font-medium text-sm tabular-nums"
                style={{ color: "#1f2937" }}
              >
                {typeof row.value === "number" ? row.value.toLocaleString() : row.value}
              </span>
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {children && (
            <motion.div
              animate={{ opacity: 1, filter: "blur(0px)" }}
              className="mt-2"
              exit={{ opacity: 0, filter: "blur(4px)" }}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              key={markerKey}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

TooltipContent.displayName = "TooltipContent";

// TooltipBox
function TooltipBox({
  x,
  y,
  visible,
  containerRef,
  containerWidth,
  containerHeight,
  offset = 16,
  className = "",
  children,
  top: topOverride,
}) {
  const tooltipRef = useRef(null);
  const [tooltipWidth, setTooltipWidth] = useState(180);
  const [tooltipHeight, setTooltipHeight] = useState(80);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const w = tooltipRef.current.offsetWidth;
      const h = tooltipRef.current.offsetHeight;
      if (w > 0 && w !== tooltipWidth) setTooltipWidth(w);
      if (h > 0 && h !== tooltipHeight) setTooltipHeight(h);
    }
  }, [tooltipWidth, tooltipHeight]);

  const shouldFlipX = x + tooltipWidth + offset > containerWidth;
  const targetX = shouldFlipX ? x - offset - tooltipWidth : x + offset;
  const targetY = Math.max(
    offset,
    Math.min(y - tooltipHeight / 2, containerHeight - tooltipHeight - offset)
  );

  const prevFlipRef = useRef(shouldFlipX);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (prevFlipRef.current !== shouldFlipX) {
      setFlipKey((k) => k + 1);
      prevFlipRef.current = shouldFlipX;
    }
  }, [shouldFlipX]);

  const finalTop = topOverride ?? targetY;
  const transformOrigin = shouldFlipX ? "right top" : "left top";
  const container = containerRef.current;

  if (!(mounted && container)) return null;
  if (!visible) return null;

  return createPortal(
    <motion.div
      animate={{ opacity: 1 }}
      className={cn("pointer-events-none absolute z-50", className)}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      ref={tooltipRef}
      style={{ left: targetX, top: finalTop }}
      transition={{ duration: 0.1 }}
    >
      <motion.div
        animate={{ scale: 1, opacity: 1, x: 0 }}
        className="min-w-[140px] overflow-hidden rounded-lg shadow-lg backdrop-blur-md"
        style={{
          backgroundColor: "rgba(33, 33, 33, 0.95)",
          color: "white",
        }}
        initial={{ scale: 0.85, opacity: 0, x: shouldFlipX ? 20 : -20 }}
        key={flipKey}
        style={{ transformOrigin }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {children}
      </motion.div>
    </motion.div>,
    container
  );
}

TooltipBox.displayName = "TooltipBox";

// ─── ChartTooltip ────────────────────────────────────────────────────────────
export function ChartTooltip({
  showCrosshair = true,
  showDots = true,
  content,
  rows: rowsRenderer,
  children,
  className = "",
}) {
  const {
    tooltipData,
    width,
    height,
    margin,
    bars,
    xDataKey,
    containerRef,
  } = useChart();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visible = tooltipData !== null;
  const x = tooltipData?.x ?? 0;
  const xWithMargin = x + margin.left;
  const yWithMargin = margin.top;

  const tooltipRows = useMemo(() => {
    if (!tooltipData) return [];
    if (rowsRenderer) return rowsRenderer(tooltipData.point);
    return bars.map((bar) => ({
      color: bar.stroke || bar.fill,
      label: bar.dataKey,
      value: tooltipData.point[bar.dataKey] ?? 0,
    }));
  }, [tooltipData, bars, rowsRenderer]);

  const title = useMemo(() => {
    if (!tooltipData) return undefined;
    return String(tooltipData.point[xDataKey] ?? "");
  }, [tooltipData, xDataKey]);

  const container = containerRef.current;
  if (!(mounted && container)) return null;

  const tooltipContent = (
    <>
      <TooltipBox
        className={className}
        containerHeight={height}
        containerRef={containerRef}
        containerWidth={width}
        top={margin.top}
        visible={visible}
        x={xWithMargin}
        y={yWithMargin}
      >
        {content ? (
          content({
            point: tooltipData?.point ?? {},
            index: tooltipData?.index ?? 0,
          })
        ) : (
          <TooltipContent rows={tooltipRows} title={title}>
            {children}
          </TooltipContent>
        )}
      </TooltipBox>
    </>
  );

  return createPortal(tooltipContent, container);
}

ChartTooltip.displayName = "ChartTooltip";

// ─── Grid ────────────────────────────────────────────────────────────────────
export function Grid({
  horizontal = true,
  vertical = false,
  numTicksRows = 5,
  numTicksColumns = 10,
  rowTickValues,
  stroke = chartCssVars.grid,
  strokeOpacity = 1,
  strokeWidth = 1,
  strokeDasharray = "4,4",
  fadeHorizontal = true,
  fadeVertical = false,
}) {
  const { xScale, yScale, innerWidth, innerHeight, orientation } = useChart();
  const isHorizontalBar = orientation === "horizontal";
  const uniqueId = useId();
  const hMaskId = `grid-rows-fade-${uniqueId}`;
  const hGradientId = `${hMaskId}-gradient`;

  return (
    <g className="chart-grid">
      {horizontal && fadeHorizontal && (
        <defs>
          <linearGradient id={hGradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: "white", stopOpacity: 0 }} />
            <stop offset="10%" style={{ stopColor: "white", stopOpacity: 1 }} />
            <stop offset="90%" style={{ stopColor: "white", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "white", stopOpacity: 0 }} />
          </linearGradient>
          <mask id={hMaskId}>
            <rect
              fill={`url(#${hGradientId})`}
              height={innerHeight}
              width={innerWidth}
              x="0"
              y="0"
            />
          </mask>
        </defs>
      )}
      {horizontal && (
        <g mask={fadeHorizontal ? `url(#${hMaskId})` : undefined}>
          <GridRows
            numTicks={rowTickValues ? undefined : numTicksRows}
            scale={yScale}
            stroke={stroke}
            strokeDasharray={strokeDasharray}
            strokeOpacity={strokeOpacity}
            strokeWidth={strokeWidth}
            tickValues={rowTickValues}
            width={innerWidth}
          />
        </g>
      )}
    </g>
  );
}

Grid.displayName = "Grid";

// ─── BarXAxis ────────────────────────────────────────────────────────────────
export function BarXAxis({
  tickerHalfWidth = 50,
  showAllLabels = false,
  maxLabels = 12,
}) {
  const { xScale, margin, tooltipData, containerRef, bandWidth } = useChart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const labelsToShow = useMemo(() => {
    const domain = xScale.domain();
    if (domain.length === 0) return [];
    let labels = domain.map((label) => ({
      label,
      x: (xScale(label) ?? 0) + bandWidth / 2 + margin.left,
    }));
    if (!showAllLabels && labels.length > maxLabels) {
      const step = Math.ceil(labels.length / maxLabels);
      labels = labels.filter((_, i) => i % step === 0);
    }
    return labels;
  }, [xScale, margin.left, bandWidth, showAllLabels, maxLabels]);

  const isHovering = tooltipData !== null;
  const crosshairX = tooltipData ? tooltipData.x + margin.left : null;
  const container = containerRef.current;

  if (!(mounted && container)) return null;

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {labelsToShow.map((item) => {
        let opacity = 1;
        if (isHovering && crosshairX !== null) {
          const fadeBuffer = 20;
          const fadeRadius = tickerHalfWidth + fadeBuffer;
          const distance = Math.abs(item.x - crosshairX);
          if (distance < tickerHalfWidth) {
            opacity = 0;
          } else if (distance < fadeRadius) {
            opacity = (distance - tickerHalfWidth) / fadeBuffer;
          }
        }
        return (
          <div
            className="absolute"
            key={item.label}
            style={{
              left: item.x,
              bottom: 12,
              width: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <motion.span
              animate={{ opacity }}
              className="whitespace-nowrap text-xs"
              style={{ color: "#999" }}
              initial={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {item.label}
            </motion.span>
          </div>
        );
      })}
    </div>,
    container
  );
}

BarXAxis.displayName = "BarXAxis";

// ─── Bar ─────────────────────────────────────────────────────────────────────
function resolveRadius(lineCap, barWidth) {
  if (lineCap === "butt") return 0;
  if (lineCap === "round") return barWidth / 2;
  return lineCap;
}

export function Bar({
  dataKey,
  fill = chartCssVars.linePrimary,
  stroke,
  lineCap = "round",
  animate = true,
  animationType = "grow",
  fadedOpacity = 0.3,
  staggerDelay,
  stackGap = 0,
}) {
  const {
    data,
    xScale,
    yScale,
    innerHeight,
    innerWidth,
    bandWidth,
    hoveredBarIndex,
    isLoaded,
    animationDuration,
    xDataKey,
    orientation,
    stacked,
    stackOffsets,
    bars,
    barWidth: fixedBarWidth,
  } = useChart();

  const isHorizontal = orientation === "horizontal";
  const barIndex = bars.findIndex((b) => b.dataKey === dataKey);
  const barCount = bars.length;
  const singleBarWidth = stacked ? bandWidth : bandWidth / barCount;
  const actualBarWidth = fixedBarWidth ?? singleBarWidth;
  const radius = resolveRadius(lineCap, actualBarWidth);
  const autoStagger = staggerDelay ?? Math.min(0.06, 0.8 / data.length);

  return (
    <>
      {data.map((d, i) => {
        const category = String(d[xDataKey] ?? "");
        const value = typeof d[dataKey] === "number" ? d[dataKey] : 0;
        const bandStart = xScale(category) ?? 0;
        const stackOffset = stacked ? stackOffsets.get(i)?.get(dataKey) ?? 0 : 0;

        let barX;
        let barY;
        let barW;
        let barH;

        if (isHorizontal) {
          const barLength = innerWidth - (yScale(value) ?? innerWidth);
          barY = bandStart + (stacked ? 0 : barIndex * singleBarWidth);
          barH = actualBarWidth;
          barW = barLength;
          barX = stacked ? stackOffset : 0;
          if (stacked && stackGap > 0 && barIndex > 0) {
            barX += stackGap;
            barW = Math.max(0, barW - stackGap);
          }
        } else {
          const scaledY = yScale(value) ?? innerHeight;
          barX = bandStart + (stacked ? 0 : barIndex * singleBarWidth);
          barW = actualBarWidth;
          barH = innerHeight - scaledY;
          barY = stacked ? scaledY - stackOffset : scaledY;
          if (stacked && stackGap > 0 && barIndex > 0) {
            barY += stackGap;
            barH = Math.max(0, barH - stackGap);
          }
        }

        if (barW <= 0 || barH <= 0) return null;

        const isHovered = hoveredBarIndex === i;
        const someoneHovered = hoveredBarIndex !== null;
        const barOpacity = someoneHovered ? (isHovered ? 1 : fadedOpacity) : 1;
        const delay = i * autoStagger;

        const r = Math.min(radius, barW / 2, barH / 2);
        let path;

        if (isHorizontal) {
          path = `M${barX},${barY} L${barX + barW - r},${barY} Q${barX + barW},${barY} ${barX + barW},${barY + r} L${barX + barW},${barY + barH - r} Q${barX + barW},${barY + barH} ${barX + barW - r},${barY + barH} L${barX},${barY + barH}Z`;
        } else {
          path = `M${barX},${barY + barH} L${barX},${barY + r} Q${barX},${barY} ${barX + r},${barY} L${barX + barW - r},${barY} Q${barX + barW},${barY} ${barX + barW},${barY + r} L${barX + barW},${barY + barH}Z`;
        }

        const originX = isHorizontal ? barX : barX + barW / 2;
        const originY = isHorizontal ? barY + barH / 2 : innerHeight;

        const shouldAnimateEntry = animate && !isLoaded;
        const growInitial = isHorizontal ? { scaleX: 0, opacity: 0 } : { scaleY: 0, opacity: 0 };
        const growAnimate = isHorizontal ? { scaleX: 1, opacity: barOpacity } : { scaleY: 1, opacity: barOpacity };
        const growTransition = {
          [isHorizontal ? "scaleX" : "scaleY"]: {
            duration: animationDuration / 1000,
            ease: [0.85, 0, 0.15, 1],
            delay,
          },
          opacity: { duration: 0.3, ease: "easeInOut" },
        };

        return (
          <motion.path
            key={`${category}-${dataKey}`}
            d={path}
            fill={fill}
            style={{ transformOrigin: `${originX}px ${originY}px` }}
            initial={
              shouldAnimateEntry && animationType === "grow"
                ? growInitial
                : shouldAnimateEntry && animationType === "fade"
                ? { opacity: 0, filter: "blur(4px)" }
                : { opacity: barOpacity }
            }
            animate={
              shouldAnimateEntry && animationType === "grow"
                ? growAnimate
                : shouldAnimateEntry && animationType === "fade"
                ? { opacity: barOpacity, filter: "blur(0px)" }
                : { opacity: barOpacity }
            }
            transition={
              shouldAnimateEntry && animationType === "grow"
                ? growTransition
                : shouldAnimateEntry && animationType === "fade"
                ? { duration: 0.5, delay, ease: "easeOut" }
                : { opacity: { duration: 0.3, ease: "easeInOut" } }
            }
          />
        );
      })}
    </>
  );
}

Bar.displayName = "Bar";

// ─── Re-exports ──────────────────────────────────────────────────────────────
export { VisxLinearGradient as LinearGradient };

// ─── BarLineIndicator ─────────────────────────────────────────────────────────
export function BarLineIndicator({
  data,
  valueKey,
  xKey,
  stroke = chartCssVars.linePrimary,
  strokeWidth = 2,
  strokeDasharray,
  offsetY = 0,
}) {
  const { xScale, yScale, bandWidth, isLoaded, animationDuration } = useChart();

  const points = useMemo(() => {
    return data.map((d) => {
      const category = String(d[xKey] ?? "");
      const value = typeof d[valueKey] === "number" ? d[valueKey] : 0;
      const x = (xScale(category) ?? 0) + bandWidth / 2;
      const y = (yScale(value) ?? 0) + offsetY;
      return { x, y };
    });
  }, [data, valueKey, xKey, xScale, yScale, bandWidth, offsetY]);

  if (points.length < 2) return null;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <motion.path
      d={pathD}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: isLoaded ? 1 : 0, opacity: isLoaded ? 1 : 0 }}
      transition={{
        pathLength: { duration: animationDuration / 1000, ease: "easeOut" },
        opacity: { duration: 0.3 },
      }}
    />
  );
}

BarLineIndicator.displayName = "BarLineIndicator";

// ─── BarChart ────────────────────────────────────────────────────────────────
function extractBarConfigs(children) {
  const configs = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const childType = child.type;
    const componentName =
      typeof child.type === "function"
        ? childType.displayName || childType.name || ""
        : "";
    const props = child.props;
    const isBarComponent =
      componentName === "Bar" ||
      child.type === Bar ||
      (props && typeof props.dataKey === "string" && props.dataKey.length > 0);
    if (isBarComponent && props?.dataKey) {
      configs.push({
        dataKey: props.dataKey,
        fill: props.fill || "var(--chart-line-primary)",
        stroke: props.stroke,
      });
    }
  });
  return configs;
}

const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 40, left: 40 };

function BarChartInner({
  width,
  height,
  data,
  xDataKey,
  margin,
  animationDuration,
  barGap,
  barWidth,
  orientation,
  stacked,
  stackGap,
  children,
  containerRef,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const bars = useMemo(() => extractBarConfigs(children), [children]);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const isHorizontal = orientation === "horizontal";

  const xScale = useMemo(() => {
    const domain = data.map((d) => String(d[xDataKey] ?? ""));
    return scaleBand({
      range: isHorizontal ? [0, innerHeight] : [0, innerWidth],
      domain,
      padding: barGap,
    });
  }, [data, xDataKey, innerWidth, innerHeight, barGap, isHorizontal]);

  const bandWidth = xScale.bandwidth();

  const yScale = useMemo(() => {
    let maxValue = 0;
    if (stacked) {
      for (const d of data) {
        let sum = 0;
        for (const bar of bars) {
          const value = d[bar.dataKey];
          if (typeof value === "number") sum += value;
        }
        if (sum > maxValue) maxValue = sum;
      }
    } else {
      for (const bar of bars) {
        for (const d of data) {
          const value = d[bar.dataKey];
          if (typeof value === "number" && value > maxValue) maxValue = value;
        }
      }
    }
    if (maxValue === 0) maxValue = 100;
    return scaleLinear({
      range: isHorizontal ? [innerWidth, 0] : [innerHeight, 0],
      domain: [0, maxValue * 1.1],
      nice: true,
    });
  }, [data, bars, innerWidth, innerHeight, stacked, isHorizontal]);

  const stackOffsets = useMemo(() => {
    if (!stacked) return new Map();
    const offsets = new Map();
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      let cumulative = 0;
      const barOffsets = new Map();
      for (const bar of bars) {
        barOffsets.set(bar.dataKey, cumulative);
        const value = d[bar.dataKey];
        if (typeof value === "number") {
          if (isHorizontal) {
            cumulative += innerWidth - (yScale(value) ?? innerWidth);
          } else {
            cumulative += innerHeight - (yScale(value) ?? innerHeight);
          }
        }
      }
      offsets.set(i, barOffsets);
    }
    return offsets;
  }, [data, bars, stacked, yScale, innerHeight, innerWidth, isHorizontal]);

  const [tooltipData, setTooltipData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, animationDuration);
    return () => clearTimeout(timer);
  }, [animationDuration]);

  const handleMouseMove = useCallback(
    (event) => {
      const point = localPoint(event);
      if (!point) return;
      const chartX = point.x - margin.left;
      const chartY = point.y - margin.top;

      const domain = xScale.domain();
      let foundIndex = -1;
      for (let i = 0; i < domain.length; i++) {
        const cat = domain[i];
        const bandStart = xScale(cat) ?? 0;
        const bandEnd = bandStart + bandWidth;
        if (isHorizontal) {
          if (chartY >= bandStart && chartY <= bandEnd) {
            foundIndex = i;
            break;
          }
        } else {
          if (chartX >= bandStart && chartX <= bandEnd) {
            foundIndex = i;
            break;
          }
        }
      }

      if (foundIndex >= 0) {
        setHoveredBarIndex(foundIndex);
        const d = data[foundIndex];
        const yPositions = {};
        const xPositions = {};
        for (const bar of bars) {
          const value = d[bar.dataKey];
          if (typeof value === "number") {
            if (isHorizontal) {
              xPositions[bar.dataKey] = innerWidth - (yScale(value) ?? innerWidth);
              yPositions[bar.dataKey] = (xScale(domain[foundIndex]) ?? 0) + bandWidth / 2;
            } else {
              yPositions[bar.dataKey] = yScale(value) ?? 0;
              xPositions[bar.dataKey] = (xScale(domain[foundIndex]) ?? 0) + bandWidth / 2;
            }
          }
        }
        const tooltipX = isHorizontal
          ? innerWidth - (yScale(Number(d[bars[0]?.dataKey ?? ""] ?? 0)) ?? 0)
          : (xScale(domain[foundIndex]) ?? 0) + bandWidth / 2;
        setTooltipData({
          point: d,
          index: foundIndex,
          x: tooltipX,
          yPositions,
          xPositions,
        });
      } else {
        setHoveredBarIndex(null);
        setTooltipData(null);
      }
    },
    [xScale, yScale, data, bars, margin, bandWidth, isHorizontal, innerWidth]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredBarIndex(null);
    setTooltipData(null);
  }, []);

  if (width < 10 || height < 10) return null;

  const contextValue = {
    data,
    xScale,
    yScale,
    width,
    height,
    innerWidth,
    innerHeight,
    margin,
    bandWidth,
    tooltipData,
    setTooltipData,
    containerRef,
    bars,
    isLoaded,
    animationDuration,
    xDataKey,
    hoveredBarIndex,
    setHoveredBarIndex,
    orientation,
    stacked,
    stackGap,
    stackOffsets,
    barGap,
    barWidth,
  };

  return (
    <BarChartProvider value={contextValue}>
      <svg aria-hidden="true" height={height} width={width}>
        <rect fill="transparent" height={height} width={width} x={0} y={0} />
        <g
          onMouseMove={isLoaded ? handleMouseMove : undefined}
          onMouseLeave={isLoaded ? handleMouseLeave : undefined}
          style={{
            cursor: isLoaded ? "crosshair" : "default",
            touchAction: "none",
          }}
          transform={`translate(${margin.left},${margin.top})`}
        >
          <rect fill="transparent" height={innerHeight} width={innerWidth} x={0} y={0} />
          {children}
        </g>
      </svg>
    </BarChartProvider>
  );
}

export function BarChart({
  data,
  xDataKey = "name",
  margin: marginProp,
  animationDuration = 1100,
  aspectRatio = "2 / 1",
  barGap = 0.2,
  barWidth,
  orientation = "vertical",
  stacked = false,
  stackGap = 0,
  className = "",
  children,
}) {
  const containerRef = useRef(null);
  const margin = { ...DEFAULT_MARGIN, ...marginProp };

  return (
    <div
      className={cn("relative w-full", className)}
      ref={containerRef}
      style={{ aspectRatio, touchAction: "none" }}
    >
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <BarChartInner
            animationDuration={animationDuration}
            barGap={barGap}
            barWidth={barWidth}
            containerRef={containerRef}
            data={data}
            height={height}
            margin={margin}
            orientation={orientation}
            stacked={stacked}
            stackGap={stackGap}
            width={width}
            xDataKey={xDataKey}
          >
            {children}
          </BarChartInner>
        )}
      </ParentSize>
    </div>
  );
}

export default BarChart;
