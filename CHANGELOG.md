## Release Notes

## [0.2.3]
Semantics now only highlights if it finds a given word validly placed, plan to get it back to working as before, the improvement is that it should now highlight based on what is being used as rather than just whatever got put in the backend name map first. Now when something like test is being used as a Perk it will be a diffrent color than when it is being used as a Cube

## [0.2.2]
Minor update this time. Diagnostics should now not produce false positives, and I think false negatives should be restricted to things that demand constants, (especially strings) Visual:, and Animation:, but probably don't trust me on that.

## [0.2.1]
Bunch more behind the scenes stuff, the diagnostics is now significantly more intelligent and less angry

## [0.2.0]
Outline now arguably useful, and first iteration of diagnostics, the thing that tells you that thing expected an action and you gave it a boolean (warning buggy false positives and false negatives)

## [0.1.8]
More mysterious behind the scenes stuff, also hover shows you all things with the hovered name. I even feel relatively confident I didn't break anything this time!

## [0.1.7]
The top bar # search now doesn't distinguish between " " and "_" and only wants the characters in the right order. Semantic highlighting fix again (Probably need to figure out how tests work so I can perhaps notice what I break before updating) backend defines are now stored differently, should hopefully pave the way for diagnostics and words are now defined by whitespace only (so double clicking Steve_was-here will now select the whole thing instead of just Steve, was, or here)

**[Hotfix]** Unbroke semantic highlighting, oops
## [0.1.6]
Go To Declaration now works with builtins (takes you to the relevant line in the ModdingInfo.txt.built-ins in the extension folder, might be annoying. Will figure out how settings work at some point so this can be disabled) some backend stuff improved. oh and **Klelik's syntax highlighting is in!** Syntax and semantic colors are not coordinated yet shhhhh

## [0.1.5]
Hover text now tells type of compound and its arguments if it has any

## [0.1.4]
Initial rename, may be renamed again pending results of poll. Implemented Go to Definition, and proof of concept hover text

## [0.1.3]
Mostly bugfixes. Comments now get correctly detected even at the start and end of files, document symbol provider works consistently now. Highlights can occur in Artoverrides now.

## [0.1.2]
Fixed non-compound highlighting, enabled and reimplemented document symbol provider, and implemented workspace symbol provider (ctrl+t to search and jump to any defined and parsed thing) todo make that search treat underscores as spaces and not need all the characters contiguous - Not done yet because I shouldn't have even been working on this today.

## [0.1.1]
Split extension over multiple files for better organization, perk highlighting broke am very confused

## [0.0.8]
Actualy gave stuff diffrent names so it stopped overwriteing each other and stopped just doing the same thing again if it didn't work the first time when figureing out if a word should be a token

## [0.0.7]
ModdingInfo.txt.built-ins no longer cares what kind of line endings the file has (Thanks git I thought I could trust that file to be as I left it, you showed me)

## [0.0.6]
Convinced perks it was ok to let semantic tokens into their bodies also added detection for .c.txt and .cc.txt

## [0.0.5.1]
Fixed folding
## [0.0.5]
Scenario definitions  are now ignored the same way comments are, so numbers should be safe from being cubes

## [0.0.4]
Cube and Perk definition contents now also get highlighting. (TextTooltips do too shhhhh)
Because of scenario definitions various numbers are highlighted as cubes right now 

## [0.0.3]
Perk, String, and Trigger highlighting now supported

## [0.0.2]
Added static file based built-ins highlighting (see ModdingInfo.txt.built-ins in extension folder)
Support for Perk, String, and Trigger highlighting pending still.

## [0.0.1] Initial Public Release
Highlights all Compounds defined within the workspace.
Next up figureing out a good way to handle grabbing the 