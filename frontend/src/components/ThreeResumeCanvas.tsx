import React, { useState, useRef, useEffect } from 'react';
import { ResumeData } from '../types';
import { ResumeDocument } from './ResumeDocument';
import { ZoomIn, ZoomOut, RotateCcw, Download, Sparkles, LayoutTemplate, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ThreeResumeCanvasProps {
  data: ResumeData;
  onExportPDF?: () => void;
}

export const ThreeResumeCanvas: React.FC<ThreeResumeCanvasProps> = ({ data }) => {
  const [zoom, setZoom] = useState(1);
  const [is3DMode, setIs3DMode] = useState(true);
  const [template, setTemplate] = useState<'modern' | 'minimal' | 'executive'>('modern');
  const [rotation, setRotation] = useState({ x: 2, y: -5 });
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mouse tilt tracking in 3D mode
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!is3DMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setRotation({
      x: -y * 8, // subtle pitch
      y: x * 10, // subtle yaw
    });
  };

  const handleMouseLeave = () => {
    if (is3DMode) {
      setRotation({ x: 2, y: -5 }); // Return to default resting isometric angle
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4edea3', '#3b82f6', '#d0bcff'],
    });

    // Trigger browser print for pristine vector-accurate PDF output
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex-1 relative bg-[#090D16] flex flex-col overflow-hidden h-full select-none"
    >
      {/* Viewport Toolbar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-[#111827]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#1F2937] shadow-xl no-print">
        {/* Template Selector */}
        <div className="relative group">
          <button
            className="p-1.5 rounded hover:bg-[#1f2937] text-slate-400 hover:text-[#4edea3] transition-colors flex items-center gap-1.5 text-xs font-mono px-2"
            title="Switch Template"
            onClick={() => {
              setTemplate((prev) =>
                prev === 'modern' ? 'minimal' : prev === 'minimal' ? 'executive' : 'modern'
              );
            }}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="capitalize hidden sm:inline">{template}</span>
          </button>
        </div>

        {/* 3D / Flat View Toggle */}
        <button
          onClick={() => setIs3DMode(!is3DMode)}
          className={`p-1.5 rounded text-xs font-mono flex items-center gap-1 px-2 transition-all ${
            is3DMode
              ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30'
              : 'hover:bg-[#1f2937] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle 3D Perspective"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{is3DMode ? '3D View' : 'Flat View'}</span>
        </button>

        <div className="w-px h-5 bg-[#1F2937] self-center mx-0.5"></div>

        {/* Zoom In */}
        <button
          onClick={() => setZoom((prev) => Math.min(prev + 0.15, 1.6))}
          className="p-1.5 rounded hover:bg-[#1f2937] text-slate-400 hover:text-[#4edea3] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => setZoom((prev) => Math.max(prev - 0.15, 0.65))}
          className="p-1.5 rounded hover:bg-[#1f2937] text-slate-400 hover:text-[#4edea3] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Reset */}
        <button
          onClick={() => {
            setZoom(1);
            setRotation({ x: 2, y: -5 });
          }}
          className="p-1.5 rounded hover:bg-[#1f2937] text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset Zoom & Rotation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-[#1F2937] self-center mx-0.5"></div>

        {/* Export PDF Button */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4edea3] text-[#003824] hover:bg-[#6ffbbe] rounded font-bold text-xs shadow-md shadow-[#4edea3]/20 transition-all btn-spring"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </button>
      </div>

      {/* Ambient Live indicator badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#111827]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#1F2937] text-xs font-mono no-print">
        <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse shadow-[0_0_8px_#4edea3]"></div>
        <span className="text-slate-300">Live 3D Viewport</span>
      </div>

      {/* 3D Viewport Stage */}
      <div
        className="flex-1 w-full h-full relative flex items-center justify-center p-6 sm:p-12 overflow-auto"
        style={{ perspective: '1200px' }}
      >
        <div
          className="w-full max-w-2xl sm:max-w-3xl aspect-[8.5/11] bg-white rounded-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(78,222,163,0.12)] overflow-hidden relative transition-transform duration-300 ease-out border border-slate-700/20"
          style={{
            transform: is3DMode
              ? `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
              : `scale(${zoom})`,
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
          }}
        >
          <ResumeDocument data={data} templateStyle={template} />
        </div>
      </div>
    </div>
  );
};
