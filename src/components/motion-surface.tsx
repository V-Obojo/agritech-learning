"use client";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import Link from "next/link";

// Visible server HTML keeps reading independent of hydration or animation support.
export function MotionSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <MotionConfig reducedMotion="user"><motion.div className={className} initial={false} animate={{ opacity: 1, y: 0 }} variants={{ enter: { transition: { staggerChildren: reduce ? 0 : .06 } } }} whileInView="enter" viewport={{ once: true }}>{children}</motion.div></MotionConfig>;
}
const MotionLink=motion.create(Link);
export function AnimatedLink({ children, className, href, index=0 }: {children:ReactNode;className:string;href:string;index?:number}) {
  const reduce=useReducedMotion();
  return <MotionLink href={href} className={className} initial={false} whileInView={{y:reduce ? 0 : [14,0],opacity:reduce ? 1 : [.8,1]}} viewport={{once:true}} whileHover={reduce ? undefined : {y:-4}} transition={{duration:reduce ? 0 : .3,delay:reduce ? 0 : index*.06}}>{children}</MotionLink>;
}
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={false} whileInView={{ opacity: [0.8, 1], y: reduce ? 0 : [12, 0] }} viewport={{ once: true }} transition={{ duration: reduce ? 0 : .35 }}>{children}</motion.div>;
}
