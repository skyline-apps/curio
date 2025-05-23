export const brown = {
  985: "#1B1C17",
  975: "#1C1F1A",
  950: "#1F231D",
  925: "#3A3F35",
  900: "#585B4C",
  800: "#777864",
  700: "#94907C",
  600: "#B0A594",
  500: "#CCB9AC",
  400: "#D3C1B6",
  300: "#DAC9C1",
  200: "#E1D1CB",
  100: "#E7DAD6",
  75: "#EEE3E1",
  50: "#F4ECEB",
  25: "#F9F4F4",
  15: "#FAF7F6",
  foreground: "#1A1F1C",
  DEFAULT: "#CCB9AC",
};

export const lightBrown = brown[200];
export const darkBrown = brown[900];

export const gray = {
  975: "#312D2A",
  950: "#46413D",
  900: "#5C5450",
  800: "#726863",
  700: "#877B76",
  600: "#9D8F89",
  500: "#B2A29C",
  400: "#BCACA6",
  300: "#C6B6B1",
  200: "#CFC0BB",
  100: "#D8CBC6",
  75: "#E1D5D2",
  50: "#E9E0DD",
  25: "#F1EBE9",
  foreground: lightBrown,
  DEFAULT: "#B2A29C",
};

export const green = {
  900: "#375840",
  800: "#456D48",
  700: "#5A8254",
  600: "#759763",
  500: "#92AB72",
  400: "#A6BA81",
  300: "#B9C792",
  200: "#CBD4A3",
  100: "#DBDFB6",
  50: "#E9EAC9",
  foreground: brown[50],
  DEFAULT: "#92AB72",
};

export const yellow = {
  900: "#745E2D",
  800: "#90743A",
  700: "#AB8A47",
  600: "#C6A055",
  500: "#E0B663",
  400: "#ECC570",
  300: "#F5D480",
  200: "#FCE092",
  100: "#FFEBA6",
  50: "#FFF4BC",
  foreground: brown[900],
  DEFAULT: "#E0B663",
};

export const red = {
  900: "#533130",
  800: "#673E3D",
  700: "#7B4B4A",
  600: "#8F5857",
  500: "#A26565",
  400: "#B27776",
  300: "#C18B88",
  200: "#CF9F9B",
  100: "#DCB4AF",
  50: "#E7C9C5",
  foreground: brown[50],
  DEFAULT: "#A26565",
};

export const blue = {
  900: "#374958",
  800: "#455C6D",
  700: "#546E82",
  600: "#638197",
  500: "#7293AB",
  400: "#81A1BA",
  300: "#92AEC7",
  200: "#A3BCD4",
  100: "#B6CADF",
  50: "#C9D8EA",
  foreground: brown[50],
  DEFAULT: "#7293AB",
};

export const themeColors = {
  primary: blue,
  success: green,
  warning: yellow,
  danger: red,
};

export const COLOR_PALETTE = [
  red[400],
  yellow[400],
  green[400],
  blue[400],
  red[600],
  yellow[600],
  green[600],
  blue[600],
  gray[400],
  gray[600],
];
