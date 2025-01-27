export const getTimeTakenSincePoint = (point: number) => {
  const timeNow = new Date().getTime();
  const duration = timeNow - point;
  // format duration and choose unit and return
  const nanos = duration * 1_000_000; // Convert to nanoseconds
  const micros = duration * 1_000; // Convert to microseconds

  if (nanos < 1) {
    return `${nanos.toFixed(2)}ns`;
  } else if (micros < 1) {
    return `${micros.toFixed(2)}µs`;
  } else if (duration < 1000) {
    return `${duration.toFixed(2)}ms`;
  } else {
    return `${(duration / 1000).toFixed(2)}s`;
  }
};
