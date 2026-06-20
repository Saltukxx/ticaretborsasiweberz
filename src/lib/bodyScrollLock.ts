const locks = new Set<string>();

function applyBodyScrollLock() {
  if (locks.size > 0) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}

/** Reference-counted body scroll lock. Multiple overlays can lock without racing. */
export function lockBodyScroll(id: string) {
  locks.add(id);
  applyBodyScrollLock();
}

export function unlockBodyScroll(id: string) {
  locks.delete(id);
  applyBodyScrollLock();
}

export function isBodyScrollLocked() {
  return locks.size > 0;
}
