import { ItemState } from "@/db/schema";
import {
  DEFAULT_TEST_PROFILE_ID,
  DEFAULT_TEST_PROFILE_ID_2,
} from "@/utils/test/api";

export const TEST_ITEM_ID_1 = "123e4567-e89b-12d3-a456-426614174001";
export const TEST_ITEM_URL_1 = "https://example.com";
export const TEST_ITEM_ID_2 = "123e4567-e89b-12d3-a456-426614174000";
export const TEST_ITEM_URL_2 = "https://example2.com";
export const TEST_ITEM_ID_3 = "123e4567-e89b-12d3-a456-426614174003";
export const TEST_ITEM_URL_3 = "https://example3.com";
export const TEST_ITEM_ID_DELETED = "123e4567-e89b-12d3-a456-426614174004";
export const TEST_ITEM_URL_DELETED = "https://example4.com";
export const NONEXISTENT_USER_ID = "123e4567-e89b-12d3-a456-426614174003";

export const TEST_LABEL_ID_1 = "123e4567-e89b-12d3-a456-426614174005";
export const TEST_LABEL_ID_2 = "123e4567-e89b-12d3-a456-426614174006";
export const TEST_LABEL_ID_3 = "123e4567-e89b-12d3-a456-426614174007";

export const MOCK_ITEMS = [
  {
    id: TEST_ITEM_ID_1,
    url: TEST_ITEM_URL_1,
    slug: "example-com",
    createdAt: new Date("2025-01-10T12:52:56-08:00"),
    updatedAt: new Date("2025-01-10T12:52:56-08:00"),
  },
  {
    id: TEST_ITEM_ID_2,
    url: TEST_ITEM_URL_2,
    slug: "example2-com",
    createdAt: new Date("2025-01-10T12:53:56-08:00"),
    updatedAt: new Date("2025-01-10T12:53:56-08:00"),
  },
  {
    id: TEST_ITEM_ID_3,
    url: TEST_ITEM_URL_3,
    slug: "example3-com",
    createdAt: new Date("2025-01-10T12:54:56-08:00"),
    updatedAt: new Date("2025-01-10T12:54:56-08:00"),
  },
  {
    id: TEST_ITEM_ID_DELETED,
    url: TEST_ITEM_URL_DELETED,
    slug: "example4-com",
    createdAt: new Date("2025-01-10T12:54:57-08:00"),
    updatedAt: new Date("2025-01-10T12:54:57-08:00"),
  },
];

export const MOCK_LABELS = [
  {
    id: TEST_LABEL_ID_1,
    profileId: DEFAULT_TEST_PROFILE_ID,
    name: "Test Label 1",
    color: "#ff0000",
    createdAt: new Date("2025-01-10T12:50:56-08:00"),
    updatedAt: new Date("2025-01-10T12:50:56-08:00"),
  },
  {
    id: TEST_LABEL_ID_2,
    profileId: DEFAULT_TEST_PROFILE_ID,
    name: "Test Label 2",
    color: "#00ff00",
    createdAt: new Date("2025-01-10T12:50:57-08:00"),
    updatedAt: new Date("2025-01-10T12:50:57-08:00"),
  },
  {
    id: TEST_LABEL_ID_3,
    profileId: DEFAULT_TEST_PROFILE_ID_2,
    name: "Not my label",
    color: "#00ffff",
    createdAt: new Date("2025-01-10T12:50:58-08:00"),
    updatedAt: new Date("2025-01-10T12:50:58-08:00"),
  },
];

export const MOCK_PROFILE_ITEMS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174999",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_1,
    title: "Example 1",
    description: "First example item",
    author: "Test Author",
    state: ItemState.ARCHIVED,
    stateUpdatedAt: new Date("2024-04-30T12:52:59-08:00"),
    thumbnail: "https://example.com/thumb1.jpg",
    favicon: "https://example.com/favicon1.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:56-08:00"),
    textLanguage: "en",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174998",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_2,
    title: "Example item 2",
    description: "Second example item HelLO",
    author: "Test Author",
    state: ItemState.ACTIVE,
    stateUpdatedAt: new Date("2024-04-25T12:53:00-08:00"),
    isFavorite: true,
    thumbnail: "https://example.com/thumb2.jpg",
    favicon: "https://example.com/favicon2.ico",
    publishedAt: new Date("2025-01-10T12:52:57-08:00"),
    savedAt: new Date("2025-01-10T12:52:57-08:00"),
    textLanguage: "en",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174997",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_3,
    title: "Example 3",
    description: "Third example item 2",
    author: "Test Author",
    thumbnail: "https://example.com/thumb3.jpg",
    favicon: "https://example.com/favicon3.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:58-08:00"),
    state: ItemState.ARCHIVED,
    stateUpdatedAt: new Date("2024-04-20T12:54:00-08:00"),
    isFavorite: false,
    readingProgress: 10,
    lastReadAt: new Date("2025-01-15T12:00:00-08:00"),
    versionName: "2024-01-01",
    textLanguage: "en",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174996",
    profileId: DEFAULT_TEST_PROFILE_ID,
    itemId: TEST_ITEM_ID_DELETED,
    title: "Example 3 New title",
    description: "Third example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb3.jpg",
    favicon: "https://example.com/favicon3.ico",
    publishedAt: new Date("2025-01-10T12:52:56-08:00"),
    savedAt: new Date("2025-01-10T12:52:59-08:00"),
    state: ItemState.DELETED,
    stateUpdatedAt: new Date("2024-04-12T12:52:59-08:00"),
    textLanguage: "de",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174995",
    profileId: DEFAULT_TEST_PROFILE_ID_2,
    itemId: TEST_ITEM_ID_3,
    title: "Example 3 New title not mine",
    description: "Third example item",
    author: "Test Author",
    thumbnail: "https://example.com/thumb3.jpg",
    favicon: "https://example.com/favicon3.ico",
    publishedAt: new Date("2025-01-10T12:55:56-08:00"),
    savedAt: new Date("2025-01-10T12:55:56-08:00"),
    stateUpdatedAt: new Date("2024-05-31T12:55:55-08:00"),
    textLanguage: "en",
  },
];

export const MOCK_PROFILE_ITEM_LABELS = [
  {
    id: "123e4567-e89b-12d3-a456-426614174007",
    profileItemId: MOCK_PROFILE_ITEMS[0].id,
    labelId: TEST_LABEL_ID_1,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174008",
    profileItemId: MOCK_PROFILE_ITEMS[0].id,
    labelId: TEST_LABEL_ID_2,
  },
];
