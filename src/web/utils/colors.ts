export const brown = {
  975: "#292622",
  950: "#453F39",
  900: "#605850",
  800: "#7B7167",
  700: "#96897E",
  600: "#B1A195",
  500: "#CCB9AC",
  400: "#D4C1B4",
  300: "#DBC8BC",
  200: "#E1D0C5",
  100: "#E8D8CE",
  75: "#EDDFD7",
  50: "#F3E8E1",
  25: "#F8F0EC",
  foreground: "#292622",
  DEFAULT: "#CCB9AC",
};

export const lightBrown = brown[25];
export const darkBrown = brown[975];

export const gray = {
  900: "#55524F",
  800: "#6B6762",
  700: "#807B76",
  600: "#95908A",
  500: "#AAA49E",
  400: "#B6B0AA",
  300: "#C2BDB7",
  200: "#CEC9C3",
  100: "#D9D5D0",
  50: "#E4E2DD",
  foreground: lightBrown,
  DEFAULT: "#AAA49E",
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
  foreground: lightBrown,
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
  foreground: lightBrown,
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
  foreground: lightBrown,
  DEFAULT: "#7293AB",
};

export const themeColors = {
  primary: blue,
  secondary: gray,
  default: brown,
  success: green,
  warning: yellow,
  danger: red,
};
