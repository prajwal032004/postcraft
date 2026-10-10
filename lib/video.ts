/**
 * Facts about the walkthrough clip, parsed from the MP4 container.
 *
 * This lives outside the player component on purpose: VideoShowcase is a
 * client module, and a server component that imports a plain constant from a
 * client module gets `undefined` back, which silently broke the VideoObject
 * structured data.
 */
export const VIDEO = {
  src: "/google_app_password_setup_tutorial.mp4",
  poster: "/video-thumbnail",
  /** 1920x1080, 25s, H.264, no audio track. */
  width: 1920,
  height: 1080,
  seconds: 25,
  label: "Creating a Gmail app password, step by step",
} as const;
