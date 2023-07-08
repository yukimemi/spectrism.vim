# dps-randomcolorscheme

Denops random colorscheme.

## Features 

This plugin change the colorscheme for Vim / Neovim.

## Installation 

If you use [folke/lazy.nvim](https://github.com/folke/lazy.nvim).

```
  {
    "yukimemi/dps-randomcolorscheme",
    lazy = false,
    dependencies = {
      "vim-denops/denops.vim",
    },
  }
```

If you use [yukimemi/dvpm](https://github.com/yukimemi/dvpm).

```
  dvpm.add({ url: "yukimemi/dps-randomcolorscheme" });
```

## Requirements 

    - [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
    - [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)

## Usage 

No special settings are required.
By default it changes the colorscheme every 3,600 seconds.

## Commands 

`:ChangeColorscheme`                                      
Change the colorscheme.

`:OpenColorschemeSetting`                            
Open the randomcolorscheme priority setting.
colorschme setting is a toml file.
Colorschemes with higher numerical priorities are preferred.

`:ResetColorschemeSetting`                          
Remove the randomcolorscheme setting file.
The configuration file will be automatically regenerated the next time you start Vim / Neovim.

`:DisableRandomColorscheme`                        
Disable randomcolorscheme.
Stop changing colorschme.

`:EnableRandomColorscheme`                          
Enable randomcolorscheme.

`:DisableThisColorscheme`                            
Disable this colorscheme.
(Set colorschmeme priority to 0.)

`:LikeThisColorscheme [count]`                          
Increase priority by 10. (default)
If count is passed, increase priority according to count.

`:HateThisColorscheme [count]`                          
Decrease priority by 10. (default)
If count is passed, decrease priority according to count.

## Config 

No settings are required. However, the following settings can be made if necessary.

`g:randomcolorscheme_debug`                        
Enable debug messages.
default is v:false

`g:randomcolorscheme_echo`                          
Whether to echo the modified colorscheme.
default is v:true

`g:randomcolorscheme_interval`                  
Interval to change colorscheme.
default is 3600 (seconds)

`g:randomcolorscheme_enables`                    
A list of colorschemes to be used for selection.
If this list is set, only the changing colorschme that includes this list will be used.
Not included colorscheme's priority are all set to 0.
default is [] (Use all colorscheme)

`g:randomcolorscheme_disables`                  
A list of colorschemes to be not used for selection.
If this list is set, only the changing colorschme that not includes this list will be used.
Included colorscheme's priority are all set to 0.
default is [] (Use all colorscheme)

`g:randomcolorscheme_match`                        
A match pattern to be used for selection. (regexp)
If this pattern is set, only the changing colorschme that match this pattern will be used.
default is "" (Use all colorscheme)

`g:randomcolorscheme_notmatch`                  
A match pattern to be not used for selection. (regexp)
If this pattern is set, only the changing colorschme that not match this pattern will be used.
default is "" (Use all colorscheme)

`g:randomcolorscheme_events`                      
A list of events to be used for selection.
If this list is set, the colorscheme will be changed if the target event fires.
default is []

`g:randomcolorscheme_background`              
"dark" or "light"
If this option is set, the background option set after the colorscheme change is set
default is ""

`g:randomcolorscheme_path`                          
The path to the colorscheme config file.
default is $XDG_CONFIG_HOME/randomcolorscheme/colorschemes.toml

`g:randomcolorscheme_colors_path`            
colorschme looks from runtimepath and, for Neovim, from stdpath("data").
If it is delayed by plugin manager etc.,
it may not be included in the runtimepath at the time of startup.
If you still want to use randomcolorscheme, add it manually to
`g:randomcolorscheme_colors_path` as a search path.
This path will be searched recursively, and `colors/*.vim` or `colors/*.lua` files
will be registered as colorscheme.
default is []

`g:randomcolorscheme_priority`                  
The priority of the colorscheme. (readonly)
You can use this value for statusline.

## Example 

```
  let g:randomcolorscheme_debug = v:false
  let g:randomcolorscheme_echo = v:false
  let g:randomcolorscheme_interval = 60
  let g:randomcolorscheme_enables = ["morning", "ron"]
  let g:randomcolorscheme_disables = ["evening", "default"]
  let g:randomcolorscheme_match = "base16"
  let g:randomcolorscheme_notmatch = "light"
  let g:randomcolorscheme_events = ["CursorHold", "FocusLost", "BufWritePost"]
  let g:randomcolorscheme_background = "dark"
  let g:randomcolorscheme_path = expand("~/.cache/colors.toml")
  let g:randomcolorscheme_colors_path = [expand("~/.cache/vim/plugs")]

  " Useful mappings
  nnoremap <space>rc <cmd>ChangeColorscheme<cr>
  nnoremap <space>rd <cmd>DisableThisColorscheme<cr>
  nnoremap <space>rl <cmd>LikeThisColorscheme<cr>
  nnoremap <space>rh <cmd>HateThisColorscheme<cr>
```

## License 

Licensed under MIT License.

Copyright (c) 2023 yukimemi

