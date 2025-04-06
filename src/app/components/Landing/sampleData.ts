import { COLOR_PALETTE } from "@app/components/ui/Chip";
import { ItemState, TextDirection } from "@web/db/schema";

const ITEM_METADATA = {
  thumbnail: null,
  readingProgress: 0,
  lastReadAt: null,
  state: ItemState.ACTIVE,
  isFavorite: false,
  versionName: null,
  source: null,
  textDirection: TextDirection.LTR,
  textLanguage: "en",
};

export const sampleItems = [
  {
    id: "1",
    url: "https://ridewithian.substack.com/p/why-i-bike",
    slug: "ridewithian-substack-com-why-i-bike-62daf9",
    labels: [],
    profileItemId: "1",
    createdAt: "",
    metadata: {
      title: "Why I bike",
      description:
        "A weekly update on what it takes to bike across all seven continents",
      author: "Ian Andersen",
      favicon: "https://substackcdn.com/icons/substack/favicon.ico",
      ...ITEM_METADATA,
    },
  },
  {
    id: "2",
    url: "https://www.thenewatlantis.com/publications/we-live-like-royalty-and-dont-know-it",
    slug: "thenewatlantis-com-we-live-like-royalty-and-dont-know-e37518",
    labels: [],
    profileItemId: "2",
    createdAt: "",
    metadata: {
      title: "We Live Like Royalty and Don’t Know It",
      description:
        "Introducing “How the System Works,” a series on the hidden mechanisms that support modern life",
      author: "Dario Amodei",
      favicon:
        "https://www.thenewatlantis.com/wp-content/uploads/2020/08/cropped-NA_white-1-32x32.jpg",
      ...ITEM_METADATA,
    },
  },
  {
    id: "3",
    url: "https://darioamodei.com/machines-of-loving-grace",
    slug: "darioamodei-com-machines-of-loving-grace-c22c01",
    labels: [],
    profileItemId: "3",
    createdAt: "",
    metadata: {
      title: "Machines of Loving Grace",
      description: "How AI Could Transform the World for the Better",
      author: "Dario Amodei",
      favicon: "https://darioamodei.com/favicon.svg",
      ...ITEM_METADATA,
    },
  },
];

export const sampleLabels = [
  {
    id: "1",
    name: "Essays",
    color: COLOR_PALETTE[0],
  },
  {
    id: "2",
    name: "News",
    color: COLOR_PALETTE[1],
  },
  {
    id: "3",
    name: "Travel",
    color: COLOR_PALETTE[2],
  },
  {
    id: "4",
    name: "Book reviews",
    color: COLOR_PALETTE[3],
  },
];

export const sampleArticle = `Sometimes you get trapped in the wrong game because you’re competing. The best way to escape competition—to get away from the specter of competition, which is not just stressful and nerve-wracking but also will drive you to the wrong answer—is to be authentic to yourself.


**No one can compete with you on being you**


If you are building and marketing something that’s an extension of who you are, no one can compete with you. Who’s going to compete with Joe Rogan or Scott Adams? It’s impossible. Is somebody else going write a better Dilbert? No. Is someone going to compete with Bill Watterson and create a better [Calvin and Hobbes](https://twitter.com/Calvinn_Hobbes?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor)? No.
`;

export const sampleHighlights = [
  {
    id: "1",
    startOffset: 247,
    endOffset: 272,
    text: "",
    note: "",
  },
];
