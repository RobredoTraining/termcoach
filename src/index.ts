#!/usr/bin/env node
import { runCli } from "./cli";

runCli(process.argv).catch((err) => {
  console.error("termcoach error:", err);
  process.exit(1);
});