"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface LetterState {
  char: string
  isMatrix: boolean
  isSpace: boolean
}

interface MatrixTextProps {
  text?: string
  className?: string
  initialDelay?: number
  letterAnimationDuration?: number
  letterInterval?: number
}

// Base look (text-black dark:text-white) comes from CSS via className.
// Variants only add the matrix effect. textShadow start/end states are explicit
// transparent values so Motion can interpolate the glow without warnings.
const MOTION_VARIANTS = {
  initial: { textShadow: "0 0px 0px rgba(0, 255, 0, 0)" },
  matrix: {
    color: "#00ff00",
    textShadow: "0 2px 4px rgba(0, 255, 0, 0.5)",
  },
  normal: { textShadow: "0 0px 0px rgba(0, 255, 0, 0)" },
}

function toLetterStates(text: string): LetterState[] {
  return text.split("").map((char) => ({
    char,
    isMatrix: false,
    isSpace: char === " ",
  }))
}

const MatrixText = ({
  text = "HelloWorld!",
  className,
  initialDelay = 200,
  letterAnimationDuration = 500,
  letterInterval = 100,
}: MatrixTextProps) => {
  const [letters, setLetters] = useState<LetterState[]>(() => toLetterStates(text))
  const timeouts = useRef<number[]>([])
  const isAnimatingRef = useRef(false)

  // setTimeout wrapper that tracks every timer so unmount/effect cleanup can clear them.
  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timeouts.current.push(id)
    return id
  }, [])

  const getRandomChar = useCallback(() => (Math.random() > 0.5 ? "1" : "0"), [])

  const animateLetter = useCallback(
    (index: number) => {
      if (index >= text.length) return

      requestAnimationFrame(() => {
        // Guard against a text change that shortened the array
        // while this frame was queued.
        setLetters((prev) => {
          const next = [...prev]
          const target = next[index]
          if (!target || target.isSpace) return prev
          next[index] = { ...target, char: getRandomChar(), isMatrix: true }
          return next
        })

        later(() => {
          setLetters((prev) => {
            const next = [...prev]
            const target = next[index]
            if (!target) return prev
            next[index] = { ...target, char: text[index], isMatrix: false }
            return next
          })
        }, letterAnimationDuration)
      })
    },
    [getRandomChar, text, letterAnimationDuration, later],
  )

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return

    isAnimatingRef.current = true
    let currentIndex = 0

    const animate = () => {
      if (currentIndex >= text.length) {
        isAnimatingRef.current = false
        return
      }

      animateLetter(currentIndex)
      currentIndex++
      later(animate, letterInterval)
    }

    animate()
  }, [animateLetter, text, letterInterval, later])

  // (Re)start the animation whenever text or timing changes.
  // Cleanup clears every pending timer — no setState after unmount.
  useEffect(() => {
    setLetters(toLetterStates(text))
    isAnimatingRef.current = false

    const id = window.setTimeout(() => startAnimation(), initialDelay)
    timeouts.current.push(id)

    return () => {
      timeouts.current.forEach((t) => window.clearTimeout(t))
      timeouts.current = []
      isAnimatingRef.current = false
    }
  }, [text, initialDelay, startAnimation])

  return (
    <div
      className={cn("flex min-h-screen items-center justify-center text-black dark:text-white", className)}
      aria-label="Matrix text animation"
    >
      <div className="h-24 flex items-center justify-center">
        <div className="flex flex-wrap items-center justify-center">
          {letters.map((letter, index) => (
            <motion.div
              // Key includes the char so every glyph swap remounts the node —
              // that's what makes the binary flicker sharp instead of a smooth morph.
              key={`${index}-${letter.char}`}
              className="font-mono text-4xl md:text-6xl w-[1ch] text-center overflow-hidden"
              initial="initial"
              animate={letter.isMatrix ? "matrix" : "normal"}
              variants={MOTION_VARIANTS}
              transition={{
                duration: 0.1,
                ease: "easeInOut",
              }}
              style={{
                display: "inline-block",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {letter.isSpace ? " " : letter.char}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MatrixText
