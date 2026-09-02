import React, { useState, useRef } from 'react';
import { ResumeData } from '../types';
import { ResumeDocument } from './ResumeDocument';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LayoutTemplate,
  Eye,
  Maximize2,
  Minimize2,
  Printer,
  Loader2,
} from 'lucide-react';

interface ThreeResumeCanvasProps {
  data: ResumeData;
  isOriginalSize?: boolean;
  onToggleOriginalSize?: () => void;
  onExportPDF?: () => void;
}

export const ThreeResumeCanvas: React.FC<ThreeResumeCanvasProps> = ({
  data,
  isOriginalSize = true,
  onToggleOriginalSize,
  onExportPDF,
}) => {
  const [zoom, setZoom] = useState(1);
  const [is3DMode, setIs3DMode] = useState(false); // Default to clean flat document viewer
  const [template, setTemplate] = useState<'modern' | 'minimal' | 'executive'>('modern');
  const [rotation, setRotation] = useState({ x: 2, y: -4 });
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mouse tilt tracking in 3D mode only
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3DMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setRotation({
      x: -y * 6,
      y: x * 8,
    });
  };

  const handleMouseLeave = () => {
    if (is3DMode) {
      setRotation({ x: 2, y: -4 });
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    // Switch to flat mode and unscale so printout is 100% vector-sharp without any CSS transforms
    setIs3DMode(false);
    setZoom(1);

    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 200);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex-1 relative bg-[#060a12] flex flex-col overflow-hidden h-full select-none"
    >
      {/* Viewport Top Controls Toolbar */}
      <div className="shrink-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2 bg-[#0e1424] border-b border-white/[0.08] shadow-sm no-print gap-2">
        {/* Left: Viewport Status & Dimensions Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-mono text-slate-200 font-semibold hidden sm:inline">
            PDF Paper Canvas
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
            8.5" × 11" Letter
          </span>
          <span className="text-[11px] font-mono text-slate-400 capitalize hidden md:inline">
            • {template}
          </span>
        </div>

        {/* Right: Actions Cluster */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Template Switcher */}
          <button
            onClick={() => {
              setTemplate((prev) =>
                prev === 'modern' ? 'minimal' : prev === 'minimal' ? 'executive' : 'modern'
              );
            }}
            className="h-7 px-2 rounded bg-[#131d33] hover:bg-[#1a2744] text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch Resume Style"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-blue-400" />
            <span className="capitalize hidden sm:inline">{template}</span>
          </button>

          {/* 3D / Flat View Toggle */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`h-7 px-2 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
              is3DMode
                ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                : 'bg-[#131d33] hover:bg-[#1a2744] text-slate-300 border-white/10'
            }`}
            title="Toggle between Flat Paper and 3D Showcase"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{is3DMode ? '3D' : 'Flat'}</span>
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5 hidden sm:block"></div>

          {/* Zoom Controls */}
          <button
            onClick={() => setZoom((prev) => Math.min(prev + 0.1, 1.4))}
            className="h-7 w-7 rounded bg-[#131d33] hover:bg-[#1a2744] text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.7))}
            className="h-7 w-7 rounded bg-[#131d33] hover:bg-[#1a2744] text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setZoom(1);
              setRotation({ x: 2, y: -4 });
            }}
            className="h-7 px-2 rounded bg-[#131d33] hover:bg-[#1a2744] text-slate-300 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset Zoom to 100%"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">100%</span>
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5"></div>

          {/* Primary Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="h-7 px-2.5 sm:px-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title="Export Vector-Accurate PDF Document"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isExporting ? 'Preparing...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Document Viewer Stage */}
      <div
        className="flex-1 w-full h-full relative overflow-auto p-4 sm:p-8 lg:p-10 flex justify-center items-start"
        style={{ perspective: is3DMode ? '1400px' : 'none' }}
      >
        {/* Paper Document Container (Guaranteed True 8.5" x 11" Original Dimensions) */}
        <div
          className="bg-white rounded-sm shadow-2xl transition-all duration-150 ease-out border border-slate-300 ring-1 ring-black/10 shrink-0 my-4"
          style={{
            width: isOriginalSize ? '816px' : '100%',
            maxWidth: isOriginalSize ? '816px' : '816px',
            minWidth: isOriginalSize ? '816px' : '320px',
            transform: is3DMode
              ? `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
              : `scale(${zoom})`,
            transformStyle: is3DMode ? 'preserve-3d' : 'flat',
            transformOrigin: 'top center',
          }}
        >
          <ResumeDocument data={data} templateStyle={template} />
        </div>
      </div>
    </div>
  );
};
