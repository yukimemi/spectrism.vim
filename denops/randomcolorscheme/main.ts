import * as autocmd from "https://deno.land/x/denops_std@v3.8.2/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.8.2/function/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.8.2/helper/mod.ts";
import * as op from "https://deno.land/x/denops_std@v3.8.2/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.2/variable/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.5.1/src/mod.deno.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.8.2/mod.ts";
import {
  basename,
  dirname,
  extname,
  join,
  normalize,
} from "https://deno.land/std@0.159.0/path/mod.ts";
import {
  ensureArray,
  ensureObject,
  ensureString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import {
  parse,
  stringify,
} from "https://deno.land/std@0.159.0/encoding/toml.ts";
import { mapEntries } from "https://deno.land/std@0.159.0/collections/map_entries.ts";
import { filterValues } from "https://deno.land/std@0.159.0/collections/filter_values.ts";
import { ensureDir } from "https://deno.land/std@0.159.0/fs/mod.ts";

let debug = false;
let echo = true;
let interval = 3600;
let enables: string[] = [];
let disables: string[] = [];
let match = "";
let notmatch = "";
let background = "";
let colorschemePath = join(xdg.config(), "randomcolorscheme/colorschemes.toml");
let enable = true;

let events: autocmd.AutocmdEvent[] = [];

type Colorschemes = Record<string, boolean>;

let colorschemes: Colorschemes = {};

// deno-lint-ignore no-explicit-any
const clog = (...data: any[]): void => {
  if (debug) {
    console.log(...data);
  }
};

const loadColorschemes = async (): Promise<Colorschemes> => {
  clog(`load: ${colorschemePath}`);
  let colors: Colorschemes = {};
  try {
    colors = ensureObject<boolean>(
      parse(await Deno.readTextFile(colorschemePath)),
    );
    clog({ colors });
  } catch {
    clog(`Failed to load ${colorschemePath}`);
  }
  return colors;
};

const saveColorschemes = async () => {
  clog(`save: ${colorschemePath}`);
  const tomlStr = stringify(colorschemes);
  await ensureDir(dirname(colorschemePath));
  await Deno.writeTextFile(colorschemePath, tomlStr);
};

export async function main(denops: Denops): Promise<void> {
  // debug.
  debug = await vars.g.get(denops, "randomcolorscheme_debug", debug);
  // Merge user config.
  echo = await vars.g.get(denops, "randomcolorscheme_echo", echo);
  interval = await vars.g.get(denops, "randomcolorscheme_interval", interval);
  enables = await vars.g.get(denops, "randomcolorscheme_enables", enables);
  disables = await vars.g.get(denops, "randomcolorscheme_disables", disables);
  match = await vars.g.get(denops, "randomcolorscheme_match", match);
  notmatch = await vars.g.get(denops, "randomcolorscheme_notmatch", notmatch);
  background = await vars.g.get(
    denops,
    "randomcolorscheme_background",
    background,
  );
  events = await vars.g.get(denops, "randomcolorscheme_events", events);
  colorschemePath = normalize(
    await vars.g.get(denops, "randomcolorscheme_path", colorschemePath),
  );

  clog({
    debug,
    echo,
    enables,
    disables,
    match,
    notmatch,
    background,
    events,
    colorschemePath,
  });

  const beforeColors = await loadColorschemes();

  // Get all colorschemes
  colorschemes = ensureArray<string>(
    await fn.globpath(
      denops,
      await op.runtimepath.get(denops),
      "colors/*.vim",
      true,
      true,
    ),
  )
    .map((c) => basename(c, extname(c)))
    .reduce((ret: Record<string, boolean>, cur: string, _i) => {
      ret[cur] = beforeColors[cur] ?? true;
      return ret;
    }, colorschemes);

  clog({ colorschemes });
  if (enables.length) {
    colorschemes = mapEntries(colorschemes, ([name, _enable]) => [name, false]);
    enables.forEach((x) => {
      colorschemes[x] = true;
    });
  }
  clog({ colorschemes });
  if (disables.length) {
    disables.forEach((x) => {
      colorschemes[x] = false;
    });
  }
  clog({ colorschemes });
  if (match) {
    colorschemes = mapEntries(colorschemes, ([name, _enable]) => {
      if (name.match(match)) {
        return [name, true];
      } else {
        return [name, false];
      }
    });
  }
  clog({ colorschemes });
  if (notmatch) {
    colorschemes = mapEntries(colorschemes, ([name, enable]) => {
      if (name.match(notmatch)) {
        return [name, false];
      }
      return [name, enable];
    });
  }
  clog({ colorschemes });

  await saveColorschemes();

  denops.dispatcher = {
    async change(): Promise<void> {
      try {
        if (!enable) {
          clog(`enable: ${enable}`);
          return;
        }
        const enableColors = Object.keys(
          filterValues(colorschemes, (v: boolean) => v),
        );
        const r = Math.floor(Math.random() * enableColors.length);
        const colorscheme = enableColors[r];
        clog({ colorscheme });

        await denops.cmd(`colorscheme ${colorscheme}`);
        if (background) {
          await op.background.set(denops, background);
        }
        if (echo) {
          await helper.echo(denops, `Change colorscheme: ${colorscheme}`);
          await denops.cmd(`echom "Change colorscheme: ${colorscheme}"`);
        }
        await denops.cmd("redraw!");

        const c = ensureString(await vars.g.get(denops, "colors_name", ""));
        if (c === "") {
          await denops.dispatcher.change();
        }
      } catch (e) {
        clog(e);
      }
    },

    async open(): Promise<void> {
      await denops.cmd(`e ${colorschemePath}`);
    },

    async disableColorscheme(): Promise<void> {
      const c = ensureString(await vars.g.get(denops, "colors_name", ""));
      clog({ c });
      if (c === "") {
        clog(`Can't get g:colors_name... so skip.`);
        return;
      }
      await helper.echo(denops, `Disable: ${c}`);
      await denops.cmd(`echom "Disable: ${c}"`);
      colorschemes[c] = false;
      await saveColorschemes();
      await denops.dispatcher.change();
    },

    async reset(): Promise<void> {
      await helper.echo(denops, `Remove: ${colorschemePath}`);
      await denops.cmd(`echom "Remove: ${colorschemePath}"`);
      await Deno.remove(colorschemePath);
    },

    // deno-lint-ignore require-await
    async enable(): Promise<void> {
      enable = true;
    },
    // deno-lint-ignore require-await
    async disable(): Promise<void> {
      enable = false;
    },
  };

  await helper.execute(
    denops,
    `
    function! s:${denops.name}_notify(method, params) abort
      call denops#plugin#wait_async('${denops.name}', function('denops#notify', ['${denops.name}', a:method, a:params]))
    endfunction
    command! ChangeColorscheme call s:${denops.name}_notify('change', [])
    command! EnableRandomColorscheme call s:${denops.name}_notify('enable', [])
    command! DisableRandomColorscheme call s:${denops.name}_notify('disable', [])
    command! OpenColorschemeSetting call s:${denops.name}_notify('open', [])
    command! ResetColorschemeSetting call s:${denops.name}_notify('reset', [])
    command! DisableThisColorscheme call s:${denops.name}_notify('disableColorscheme', [])
  `,
  );

  if (events.length) {
    await autocmd.group(denops, denops.name, (helper) => {
      helper.remove();
      helper.define(events, "*", `call s:${denops.name}_notify('change', [])`);
    });
  }

  setInterval(async () => {
    await denops.dispatcher.change();
  }, interval * 1000);

  setTimeout(async () => {
    await denops.dispatcher.change();
  }, 100);
  clog("dps-randomcolorscheme has loaded");
}
