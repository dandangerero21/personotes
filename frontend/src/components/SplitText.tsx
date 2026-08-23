import React, { useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text = '',
  className = '',
  delay = 35,
  duration = 0.8,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 30 },
  to = { opacity: 1, y: 0 },
  tag = 'h2',
  textAlign = 'left',
  onLetterAnimationComplete
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const onCompleteRef = useRef(onLetterAnimationComplete);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  const items = useMemo(() => {
    if (splitType === 'words') {
      return text.split(/(\s+)/).filter(Boolean);
    }
    // Default to chars
    return text.split('');
  }, [text, splitType]);

  useGSAP(
    () => {
      if (!containerRef.current || !text) return;

      const elements = containerRef.current.querySelectorAll('.split-unit');
      if (!elements.length) return;

      gsap.fromTo(
        elements,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          onComplete: () => {
            onCompleteRef.current?.();
          },
          willChange: 'transform, opacity',
          force3D: true
        }
      );
    },
    {
      dependencies: [text, delay, duration, ease, JSON.stringify(from), JSON.stringify(to)],
      scope: containerRef
    }
  );

  const Tag = (tag || 'p') as React.ElementType;

  return (
    <Tag
      ref={containerRef}
      style={{ textAlign, willChange: 'transform, opacity' }}
      className={`split-parent overflow-hidden inline-flex flex-wrap ${className}`}
    >
      {items.map((item, index) => {
        if (item === ' ') {
          return (
            <span key={index} className="inline-block">
              &nbsp;
            </span>
          );
        }
        return (
          <span
            key={index}
            className="split-unit inline-block"
            style={{ willChange: 'transform, opacity' }}
          >
            {item}
          </span>
        );
      })}
    </Tag>
  );
};

export default SplitText;
