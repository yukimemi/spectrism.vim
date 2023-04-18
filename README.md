# dps-randomcolorscheme

Denops random colorscheme.

## random colorscheme

### require.

- [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)

## Commands.

```vim
" Change colorscheme.
:ChangeColorscheme

" Open colorscheme priority setting file.
:OpenColorschemeSetting

" Reset colorscheme priority setting file. (remove file. create next startup.)
:ResetColorschemeSetting

" Disable random colorscheme.
:DisableRandomColorscheme

" Enable random colorscheme.
:EnableRandomColorscheme

" Disable this colorscheme. (set priority to 0)
:DisableThisColorscheme

" Increase priority by 10. (default)
:LikeThisColorscheme
" Increase priority by 30.
:LikeThisColorscheme 30

" Decrease priority by 10. (default)
:HateThisColorscheme
" Decrease priority by 30.
:HateThisColorscheme 30
```

## Sample config.

No settings are required. However, the following settings can be made if necessary.

```vim
let g:randomcolorscheme_debug = v:false                                      " default: v:false
let g:randomcolorscheme_echo = v:false                                       " Whether to echo the modified colorscheme. default: v:true
let g:randomcolorscheme_interval = 60                                        " Interval to change colorscheme. default: 3600 (seconds)
let g:randomcolorscheme_enables = ["morning", "ron"]                         " Use colorscheme list. default: [] (Use all colorscheme)
let g:randomcolorscheme_disables = ["evening", "default"]                    " Not used colorscheme list. default: []
let g:randomcolorscheme_match = "base16"                                     " colorscheme match regexp. default: ""
let g:randomcolorscheme_notmatch = "light"                                   " colorscheme not match regexp. default: ""
let g:randomcolorscheme_events = ["CursorHold", "FocusLost", "BufWritePost"] " Event to change colorscheme. default: []
let g:randomcolorscheme_background = "dark"                                  " `set background` after colorscheme change. default: do nothing

let g:randomcolorscheme_path = expand("~/.cache/colors.toml")                " enable / disable colorscheme setting.
                                                                             "   default: $XDG_CONFIG_HOME/randomcolorscheme/colorschemes.toml

let g:randomcolorscheme_colors_path = [expand("~/.cache/vim/plugs")]         " colorschme looks from runtimepath and, for Neovim, from stdpath("data").
                                                                               If it is delayed by plugin manager etc.,
                                                                               it may not be included in the runtimepath at the time of startup.
                                                                               If you still want to use randomcolorscheme, add it manually to
                                                                               `g:randomcolorscheme_colors_path` as a search path.
                                                                               This path will be searched recursively, and `colors/*.vim` or `colors/*.lua` files
                                                                               will be registered as colorscheme. default: []

" You use `g:colors_name` for colorscheme name, and `g:randomcolorscheme_priority` for getting priority number.

" Useful mappings
nnoremap <space>cc <cmd>ChangeColorscheme<cr>
nnoremap <space>cd <cmd>DisableThisColorscheme<cr>
nnoremap <space>cl <cmd>LikeThisColorscheme<cr>
nnoremap <space>ch <cmd>HateThisColorscheme<cr>
```

---

This plugin is inspired by random colorscheme ! Thank you !

[Sammyalhashe/random_colorscheme.vim: Open a random colorscheme with every new (neo)vim session.](https://github.com/Sammyalhashe/random_colorscheme.vim)
