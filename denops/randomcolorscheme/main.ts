import * as autocmd from "https://deno.land/x/denops_std@v3.8.2/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.8.2/function/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.8.2/helper/mod.ts";
import * as op from "https://deno.land/x/denops_std@v3.8.2/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.2/variable/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v3.8.2/mod.ts";
import { basename, extname } from "https://deno.land/std@0.158.0/path/mod.ts";
import { ensureArray } from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { intersection, without } from "https://cdn.skypack.dev/lodash@4.17.21";

let debug = false;
let echo = true;
let interval = 3600;
let enables: string[] = [];
let disables: string[] = [];
let enable = true;

let events: autocmd.AutocmdEvent[] = [];

export async function main(denops: Denops): Promise<void> {
  // debug.
  debug = await vars.g.get(denops, "randomcolorscheme_debug", debug);
  // deno-lint-ignore no-explicit-any
  const clog = (...data: any[]): void => {
    if (debug) {
      console.log(...data);
    }
  };

  // Merge user config.
  echo = await vars.g.get(denops, "randomcolorscheme_echo", echo);
  interval = await vars.g.get(denops, "randomcolorscheme_interval", interval);
  enables = await vars.g.get(denops, "randomcolorscheme_enables", enables);
  disables = await vars.g.get(denops, "randomcolorscheme_disables", disables);
  events = await vars.g.get(denops, "randomcolorscheme_events", events);

  clog({ debug, echo, enables, disables, events });

  // Get all colorschemes
  let colorschemes = ensureArray<string>(
    await fn.globpath(
      denops,
      await op.runtimepath.get(denops),
      "colors/*.vim",
      true,
      true,
    ),
  ).map((c) => basename(c, extname(c)));

  clog({ colorschemes });
  if (enables.length) {
    colorschemes = intersection(colorschemes, enables);
  }
  clog({ colorschemes });
  if (disables.length) {
    colorschemes = without(colorschemes, ...disables);
  }
  clog({ colorschemes });

  denops.dispatcher = {
    async change(): Promise<void> {
      try {
        if (!enable) {
          clog(`enable: ${enable}`);
          return;
        }
        const r = Math.floor(Math.random() * colorschemes.length);
        const colorscheme = colorschemes[r];
        clog({ colorscheme });

        await helper.execute(
          denops,
          `
          colorscheme ${colorscheme}
        `,
        );
        if (echo) {
          await denops.cmd(`echom "Change colorscheme: ${colorscheme}"`);
        }
      } catch (e) {
        clog(e);
      }
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
  `,
  );

  if (events.length) {
    await autocmd.group(denops, denops.name, (helper) => {
      helper.remove();
      helper.define(
        events,
        "*",
        `call s:${denops.name}_notify('change', [])`,
      );
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
