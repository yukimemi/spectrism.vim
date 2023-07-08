import { LuaFactory } from "npm:wasmoon@latest";
const luaFactory = new LuaFactory();
const lua = await luaFactory.createEngine();
const code = (await (await fetch(
  "https://raw.githubusercontent.com/tani/podium/main/lua/podium.lua",
)).text()).replace(
  "#!/usr/bin/env lua",
  "",
);
const pod = await lua.doString(code);

const src = await Deno.readTextFile("./pod/randomcolorscheme.pod");

const doc = "./doc/randomcolorscheme.vim";
await Deno.writeTextFile(doc, await pod.process("vimdoc", src));

const readme = "./README.md";
await Deno.writeTextFile(readme, await pod.process("markdown", src));
