import { motion, type Transition, type Easing } from 'motion/react';
import React, { useEffect, useRef, useState, useMemo } from 'react';

type BlurTextProps = {
  text?: string;
  startDelay?: number;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, string | number>;
  animationTo?: Array<Record<string, string | number>>;
  easing?: Easing | Easing[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
};

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
): Record<string, Array<string | number>> => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);

  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])];
  });
  return keyframes;
};

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  startDelay = 0,
  delay = 50,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t: number) => t,
  onAnimationComplete,
  stepDuration = 0.3
}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top' ? { filter: 'blur(10px)', opacity: 0, y: -16 } : { filter: 'blur(10px)', opacity: 0, y: 16 },
    [direction]
  );

  const defaultTo = useMemo(
    () => [
      {
        filter: 'blur(3px)',
        opacity: 0.6,
        y: direction === 'top' ? 2 : -2
      },
      { filter: 'blur(0px)', opacity: 1, y: 0 }
    ],
    [direction]
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));

  // Split into paragraphs to preserve line breaks and natural block typography
  const paragraphs = useMemo(() => {
    return text.split(/\r?\n/);
  }, [text]);

  // Calculate total tokens across all paragraphs for onAnimationComplete
  let totalTokenCount = 0;
  paragraphs.forEach(p => {
    if (!p.trim()) return;
    const tokens = animateBy === 'words' ? p.split(/\s+/).filter(Boolean) : p.split('');
    totalTokenCount += tokens.length;
  });

  let globalTokenIndex = 0;

  return (
    <div ref={ref} className={`blur-text ${className} text-left`}>
      {paragraphs.map((paragraph, pIdx) => {
        if (!paragraph.trim()) {
          return <div key={pIdx} className="h-3 w-full" aria-hidden="true" />;
        }

        const tokens = animateBy === 'words' ? paragraph.split(/\s+/).filter(Boolean) : paragraph.split('');

        return (
          <p key={pIdx} className="leading-relaxed text-left whitespace-normal break-words mb-3.5 last:mb-0">
            {tokens.map((token, tIdx) => {
              const currentGlobalIndex = globalTokenIndex++;
              const isLastToken = currentGlobalIndex === totalTokenCount - 1;
              const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);

              const spanTransition: Transition = {
                duration: totalDuration,
                times,
                delay: ((startDelay || 0) + currentGlobalIndex * delay) / 1000,
                ease: easing
              };

              return (
                <motion.span
                  key={tIdx}
                  initial={fromSnapshot}
                  animate={inView ? animateKeyframes : fromSnapshot}
                  transition={spanTransition}
                  onAnimationComplete={isLastToken ? onAnimationComplete : undefined}
                  style={{
                    display: 'inline-block',
                    marginRight: animateBy === 'words' && tIdx < tokens.length - 1 ? '0.28em' : undefined,
                    willChange: 'transform, filter, opacity'
                  }}
                >
                  {token}
                </motion.span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
};

export default BlurText;
