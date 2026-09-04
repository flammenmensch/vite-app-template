/**
 * Component tests render against the same cascade the app does. Without this,
 * every test would run on an unstyled document -- fine for `getByRole`, but it
 * would make any screenshot a picture of Times New Roman on white.
 *
 * Mirrors the imports in `.ladle/components.tsx`; keep the two in step.
 */
import '../styles/reset.css'
import '../styles/global.css'
