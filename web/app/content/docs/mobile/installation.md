# Installation

Both web and mobile applications lives in the same repository, so you only need to clone it once to get started.
Both have own dependencies, so you need to install them separately. Below are the instructions for mobile.

Clone the repository

```bash
git clone  https://github.com/MatiasTervonen/Training-App.git
```

Go under mobile directory:

```bash
cd mobile
```

Install the packages:

```bash
pnpm install
```

Run the development server:

```bash
pnpm start
```

## Development build

To create a development build of the mobile application, run the following command:

```bash
npx expo run android
```

## Production build

To create a production build of the mobile application, run the following command:

```bash
npx expo run:android --variant=release
```

That's it! You're ready to go.
