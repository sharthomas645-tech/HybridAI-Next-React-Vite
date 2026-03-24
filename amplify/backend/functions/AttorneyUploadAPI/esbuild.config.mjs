import { build } from "esbuild";

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "es2022",
  external: [
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner"
  ],
  outfile: "dist/index.js",
  format: "esm"
});