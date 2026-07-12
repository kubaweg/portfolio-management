import React from 'react';

interface ChartTooltipProps {
    visible: boolean;
    x: number;
    y: number;
    text: string;
}

export const ChartTooltip = ({ visible, x, y, text }: ChartTooltipProps) => {
    if (!visible) return null;

    return (
        <div
            className="absolute z-50 pointer-events-none px-3 py-2 text-sm font-medium text-white rounded-lg shadow-md transform -translate-x-1/2 -translate-y-full transition-opacity duration-150"
            style={{
                left: x,
                top: y - 12, // 12px nad kursorem
                backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate-900 z przezroczystością
            }}
        >
            {text}
            {/* Mały trójkąt na dole dymka */}
            <div className="absolute left-1/2 bottom-0 w-2 h-2 -translate-x-1/2 translate-y-1/2 rotate-45 bg-slate-900/90" />
        </div>
    );
};