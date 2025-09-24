const platforms: { target: Bun.Build.Target, outfile: string }[] = [
    { target: "bun-darwin-arm64", outfile: "qualtrics-sidecar-aarch64-apple-darwin" },
  ];
  

  for (const platform of platforms) {
    await Bun.build({
      entrypoints: ["./src/cli.ts"],
      outdir: "./dist",
      compile: platform,
      target: 'bun',
    });
    console.log(`Sidecar built for ${platform.target}`);
  }

  export {}