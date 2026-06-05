import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';
import './AgentAuthPanel.css';

const CONFIG = {
  step: 78,
  indentByDistance: [0, 24, 48, 72, 96],
  opacityByDistance: [1, 0.6, 0.5, 0.3, 0.1],
  centerIndex: 3,
  scrollDelay: 1.5,
  initialScrollDelay: 0.5,
};

const FEATURES = [
  { name: 'Bot Blocking', id: 1 },
  { name: 'Agent Auth', id: 2 },
  { name: 'Audit Logs', id: 3 },
  { name: 'Enterprise SSO', id: 4 },
  { name: 'SCIM', id: 5 },
  { name: 'RBAC', id: 6 },
  { name: 'Connectors', id: 7 },
];

const AgentAuthPanel = () => {
  const [offset, setOffset] = useState(0);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.5 });
  const [isFirstScroll, setIsFirstScroll] = useState(true);
  const enabledCardsRef = useRef(new Set());

  // Create enough duplicates for seamless infinite scrolling (no reset needed)
  const allFeatures = [];
  for (let i = 0; i < 50; i++) {
    FEATURES.forEach((feature) => {
      allFeatures.push({
        ...feature,
        uniqueId: `${feature.id}-${i}`,
      });
    });
  }

  useEffect(() => {
    if (!isInView) return;

    const delay = isFirstScroll ? CONFIG.initialScrollDelay : CONFIG.scrollDelay;
    
    const timer = setTimeout(() => {
      setIsFirstScroll(false);
      // Just keep scrolling - no reset
      setOffset((prev) => prev - CONFIG.step);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [isInView, offset, isFirstScroll]);

  return (
    <div ref={containerRef} className="toggles-graphic">
      <div className="toggles-list-wrap">
        <div className="toggles-list-track">
          <div className="toggles-list">
            {allFeatures.map((feature, index) => {
              const basePosition = index * CONFIG.step;
              const currentPosition = basePosition + offset;
              
              const distanceFromCenter = Math.round(currentPosition / CONFIG.step) - CONFIG.centerIndex;
              const absDistance = Math.abs(distanceFromCenter);
              const clampedDistance = Math.min(absDistance, CONFIG.indentByDistance.length - 1);

              const indent = CONFIG.indentByDistance[clampedDistance];
              const opacity = CONFIG.opacityByDistance[clampedDistance];
              const isCenter = distanceFromCenter === 0;

              // Enable toggle when card reaches center
              if (isCenter && !enabledCardsRef.current.has(feature.uniqueId)) {
                enabledCardsRef.current.add(feature.uniqueId);
              }
              
              const isEnabled = enabledCardsRef.current.has(feature.uniqueId);
              
              return (
                <div
                  key={feature.uniqueId}
                  className="toggles-list-tile-wrap"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: `translateY(${currentPosition}px)`,
                    transition: 'transform 1.4s cubic-bezier(0.77, 0, 0.175, 1)',
                    zIndex: isCenter ? 3 : 1,
                  }}
                >
                  <div
                    className="toggles-list-tile"
                    style={{
                      transform: `translateX(${indent}px)`,
                      transition: 'transform 1.4s cubic-bezier(0.77, 0, 0.175, 1)',
                    }}
                  >
                    <div
                      className="toggles-tile-inner"
                      style={{
                        opacity: opacity,
                        transition: 'opacity 1.4s cubic-bezier(0.77, 0, 0.175, 1)',
                      }}
                    >
                      <div className="flex-h cc-center">
                        <div className="toggles-list-toggle">
                          <div
                            className="toggles-list-toggle-bg"
                            style={{
                              opacity: isEnabled ? 1 : 0,
                              transition: isEnabled ? 'opacity 0.8s ease-in-out' : 'none',
                            }}
                          />
                          <div
                            className="toggles-list-toggle-handle"
                            style={{
                              transform: `translateX(${isEnabled ? 18 : 0}px)`,
                              transition: isEnabled ? 'transform 0.65s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none',
                            }}
                          />
                        </div>
                        <div
                          className="toggles-list-label"
                          style={{
                            opacity: isEnabled ? 1 : opacity,
                            transition: 'opacity 0.65s',
                          }}
                        >
                          {feature.name}
                        </div>
                      </div>
                      <div
                        className="toggles-list-badge"
                        style={{
                          width: isEnabled ? '62px' : '51px',
                          backgroundColor: isEnabled ? 'rgba(0, 174, 72, 0.1)' : 'transparent',
                          borderColor: isEnabled ? 'rgba(0, 162, 85, 0.23)' : 'rgba(200, 200, 200, 0.2)',
                          transition: 'all 0.65s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        }}
                      >
                        <div
                          className="toggles-badge-text cc-ready"
                          style={{
                            opacity: isEnabled ? 0 : 1,
                            filter: isEnabled ? 'blur(2px)' : 'blur(0px)',
                            transition: 'all 0.65s',
                          }}
                        >
                          Ready
                        </div>
                        <div
                          className="toggles-badge-text cc-enabled"
                          style={{
                            opacity: isEnabled ? 1 : 0,
                            filter: isEnabled ? 'blur(0px)' : 'blur(2px)',
                            transition: 'all 0.65s',
                          }}
                        >
                          Enabled
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAuthPanel;
