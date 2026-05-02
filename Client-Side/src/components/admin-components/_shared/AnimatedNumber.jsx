import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/**
 * Counts from 0 toward `value` with spring (master prompt 2C).
 */
export function AnimatedNumber({ value, formatter = (v) => String(v) }) {
  const ref = useRef(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 14 });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = formatter(Math.round(v));
    });
  }, [spring, formatter]);

  return <span ref={ref}>0</span>;
}
