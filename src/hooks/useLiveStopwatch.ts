import { useCallback, useEffect, useRef, useState } from "react";

interface UseLiveStopwatchOptions {
  onSave: (minutes: number, subject: string, topic?: string) => void;
}

export function useLiveStopwatch({ onSave }: UseLiveStopwatchOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState("General Study");
  const [topic, setTopic] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    const update = () => {
      if (startRef.current !== null) {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startRef.current) / 1000)));
      }
    };

    update();
    const interval = setInterval(update, 500);
    const onVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isRunning]);

  const start = useCallback(() => {
    startRef.current = Date.now() - elapsedSeconds * 1000;
    setIsRunning(true);
  }, [elapsedSeconds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const stopAndSave = useCallback(() => {
    const minutes = Math.round(elapsedSeconds / 60);
    if (minutes > 0) {
      onSave(minutes, subject, topic.trim() || undefined);
    }
    setIsRunning(false);
    setElapsedSeconds(0);
    setTopic("");
    startRef.current = null;
  }, [elapsedSeconds, subject, topic, onSave]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    startRef.current = null;
  }, []);

  return {
    isRunning,
    subject,
    setSubject,
    topic,
    setTopic,
    elapsedSeconds,
    start,
    pause,
    stopAndSave,
    reset
  };
}