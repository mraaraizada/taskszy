import React, { useEffect, useState } from "react";

const projects = [
  { name: "Website Redesign", status: "Paid", statusColor: "bg-emerald-500", team: "Frontend Team", budget: "$12,500" },
  { name: "Mobile App", status: "Unpaid", statusColor: "bg-gray-400", team: "Mobile Team", budget: "$8,750" },
  { name: "API Integration", status: "Pending", statusColor: "bg-amber-500", team: "Backend Team", budget: "$5,200" },
  { name: "Database Migration", status: "Paid", statusColor: "bg-emerald-500", team: "DevOps Team", budget: "$3,800" },
  { name: "User Dashboard", status: "Paid", statusColor: "bg-emerald-500", team: "UX Team", budget: "$7,200" },
  { name: "Security Audit", status: "Failed", statusColor: "bg-red-500", team: "Security Team", budget: "$2,100" },
  { name: "Cloud Infrastructure", status: "Pending", statusColor: "bg-amber-500", team: "DevOps Team", budget: "$9,400" },
  { name: "Analytics Dashboard", status: "Paid", statusColor: "bg-emerald-500", team: "Data Team", budget: "$6,800" },
];

export function ProjectTable() {
  const [activeRow, setActiveRow] = useState(-1);

  useEffect(() => {
    let currentRow = 0;
    const interval = setInterval(() => {
      setActiveRow(currentRow);
      currentRow = (currentRow + 1) % projects.length;
    }, 800); // Change highlighted row every 800ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-white text-gray-900 overflow-hidden flex flex-col rounded-xl border border-gray-200" style={{ 
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      transform: 'translateZ(0)',
      WebkitFontSmoothing: 'antialiased'
    }}>
      <style>
        {`
          .project-table-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .project-table-scroll::-webkit-scrollbar-track {
            background: transparent;
            margin: 8px 0;
          }
          .project-table-scroll::-webkit-scrollbar-thumb {
            background: #5b5ff8;
            border-radius: 999px;
            min-height: 20px;
            max-height: 40px;
          }
          .project-table-scroll::-webkit-scrollbar-thumb:hover {
            background: #4a4ed6;
          }
        `}
      </style>
      <div className="flex-1 overflow-auto p-2 project-table-scroll">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-2 py-1.5 text-gray-500 font-semibold" style={{ fontSize: '9px' }}>Project</th>
              <th className="text-left px-2 py-1.5 text-gray-500 font-semibold" style={{ fontSize: '9px' }}>Status</th>
              <th className="text-left px-2 py-1.5 text-gray-500 font-semibold" style={{ fontSize: '9px' }}>Team</th>
              <th className="text-right px-2 py-1.5 text-gray-500 font-semibold" style={{ fontSize: '9px' }}>Budget</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-gray-100 transition-all duration-300 ${
                  activeRow === idx 
                    ? 'bg-blue-50 shadow-sm' 
                    : 'bg-white hover:bg-gray-50'
                }`}
                style={{
                  transform: activeRow === idx ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: 'left center'
                }}
              >
                <td className="px-2 py-1.5 font-semibold text-gray-900" style={{ fontSize: '9px' }}>{project.name}</td>
                <td className="px-2 py-1.5" style={{ fontSize: '9px' }}>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border transition-all duration-300 ${
                    activeRow === idx 
                      ? 'border-blue-300 bg-blue-100' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${project.statusColor} ${
                      activeRow === idx ? 'animate-pulse' : ''
                    }`}></span>
                    <span style={{ fontSize: '8px' }}>{project.status}</span>
                  </span>
                </td>
                <td className="px-2 py-1.5 text-gray-600" style={{ fontSize: '9px' }}>{project.team}</td>
                <td className={`px-2 py-1.5 text-right font-medium transition-colors duration-300 ${
                  activeRow === idx ? 'text-blue-600' : 'text-gray-900'
                }`} style={{ fontSize: '9px' }}>{project.budget}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td colSpan={3} className="px-2 py-1.5 font-bold text-gray-900" style={{ fontSize: '9px' }}>Total Budget</td>
              <td className="px-2 py-1.5 text-right font-bold text-gray-900" style={{ fontSize: '9px' }}>$55,750</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="text-center px-2 pb-2 text-gray-500" style={{ fontSize: '8px' }}>
        A list of current projects.
      </div>
    </div>
  );
}

