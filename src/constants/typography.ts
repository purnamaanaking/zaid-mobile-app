export const Fonts = {
  bodyMedium: 'Poppins_500Medium',
  bodyRegular: 'Poppins_400Regular',
  displayRegular: 'Poppins_400Regular',
  displaySemi: 'Poppins_600SemiBold',
  semiBold: 'Poppins_600SemiBold',
} as const;

export const TextStyles = {
  h1: { fontFamily: Fonts.displaySemi, fontSize: 28, lineHeight: 36 },
  h2: { fontFamily: Fonts.displaySemi, fontSize: 22, lineHeight: 30 },
  h3: { fontFamily: Fonts.displaySemi, fontSize: 18, lineHeight: 26 },
  h4: { fontFamily: Fonts.displaySemi, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: Fonts.bodyRegular, fontSize: 15, lineHeight: 24 },
  bodyMd: { fontFamily: Fonts.bodyMedium, fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: Fonts.bodyRegular, fontSize: 12, lineHeight: 18 },
  label: { fontFamily: Fonts.displaySemi, fontSize: 13, lineHeight: 20 },
  button: { fontFamily: Fonts.displaySemi, fontSize: 15, lineHeight: 20 },
} as const;
