import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  UserGroupIcon,
  HierarchyIcon,
  UserIcon,
  RotateLeftIcon,
  Settings02Icon,
  CpuIcon,
  CodeIcon,
  Chart01Icon,
  FlashIcon,
  Link01Icon,
  SmartPhone01Icon,
  CloudIcon,
  DatabaseIcon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { cn } from "../lib/utils";

// Taskzy-related tags for project management with color themes
const TAG_ROWS = [
  [
    { id: "task-tracking", icon: Search01Icon, label: "Task Tracking", color: "#3b82f6" }, // blue
    { id: "team-collab", icon: UserGroupIcon, label: "Team Collaboration", color: "#8b5cf6" }, // violet
    { id: "project-planning", icon: HierarchyIcon, label: "Project Planning", color: "#ec4899" }, // pink
    { id: "user-management", icon: UserIcon, label: "User Management", color: "#f59e0b" }, // amber
    { id: "workflow-automation", icon: RotateLeftIcon, label: "Workflow Automation", color: "#10b981" }, // emerald
  ],
  [
    { id: "settings", icon: Settings02Icon, label: "Settings & Config", color: "#6366f1" }, // indigo
    { id: "performance", icon: CpuIcon, label: "Performance Metrics", color: "#14b8a6" }, // teal
    { id: "custom-fields", icon: CodeIcon, label: "Custom Fields", color: "#a855f7" }, // purple
    { id: "analytics", icon: Chart01Icon, label: "Analytics Dashboard", color: "#06b6d4" }, // cyan
    { id: "quick-actions", icon: FlashIcon, label: "Quick Actions", color: "#eab308" }, // yellow
  ],
  [
    { id: "api-integration", icon: Link01Icon, label: "API Integration", color: "#ef4444" }, // red
    { id: "mobile-access", icon: SmartPhone01Icon, label: "Mobile Access", color: "#22c55e" }, // green
    { id: "cloud-sync", icon: CloudIcon, label: "Cloud Sync", color: "#0ea5e9" }, // sky
    { id: "data-management", icon: DatabaseIcon, label: "Data Management", color: "#f97316" }, // orange
    { id: "security", icon: LockIcon, label: "Security & Privacy", color: "#dc2626" }, // red-600
  ],
];

const CONFIG = {
  title: "SMART TASK ORGANIZATION",
  description: "Automatically categorize and search through your team's tasks, projects, and workflows with intelligent context awareness.",
  containerHeight: "h-full",
  lensSize: 80,
};

const MagnifiedBento = () => {
  const containerRef = React.useRef(null);
  const lensX = useMotionValue(0);
  const lensY = useMotionValue(0);
  
  const clipPath = useMotionTemplate`circle(24px at 50% 50%)`;
  const inverseMask = useMotionTemplate`radial-gradient(circle 24px at 50% 50%, transparent 100%, black 100%)`;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div
        ref={containerRef}
        className={cn(
          "relative w-full overflow-hidden bg-white flex-1",
          CONFIG.containerHeight
        )}
      >
        <div className="relative h-full w-full flex flex-col items-center justify-center mt-4">
          {/* Base layer - dimmed tags */}
          <motion.div
            style={{ 
              WebkitMaskImage: inverseMask, 
              maskImage: inverseMask 
            }}
            className="flex flex-col gap-3 w-full h-full justify-center px-4"
          >
            {TAG_ROWS.map((row, rowIndex) => (
              <motion.div
                key={`row-${rowIndex}`}
                className="flex gap-4 w-max"
                animate={{
                  x: rowIndex % 2 === 0 ? ["0%", "-33.333%"] : ["-33.333%", "0%"],
                }}
                transition={{
                  duration: 20,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                {[...row, ...row, ...row].map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex gap-2 bg-white whitespace-nowrap w-fit text-gray-800 p-2 px-4 items-center border border-gray-800 rounded-full text-xs"
                    style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)' }}
                  >
                    <HugeiconsIcon icon={item.icon} size={16} style={{ color: item.color, opacity: 0.6 }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>

          {/* Reveal layer - highlighted tags under magnifier */}
          <motion.div
            className="absolute inset-0 flex flex-col gap-3 justify-center pointer-events-none select-none z-10 px-4"
            style={{
              clipPath,
            }}
          >
            {TAG_ROWS.map((row, rowIndex) => (
              <motion.div
                key={`row-reveal-${rowIndex}`}
                className="flex gap-3 w-max"
                animate={{
                  x: rowIndex % 2 === 0 ? ["0%", "-33.333%"] : ["-33.333%", "0%"],
                }}
                transition={{
                  duration: 20,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                {[...row, ...row, ...row].map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}-reveal`}
                    className="flex gap-2 bg-white whitespace-nowrap w-fit p-2 px-4 items-center border rounded-full text-xs scale-115"
                    style={{ 
                      color: item.color,
                      borderColor: item.color,
                      boxShadow: `0 3px 6px ${item.color}25, 0 1px 3px rgba(0, 0, 0, 0.1)`
                    }}
                  >
                    <HugeiconsIcon icon={item.icon} size={16} style={{ color: item.color }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>

          {/* Static magnifying lens in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <div className="relative" style={{ 
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))' 
            }}>
              <MagnifyingLens size={CONFIG.lensSize} />
            </div>
          </div>
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white to-transparent z-20"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white to-transparent z-20"></div>
      </div>

      {/* Title and description at bottom */}
      <div className="p-4 px-4 pb-4 bg-white">
        <h3 className="text-sm font-semibold tracking-tight" style={{ color: '#5b5ff8' }}>
          {CONFIG.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
          {CONFIG.description}
        </p>
      </div>
    </div>
  );
};

export default MagnifiedBento;

const MagnifyingLens = ({ size = 72 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M365.424 335.392L342.24 312.192L311.68 342.736L334.88 365.936L365.424 335.392Z"
        fill="#B0BDC6"
      />
      <path
        d="M358.08 342.736L334.88 319.552L319.04 335.392L342.24 358.584L358.08 342.736Z"
        fill="#DFE9EF"
      />
      <path
        d="M352.368 321.808L342.752 312.192L312.208 342.752L321.824 352.36L352.368 321.808Z"
        fill="#B0BDC6"
      />
      <path
        d="M332 332C260 404 142.4 404 69.6001 332C-2.3999 260 -2.3999 142.4 69.6001 69.6C141.6 -3.20003 259.2 -2.40002 332 69.6C404.8 142.4 404.8 260 332 332ZM315.2 87.2C252 24 150.4 24 88.0001 87.2C24.8001 150.4 24.8001 252 88.0001 314.4C151.2 377.6 252.8 377.6 315.2 314.4C377.6 252 377.6 150.4 315.2 87.2Z"
        fill="#DFE9EF"
      />
      <path
        d="M319.2 319.2C254.4 384 148.8 384 83.2001 319.2C18.4001 254.4 18.4001 148.8 83.2001 83.2C148 18.4 253.6 18.4 319.2 83.2C384 148.8 384 254.4 319.2 319.2ZM310.4 92C250.4 32 152 32 92.0001 92C32.0001 152 32.0001 250.4 92.0001 310.4C152 370.4 250.4 370.4 310.4 310.4C370.4 250.4 370.4 152 310.4 92Z"
        fill="#7A858C"
      />
      <path
        d="M484.104 428.784L373.8 318.472L318.36 373.912L428.672 484.216L484.104 428.784Z"
        fill="#333333"
      />
      <path
        d="M471.664 441.224L361.344 330.928L330.8 361.48L441.12 471.76L471.664 441.224Z"
        fill="#575B5E"
      />
      <path
        d="M495.2 423.2C504 432 432.8 504 423.2 495.2L417.6 489.6C408.8 480.8 480 408.8 489.6 417.6L495.2 423.2Z"
        fill="#B0BDC6"
      />
      <path
        d="M483.2 435.2C492 444 444.8 492 435.2 483.2L429.6 477.6C420.8 468.8 468 420.8 477.6 429.6L483.2 435.2Z"
        fill="#DFE9EF"
      />
    </svg>
  );
};
