# Urgent release validation

This temporary branch is based on approved release commit `5e9597d7398a432d2114be6ed44ba0cf2df61e4c`.

Only this note and the one-time GitHub Actions workflow differ from the approved application tree. The workflow runs the handover-required commands:

```sh
npm ci
npm run build
```

This branch must not be merged.
