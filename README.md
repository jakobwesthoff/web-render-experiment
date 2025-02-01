# Headless Chromium Render Experiment

This is a simple experiment to render a webpage (currently static) to an image in a fixed dimension using a headless chromium within a containerized context.

I needed to make sure that would work properly for another project idea, I currently have. Therefore I quickly scaffolded it. It is not supposed to be in anyway useable in a real world scenario like that.

## Startup

Use `npm run docker:dev:build` first to build the generic dev image.
After that use `npm run docker:dev:start`, to start the application and serve on port 3000.

## Usage

Use for example curl to request a specific webpage in a specific dimension:

```
curl -X POST -o foobar.png -d '{url:"http://westhoffswelt.de", height": 800, "width":600, "deviceScaleFactor": 2}' -H 'Content-Type: application/json' http://localhost:3000/api/render
```

