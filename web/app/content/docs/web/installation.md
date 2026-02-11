# Installation

Both web and mobile applications lives in the same repository, so you only need to clone it once to get started.
Both have own dependencies, so you need to install them separately. Below are the instructions for web.

Clone the repository

```bash
git clone  https://github.com/MatiasTervonen/Training-App.git
```

Go under web directory:

```bash
cd web
```

Install the packages:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

That's it! You're ready to go.

---

## Production build

To create a production build of the web application, run the following command:

```bash
pnpm build
```

Run the production server:

```bash
pnpm start
```
