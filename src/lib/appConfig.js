export const APP_NAME = "tooL";
export const APP_DESCRIPTION = "A tool-based onchain identity experiment.";
export const APP_BUTTON_TITLE = "Open tooL";
export const APP_SPLASH_BACKGROUND_COLOR = "#f7f4e8";

const DEFAULT_APP_URL = "https://www.boxes.tools";

export function normalizeAppUrl(url = process.env.NEXT_PUBLIC_APP_URL) {
  return (url || DEFAULT_APP_URL).replace(/\/+$/, "");
}

export const APP_URL = normalizeAppUrl();
export const MINIAPP_ICON_PATH = "/miniapp-icon.png";
export const MINIAPP_EMBED_PATH = "/miniapp-embed.png";
export const MINIAPP_ICON_URL = `${APP_URL}${MINIAPP_ICON_PATH}`;
export const MINIAPP_EMBED_URL = `${APP_URL}${MINIAPP_EMBED_PATH}`;

export const MINIAPP_EMBED = {
  version: "1",
  imageUrl: MINIAPP_EMBED_URL,
  button: {
    title: APP_BUTTON_TITLE,
    action: {
      type: "launch_miniapp",
      name: APP_NAME,
      url: APP_URL,
      splashImageUrl: MINIAPP_ICON_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
    },
  },
};

export const MINIAPP_MANIFEST_CONFIG = {
  version: "1",
  name: APP_NAME,
  iconUrl: MINIAPP_ICON_URL,
  homeUrl: APP_URL,
  imageUrl: MINIAPP_EMBED_URL,
  buttonTitle: APP_BUTTON_TITLE,
  splashImageUrl: MINIAPP_ICON_URL,
  splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
  description: APP_DESCRIPTION,
};
