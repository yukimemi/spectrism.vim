import * as autocmd from "https://deno.land/x/denops_std@v3.12.0/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.12.0/function/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.12.0/helper/mod.ts";
import * as op from "https://deno.land/x/denops_std@v3.12.0/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.12.0/variable/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.5.1/src/mod.deno.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.12.0/mod.ts";
import {
  basename,
  dirname,
  extname,
  join,
  normalize,
} from "https://deno.land/std@0.170.0/path/mod.ts";
import {
  ensureArray,
  ensureObject,
  ensureString,
  isBoolean,
} from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import {
  parse,
  stringify,
} from "https://deno.land/std@0.170.0/encoding/toml.ts";
import {
  filterEntries,
} from "https://deno.land/std@0.175.0/collections/filter_entries.ts";
import {
  mapEntries,
} from "https://deno.land/std@0.175.0/collections/map_entries.ts";
import { ensureDir } from "https://deno.land/std@0.170.0/fs/mod.ts";
import { Chance } from "https://cdn.skypack.dev/chance@1.1.9";

const defaultPriority = 100;

const chance = new Chance();

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

type Colorschemes = Record<string, number>;

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
    colors = ensureObject<number>(
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

  let beforeColors = await loadColorschemes();

  // Migration.
  beforeColors = mapEntries(beforeColors, ([name, priority]) => {
    if (isBoolean(priority)) {
      return [name, priority ? defaultPriority : 0];
    } else {
      return [name, priority];
    }
  });

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
    .reduce((ret: Record<string, number>, cur: string, _i) => {
      ret[cur] = beforeColors[cur] ?? defaultPriority;
      return ret;
    }, colorschemes);

  clog({ colorschemes });
  if (enables.length) {
    colorschemes = mapEntries(
      colorschemes,
      ([name, _priority]) => [name, 0],
    );
    enables.forEach((x) => {
      colorschemes[x] = defaultPriority;
    });
  }
  clog({ colorschemes });
  if (disables.length) {
    disables.forEach((x) => {
      colorschemes[x] = 0;
    });
  }
  clog({ colorschemes });
  if (match) {
    colorschemes = mapEntries(colorschemes, ([name, priority]) => {
      if (name.match(match)) {
        return [name, priority > 0 ? priority : defaultPriority];
      } else {
        return [name, 0];
      }
    });
  }
  clog({ colorschemes });
  if (notmatch) {
    colorschemes = mapEntries(colorschemes, ([name, priority]) => {
      if (name.match(notmatch)) {
        return [name, 0];
      }
      return [name, priority > 0 ? priority : defaultPriority];
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
        const nowColor = ensureString(
          await vars.g.get(denops, "colors_name", ""),
        );
        const enableColors = filterEntries(
          colorschemes,
          ([_name, priority]) => priority > 0,
        );
        const colorscheme = chance.weighted(
          Object.keys(enableColors),
          Object.values(enableColors),
        );
        clog({ colorscheme });

        if (nowColor === colorscheme) {
          clog(`colorscheme is same ! so retry !`);
          await denops.dispatcher.change();
          return;
        }

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
      if (c === "") {
        clog(`Can't get g:colors_name... so skip.`);
        return;
      }
      await helper.echo(denops, `Disable: ${c}`);
      await denops.cmd(`echom "Disable: ${c}"`);
      colorschemes[c] = 0;
      await saveColorschemes();
      await denops.dispatcher.change();
    },

    async reset(): Promise<void> {
      await helper.echo(denops, `Remove: ${colorschemePath}`);
      await denops.cmd(`echom "Remove: ${colorschemePath}"`);
      await Deno.remove(colorschemePath);
    },

    async like(...args: unknown[]): Promise<void> {
      clog({ args });
      const val = Number(ensureArray<number>(args)[0] ?? 10);
      const c = ensureString(await vars.g.get(denops, "colors_name", ""));
      if (c === "") {
        clog(`Can't get g:colors_name... so skip.`);
        return;
      }
      const priority = colorschemes[c] + val;
      await helper.echo(denops, `Increase ${c}'s priority to ${priority}`);
      await denops.cmd(`echom "Increase ${c}'s priority to ${priority}"`);
      colorschemes[c] = priority;
      await saveColorschemes();
    },

    async hate(...args: unknown[]): Promise<void> {
      const val = Number(ensureArray<number>(args)[0] ?? 10);
      const c = ensureString(await vars.g.get(denops, "colors_name", ""));
      if (c === "") {
        clog(`Can't get g:colors_name... so skip.`);
        return;
      }
      let priority = colorschemes[c] - val;
      priority = priority < 0 ? 0 : priority;
      await helper.echo(denops, `Decrease ${c}'s priority to ${priority}`);
      await denops.cmd(`echom "Decrease ${c}'s priority to ${priority}"`);
      colorschemes[c] = priority;
      await saveColorschemes();
      await denops.dispatcher.change();
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
    command! -nargs=? LikeThisColorscheme call s:${denops.name}_notify('like', [<f-args>])
    command! -nargs=? HateThisColorscheme call s:${denops.name}_notify('hate', [<f-args>])
  `,
  );

  if (events.length) {
    await autocmd.group(denops, denops.name, (helper) => {
      helper.remove();
      helper.define(events, "*", `call s:${denops.name}_notify('change', [])`, {
        nested: true,
      });
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
