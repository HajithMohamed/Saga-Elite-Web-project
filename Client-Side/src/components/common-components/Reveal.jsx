// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Luxury scroll-reveal wrapper — fades + lifts + un-blurs a section as it
// enters the viewport (once). Matches the homepage's cinematic motion language
// (easeOutQuart-ish cubic-bezier). Use to give "instant-appearing" sections a
// graceful entrance without re-implementing the animation each time.
const Reveal = ({ children, className, delay = 0, y = 40 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y, filter: "blur(6px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default Reveal;
