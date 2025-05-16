export const camelCaseToKebabCase = (str: string): string => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
};

export const camelCaseToSentenceCase = (str: string): string => {
  const sentence = str
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
};

export const cleanHtmlEntities = (
  str: string | null | undefined,
): string | null => {
  if (!str) return null;
  // Replace common named entities
  return (
    str
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      // Remove any remaining entities
      .replace(/&[a-zA-Z0-9#]+;/g, "")
      .trim()
  );
};
