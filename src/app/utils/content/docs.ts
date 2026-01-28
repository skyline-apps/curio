import config from "@app/utils/config.json";

const curioUrl = import.meta.env.VITE_CURIO_URL;

export const PREMIUM_FEATURES = [
  "AI-powered article summaries",
  "In-context snippet explanations",
  "And more to come!",
];

const docs = `
Welcome to Curio!

I&rsquo;ve always been an avid reader, and most of my education has come from the Internet. For a long time, I&rsquo;ve used read-it-later apps to keep track of what I&rsquo;ve read and highlight the most memorable parts. I built Curio as a passion project to make my reading experience even better, and I&rsquo;m excited to share it with you.

Curio provides a distraction-free reading experience for your favorite articles and newsletters across the web.
Save content from pages when you&rsquo;re on the go, and read it later in a beautiful, focused environment.
Add highlights, notes, and labels to organize your information diet.
Best of all, Curio is open-source, and its essential features will always be free for everyone to use:
- Saving articles from webpages
- Subscribing to email newsletters
- Adding notes, highlights, and labels to saved pages
- Searching over your article library

This guide will help you get the most out of your Curio experience.

## Getting started

Access Curio on the web at [${curioUrl}](${curioUrl}).
Android and iOS applications are available for beta testing:
- [Android](${config.androidLink})
- [iOS](${config.iosLink})

Create an account by logging in via your Google account or email address.

## Using Curio

### Reading and highlighting

Curio provides a distraction-free reading experience with the ability to:

- Highlight important passages
- Add notes to your highlights
- Adjust font size and reading themes
- Track your reading progress
  
![Curio article view](https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/public/assets/curio_item.png)

### Saving articles from the web

To save articles from your web browser, you must have the Curio browser extension installed.
Using your client browser instead of our own servers to render webpages is why we're able to offer Curio's features for free for everyone.

Currently, only Chrome and Firefox are supported.
- [Chrome extension](${config.chromeExtensionLink})
- [Firefox add-on](${config.firefoxExtensionLink})
  
With the browser extension installed, you have a few ways to save articles to Curio.
1. From the Curio app, click the "Add new" button in the left sidebar and paste in your intended URL. This will open the page in a new tab and save its contents to Curio in the background.

![Curio saving page](https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/public/assets/curio_save.gif)

2. From any page in your browser, click the Curio extension icon and select "Save current page". This will save the page's contents directly to Curio.
3. From any page in your browser, right click and select "Save to Curio". This will save the page's contents directly to Curio.

You can also save pages that are linked to from other pages.
1. In Curio, hover over any link and click the "Save to Curio" button that appears. This will open the page in a new tab and save its contents to Curio in the background.
2. From any page in your browser, right click on a specific link and select "Save to Curio". This will open the page in a new tab and save its contents to Curio in the background.

### Saving articles from mobile

To save articles from your mobile device, you must have the Curio app installed.

From the app, click the "+" button in the left sidebar and paste in your page's URL. This will open the page briefly in the app and save its contents to Curio.

![Curio mobile view](https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/public/assets/android_curio_inbox.png)

Alternatively, you can save pages by clicking on your device's "share" button from within a browser and selecting "Curio" as the share target.

| | |
| :---: | :---: |
| ![Curio Android share](https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/public/assets/android_curio_share.png) | ![Curio iOS share](https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/public/assets/ios_curio_share.png) |

#### Configuring paywalled article access
The mobile app uses the in-app browser to fetch webpage content.
This means that, in order to save content behind a paywall, you must authenticate to the paywall in the in-app browser.

To configure paywalled article access, navigate to your [account settings](${curioUrl}/settings?section=account) page in the mobile app.
Then under "Paywall authentication", enter the URL of the paywalled website and click "Launch".
Use the in-app browser to authenticate to the paywall.
Future articles saved from the app should now be able to access content behind the paywall.

### Subscribing to newsletters

Curio can also serve as an email newsletter reader.

To create your own custom newsletter email address, navigate to your [account settings](${curioUrl}/settings?section=account) page.

![Curio newsletter settings](https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/public/assets/curio_newsletters.png)

Click "Generate" to create a personalized email address you can use to sign up for email subscriptions.
When newsletters are delivered to that email address, they'll automatically appear in your Curio inbox.

### Organizing your content

#### Labels

Use labels to categorize your saved content. You can create custom labels and apply multiple labels to any article.

From your [organization settings](${curioUrl}/settings?section=organization), you can create, delete, and edit labels.

#### Favorites

Mark important articles as favorites for quick access later.

Favorites will appear on your profile page, but they won't appear to the public unless your profile is set to public in your [preferences](${curioUrl}/settings?section=preferences).

### Search

Use the search functionality to find articles by title keywords or content text.

You can also filter by favorited items or labels via the advanced search options.

![Curio search](https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/public/assets/curio_search.png)

### Keyboard shortcuts

View available keyboard shortcuts by pressing \`Shift + ?\`.

![Curio keyboard shortcuts](https://raw.githubusercontent.com/skyline-apps/curio/refs/heads/main/src/app/public/assets/curio_shortcuts.png)

### Deleting your account

To delete your account, navigate to your [account settings](${curioUrl}/settings?section=account) and click "Delete account".

***Please note that deleting your account is permanent and immediate. It cannot be undone.***

## Curio Premium

Curio is offered free of charge to everyone.
If you're enjoying the app, we'd appreciate if you consider supporting us by purchasing a Curio Premium subscription.

Paid supporters get access to the following:

${PREMIUM_FEATURES.map((feature) => `- ${feature}`).join("\n")}

To purchase or manage your subscription, head to your [subscription settings](${curioUrl}/settings?section=subscription).

## API access

For power users, Curio provides API access to programmatically manage your content.

Generate an API key from your [account settings](${curioUrl}/settings?section=account), then access API documentation via:

\`\`\`bash
$ curl ${curioUrl}/api/openapi
\`\`\`

## Feature requests and bug reports

If you have any feature requests or bug reports, please open an issue on our [GitHub repository](https://github.com/skyline-apps/curio/issues).

We appreciate your feedback.

## Contact us

If you need additional help, you can reach out to us via email at [team@curi.ooo](mailto:team@curi.ooo).
We'd love to hear from you!
`;

export default docs;
