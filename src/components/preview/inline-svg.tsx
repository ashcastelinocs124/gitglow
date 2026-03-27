"use client";

interface InlineSvgProps {
  svg: string;
  className?: string;
}

/**
 * Renders an SVG string directly inline so CSS animations work.
 * (SVGs inside <img> tags have animations stripped by the browser.)
 */
export default function InlineSvg({ svg, className }: InlineSvgProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
