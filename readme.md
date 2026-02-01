```
common/
- DataDomeOptions.js: defines all tag configuration defaults and merges window.ddoptions (user)

- DataDomeTools.js: shared utilities (cookies/session, headers, events, storage checks, user agent...).

- DataDomeUrlTools.js: URL matching and filtering (inclusion/exclusion + trusted origin).

output/
- index.js: entry point. Initializes config, restores referrer, launches all modules (sync, async, events, challenges, service worker) via deferred execution.

- DetectionWrapper.js: wrapper around the fingerprinting module (detection-js). Loads it async, exposes 3 methods: inject data (.i), read data (.o), run detection (.u).
```