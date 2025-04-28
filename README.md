# lumiris.vim

Vim / Neovim random colorscheme plugin.

lumiris is spectrum and prism.

# Features

This plugin change the colorscheme for Vim / Neovim.

# Installation

If you use [folke/lazy.nvim](https://github.com/folke/lazy.nvim).

```lua
{
  "yukimemi/lumiris.vim",
  lazy = false,
  dependencies = {
    "vim-denops/denops.vim",
  },
}
```

If you use [yukimemi/dvpm](https://github.com/yukimemi/dvpm).

```typescript
dvpm.add({ url: "yukimemi/lumiris.vim" });
```

# Requirements

- [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)

# Usage

No special settings are required.
By default it changes the colorscheme every 3,600 seconds.

# Commands

`:ChangeColorscheme`

Change the colorscheme.

`:OpenColorschemeSetting`

Open the lumiris priority setting.
colorschme setting is a toml file.
Colorschemes with higher numerical priorities are preferred.

`:ResetColorschemeSetting`

Remove the lumiris setting file.
The configuration file will be automatically regenerated the next time you start Vim / Neovim.

`:DisableLumiris`

Disable lumiris.
Stop changing colorschme.

`:EnableLumiris`

Enable lumiris.

`:DisableThisColorscheme`

Disable this colorscheme.
(Set colorschmeme priority to 0.)

`:LikeThisColorscheme [size]`

Increase priority by `g:lumiris_changesize`. (default)
If size is passed, increase priority according to size.

`:HateThisColorscheme [size]`

Decrease priority by `g:lumiris_changesize`. (default)
If size is passed, decrease priority according to size.

# Config

No settings are required. However, the following settings can be made if necessary.

`g:lumiris_debug`

Enable debug messages.
default is v:false

`g:lumiris_echo`

Whether to echo the modified colorscheme.
default is v:true

`g:lumiris_notify`

Whether to `vim.notify` the modified colorscheme. (Neovim only)
default is v:false

`g:lumiris_interval`

Interval to change colorscheme.
default is 3600 (seconds)

`g:lumiris_retry`

Whether to retry change colorscheme when after changed colorschme is same before.
default is v:true

`g:lumiris_checkwait`

Time to wait before checking `g:colors_name` after changing colorschme.
`g:colors_name` may not be included immediately after changing colorschme.
default is 3000 (milliseconds)

`g:lumiris_enables`

A list of colorschemes to be used for selection.
If this list is set, only the changing colorschme that includes this list will be used.
Not included colorscheme's priority are all set to 0.
default is [] (Use all colorscheme)

`g:lumiris_disables`

A list of colorschemes to be not used for selection.
If this list is set, only the changing colorschme that not includes this list will be used.
Included colorscheme's priority are all set to 0.
default is [] (Use all colorscheme)

`g:lumiris_match`

A match pattern to be used for selection. (regexp)
If this pattern is set, only the changing colorschme that match this pattern will be used.
default is "" (Use all colorscheme)

`g:lumiris_notmatch`

A match pattern to be not used for selection. (regexp)
If this pattern is set, only the changing colorschme that not match this pattern will be used.
default is "" (Use all colorscheme)

`g:lumiris_events`

A list of events to be used for selection.
If this list is set, the colorscheme will be changed if the target event fires.
default is []

`g:lumiris_background`

"dark" or "light"
If this option is set, the background option set after the colorscheme change is set
default is ""

`g:lumiris_changesize`

Priority size changed during LikeThisColorscheme and HatesThisColorscheme.
default is 50

`g:lumiris_path`

The path to the colorscheme config file.
default is $XDG_CONFIG_HOME/lumiris/colorschemes.toml

`g:lumiris_colors_path`

colorschme looks from runtimepath and, for Neovim, from stdpath("data").
If it is delayed by plugin manager etc.,
it may not be included in the runtimepath at the time of startup.
If you still want to use lumiris, add it manually to
`g:lumiris_colors_path` as a search path.
This path will be searched recursively, and `colors/*.vim` or `colors/*.lua` files
will be registered as colorscheme.
default is []

`g:lumiris_priority`

The priority of the colorscheme. (readonly)
You can use this value for statusline.

# Example

```vim
let g:lumiris_debug = v:false
let g:lumiris_echo = v:false
let g:lumiris_notify = v:true
let g:lumiris_interval = 60
let g:lumiris_enables = ["morning", "ron"]
let g:lumiris_disables = ["evening", "default"]
let g:lumiris_match = "base16"
let g:lumiris_notmatch = "light"
let g:lumiris_events = ["CursorHold", "FocusLost", "BufWritePost"]
let g:lumiris_background = "dark"
let g:lumiris_path = expand("~/.cache/colors.toml")
let g:lumiris_colors_path = [expand("~/.cache/vim/plugs")]

" Useful mappings
nnoremap <space>rc <cmd>ChangeColorscheme<cr>
nnoremap <space>rd <cmd>DisableThisColorscheme<cr>
nnoremap <space>rl <cmd>LikeThisColorscheme<cr>
nnoremap <space>rh <cmd>HateThisColorscheme<cr>
```

# License

Licensed under MIT License.

Copyright (c) 2023 yukimemi

