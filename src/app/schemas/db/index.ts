export enum ColorScheme {
  AUTO = "auto",
  LIGHT = "light",
  DARK = "dark",
}

export enum DisplayFont {
  MONO = "monospace",
  SANS = "sans-serif",
  SERIF = "serif",
}

export enum DisplayFontSize {
  SM = "sm",
  MD = "md",
  LG = "lg",
  XL = "xl",
}

export enum ItemState {
  ACTIVE = "active",
  ARCHIVED = "archived",
  DELETED = "deleted",
}

export enum ItemSource {
  EMAIL = "email",
  OMNIVORE = "omnivore",
  INSTAPAPER = "instapaper",
}

export enum TextDirection {
  LTR = "ltr",
  RTL = "rtl",
  AUTO = "auto",
}

export enum RecommendationType {
  POPULAR = "popular",
}

export enum PersonalRecommendationType {
  NEWSLETTER = "newsletter",
  FAVORITE_AUTHOR = "favorite_author",
  FAVORITES = "favorites",
}

export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum JobType {
  IMPORT_INSTAPAPER = "import_instapaper",
  IMPORT_OMNIVORE = "import_omnivore",
}
