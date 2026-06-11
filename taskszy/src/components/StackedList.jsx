import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ProfileIcon,
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  Briefcase01Icon,
  PaintBoardIcon,
  Database01Icon,
  QuillWrite01Icon,
} from "@hugeicons/core-free-icons";

const ALL_MEMBERS = [
  {
    id: "01",
    name: "Oliver Smith",
    status: "Online",
    online: true,
    role: "Project Manager",
    roleType: "pm",
    avatar: "https://tapback.co/api/avatar/Oliver.webp",
  },
  {
    id: "02",
    name: "Sophie Chen",
    status: "17m ago",
    online: false,
    role: "Designer",
    roleType: "designer",
    avatar: "https://tapback.co/api/avatar/Sophie.webp",
  },
  {
    id: "03",
    name: "Noah Wilson",
    status: "29m ago",
    online: false,
    role: "Data Specialist",
    roleType: "data",
    avatar: "https://tapback.co/api/avatar/Noah.webp",
  },
  {
    id: "04",
    name: "Emma Davis",
    status: "48m ago",
    online: false,
    role: "Creator",
    roleType: "creator",
    avatar: "https://tapback.co/api/avatar/Emma.webp",
  },
  {
    id: "05",
    name: "Leo Garcia",
    status: "Online",
    online: true,
    role: "Designer",
    roleType: "designer",
    avatar: "https://tapback.co/api/avatar/Leo.webp",
  },
  {
    id: "06",
    name: "Mia Thompson",
    status: "Online",
    online: true,
    role: "Project Manager",
    roleType: "pm",
    avatar: "https://tapback.co/api/avatar/Mia.webp",
  },
  {
    id: "07",
    name: "Ethan Wright",
    status: "5h ago",
    online: false,
    role: "Data Specialist",
    roleType: "data",
    avatar: "https://tapback.co/api/avatar/Ethan.webp",
  },
];

const ACTIVE_MEMBERS = ALL_MEMBERS.filter((m) => m.online);

const sweepSpring = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  mass: 0.6,
};

const RoleBadge = ({ type, label }) => {
  const styles = {
    pm: {
      bg: "bg-[#FFFCEB]",
      text: "text-[#856404]",
      border: "border-[#FFEBA5]",
      icon: Briefcase01Icon,
    },
    designer: {
      bg: "bg-[#F0F7FF]",
      text: "text-[#004085]",
      border: "border-[#B8DAFF]",
      icon: PaintBoardIcon,
    },
    data: {
      bg: "bg-[#F3FAF4]",
      text: "text-[#155724]",
      border: "border-[#C3E6CB]",
      icon: Database01Icon,
    },
    creator: {
      bg: "bg-[#FCF5FF]",
      text: "text-[#522785]",
      border: "border-[#E8D1FF]",
      icon: QuillWrite01Icon,
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div
      className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border} shrink-0 w-[140px]`}
    >
      <HugeiconsIcon icon={Icon} size={12} strokeWidth={1.8} />
      <span className="text-xs font-regular tracking-tight uppercase whitespace-nowrap">
        {label}
      </span>
    </div>
  );
};

const MemberItem = ({ member }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, x: 8, y: 10, rotate: 0.5 },
      visible: { opacity: 1, x: 0, y: 0, rotate: 0 },
    }}
    transition={{
      type: "spring",
      stiffness: 280,
      damping: 26,
      mass: 0.65,
    }}
    style={{ originX: 1, originY: 1 }}
    className="flex items-center group py-2.5 first:pt-0 border-b border-gray-100 last:border-0"
  >
    <div className="relative mr-3 shrink-0">
      <img
        src={member.avatar}
        alt={member.name}
        className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm grayscale-[0.1] group-hover:grayscale-0 transition-all duration-500 ease-out"
      />
      {member.online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-gray-900 tracking-tight leading-none mb-1 truncate">
        {member.name}
      </h3>
      <div className="flex items-center gap-1 opacity-80">
        {member.online && (
          <div className="w-1 h-1 bg-green-500 rounded-full" />
        )}
        <p
          className={`text-xs font-medium leading-none ${
            member.online ? "text-green-600" : "text-gray-500"
          }`}
        >
          {member.status}
        </p>
      </div>
    </div>
    <div className="shrink-0">
      <RoleBadge type={member.roleType} label={member.role} />
    </div>
  </motion.div>
);

export function StackedList() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = React.useRef(null);

  const filteredAllMembers = useMemo(
    () =>
      ALL_MEMBERS.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.role.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  // Auto-expand after 2 seconds, then collapse, repeat
  React.useEffect(() => {
    const cycle = () => {
      // Expand
      setTimeout(() => {
        setIsExpanded(true);
      }, 2000);

      // Collapse after showing all content
      setTimeout(() => {
        setIsExpanded(false);
      }, 10000); // 2s wait + 5s scroll + 3s view
    };

    cycle();
    const cycleInterval = setInterval(cycle, 12000); // Full cycle every 12 seconds

    return () => clearInterval(cycleInterval);
  }, []);

  // Auto-scroll when expanded with smooth animation
  React.useEffect(() => {
    if (isExpanded && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      
      // Reset to top first
      container.scrollTop = 0;

      // Wait for expand animation to complete
      const scrollTimer = setTimeout(() => {
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const maxScroll = scrollHeight - clientHeight;

        if (maxScroll > 0) {
          // Smooth scroll using CSS
          container.style.scrollBehavior = 'smooth';
          container.scrollTop = maxScroll;
          
          // Reset scroll behavior after animation
          setTimeout(() => {
            container.style.scrollBehavior = 'auto';
          }, 3000);
        }
      }, 600); // Wait for expand animation

      return () => clearTimeout(scrollTimer);
    } else if (!isExpanded && scrollContainerRef.current) {
      // Reset scroll position when collapsed
      scrollContainerRef.current.scrollTop = 0;
      scrollContainerRef.current.style.scrollBehavior = 'auto';
    }
  }, [isExpanded]);

  return (
    <div className="relative w-full h-full bg-white flex flex-col overflow-hidden">
      <div className={`flex flex-col h-full bg-white transition-all duration-500 ease-out ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#5b5ff8] tracking-tight flex items-center gap-2">
              Active Members
              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 mt-0.5 rounded-full text-gray-600 leading-none font-normal">
                {ACTIVE_MEMBERS.length}
              </span>
            </h2>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-all duration-200"
            >
              <span className="text-base font-normal">+</span>
            </Button>
          </div>
          <div className="relative mb-2">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 z-10"
              size={12}
            />
            <Input
              placeholder="Search teammates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-2.5 bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 transition-all duration-200 w-full box-border"
            />
          </div>
        </div>
        <div 
          className="flex-1 px-4 pb-14 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#5b5ff8 transparent' }}
        >
          <motion.div
            initial={false}
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
            className="space-y-0"
          >
            {ACTIVE_MEMBERS.map((member) => (
              <MemberItem key={`active-${member.id}`} member={member} />
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        layout
        initial={false}
        animate={{
          height: isExpanded ? "calc(100% - 12px)" : "50px",
          width: isExpanded ? "calc(100% - 12px)" : "calc(100% - 24px)",
          bottom: isExpanded ? "6px" : "12px",
          left: isExpanded ? "6px" : "12px",
          borderRadius: isExpanded ? "20px" : "16px",
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
          mass: 0.7,
        }}
        className="absolute z-50 overflow-hidden border border-gray-200 shadow-lg flex flex-col group/bar bg-white"
        style={{ cursor: isExpanded ? "default" : "pointer" }}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <div
          className={`flex items-center justify-between px-2.5 h-[50px] shrink-0 transition-all duration-300 ${
            isExpanded ? "border-b border-gray-100" : "hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm transition-all duration-300 group-hover/bar:scale-105`}
            >
              <HugeiconsIcon icon={ProfileIcon} size={16} strokeWidth={2} />
            </div>
            <motion.div layout="position" transition={{ duration: 0.3 }}>
              <h4 className="text-xs font-semibold text-gray-900 tracking-tight leading-none">
                Member Directory
              </h4>
              <p className="text-[10px] font-regular leading-none text-gray-500 mt-0.5">
                {ALL_MEMBERS.length} Members Registered
              </p>
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            {!isExpanded && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-0"
              >
                <div className="flex -space-x-2 items-center">
                  {ALL_MEMBERS.slice(0, 3).map((m, idx) => (
                    <motion.img
                      key={`sum-${m.id}`}
                      layoutId={`avatar-${m.id}`}
                      src={m.avatar}
                      className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm z-1"
                      alt="avatar"
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-600 ml-2">
                    +{ALL_MEMBERS.length - 3}
                  </span>
                </div>
              </motion.div>
            )}
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                className="h-8 w-8 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all duration-200 flex items-center justify-center bg-gray-100 active:scale-90 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <span className="text-xl font-normal leading-none">+</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="px-4 py-2"
              >
                <div className="relative">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 transition-colors duration-200"
                    size={12}
                  />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 transition-all duration-200 w-full box-border pl-8"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#5b5ff8 transparent' }}>
            <motion.div
              initial="hidden"
              animate={isExpanded ? "visible" : "hidden"}
              variants={{
                visible: {
                  transition: { staggerChildren: 0.04, delayChildren: 0.15 },
                },
                hidden: {
                  transition: { staggerChildren: 0.02, staggerDirection: -1 },
                },
              }}
              className="space-y-0"
            >
              {filteredAllMembers.map((member) => (
                <MemberItem key={`list-${member.id}`} member={member} />
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default StackedList;
