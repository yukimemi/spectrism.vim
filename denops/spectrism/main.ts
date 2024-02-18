// =============================================================================
// File        : main.ts
// Author      : yukimemi
// Last Change : 2024/02/18 14:41:07.
// =============================================================================

import * as autocmd from "https://deno.land/x/denops_std@v6.0.1/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.0.1/function/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v6.0.1/helper/mod.ts";
import * as nvimFn from "https://deno.land/x/denops_std@v6.0.1/function/nvim/mod.ts";
import * as op from "https://deno.land/x/denops_std@v6.0.1/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.0.1/variable/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v6.0.1/mod.ts";
import xdg from "https://deno.land/x/xdg@v10.6.0/src/mod.deno.ts";
import { delay } from "https://deno.land/std@0.216.0/async/delay.ts";
import { walk } from "https://deno.land/std@0.216.0/fs/walk.ts";
import {
  basename,
  dirname,
  extname,
  join,
  normalize,
} from "https://deno.land/std@0.216.0/path/mod.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";
import { parse, stringify } from "https://deno.land/std@0.216.0/toml/mod.ts";
import { filterEntries } from "https://deno.land/std@0.216.0/collections/filter_entries.ts";
import { mapEntries } from "https://deno.land/std@0.216.0/collections/map_entries.ts";
import { ensureDir } from "https://deno.land/std@0.216.0/fs/mod.ts";
import Chance from "https://cdn.skypack.dev/chance@1.1.11/";

const defaultPriority = 100;

const chance = new Chance();

let debug = false;
let echo = true;
let notify = false;
let retry = true;
let interval = 3600;
let checkWait = 3000;
let enables: string[] = [];
let disables: string[] = [];
let match = "";
let notmatch = "";
let background = "";
let changeSize = 50;
let colorschemePath = join(xdg.config(), "spectrism/colorschemes.toml");
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
    colors = ensure(
      parse(await Deno.readTextFile(colorschemePath)),
      is.RecordOf(is.Number),
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

const message = async (denops: Denops, msg: string) => {
  if (notify && denops.meta.host === "nvim") {
    await helper.execute(
      denops,
      `lua vim.notify([[${msg}]], vim.log.levels.INFO)`,
    );
  }
  if (echo) {
    await helper.echo(denops, msg);
  }
};

export async function main(denops: Denops): Promise<void> {
  // debug.
  debug = await vars.g.get(denops, "spectrism_debug", debug);
  // Merge user config.
  echo = await vars.g.get(denops, "spectrism_echo", echo);
  notify = await vars.g.get(denops, "spectrism_notify", notify);
  retry = await vars.g.get(denops, "spectrism_retry", retry);
  interval = await vars.g.get(denops, "spectrism_interval", interval);
  checkWait = await vars.g.get(denops, "spectrism_checkwait", checkWait);
  enables = await vars.g.get(denops, "spectrism_enables", enables);
  disables = await vars.g.get(denops, "spectrism_disables", disables);
  match = await vars.g.get(denops, "spectrism_match", match);
  notmatch = await vars.g.get(denops, "spectrism_notmatch", notmatch);
  changeSize = await vars.g.get(denops, "spectrism_changesize", changeSize);
  background = await vars.g.get(
    denops,
    "spectrism_background",
    background,
  );
  events = await vars.g.get(denops, "spectrism_events", events);
  colorschemePath = normalize(
    await vars.g.get(denops, "spectrism_path", colorschemePath),
  );
  const colors_path: string[] = await vars.g.get(
    denops,
    "spectrism_colors_path",
    [],
  );

  clog({
    debug,
    echo,
    notify,
    retry,
    interval,
    checkWait,
    enables,
    disables,
    match,
    notmatch,
    background,
    changeSize,
    events,
    colorschemePath,
    colors_path,
  });

  let beforeColors = await loadColorschemes();

  // Migration.
  beforeColors = mapEntries(beforeColors, ([name, priority]) => {
    if (is.Boolean(priority)) {
      return [name, priority ? defaultPriority : 0];
    } else {
      return [name, priority];
    }
  });

  // Get all colorschemes
  const colors = Array.from(
    new Set((await Promise.all(
      [
        ...(await op.runtimepath.get(denops)).split(","),
        await fn.has(denops, "nvim") ? ensure(await nvimFn.stdpath(denops, "data"), is.String) : "",
        ...colors_path,
      ].map(
        async (c) => {
          // clog({ c });
          const colornames = [];
          if (!(await fn.isdirectory(denops, c))) {
            clog(`c is not found, skip !`);
          } else {
            for await (
              const entry of walk(c, {
                includeDirs: false,
                includeFiles: true,
                exts: ["vim", "lua"],
                match: [/[/\\]colors[/\\][^/\\]+$/],
              })
            ) {
              clog(entry.path);
              colornames.push(entry.path);
            }
          }
          return colornames;
        },
      ),
    )).flat()),
  ).sort();
  if (colors == undefined) {
    await denops.cmd(`echom "Colorscheme not found !"`);
    return;
  }

  colorschemes = colors
    .map((c) => basename(c, extname(c)))
    .reduce((ret: Record<string, number>, cur: string, _i) => {
      ret[cur] = beforeColors[cur] ?? defaultPriority;
      return ret;
    }, colorschemes);
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

  if (enables.length) {
    colorschemes = mapEntries(colorschemes, ([name, _priority]) => [name, 0]);
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

  await saveColorschemes();

  denops.dispatcher = {
    async change(): Promise<void> {
      try {
        if (!enable) {
          clog(`enable: ${enable}`);
          return;
        }
        const nowColor = ensure(
          await vars.g.get(denops, "colors_name", ""),
          is.String,
        );
        const enableColors = filterEntries(
          colorschemes,
          ([_name, priority]) => priority > 0,
        );
        const colorscheme = chance.weighted(
          Object.keys(enableColors),
          Object.values(enableColors),
        );
        const priority = colorschemes[colorscheme];
        clog({ colorscheme, priority });

        if (nowColor === colorscheme && retry) {
          clog(
            `colorscheme is same ! so retry ! prev: ${nowColor}, curr: ${colorscheme}`,
          );
          await denops.dispatcher.change();
          return;
        }

        await vars.g.set(denops, "spectrism_priority", priority);
        try {
          await denops.cmd(`colorscheme ${colorscheme}`);
        } catch (e) {
          clog(e);
          colorschemes[colorscheme] = 0;
          await saveColorschemes();
          await denops.dispatcher.change();
          return;
        }
        if (background) {
          await op.background.set(denops, background);
        }

        await delay(checkWait);
        const afterColor = ensure(
          await vars.g.get(denops, "colors_name", ""),
          is.String,
        );
        if (!afterColor) {
          await denops.dispatcher.change();
          return;
        }

        await message(denops, `Change colorscheme: ${colorscheme}`);

        // await denops.cmd("redraw!");
      } catch (e) {
        clog(e);
      }
    },

    async open(): Promise<void> {
      await denops.cmd(`e ${colorschemePath}`);
    },

    async disableColorscheme(): Promise<void> {
      const c = ensure(await vars.g.get(denops, "colors_name", ""), is.String);
      if (c === "") {
        clog(`Can't get g:colors_name... so skip.`);
        return;
      }
      await message(denops, `Disable: ${c}`);
      colorschemes[c] = 0;
      await saveColorschemes();
      await denops.dispatcher.change();
    },

    async reset(): Promise<void> {
      await message(denops, `Remove: ${colorschemePath}`);
      await Deno.remove(colorschemePath);
    },

    async like(...args: unknown[]): Promise<void> {
      clog({ args });
      const val = Number(ensure(args, is.Array)[0] ?? changeSize);
      const c = ensure(await vars.g.get(denops, "colors_name", ""), is.String);
      if (c === "") {
        clog(`Can't get g:colors_name... so skip.`);
        return;
      }
      const priority = colorschemes[c] + val;
      await message(denops, `Increase ${c}'s priority to ${priority}`);
      colorschemes[c] = priority;
      await vars.g.set(denops, "spectrism_priority", priority);
      await saveColorschemes();
    },

    async hate(...args: unknown[]): Promise<void> {
      const val = Number(ensure(args, is.Array)[0] ?? changeSize);
      const c = ensure(await vars.g.get(denops, "colors_name", ""), is.String);
      if (c === "") {
        clog(`Can't get g:colors_name... so skip.`);
        return;
      }
      let priority = colorschemes[c] - val;
      priority = priority < 0 ? 0 : priority;
      await message(denops, `Decrease ${c}'s priority to ${priority}`);
      colorschemes[c] = priority;
      await vars.g.set(denops, "spectrism_priority", priority);
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
    command! EnableSpectrism call s:${denops.name}_notify('enable', [])
    command! DisableSpectrism call s:${denops.name}_notify('disable', [])
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
  clog("spectrism has loaded");
}
