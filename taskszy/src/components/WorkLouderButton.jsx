import { motion } from 'framer-motion'
import { useState } from 'react'

export default function WorkLouderButton({ label = "Button", delay = 0, useSvgIcon = false }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative inline-flex items-center justify-center cursor-pointer"
      style={{
        width: '100px',
        height: '100px',
      }}
    >
      {/* Shadow */}
      <motion.div
        className="absolute"
        style={{
          backgroundColor: 'rgb(0, 0, 0)',
          borderRadius: '20px',
          filter: 'blur(2px)',
          opacity: 0.8,
          left: '2px',
          top: '2px',
          zIndex: 0,
        }}
        animate={{
          bottom: isHovered ? '0px' : '-3px',
          right: isHovered ? '0px' : '-2px',
        }}
        transition={{
          type: 'spring',
          bounce: 0.2,
          duration: 0.4,
        }}
      />

      {/* Background */}
      <div
        className="relative flex flex-col items-center justify-center w-full h-full"
        style={{
          backgroundColor: 'rgb(100, 149, 237)',
          borderRadius: '20px',
          padding: '8px',
          boxShadow: 'inset 8.6746988px 2.6144578px 0.7228915691375732px -7.951807022094727px rgba(255, 255, 255, 0.5), inset 1.4457831382751465px 7.951807022094727px 1.4457831382751465px -7.951807022094727px rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Inner Shadow Gradient Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(20, 20, 20, 0.02) 39.189189189189186%, rgb(145, 145, 145) 100%)',
            borderRadius: '20px',
            mixBlendMode: 'hard-light',
            zIndex: 1,
          }}
        />

        {/* Wrapper */}
        <div
          className="relative flex flex-col items-center justify-center w-full h-full"
          style={{
            backgroundColor: 'rgb(100, 149, 237)',
            borderRadius: '16px',
            padding: '10px',
            zIndex: 0,
          }}
        >
          {/* Inner Shadow on Wrapper */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '16px',
              boxShadow: 'inset -2.4457831px -1.7228916px 4.0240963px 0px rgba(255, 255, 255, 0.3), inset 0.7228915691375732px 2.891566276550293px 5.060240745544434px 0px rgba(0, 0, 0, 0.45)',
              zIndex: 1,
            }}
          />

          {/* Content */}
          <div className="relative flex flex-col items-center justify-center gap-1 z-[2]">
            {/* Icon */}
            {useSvgIcon ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
                style={{ 
                  width: '32px', 
                  height: '32px',
                  fill: 'rgb(255, 255, 255)'
                }}
              >
                <path d="m23.965,20.006l-.983-4.655c-.614-1.941-2.526-3.351-4.548-3.351-2.146,0-4.067,1.537-4.571,3.668l-.966,4.341c-.1.482.023.98.336,1.364.324.398.808.626,1.328.626h1.649c.126,1.123,1.068,2,2.225,2s2.099-.876,2.225-2h1.644c.521,0,1.005-.229,1.329-.627.313-.386.435-.884.333-1.367Zm.035-12.006H0v-1C0,4.243,2.243,2,5,2h1v-1c0-.552.448-1,1-1s1,.448,1,1v1h8v-1c0-.552.448-1,1-1s1,.448,1,1v1h1c2.757,0,5,2.243,5,5v1Zm-12.319,14.635c.705.867,1.754,1.365,2.88,1.365H5c-2.757,0-5-2.243-5-5v-9h18.433c-3.063,0-5.804,2.19-6.523,5.234l-.972,4.371c-.222,1.075.049,2.18.742,3.03Z"/>
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
                style={{ 
                  width: '20px', 
                  height: '20px',
                  color: 'rgb(255, 255, 255)'
                }}
              >
                <path d="m18 15 6-6-6-6"/>
                <path d="M12 21v-6"/>
                <path d="M12 9V3"/>
              </svg>
            )}
            
            {/* Label */}
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgb(255, 255, 255)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {label}
            </span>
          </div>
        </div>

        {/* Noise Texture Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '20px',
            opacity: 0.5,
            mixBlendMode: 'overlay',
            backgroundImage: 'url(https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png?width=256&height=256)',
            backgroundSize: '150%',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'left top',
            zIndex: 1,
          }}
        />
      </div>
    </motion.div>
  )
}
