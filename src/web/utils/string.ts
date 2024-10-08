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
