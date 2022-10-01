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

" Disable random colorscheme.
:DisableRandomColorscheme

" Enable random colorscheme
:EnableRandomColorscheme
```

## Sample config.

No settings are required. However, the following settings can be made if necessary.

```vim
let g:randomcolorscheme_debug = v:false                                      " default: v:false
let g:randomcolorscheme_echo = v:false                                       " Whether to echo the modified colorscheme. default: v:true
let g:randomcolorscheme_interval = 60                                        " Interval to change colorscheme. default: 3600 (seconds)
let g:randomcolorscheme_enables = ["morning", "ron"]                         " Use colorscheme list. default: [] (Use all colorscheme)
let g:randomcolorscheme_disables = ["evening", "default"]                    " Not used colorscheme list. default: []
let g:randomcolorscheme_events = ["CursorHold", "FocusLost", "BufWritePost"] " Event to change colorscheme. default: []
```

---

This plugin is inspired by random colorscheme ! Thank you !

[Sammyalhashe/random_colorscheme.vim: Open a random colorscheme with every new (neo)vim session.](https://github.com/Sammyalhashe/random_colorscheme.vim)

