# Code Citations

## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
```


## License: unknown
https://github.com/jasonsturges/vite-npm-package/blob/03697b0814bf671e480a721af39c63d505d1ab25/README.md

```
No workflow file exists yet. You need to create one in the **`recoilapp_wrappers`** GitHub repo at `.github/workflows/publish.yml`. Here's what to put in each field and how to set it up:

### npm Settings Page Fields

| Field | Value |
|-------|-------|
| **Publisher** | GitHub Actions |
| **Organization or user** | `RecoilApp` |
| **Repository** | `recoilapp_wrappers` |
| **Workflow filename** | `publish.yml` |
| **Environment name** | `npm` |

### Then Create the Workflow

In your `recoilapp_wrappers` repo, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: read
      id-token: write    # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_
```

