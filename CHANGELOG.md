## Release Notes

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