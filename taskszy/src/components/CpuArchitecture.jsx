import { cn } from "@/lib/utils";
import React from "react";
import './CpuArchitecture.css';

export const CpuArchitecture = ({
  className,
  width = "100%",
  height = "100%",
  text = "CPU",
  showCpuConnections = true,
  animateText = true,
  lineMarkerSize = 18,
  animateLines = true,
  animateMarkers = true,
}) => {
  return (
    <svg
      className={cn("text-muted", className)}
      width={width}
      height={height}
      viewBox="0 0 200 100"
    >
      {/* Paths */}
      <g
        stroke="currentColor"
        fill="none"
        strokeWidth="0.3"
        strokeDasharray="100 100"
        pathLength="100"
        markerStart="url(#cpu-circle-marker)"
      >
        {/* 1st - spread left */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 5 15 h 84.5 q 5 0 5 5 v 35"
        />
        {/* 2nd - spread right */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 185 5 h -74.7 q -5 0 -5 5 v 35"
        />
        {/* 3rd - spread right */}
        <path d="M 135 15 v 21.8 q 0 5 -5 5 h -15" />
        {/* 4th - spread right */}
        <path d="M 175 85 v -21.8 q 0 -5 -5 -5 h -55" />
        {/* 5th - spread right */}
        <path
          strokeDasharray="100 100"
          pathLength="100"
          d="M 140 70 h 20 q 5 0 5 5 v 10 q 0 5 -5 5 h -44.8 q -5 0 -5 -5 v -25"
        />
        {/* 6th */}
        <path d="M 94.8 95 v -36" />
        {/* 7th - spread left */}
        <path d="M 83 88 v -15 q 0 -5 -5 -5 h -15 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 19" />
        {/* 8th - spread left */}
        <path d="M 25 25 h 30 q 5 0 5 5 v 6.5 q 0 5 5 5 h 25" />
        {/* Animation For Path Starting */}
        {animateLines && (
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        )}
      </g>

      {/* 1. Blue Light */}
      <g mask="url(#cpu-mask-1)">
        <circle
          className="cpu-architecture cpu-line-1"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-blue-grad)"
        />
      </g>

      {/* 2. Yellow Light */}
      <g mask="url(#cpu-mask-2)">
        <circle
          className="cpu-architecture cpu-line-2"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-yellow-grad)"
        />
      </g>

      {/* 3. Pinkish Light */}
      <g mask="url(#cpu-mask-3)">
        <circle
          className="cpu-architecture cpu-line-3"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-pinkish-grad)"
        />
      </g>

      {/* 4. White Light */}
      <g mask="url(#cpu-mask-4)">
        <circle
          className="cpu-architecture cpu-line-4"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-white-grad)"
        />
      </g>

      {/* 5. Green Light */}
      <g mask="url(#cpu-mask-5)">
        <circle
          className="cpu-architecture cpu-line-5"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-green-grad)"
        />
      </g>

      {/* 6. Orange Light */}
      <g mask="url(#cpu-mask-6)">
        <circle
          className="cpu-architecture cpu-line-6"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-orange-grad)"
        />
      </g>

      {/* 7. Cyan Light */}
      <g mask="url(#cpu-mask-7)">
        <circle
          className="cpu-architecture cpu-line-7"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-cyan-grad)"
        />
      </g>

      {/* 8. Rose Light */}
      <g mask="url(#cpu-mask-8)">
        <circle
          className="cpu-architecture cpu-line-8"
          cx="0"
          cy="0"
          r="8"
          fill="url(#cpu-rose-grad)"
        />
      </g>

      {/* CPU Box */}
      <g>
        {/* Outer Frame - Medium dark gray (bigger one) with light border */}
        <rect
          x="78"
          y="35"
          width="44"
          height="30"
          rx="3"
          fill="#3d3d3d"
          stroke="#888888"
          strokeWidth="0.2"
        />

        {/* Inner Substrate - Slightly lighter gray layer (smaller one) with light border */}
        <rect
          x="81"
          y="38"
          width="38"
          height="24"
          rx="2.5"
          fill="#4d4d4d"
          stroke="#888888"
          strokeWidth="0.3"
        />

        {/* Central Black Chip */}
        <rect
          x="88"
          y="43"
          width="24"
          height="14"
          rx="2"
          fill="#0a0a0a"
          filter="url(#cpu-light-shadow)"
        />

        {/* CPU Text */}
        <text
          x="100"
          y="52"
          fontSize="5"
          fill={animateText ? "url(#cpu-text-gradient)" : "white"}
          fontWeight="700"
          letterSpacing="0.05em"
          textAnchor="middle"
        >
          {text}
        </text>

        {/* Small Chip - Top Center */}
        <g>
          {/* Connection lines - ONLY 2 LINES (outer ones) */}
          <line x1="98.02" y1="20" x2="98.02" y2="35" stroke="#555555" strokeWidth="0.2" />
          <line x1="101.98" y1="20" x2="101.98" y2="35" stroke="#555555" strokeWidth="0.2" />
          
          {/* Chip body with border */}
          <rect x="97" y="20" width="6" height="4" rx="0.4" fill="#2a2a2a" stroke="#555555" strokeWidth="0.2" />
          {/* Inner darker area */}
          <rect x="97.5" y="20.5" width="5" height="3" rx="0.3" fill="#1a1a1a" />
          
          {/* 4 yellow/green pins - PERFECTLY CENTERED with equal spacing */}
          <rect x="97.72" y="19" width="0.6" height="1" rx="0.15" fill="#a3e635" />
          <rect x="99.04" y="19" width="0.6" height="1" rx="0.15" fill="#a3e635" />
          <rect x="100.36" y="19" width="0.6" height="1" rx="0.15" fill="#a3e635" />
          <rect x="101.68" y="19" width="0.6" height="1" rx="0.15" fill="#a3e635" />
          
          {/* Left side connection point - hollow */}
          <circle cx="96.5" cy="22" r="0.5" fill="none" stroke="#a3e635" strokeWidth="0.2" />
          
          {/* Right side connection point - hollow */}
          <circle cx="103.5" cy="22" r="0.5" fill="none" stroke="#a3e635" strokeWidth="0.2" />
        </g>

        {/* Small Chip - Bottom Center */}
        <g>
          {/* Connection lines - ONLY 2 LINES (outer ones) */}
          <line x1="98.02" y1="65" x2="98.02" y2="80" stroke="#555555" strokeWidth="0.2" />
          <line x1="101.98" y1="65" x2="101.98" y2="80" stroke="#555555" strokeWidth="0.2" />
          
          {/* Chip body with border */}
          <rect x="97" y="76" width="6" height="4" rx="0.4" fill="#2a2a2a" stroke="#555555" strokeWidth="0.2" />
          {/* Inner darker area */}
          <rect x="97.5" y="76.5" width="5" height="3" rx="0.3" fill="#1a1a1a" />
          
          {/* 4 yellow/green pins - PERFECTLY CENTERED with equal spacing */}
          <rect x="97.72" y="80" width="0.6" height="1" rx="0.15" fill="#a3e635" />
          <rect x="99.04" y="80" width="0.6" height="1" rx="0.15" fill="#a3e635" />
          <rect x="100.36" y="80" width="0.6" height="1" rx="0.15" fill="#a3e635" />
          <rect x="101.68" y="80" width="0.6" height="1" rx="0.15" fill="#a3e635" />
          
          {/* Left side connection point - hollow */}
          <circle cx="96.5" cy="78" r="0.5" fill="none" stroke="#a3e635" strokeWidth="0.2" />
          
          {/* Right side connection point - hollow */}
          <circle cx="103.5" cy="78" r="0.5" fill="none" stroke="#a3e635" strokeWidth="0.2" />
        </g>

        {/* CPU Pins/Connections with lines and squares */}
        {showCpuConnections && (
          <g>
            {/* Top pins - 8 pins with lines ending in squares - centered */}
            {/* Pin 1 */}
            <line x1="86" y1="35" x2="86" y2="30" stroke="#555555" strokeWidth="0.5" />
            <rect x="85.4" y="29" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 2 */}
            <line x1="90" y1="35" x2="90" y2="30" stroke="#555555" strokeWidth="0.5" />
            <rect x="89.4" y="29" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 3 */}
            <line x1="94" y1="35" x2="94" y2="30" stroke="#555555" strokeWidth="0.5" />
            <rect x="93.4" y="29" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 4 */}
            <line x1="98" y1="35" x2="98" y2="30" stroke="#555555" strokeWidth="0.5" />
            <rect x="97.4" y="29" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 5 */}
            <line x1="102" y1="35" x2="102" y2="30" stroke="#555555" strokeWidth="0.5" />
            <rect x="101.4" y="29" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 6 */}
            <line x1="106" y1="35" x2="106" y2="30" stroke="#555555" strokeWidth="0.5" />
            <rect x="105.4" y="29" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 7 */}
            <line x1="110" y1="35" x2="110" y2="30" stroke="#555555" strokeWidth="0.5" />
            <rect x="109.4" y="29" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 8 */}
            <line x1="114" y1="35" x2="114" y2="30" stroke="#555555" strokeWidth="0.5" />
            <rect x="113.4" y="29" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />

            {/* Bottom pins - 8 pins with lines ending in squares - centered */}
            {/* Pin 1 */}
            <line x1="86" y1="65" x2="86" y2="70" stroke="#555555" strokeWidth="0.5" />
            <rect x="85.4" y="70" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 2 */}
            <line x1="90" y1="65" x2="90" y2="70" stroke="#555555" strokeWidth="0.5" />
            <rect x="89.4" y="70" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 3 */}
            <line x1="94" y1="65" x2="94" y2="70" stroke="#555555" strokeWidth="0.5" />
            <rect x="93.4" y="70" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 4 */}
            <line x1="98" y1="65" x2="98" y2="70" stroke="#555555" strokeWidth="0.5" />
            <rect x="97.4" y="70" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 5 */}
            <line x1="102" y1="65" x2="102" y2="70" stroke="#555555" strokeWidth="0.5" />
            <rect x="101.4" y="70" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 6 */}
            <line x1="106" y1="65" x2="106" y2="70" stroke="#555555" strokeWidth="0.5" />
            <rect x="105.4" y="70" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 7 */}
            <line x1="110" y1="65" x2="110" y2="70" stroke="#555555" strokeWidth="0.5" />
            <rect x="109.4" y="70" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
            
            {/* Pin 8 */}
            <line x1="114" y1="65" x2="114" y2="70" stroke="#555555" strokeWidth="0.5" />
            <rect x="113.4" y="70" width="1.2" height="1.2" rx="0.2" fill="#555555" fillOpacity="0.3" stroke="#555555" strokeWidth="0.5" />
          </g>
        )}
      </g>

      {/* Masks */}
      <defs>
        <mask id="cpu-mask-1">
          <path
            d="M 5 15 h 84.5 q 5 0 5 5 v 29"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-2">
          <path
            d="M 185 5 h -74.7 q -5 0 -5 5 v 29"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-3">
          <path
            d="M 135 15 v 21.8 q 0 5 -5 5 h -15"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-4">
          <path
            d="M 175 85 v -21.8 q 0 -5 -5 -5 h -55"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-5">
          <path
            d="M 140 70 h 20 q 5 0 5 5 v 10 q 0 5 -5 5 h -44.8 q -5 0 -5 -5 v -25"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-6">
          <path d="M 94.8 95 v -36" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-7">
          <path
            d="M 83 88 v -15 q 0 -5 -5 -5 h -15 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 19"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>
        <mask id="cpu-mask-8">
          <path
            d="M 25 25 h 30 q 5 0 5 5 v 6.5 q 0 5 5 5 h 25"
            strokeWidth="0.5"
            stroke="white"
          />
        </mask>

        {/* Gradients */}
        <radialGradient id="cpu-blue-grad" fx="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-yellow-grad" fx="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-pinkish-grad" fx="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-white-grad" fx="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-green-grad" fx="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad" fx="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-cyan-grad" fx="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-rose-grad" fx="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <filter
          id="cpu-light-shadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="1.5"
            dy="1.5"
            stdDeviation="1"
            floodColor="black"
            floodOpacity="0.1"
          />
        </filter>

        <marker
          id="cpu-circle-marker"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth={lineMarkerSize}
          markerHeight={lineMarkerSize}
        >
          <circle
            id="innerMarkerCircle"
            cx="5"
            cy="5"
            r="2"
            fill="black"
            stroke="#232323"
            strokeWidth="0.5"
          >
            {animateMarkers && (
              <animate attributeName="r" values="0; 3; 2" dur="0.5s" />
            )}
          </circle>
        </marker>

        {/* Cpu connection gradient */}
        <linearGradient
          id="cpu-connection-gradient"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#4F4F4F" />
          <stop offset="60%" stopColor="#121214" />
        </linearGradient>

        {/* Add CPU Text Gradient */}
        <linearGradient id="cpu-text-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#666666">
            <animate
              attributeName="offset"
              values="-2; -1; 0"
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
          <stop offset="25%" stopColor="white">
            <animate
              attributeName="offset"
              values="-1; 0; 1"
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
          <stop offset="50%" stopColor="#666666">
            <animate
              attributeName="offset"
              values="0; 1; 2;"
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            />
          </stop>
        </linearGradient>
      </defs>
    </svg>
  );
};
